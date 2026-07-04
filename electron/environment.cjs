const { app } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function hasManagerTree(root) {
  return !!root
    && fs.existsSync(path.join(root, 'package.json'))
    && fs.existsSync(path.join(root, 'electron', 'main.cjs'))
    && fs.existsSync(path.join(root, 'manager', 'index.html'));
}

function resolveRootDir() {
  const candidates = [
    path.resolve(__dirname, '..'),
    path.resolve(process.cwd()),
    path.resolve(app.getAppPath ? app.getAppPath() : ''),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (hasManagerTree(candidate)) return candidate;
  }
  for (const candidate of candidates) {
    const parent = path.resolve(candidate, '..');
    if (hasManagerTree(parent)) return parent;
  }
  return path.resolve(__dirname, '..');
}

const ROOT_DIR = resolveRootDir();
const PACKAGED_RUNTIME_ROOT = path.join(process.resourcesPath || ROOT_DIR, 'app.asar.unpacked');
const PACKAGED_INSTALL_TREE_ROOT = path.join(process.resourcesPath || ROOT_DIR, 'release', 'v4', 'current');
const DEV_PACKAGED_RUNTIME_ROOT = path.join(ROOT_DIR, 'dist', 'win-unpacked', 'resources', 'app.asar.unpacked');
const DEV_INSTALL_TREE_ROOT = path.join(ROOT_DIR, 'release', 'v4', 'current');
const MANAGER_HTML = path.join(ROOT_DIR, 'manager', 'index.html');
const ICON_PATH = path.join(ROOT_DIR, 'bago.ico');
const PRELOAD_PATH = path.join(__dirname, 'preload.cjs');

// Resolve the React UI dist index.html — primary entry point for the main window
function resolveReactHtml() {
  const candidates = [
    path.join(ROOT_DIR, 'ui-react', 'dist', 'index.html'),
    path.join(PACKAGED_RUNTIME_ROOT, 'ui-react', 'dist', 'index.html'),
    path.join(DEV_PACKAGED_RUNTIME_ROOT, 'ui-react', 'dist', 'index.html'),
  ];
  return candidates.find(c => fs.existsSync(c)) || MANAGER_HTML;
}

const REACT_HTML = resolveReactHtml();
const INSTALLS_ROOT = app.isPackaged
  ? path.join(path.dirname(app.getPath('exe')), 'installations')
  : path.join(ROOT_DIR, 'installations');
const SMOKE_TEST = process.env.BAGO_MANAGER_SMOKE_TEST === '1';
const CHAT_HOST = '127.0.0.1';
const CHAT_START_PORT = Number(process.env.BAGO_MANAGER_CHAT_PORT || 8080);

function isExternalUrl(url) {
  return /^https?:\/\//i.test(url);
}

function runVisiblePowerShell(command, options = {}) {
  if (!command || typeof command !== 'string') {
    throw new Error('Comando vacío');
  }
  if (command.length > 12000) {
    throw new Error('Comando demasiado largo');
  }
  const visible = options.visible === true;
  const noExit = options.noExit === true;
  const cwd = options.cwd || app.getPath('home');
  const args = [
    ...(visible && noExit ? ['-NoExit'] : []),
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    command
  ];
  const child = spawn(
    'powershell.exe',
    args,
    {
      cwd,
      detached: visible,
      stdio: 'ignore',
      windowsHide: !visible
    }
  );
  if (visible) child.unref();
  return { pid: child.pid };
}

function resolveUserRoot() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const home = process.env.USERPROFILE || process.env.HOME || '';
  if (localAppData) return path.join(localAppData, 'BAGO');
  if (home) return path.join(home, 'AppData', 'Local', 'BAGO');
  return '';
}

function resolveLegacyUserRoot() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  return home ? path.join(home, '.bago') : '';
}

function hasBagoRuntime(root) {
  return !!root
    && fs.existsSync(path.join(root, 'bago_core', 'launcher.py'))
    && fs.existsSync(path.join(root, 'bago_core', 'session_control.py'))
    && fs.existsSync(path.join(root, '.bago', 'core', 'version.py'))
    && fs.existsSync(path.join(root, '.bago', 'core', 'context_store.py'));
}

function hasInstallManifest(root) {
  return !!root && fs.existsSync(path.join(root, 'install_manifest.json'));
}

function resolveBundledRuntimeRoot() {
  const candidates = app.isPackaged
    ? [PACKAGED_INSTALL_TREE_ROOT, PACKAGED_RUNTIME_ROOT, DEV_INSTALL_TREE_ROOT, DEV_PACKAGED_RUNTIME_ROOT]
    : [DEV_INSTALL_TREE_ROOT, ROOT_DIR, DEV_PACKAGED_RUNTIME_ROOT];
  for (const root of candidates) {
    if (hasBagoRuntime(root)) return root;
  }
  return '';
}

function resolveInstalledRuntimeRoot() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const localAppData = resolveUserRoot();
  const envOverride = process.env.BAGO_ROOT || '';

  const managedInstalls = [];
  try {
    if (fs.existsSync(INSTALLS_ROOT)) {
      fs.readdirSync(INSTALLS_ROOT, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .forEach(d => managedInstalls.push(path.join(INSTALLS_ROOT, d.name)));
    }
  } catch {}

  const candidates = [
    envOverride,
    ...managedInstalls,
    path.join(programFiles, 'BAGO'),
    localAppData,
    home ? path.join(home, 'AppData', 'Local', 'BAGO', 'active') : '',
    home ? path.join(home, 'AppData', 'Local', 'BAGO', 'launch') : '',
    resolveLegacyUserRoot() ? path.join(resolveLegacyUserRoot(), 'active') : '',
    resolveLegacyUserRoot() ? path.join(resolveLegacyUserRoot(), 'launch') : ''
  ].filter(Boolean);

  const bundled = resolveBundledRuntimeRoot();
  const real = candidates.filter(c => {
    if (!hasBagoRuntime(c)) return false;
    if (bundled && path.resolve(c) === path.resolve(bundled)) return false;
    if (c === envOverride) return true;
    return hasInstallManifest(c) || isUserOwnedLocation(c, home);
  });
  return real[0] || '';
}

function resolveDevelopmentRuntimeRoot() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const installed = resolveInstalledRuntimeRoot();
  const selectionFile = resolveUserRoot() ? path.join(resolveUserRoot(), 'install_selection.json') : '';
  const legacySelectionFile = resolveLegacyUserRoot() ? path.join(resolveLegacyUserRoot(), 'install_selection.json') : '';
  const candidates = [];

  for (const file of [selectionFile, legacySelectionFile]) {
    if (!file || !fs.existsSync(file)) continue;
    try {
      const payload = JSON.parse(readText(file) || '{}');
      const selectedDev = payload && payload.roles && payload.roles.dev && payload.roles.dev.path;
      if (selectedDev) candidates.push(String(selectedDev));
    } catch {}
  }

  if (home) {
    candidates.push(path.join(home, 'bago_fw'));
    candidates.push(path.join(home, 'BAGO'));
    candidates.push(path.join(home, 'AppData', 'Local', 'BAGO', 'dev'));
    const legacy = resolveLegacyUserRoot();
    if (legacy) candidates.push(path.join(legacy, 'dev'));
  }

  for (const candidate of candidates) {
    if (!candidate || !hasBagoRuntime(candidate)) continue;
    if (installed && path.resolve(candidate) === path.resolve(installed)) continue;
    return candidate;
  }
  return '';
}

function isUserOwnedLocation(candidate, home) {
  if (!candidate || !home) return false;
  const resolved = path.resolve(candidate).toLowerCase();
  const homeLc = path.resolve(home).toLowerCase();
  const localAppDataLc = (process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local')).toLowerCase();
  return resolved.startsWith(homeLc) || resolved.startsWith(localAppDataLc);
}

function resolveBagoRuntimeRoot() {
  if (!app.isPackaged) {
    const dev = resolveBundledRuntimeRoot();
    if (dev) return dev;
  }
  const installed = resolveInstalledRuntimeRoot();
  if (installed) return installed;
  throw new Error('No se encontro una instalacion real de BAGO');
}

function resolveUiDist(runtimeRoot) {
  const candidates = [
    path.join(runtimeRoot, 'ui-react', 'dist'),
    path.join(ROOT_DIR, 'ui-react', 'dist'),
    path.join(PACKAGED_RUNTIME_ROOT, 'ui-react', 'dist'),
    path.join(DEV_PACKAGED_RUNTIME_ROOT, 'ui-react', 'dist')
  ];
  return candidates.find(candidate => fs.existsSync(path.join(candidate, 'index.html'))) || '';
}

function findPackagedRuntimeRoot() {
  return resolveBundledRuntimeRoot();
}

module.exports = {
  ROOT_DIR,
  PACKAGED_RUNTIME_ROOT,
  DEV_PACKAGED_RUNTIME_ROOT,
  MANAGER_HTML,
  REACT_HTML,
  ICON_PATH,
  PRELOAD_PATH,
  INSTALLS_ROOT,
  SMOKE_TEST,
  CHAT_HOST,
  CHAT_START_PORT,
  isExternalUrl,
  runVisiblePowerShell,
  hasBagoRuntime,
  hasInstallManifest,
  resolveBundledRuntimeRoot,
  resolveInstalledRuntimeRoot,
  resolveDevelopmentRuntimeRoot,
  isUserOwnedLocation,
  resolveBagoRuntimeRoot,
  resolveUiDist,
  findPackagedRuntimeRoot
};
