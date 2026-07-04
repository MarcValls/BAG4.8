import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import type {
  BackendCommandResult,
  BackendHistory,
  BackendMenu,
  BackendProviders,
  BackendRoutes,
  ChatMode,
  ChatTurn,
  GlobalMode,
  InspectorLevel,
  SelectionRecord,
  UiAction,
  UiBootstrapSnapshot
} from '@/contracts/backend';
import { safeJson } from '@/api/client';
import { Icon, type IconName } from '@/shared/Icon';

interface Props {
  section: 'home' | 'chat' | 'workspace' | 'graph' | 'pipeline' | 'evidence' | 'context' | 'system';
  snapshot: UiBootstrapSnapshot | null;
  menu: BackendMenu | null;
  routes: BackendRoutes | null;
  providers: BackendProviders | null;
  history: BackendHistory | null;
  files: Record<string, unknown> | null;
  commandResults: Record<string, BackendCommandResult | null>;
  turns: ChatTurn[];
  drafts: Record<string, string>;
  chatMode: ChatMode;
  globalMode: GlobalMode;
  onDraftChange: (section: string, text: string) => void;
  onSendChat: (message: string) => Promise<void>;
  onInspect: (selection: SelectionRecord, level?: InspectorLevel) => void;
  onReadFile: (path: string) => Promise<Record<string, unknown> | null>;
  onRunCommand: (command: string) => Promise<BackendCommandResult | null>;
  onRunContextCommand: (command: string) => Promise<void>;
  onRunAction: (action: UiAction) => void;
  onRunPlanTask: (task: string) => Promise<void>;
  onSetSection: (section: Props['section']) => void;
  onSetChatMode: (mode: ChatMode) => void;
  onSetGlobalMode: (mode: GlobalMode) => void;
  onChooseWorkspace: () => void;
}

type RecordValue = Record<string, unknown>;
type GraphLayout = 'radial' | 'linear' | 'hierarchical';
type ExplorerKind = 'file' | 'directory';
type WorkspaceFilter = 'all' | 'code' | 'python' | 'text' | 'json' | 'web' | 'shell' | 'other' | 'directory';

const PROGRAMMING_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'pyw', 'pyi',
  'html', 'htm', 'xhtml', 'xml', 'svg',
  'css', 'scss', 'sass', 'less',
  'json', 'jsonc', 'yaml', 'yml', 'toml', 'ini', 'env',
  'md', 'markdown',
  'sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd',
  'c', 'h', 'hpp', 'cpp', 'cc', 'cxx',
  'java', 'kt', 'kts',
  'go', 'rs', 'rb', 'php',
  'swift', 'scala', 'dart',
  'sql', 'graphql', 'gql',
  'vue', 'svelte', 'astro',
  'lock', 'txt', 'log',
  'cs', 'fs', 'lua', 'r', 'pl', 'pm',
  'makefile', 'mk', 'cmake', 'gradle', 'properties'
]);

const PROGRAMMING_FILENAMES = new Set([
  'dockerfile', 'makefile', 'procfile', 'gemfile', 'rakefile', 'vagrantfile',
  'license', 'licence', 'readme', '.gitignore', '.npmignore', '.editorconfig',
  '.env', '.env.example', '.env.local', '.babelrc', '.eslintrc', '.prettierrc',
  'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb',
  'tsconfig.json', 'jsconfig.json', 'vite.config.js', 'vite.config.ts', 'webpack.config.js',
  'rollup.config.js', 'eslint.config.js', 'prettier.config.js'
]);

const LANGUAGE_LABELS: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'React JSX',
  ts: 'TypeScript',
  tsx: 'React TSX',
  py: 'Python',
  pyw: 'Python',
  pyi: 'Python stub',
  html: 'HTML',
  htm: 'HTML',
  xhtml: 'XHTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  less: 'Less',
  json: 'JSON',
  jsonc: 'JSONC',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  ini: 'INI',
  env: 'Environment',
  md: 'Markdown',
  markdown: 'Markdown',
  sh: 'Shell',
  bash: 'Shell',
  zsh: 'Shell',
  ps1: 'PowerShell',
  bat: 'Batch',
  cmd: 'Batch',
  c: 'C',
  h: 'Header',
  hpp: 'C++ header',
  cpp: 'C++',
  cc: 'C++',
  cxx: 'C++',
  java: 'Java',
  kt: 'Kotlin',
  kts: 'Kotlin',
  go: 'Go',
  rs: 'Rust',
  rb: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  scala: 'Scala',
  dart: 'Dart',
  sql: 'SQL',
  graphql: 'GraphQL',
  gql: 'GraphQL',
  vue: 'Vue',
  svelte: 'Svelte',
  astro: 'Astro',
  txt: 'Text',
  log: 'Log',
  cs: 'C#',
  fs: 'F#',
  lua: 'Lua',
  r: 'R',
  pl: 'Perl',
  pm: 'Perl',
  makefile: 'Makefile',
  mk: 'Makefile',
  cmake: 'CMake',
  gradle: 'Gradle',
  properties: 'Properties',
  lock: 'Lockfile'
};

const TYPE_LABELS: Record<Exclude<WorkspaceFilter, 'all' | 'code'>, string> = {
  python: 'Python',
  text: 'Text',
  json: 'JSON',
  web: 'Web',
  shell: 'Shell',
  other: 'Otros',
  directory: 'Carpetas'
};

interface ExplorerNode {
  name: string;
  path: string;
  kind: ExplorerKind;
  children: ExplorerNode[];
}

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : null;
}

function flattenFiles(payload: Record<string, unknown> | null): RecordValue[] {
  const entries = Array.isArray(payload?.entries) ? payload.entries as RecordValue[] : [];
  return entries.slice(0, 200);
}

function buildExplorerTree(entries: RecordValue[]): ExplorerNode[] {
  const roots: ExplorerNode[] = [];

  const getOrCreate = (children: ExplorerNode[], name: string, path: string, kind: ExplorerKind): ExplorerNode => {
    const existing = children.find((node) => node.path === path);
    if (existing) {
      if (kind === 'directory') existing.kind = 'directory';
      return existing;
    }
    const node: ExplorerNode = { name, path, kind, children: [] };
    children.push(node);
    return node;
  };

  const normalize = (value: string) => value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

  for (const entry of entries) {
    const rawPath = normalize(String(entry.path || entry.name || ''));
    if (!rawPath) continue;
    const parts = rawPath.split('/').filter(Boolean);
    const isDirectory = ['directory', 'dir', 'folder'].includes(String(entry.type || '').toLowerCase());
    let children = roots;
    let currentPath = '';

    if (isDirectory) {
      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const node = getOrCreate(children, part, currentPath, 'directory');
        children = node.children;
        if (index === parts.length - 1) {
          node.kind = 'directory';
        }
      });
      continue;
    }

    const dirParts = parts.slice(0, -1);
    const fileName = parts[parts.length - 1];
    for (const part of dirParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const node = getOrCreate(children, part, currentPath, 'directory');
      children = node.children;
    }
    const filePath = parts.join('/');
    getOrCreate(children, fileName, filePath, 'file');
  }

  const sortNodes = (nodes: ExplorerNode[]) => {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name, 'es', { numeric: true, sensitivity: 'base' });
    });
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);
  return roots;
}

function fileExtension(path: string): string {
  const file = path.split('/').pop() || '';
  const match = file.toLowerCase().match(/\.([^.]+)$/);
  return match ? match[1] : file.toLowerCase();
}

function isPlainTextContent(text: string): boolean {
  if (!text) return true;
  if (text.includes('\u0000')) return false;
  const sample = text.slice(0, 2000);
  let suspicious = 0;
  for (const char of sample) {
    const code = char.charCodeAt(0);
    if (code < 32 && !['\n', '\r', '\t'].includes(char)) suspicious += 1;
  }
  return suspicious < Math.max(8, sample.length * 0.02);
}

function languageLabelForPath(path: string): string {
  const name = path.split('/').pop() || '';
  const lower = name.toLowerCase();
  const ext = fileExtension(path);
  if (LANGUAGE_LABELS[lower]) return LANGUAGE_LABELS[lower];
  if (LANGUAGE_LABELS[ext]) return LANGUAGE_LABELS[ext];
  if (PROGRAMMING_FILENAMES.has(lower)) return 'Config';
  return ext ? ext.toUpperCase() : 'Text';
}

function workspaceTypeForPath(entry: RecordValue): Exclude<WorkspaceFilter, 'all'> {
  const type = String(entry.type || '').toLowerCase();
  if (['directory', 'dir', 'folder'].includes(type)) return 'directory';
  const name = String(entry.name || entry.path || '').toLowerCase();
  const ext = fileExtension(String(entry.path || entry.name || ''));
  if (['py', 'pyw', 'pyi'].includes(ext)) return 'python';
  if (['json', 'jsonc'].includes(ext)) return 'json';
  if (['html', 'htm', 'xhtml', 'css', 'scss', 'sass', 'less', 'js', 'jsx', 'ts', 'tsx', 'vue', 'svelte', 'astro', 'xml', 'svg'].includes(ext)) return 'web';
  if (['sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd'].includes(ext)) return 'shell';
  if (['txt', 'md', 'markdown', 'log', 'ini', 'toml', 'yaml', 'yml', 'env', 'properties'].includes(ext)) return 'text';
  if (['dockerfile', 'makefile', 'procfile', 'gemfile', 'rakefile', 'vagrantfile', 'package.json', 'tsconfig.json', 'jsconfig.json', 'vite.config.js', 'vite.config.ts', 'webpack.config.js', 'rollup.config.js', 'eslint.config.js', 'prettier.config.js'].includes(name)) return 'text';
  return isProgrammingFile(entry) ? 'other' : 'other';
}

function filterLabelForType(filter: WorkspaceFilter): string {
  if (filter === 'all') return 'Todo';
  if (filter === 'code') return 'Código';
  return TYPE_LABELS[filter] || filter;
}

function isProgrammingFile(entry: RecordValue): boolean {
  const type = String(entry.type || '').toLowerCase();
  if (['directory', 'dir', 'folder'].includes(type)) return false;
  const rawName = String(entry.name || entry.path || '').toLowerCase().trim();
  const ext = fileExtension(String(entry.path || entry.name || ''));
  return PROGRAMMING_EXTENSIONS.has(ext) || PROGRAMMING_FILENAMES.has(rawName) || PROGRAMMING_FILENAMES.has(rawName.split('/').pop() || '');
}

function workspaceFileKind(entry: RecordValue): 'directory' | 'code' | 'file' {
  const type = String(entry.type || '').toLowerCase();
  if (['directory', 'dir', 'folder'].includes(type)) return 'directory';
  return isProgrammingFile(entry) ? 'code' : 'file';
}

function joinPath(base: string, part: string): string {
  return base ? `${base}/${part}` : part;
}

function readMessages(history: BackendHistory | null): RecordValue[] {
  return Array.isArray(history?.messages) ? history.messages as RecordValue[] : [];
}

function planSteps(plan: unknown): RecordValue[] {
  const data = asRecord(plan);
  return data && Array.isArray(data.steps) ? data.steps as RecordValue[] : [];
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => String(entry)).filter(Boolean) : [];
}

function summarizeMessage(message: RecordValue): string {
  return String(message.content || message.text || message.message || '').trim();
}

function commandAvailable(menu: BackendMenu | null, routes: BackendRoutes | null, pattern: RegExp): boolean {
  try {
    return pattern.test(JSON.stringify({ menu, routes }).toLowerCase());
  } catch {
    return false;
  }
}

function statusTone(status: string): string {
  const value = status.toLowerCase();
  if (['done', 'confirmed', 'valid', 'certified', 'ok'].some((entry) => value.includes(entry))) return 'confirmed';
  if (['running', 'pending', 'loading', 'partial', 'stale'].some((entry) => value.includes(entry))) return 'running';
  if (['failed', 'error', 'invalid', 'rejected'].some((entry) => value.includes(entry))) return 'error';
  if (['blocked', 'missing', 'legacy'].some((entry) => value.includes(entry))) return 'blocked';
  return 'unknown';
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`status-badge state-${statusTone(status)}`}>
      <span className="status-dot" />
      {label || status}
    </span>
  );
}

function Metric({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: IconName }) {
  return (
    <article className="metric-card">
      <div className="metric-label">{icon && <Icon name={icon} size={16} />}{label}</div>
      <strong>{value}</strong>
      {hint && <span>{hint}</span>}
    </article>
  );
}

function ActionButton({ icon, children, primary = false, disabled = false, onClick, title }: {
  icon?: IconName;
  children: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      className={primary ? 'primary-button compact' : 'secondary-button compact'}
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}

function buildSelection(id: string, kind: string, title: string, summary: string, detail: string[], raw: unknown): SelectionRecord {
  return { id, kind, title, summary, detail, raw: safeJson(raw) };
}

export function ControlSections(props: Props) {
  const [workspaceQuery, setWorkspaceQuery] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState<WorkspaceFilter>('all');
  const [workspaceExpanded, setWorkspaceExpanded] = useState<string[]>([]);
  const [workspaceActivePath, setWorkspaceActivePath] = useState('');
  const [workspaceContent, setWorkspaceContent] = useState('Selecciona un archivo para verlo aquí.');
  const [workspaceContentPath, setWorkspaceContentPath] = useState('');
  const [workspaceContentKind, setWorkspaceContentKind] = useState('Text');
  const [workspaceContentLoading, setWorkspaceContentLoading] = useState(false);
  const [workspaceContentState, setWorkspaceContentState] = useState<'empty' | 'loading' | 'ready' | 'error'>('empty');
  const [graphLayout, setGraphLayout] = useState<GraphLayout>('hierarchical');
  const [graphFiltered, setGraphFiltered] = useState(true);
  const [evidenceCompare, setEvidenceCompare] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const snapshot = props.snapshot;
  const allFiles = useMemo(() => flattenFiles(props.files), [props.files]);
  const visibleFiles = useMemo(() => {
    const query = workspaceQuery.trim().toLowerCase();
    return allFiles.filter((entry) => {
      const kind = workspaceFileKind(entry);
      const type = workspaceTypeForPath(entry);
      const matchesType = workspaceFilter === 'all'
        || (workspaceFilter === 'code' ? kind === 'code'
          : workspaceFilter === 'directory' ? kind === 'directory'
            : workspaceFilter === 'python' ? type === 'python'
              : workspaceFilter === 'text' ? type === 'text'
                : workspaceFilter === 'json' ? type === 'json'
                  : workspaceFilter === 'web' ? type === 'web'
                    : workspaceFilter === 'shell' ? type === 'shell'
                      : workspaceFilter === 'other' ? type === 'other'
                        : true);
      const text = `${String(entry.name || '')} ${String(entry.path || '')}`.toLowerCase();
      return matchesType && (!query || text.includes(query));
    });
  }, [allFiles, workspaceFilter, workspaceQuery]);
  const explorerTree = useMemo(() => buildExplorerTree(visibleFiles), [visibleFiles]);

  const historyMessages = useMemo(() => readMessages(props.history), [props.history]);
  const evidenceItems = Array.isArray(snapshot?.evidence) ? snapshot.evidence : [];
  const jobItems = Array.isArray(snapshot?.jobs) ? snapshot.jobs : [];
  const planResult = props.commandResults.plan;
  const pipelineJob = jobItems.find((item) => String(item.kind || '') === 'pipeline') || jobItems[0] || null;
  const plan = planResult?.data || planResult?.plan || planResult || pipelineJob;
  const steps = planSteps(plan);
  const planData = asRecord(plan);
  const pipelineStatus = String(planData?.status || pipelineJob?.status || (planResult?.ok === false ? 'failed' : steps.length ? 'running' : 'pending'));
  const doneCount = steps.filter((step) => statusTone(String(step.status || 'pending')) === 'confirmed').length;
  const blockedCount = steps.filter((step) => statusTone(String(step.status || 'pending')) === 'blocked').length;
  const failedCount = steps.filter((step) => statusTone(String(step.status || 'pending')) === 'error').length;
  const selectedWorkspaceFile = useMemo(() => visibleFiles.find((entry) => String(entry.path || '') === workspaceActivePath) || null, [visibleFiles, workspaceActivePath]);

  useEffect(() => {
    const topLevel = explorerTree.filter((node) => node.kind === 'directory').map((node) => node.path);
    setWorkspaceExpanded(topLevel);
    setWorkspaceActivePath('');
    setWorkspaceContent('Selecciona un archivo para verlo aquí.');
    setWorkspaceContentPath('');
    setWorkspaceContentKind('Text');
    setWorkspaceContentState('empty');
    setWorkspaceContentLoading(false);
  }, [snapshot?.workspace.id, snapshot?.workspace.root]);

  useEffect(() => {
    const firstFile = visibleFiles.find((entry) => workspaceFileKind(entry) !== 'directory');
    if (firstFile && !workspaceActivePath) {
      void openWorkspaceFile(String(firstFile.path || firstFile.name || ''));
    }
  }, [visibleFiles, workspaceActivePath]);

  async function openWorkspaceFile(path: string) {
    const clean = path.trim();
    if (!clean) return;
    setWorkspaceActivePath(clean);
    setWorkspaceContentPath(clean);
    setWorkspaceContentLoading(true);
    setWorkspaceContentState('loading');
    props.onInspect(
      buildSelection(
        clean,
        'workspace-file',
        String(clean.split('/').pop() || clean),
        `Leyendo ${clean}`,
        [`path: ${clean}`, `workspace: ${snapshot?.workspace.id || 'unknown'}`],
        { path: clean }
      )
    );
    try {
      const result = await props.onReadFile(clean);
      const content = String(result?.content || result?.data?.content || result?.text || '');
      if (content && !isPlainTextContent(content)) {
        setWorkspaceContent('Este archivo parece binario o no es texto legible.');
        setWorkspaceContentKind(languageLabelForPath(clean));
        setWorkspaceContentState('error');
      } else {
        setWorkspaceContent(content || 'Archivo vacío.');
        setWorkspaceContentKind(languageLabelForPath(clean));
        setWorkspaceContentState('ready');
      }
    } catch (error) {
      setWorkspaceContent(String(error instanceof Error ? error.message : 'No se pudo leer el archivo.'));
      setWorkspaceContentKind(languageLabelForPath(clean));
      setWorkspaceContentState('error');
    } finally {
      setWorkspaceContentLoading(false);
    }
  }

  async function copyWorkspaceText(text: string) {
    if (!text.trim()) return;
    await navigator.clipboard?.writeText(text);
  }

  function toggleWorkspaceFolder(path: string) {
    setWorkspaceExpanded((current) => (
      current.includes(path)
        ? current.filter((item) => item !== path)
        : [...current, path]
    ));
  }

  function isWorkspaceExpanded(path: string): boolean {
    return workspaceExpanded.includes(path);
  }

  if (props.section === 'home') {
    const canChat = snapshot?.permissions.canChat ?? false;
    return (
      <div className="home-surface">
        <section className="home-hero">
          <div>
            <h2>{snapshot?.system.objective || '¿Qué quieres resolver ahora?'}</h2>
            <p>Elige una entrada y continúa desde ahí.</p>
          </div>
          <div className="home-hero-actions">
            <ActionButton icon="plus" primary onClick={() => props.onSetSection('chat')} disabled={!canChat}>Nuevo flujo</ActionButton>
            <ActionButton icon="history" onClick={() => props.onSetSection(historyMessages.length ? 'chat' : 'workspace')}>Abrir último trabajo</ActionButton>
          </div>
        </section>
      </div>
    );
  }

  if (props.section === 'chat') {
    const draft = props.drafts.chat || '';
    const lastCommand = [...props.turns].reverse().find((turn) => turn.role === 'command');
    const canChat = snapshot?.permissions.canChat ?? false;
    const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (canChat && draft.trim()) void props.onSendChat(draft);
      }
    };

    return (
      <div className={`chat-surface ${props.globalMode === 'focus' ? 'is-focus' : ''}`}>
        <div className="chat-toolbar">
          <div className="segmented-control" aria-label="Modo de chat">
            <button className={props.chatMode === 'live' ? 'is-active' : ''} type="button" onClick={() => props.onSetChatMode('live')}>
              <Icon name="live" size={15} /> Live
            </button>
            <button className={props.chatMode === 'trace' ? 'is-active' : ''} type="button" onClick={() => props.onSetChatMode('trace')}>
              <Icon name="trace" size={15} /> Trace
            </button>
          </div>
          <div className="chat-toolbar-actions">
            <button className="toolbar-button" type="button" onClick={() => props.onRunContextCommand('/context attach')} disabled={!snapshot?.permissions.canInspectContext}>
              <Icon name="attach" size={16} /> Adjuntar contexto
            </button>
            <button className={`toolbar-button ${historyExpanded ? 'is-active' : ''}`} type="button" onClick={() => setHistoryExpanded((value) => !value)}>
              <Icon name="history" size={16} /> Historial breve
            </button>
            <button
              className="toolbar-button"
              type="button"
              disabled={!lastCommand}
              onClick={() => lastCommand && props.onDraftChange('chat', lastCommand.text)}
              title={lastCommand ? 'Pegar el último comando' : 'No hay comandos recientes'}
            >
              <Icon name="command" size={16} /> Pegar último comando
            </button>
          </div>
        </div>

        {historyExpanded && (
          <aside className="brief-history">
            <div className="brief-history-head"><strong>Últimos mensajes</strong><span>{historyMessages.length}</span></div>
            {historyMessages.slice(-5).reverse().map((message, index) => (
              <button
                key={`${String(message.id || message.timestamp || index)}`}
                type="button"
                onClick={() => props.onInspect(buildSelection(
                  String(message.id || index),
                  'history-message',
                  String(message.role || 'Mensaje'),
                  summarizeMessage(message).slice(0, 180) || 'Mensaje sin contenido',
                  [`timestamp: ${String(message.timestamp || message.created_at || 'unknown')}`, `source: ${String(message.source || message.origin || 'history')}`],
                  message
                ))}
              >
                <span>{String(message.role || 'mensaje')}</span>
                <p>{summarizeMessage(message).slice(0, 100) || 'Sin contenido'}</p>
              </button>
            ))}
          </aside>
        )}

        <section className="chat-timeline" aria-live="polite">
          {props.turns.length === 0 ? (
            <div className="chat-empty">
              <span className="chat-empty-icon"><Icon name="chat" size={28} /></span>
              <h3>Empieza por la tarea</h3>
              <p>Pregunta, describe un objetivo o solicita una acción.</p>
            </div>
          ) : props.turns.map((turn) => (
            <article
              key={turn.id}
              className={`chat-message role-${turn.role} status-${turn.status || 'done'}`}
              onClick={() => props.onInspect(buildSelection(
                turn.id,
                'chat-turn',
                turn.role === 'user' ? 'Mensaje del usuario' : turn.role === 'command' ? 'Comando' : 'Respuesta de BAGO',
                turn.text.slice(0, 240),
                [`status: ${turn.status || 'done'}`, `timestamp: ${turn.timestamp}`, `receipt: ${turn.receipt ? 'available' : 'none'}`],
                turn
              ))}
            >
              <div className="message-avatar">{turn.role === 'user' ? 'TÚ' : turn.role === 'command' ? '/' : 'B'}</div>
              <div className="message-body">
                <div className="message-meta">
                  <strong>{turn.role === 'user' ? 'Tú' : turn.role === 'command' ? 'Comando' : 'BAGO'}</strong>
                  <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {turn.status && <StatusBadge status={turn.status} />}
                </div>
                <div className="message-text">{turn.text || (turn.status === 'running' ? 'Procesando…' : '')}</div>
                {props.chatMode === 'trace' && turn.role === 'assistant' && (
                  <div className="message-trace">
                    <Icon name="trace" size={14} />
                    <span>{turn.receipt ? 'Receipt disponible' : `Estado: ${turn.status || 'unknown'}`}</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="chat-composer">
          {!canChat && (
            <div className="composer-blocked"><Icon name="warning" /> El backend no autoriza el chat en el estado actual.</div>
          )}
          <textarea
            value={draft}
            onChange={(event) => props.onDraftChange('chat', event.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder="Escribe una pregunta, objetivo o acción…"
            rows={3}
            disabled={!canChat}
          />
          <div className="composer-footer">
            <div className="composer-hint"><kbd>Enter</kbd> enviar · <kbd>Shift Enter</kbd> nueva línea</div>
            <div className="composer-buttons">
              <button className="icon-button" type="button" onClick={() => props.onRunContextCommand('/context attach')} disabled={!snapshot?.permissions.canInspectContext} title="Adjuntar contexto">
                <Icon name="attach" />
              </button>
              <button className="send-button" type="button" disabled={!canChat || !draft.trim()} onClick={() => void props.onSendChat(draft)}>
                Enviar <Icon name="send" size={17} />
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (props.section === 'workspace') {
    const workspaceFilters: WorkspaceFilter[] = ['all', 'code', 'python', 'text', 'json', 'web', 'shell', 'other', 'directory'];
    const renderTree = (nodes: ExplorerNode[], depth = 0): React.ReactNode => nodes.map((node) => {
      const expanded = isWorkspaceExpanded(node.path);
      const selected = node.path === workspaceActivePath;
      const indent = { paddingLeft: `${12 + depth * 16}px` };
      if (node.kind === 'directory') {
        return (
          <div key={node.path} className={`workspace-tree-row kind-directory ${selected ? 'is-selected' : ''}`}>
            <button
              type="button"
              className="workspace-tree-item"
              style={indent}
              onClick={() => {
                toggleWorkspaceFolder(node.path);
                setWorkspaceActivePath(node.path);
                setWorkspaceContentPath(node.path);
                setWorkspaceContent(`Carpeta: ${node.path}\nHijos: ${node.children.length}`);
                setWorkspaceContentState('empty');
                props.onInspect(
                  buildSelection(
                    node.path,
                    'workspace-directory',
                    node.name,
                    node.path,
                    [`children: ${node.children.length}`, `workspace: ${snapshot?.workspace.id || 'unknown'}`],
                    node
                  )
                );
              }}
            >
              <span className={`workspace-tree-caret ${expanded ? 'is-open' : ''}`}>▸</span>
              <span className="workspace-tree-icon"><Icon name="folder" size={15} /></span>
              <span className="workspace-tree-label">{node.name}</span>
            </button>
            {expanded && node.children.length > 0 && (
              <div className="workspace-tree-children">
                {renderTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }
      return (
        <div key={node.path} className={`workspace-tree-row kind-file ${selected ? 'is-selected' : ''}`}>
          <button
            type="button"
            className="workspace-tree-item"
            style={indent}
            onClick={() => void openWorkspaceFile(node.path)}
          >
            <span className="workspace-tree-caret" aria-hidden="true">•</span>
            <span className="workspace-tree-icon"><Icon name="file" size={15} /></span>
            <span className="workspace-tree-label-group">
              <span className="workspace-tree-label">{node.name}</span>
              <span className="workspace-tree-kind">{languageLabelForPath(node.path)}</span>
            </span>
          </button>
        </div>
      );
    });

    return (
      <div className="workspace-surface">
        <div className="surface-toolbar">
          <label className="surface-search">
            <Icon name="search" size={16} />
            <input value={workspaceQuery} onChange={(event) => setWorkspaceQuery(event.target.value)} placeholder="Buscar en el workspace" />
          </label>
          <div className="surface-toolbar-actions">
            <button className="toolbar-button" type="button" onClick={props.onChooseWorkspace}>
              <Icon name="folder" size={16} /> Elegir workspace
            </button>
            <button className="toolbar-button" type="button" onClick={() => setWorkspaceExpanded(explorerTree.filter((node) => node.kind === 'directory').map((node) => node.path))}>
              <Icon name="layout" size={16} /> Expandir todo
            </button>
            <button className="toolbar-button" type="button" onClick={() => setWorkspaceExpanded([])}>
              <Icon name="close" size={16} /> Contraer
            </button>
          </div>
        </div>
        <div className="workspace-repertoire">
          <span>Repertorio: py, txt, md, json, html, css, js, ts, jsx, tsx, yml, sh, ps1 y más.</span>
        </div>
        <div className="workspace-filterbar" role="toolbar" aria-label="Filtrar tipos de archivo">
          <span className="workspace-filterbar-label">Tipo</span>
          {workspaceFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`filter-chip ${workspaceFilter === filter ? 'is-active' : ''}`}
              onClick={() => setWorkspaceFilter(filter)}
            >
              {filterLabelForType(filter)}
            </button>
          ))}
        </div>

        <div className="workspace-layout">
          <aside className="workspace-tree-panel">
            <div className="workspace-tree-head">
              <strong>Explorador</strong>
              <span>{visibleFiles.length} entradas</span>
            </div>
            <div className="workspace-tree">
              {explorerTree.length ? renderTree(explorerTree) : (
                <div className="empty-state compact">
                  <Icon name="folder" size={22} />
                  <h3>Sin contenido</h3>
                  <p>No hay archivos visibles en este workspace.</p>
                </div>
              )}
            </div>
          </aside>

          <section className="workspace-viewer">
            <div className="workspace-viewer-head">
              <div>
                <span className="surface-eyebrow">Archivo</span>
                <h3>{selectedWorkspaceFile?.name || workspaceContentPath || 'Ninguno seleccionado'}</h3>
                <span className="workspace-viewer-kind">{workspaceContentKind}</span>
              </div>
              <div className="workspace-viewer-actions">
                <button className="toolbar-button" type="button" disabled={!workspaceContentPath} onClick={() => void copyWorkspaceText(workspaceContent)}>
                  <Icon name="copy" size={16} /> Copiar texto
                </button>
              </div>
            </div>
            <div className="workspace-viewer-meta">
              <span>{workspaceContentPath || 'Selecciona un archivo del árbol'}</span>
              <span>{workspaceContentLoading ? 'Leyendo...' : workspaceContentState === 'error' ? 'Error' : workspaceContentState === 'ready' ? 'Listo' : 'Esperando'}</span>
            </div>
            <pre className={`workspace-viewer-content state-${workspaceContentState}`}>{workspaceContentLoading ? 'Leyendo archivo...' : workspaceContent}</pre>
          </section>
        </div>
      </div>
    );
  }

  if (props.section === 'graph') {
    const baseNodes = [
      { id: 'input', type: 'entrada', label: 'Sesión', value: snapshot?.session.id || 'sin sesión', icon: 'session' as IconName },
      { id: 'context', type: 'contexto', label: 'Contexto', value: snapshot?.context.state || 'unknown', icon: 'context' as IconName },
      { id: 'workspace', type: 'transformación', label: 'Workspace', value: snapshot?.workspace.id || 'unknown', icon: 'workspace' as IconName },
      { id: 'validation', type: 'validación', label: 'Vínculo', value: snapshot?.workspace.linkedToSession ? 'confirmado' : 'pendiente', icon: 'check' as IconName },
      { id: 'model', type: 'herramienta', label: 'Modelo', value: snapshot?.model.effectiveModel || 'unknown', icon: 'model' as IconName },
      { id: 'evidence', type: 'evidencia', label: 'Receipt', value: snapshot?.context.receiptId || 'sin receipt', icon: 'evidence' as IconName },
      { id: 'output', type: 'salida', label: 'Resultado', value: snapshot?.system.objective || 'objetivo', icon: 'artifact' as IconName }
    ];
    const nodes = graphFiltered ? baseNodes.slice(0, 6) : baseNodes;
    const nextLayout = () => setGraphLayout((current) => current === 'hierarchical' ? 'radial' : current === 'radial' ? 'linear' : 'hierarchical');
    return (
      <div className="graph-surface">
        <div className="surface-toolbar graph-toolbar">
          <div className="toolbar-group">
            <button className="toolbar-button icon-only" type="button" title="Acercar"><Icon name="zoomIn" /></button>
            <button className="toolbar-button icon-only" type="button" title="Alejar"><Icon name="zoomOut" /></button>
            <button className="toolbar-button" type="button"><Icon name="center" size={16} /> Centrar</button>
          </div>
          <div className="toolbar-group">
            <button className={`toolbar-button ${graphFiltered ? 'is-active' : ''}`} type="button" onClick={() => setGraphFiltered((value) => !value)}><Icon name="filter" size={16} /> {graphFiltered ? 'Subárbol' : 'Todo'}</button>
            <button className="toolbar-button" type="button" onClick={nextLayout}><Icon name="layout" size={16} /> {graphLayout}</button>
          </div>
        </div>

        <div className="graph-layout">
          <section className={`graph-canvas graph-${graphLayout}`}>
            <svg className="graph-lines" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
              <path d="M180 160 C330 160 330 300 500 300" />
              <path d="M500 300 C670 300 670 150 820 150" />
              <path d="M500 300 C670 300 670 430 820 430" />
              <path d="M180 460 C330 460 330 300 500 300" />
              <path d="M500 300 C500 420 500 470 500 540" />
            </svg>
            {nodes.map((node, index) => (
              <button
                key={node.id}
                type="button"
                className={`graph-node node-${node.type} graph-position-${index}`}
                onClick={() => props.onInspect(buildSelection(
                  node.id,
                  node.type,
                  node.label,
                  node.value,
                  [`type: ${node.type}`, `position: ${index + 1}`, `layout: ${graphLayout}`],
                  node
                ))}
              >
                <span className="graph-node-icon"><Icon name={node.icon} size={17} /></span>
                <span><small>{node.type}</small><strong>{node.label}</strong><em>{node.value}</em></span>
              </button>
            ))}
          </section>

          <aside className="recent-nodes">
            {nodes.slice(0, 5).map((node) => (
              <button key={node.id} type="button" onClick={() => props.onInspect(buildSelection(node.id, node.type, node.label, node.value, [`type: ${node.type}`], node))}>
                <span className={`node-type-mark type-${node.type}`} />
                <span><strong>{node.label}</strong><small>{node.value}</small></span>
                <Icon name="chevron" size={14} />
              </button>
            ))}
          </aside>
        </div>
      </div>
    );
  }

  if (props.section === 'pipeline') {
    const task = props.drafts.pipeline || '';
    const canRetry = statusTone(pipelineStatus) === 'error' && Boolean(task.trim()) && Boolean(snapshot?.permissions.canRetryPipeline);
    const stopCommand = commandAvailable(props.menu, props.routes, /task cancel|\/stop|pipeline stop/) ? '/task cancel' : null;
    const canStop = statusTone(pipelineStatus) === 'running' && Boolean(stopCommand) && Boolean(snapshot?.permissions.canStopPipeline);
    const codeTaskSnapshot = asRecord(snapshot?.codeTask) || {};
    const codeTaskClassification = asRecord(codeTaskSnapshot.classification) || {};
    const codeTaskContract = asRecord(codeTaskSnapshot.contract) || {};
    const codeTaskPlan = asRecord(codeTaskContract.plan) || {};
    const codeReadFiles = stringList(codeTaskPlan?.read_files);
    const codeEditFiles = stringList(codeTaskPlan?.edit_files);
    const codeCreateFiles = stringList(codeTaskPlan?.create_files);
    const codeVerifySteps = stringList(codeTaskPlan?.verify_steps);
    const codeTaskObjective = String(codeTaskContract?.objective || codeTaskClassification?.objective || snapshot?.system.objective || 'Sin objetivo');
    const codeTaskOperation = String(codeTaskContract?.operation || codeTaskClassification?.kind || 'unknown');
    const hasCodeTask = Object.keys(codeTaskContract).length > 0 || Object.keys(codeTaskClassification).length > 0;
    return (
      <div className="pipeline-surface">
        <section className="pipeline-summary">
          <div className="pipeline-summary-copy">
            <StatusBadge status={pipelineStatus} />
            <h2>{String(planData?.task || snapshot?.system.objective || 'No hay un flujo activo')}</h2>
            <p>{steps.length ? `${steps.length} pasos · ${doneCount} completados · ${blockedCount + failedCount} requieren atención` : 'Describe una tarea para generar un plan mediante el backend existente.'}</p>
          </div>
          <div className="pipeline-summary-actions">
            {canRetry && <ActionButton icon="retry" onClick={() => void props.onRunPlanTask(task)}>Reintentar</ActionButton>}
            {canStop && stopCommand && <ActionButton icon="stop" onClick={() => void props.onRunCommand(stopCommand)}>Detener</ActionButton>}
          </div>
        </section>

        {hasCodeTask && (
          <section className="pipeline-contract">
            <div className="pipeline-contract-status">
              <StatusBadge status={codeTaskContract?.refused ? 'rejected' : codeTaskPlan?.requires_model_review ? 'blocked' : 'confirmed'} label={codeTaskOperation} />
            </div>
            <div className="pipeline-contract-overview">
              <article className="contract-card">
                <span>Objetivo</span>
                <strong>{codeTaskObjective}</strong>
                <p>{String(codeTaskContract?.language || codeTaskClassification?.language || 'unknown')} · {String(codeTaskContract?.task_id || 'sin task id')}</p>
              </article>
              <article className="contract-card">
                <span>Estado</span>
                <strong>{codeTaskContract?.refused ? 'Rechazado' : codeTaskPlan?.requires_model_review ? 'Requiere revisión' : 'Compilado'}</strong>
                <p>{String(codeTaskContract?.refusal_reason || codeTaskPlan?.finish_message || 'Sin observaciones')}</p>
              </article>
            </div>
            <div className="pipeline-contract-grid">
              <button type="button" className="contract-group" onClick={() => props.onInspect(buildSelection(
                'code-task-read',
                'code-task-plan',
                'Archivos a leer',
                codeReadFiles.join(', ') || 'Sin archivos de lectura',
                [`count: ${codeReadFiles.length}`, `operation: ${codeTaskOperation}`],
                codeTaskPlan?.read_files || []
              ))}>
                <span className="contract-group-label">Read</span>
                <strong>{codeReadFiles.length}</strong>
                <small>{codeReadFiles.length ? codeReadFiles.join(' · ') : 'Sin archivos de lectura'}</small>
              </button>
              <button type="button" className="contract-group" onClick={() => props.onInspect(buildSelection(
                'code-task-edit',
                'code-task-plan',
                'Archivos a editar',
                codeEditFiles.join(', ') || 'Sin archivos de edición',
                [`count: ${codeEditFiles.length}`, `operation: ${codeTaskOperation}`],
                codeTaskPlan?.edit_files || []
              ))}>
                <span className="contract-group-label">Edit</span>
                <strong>{codeEditFiles.length}</strong>
                <small>{codeEditFiles.length ? codeEditFiles.join(' · ') : 'Sin archivos de edición'}</small>
              </button>
              <button type="button" className="contract-group" onClick={() => props.onInspect(buildSelection(
                'code-task-create',
                'code-task-plan',
                'Archivos a crear',
                codeCreateFiles.join(', ') || 'Sin archivos de creación',
                [`count: ${codeCreateFiles.length}`, `operation: ${codeTaskOperation}`],
                codeTaskPlan?.create_files || []
              ))}>
                <span className="contract-group-label">Create</span>
                <strong>{codeCreateFiles.length}</strong>
                <small>{codeCreateFiles.length ? codeCreateFiles.join(' · ') : 'Sin archivos de creación'}</small>
              </button>
              <button type="button" className="contract-group" onClick={() => props.onInspect(buildSelection(
                'code-task-verify',
                'code-task-plan',
                'Verificaciones',
                codeVerifySteps.join(', ') || 'Sin verificaciones',
                [`count: ${codeVerifySteps.length}`, `operation: ${codeTaskOperation}`],
                codeTaskPlan?.verify_steps || []
              ))}>
                <span className="contract-group-label">Verify</span>
                <strong>{codeVerifySteps.length}</strong>
                <small>{codeVerifySteps.length ? codeVerifySteps.join(' · ') : 'Sin verificaciones'}</small>
              </button>
            </div>
          </section>
        )}

        <section className="pipeline-create">
          <textarea value={task} onChange={(event) => props.onDraftChange('pipeline', event.target.value)} placeholder="Describe una tarea para crear un nuevo flujo…" rows={2} />
          <button className="primary-button compact" type="button" disabled={!task.trim()} onClick={() => void props.onRunPlanTask(task)}><Icon name="pipeline" size={16} /> Generar plan</button>
          <button className="secondary-button compact" type="button" onClick={() => void props.onRunCommand('/roadmap')}><Icon name="history" size={16} /> Roadmap</button>
        </section>

        <section className="pipeline-timeline">
          {steps.length ? steps.map((step, index) => {
            const status = String(step.status || 'pending');
            return (
              <button
                key={String(step.number || index)}
                type="button"
                className={`pipeline-step state-${statusTone(status)}`}
                onClick={() => props.onInspect(buildSelection(
                  String(step.number || index + 1),
                  'pipeline-step',
                  String(step.description || `Paso ${index + 1}`),
                  status,
                  [`status: ${status}`, `evidence: ${Array.isArray(step.evidence) ? step.evidence.length : 0}`, `required evidence: ${Array.isArray(step.required_evidence) ? step.required_evidence.length : 0}`, `block reason: ${String(step.block_reason || 'none')}`],
                  step
                ))}
              >
                <span className="step-index">{String(step.number || index + 1)}</span>
                <span className="step-copy"><strong>{String(step.description || `Paso ${index + 1}`)}</strong><small>{String(step.block_reason || step.result || status)}</small></span>
                <StatusBadge status={status} />
                <Icon name="chevron" size={15} />
              </button>
            );
          }) : (
            <div className="empty-state"><Icon name="pipeline" size={25} /><h3>Sin pasos todavía</h3><p>Genera un plan para visualizar su ejecución.</p></div>
          )}
        </section>

      </div>
    );
  }

  if (props.section === 'evidence') {
    const latest = evidenceItems.length ? (evidenceItems[0] as RecordValue) : historyMessages.length ? historyMessages[historyMessages.length - 1] : (asRecord(snapshot?.context) || {});
    const previous = historyMessages.length > 1 ? historyMessages[historyMessages.length - 2] : null;
    const receiptId = snapshot?.context.receiptId || String(latest.id || latest.receipt_id || latest.envelope_id || 'No disponible');
    const latestSelection = buildSelection(
      receiptId,
      'evidence',
      'Última evidencia',
      String(latest.message || latest.text || latest.summary || summarizeMessage(latest) || `Receipt ${receiptId}`),
      [`status: ${snapshot?.context.certificationStatus || snapshot?.context.state || 'unknown'}`, `source: ${String(latest.source || latest.origin || 'backend')}`, `context revision: ${String(snapshot?.context.revision || 'unknown')}`],
      latest
    );
    return (
      <div className="evidence-surface">
        <section className="evidence-primary">
          <div className="evidence-heading">
            <div>
              <span className="surface-eyebrow">Última evidencia</span>
              <h2>{receiptId}</h2>
            </div>
          </div>
          <p className="evidence-narrative">{latestSelection.summary}</p>
          <div className="evidence-actions">
            <ActionButton icon="inspector" primary onClick={() => props.onInspect(latestSelection, 'detail')}>Ver detalle</ActionButton>
            <ActionButton icon="command" onClick={() => props.onInspect(latestSelection, 'raw')}>Ver raw</ActionButton>
            <ActionButton icon="compare" onClick={() => setEvidenceCompare((value) => !value)} disabled={!previous}>Comparar</ActionButton>
            <ActionButton icon="copy" onClick={() => void navigator.clipboard?.writeText(receiptId)}>Copiar ID</ActionButton>
          </div>
        </section>

        {evidenceCompare && previous && (
          <section className="evidence-comparison">
            <div className="comparison-grid">
              <article><span>Anterior</span><strong>{String(previous.id || previous.receipt_id || 'sin id')}</strong><p>{summarizeMessage(previous).slice(0, 240) || 'Sin resumen'}</p></article>
              <article><span>Actual</span><strong>{receiptId}</strong><p>{latestSelection.summary}</p></article>
            </div>
          </section>
        )}

        <section className="evidence-history">
          <div className="compact-list">
            {(evidenceItems.length ? evidenceItems : historyMessages).slice(-6).reverse().map((message, index) => (
              <button
                key={`${String(message.id || message.timestamp || index)}`}
                type="button"
                onClick={() => props.onInspect(buildSelection(
                  String(message.id || index),
                  'history-message',
                  String(message.role || message.type || 'Evidencia'),
                  String(message.message || message.text || summarizeMessage(message)).slice(0, 220),
                  [`timestamp: ${String(message.timestamp || message.created_at || 'unknown')}`, `source: ${String(message.source || message.origin || 'history')}`],
                  message
                ))}
              >
                <span className="compact-list-icon"><Icon name="evidence" size={16} /></span>
                <span><strong>{String(message.role || message.type || 'evidencia')}</strong><small>{String(message.message || message.text || summarizeMessage(message)).slice(0, 110) || 'Sin resumen'}</small></span>
                <Icon name="chevron" size={14} />
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (props.section === 'context') {
    const occupied = snapshot?.context.occupied ?? 0;
    const limit = snapshot?.context.limit ?? 0;
    const reserve = snapshot?.context.reserve ?? 0;
    const available = snapshot?.context.available ?? Math.max(0, limit - occupied - reserve);
    const percentage = limit > 0 ? Math.min(100, Math.round((occupied / limit) * 100)) : 0;
    const isHigh = percentage >= 80;
    const inspect = props.commandResults.contextInspect;
    const measure = props.commandResults.contextMeasure;
    const receiptSelection = buildSelection(
      snapshot?.context.receiptId || 'context-receipt',
      'context-receipt',
      'ContextReceipt',
      `Estado ${snapshot?.context.state || 'unknown'} · revisión ${String(snapshot?.context.revision || 'unknown')}`,
      [`occupied: ${occupied}`, `available: ${available}`, `reserve: ${reserve}`, `limit: ${limit}`, `factor: ${snapshot?.context.limitingFactor || 'unknown'}`],
      inspect?.data || inspect || snapshot?.context
    );
    return (
      <div className="context-surface">
        <section className="context-budget-card">
          <div className="context-budget-heading">
            <div>
              <span className="surface-eyebrow">Presupuesto actual</span>
              <h2>{limit ? `${occupied.toLocaleString()} de ${limit.toLocaleString()} tokens` : 'Límite no confirmado'}</h2>
            </div>
            <StatusBadge status={isHigh ? 'blocked' : snapshot?.context.state || 'unknown'} label={isHigh ? 'Uso alto' : snapshot?.context.state || 'unknown'} />
          </div>
          <div className="context-progress" aria-label={`Uso de contexto ${percentage}%`}>
            <span style={{ width: `${percentage}%` }} />
          </div>
          <div className="context-scale"><span>0</span><span>{percentage}% ocupado</span><span>{limit ? limit.toLocaleString() : '—'}</span></div>
          {isHigh && <div className="context-alert"><Icon name="warning" /> El contexto está cerca del límite. Revisa la propuesta antes de reducir carga.</div>}
        </section>

        <section className="context-metrics">
          <Metric label="Uso actual" value={occupied ? occupied.toLocaleString() : 'No disponible'} hint={`${percentage}% del límite`} icon="context" />
          <Metric label="Reserva" value={reserve ? reserve.toLocaleString() : 'No disponible'} hint="Salida, herramientas y reintentos" icon="evidence" />
          <Metric label="Disponible" value={available ? available.toLocaleString() : 'No disponible'} hint="Después de la reserva" icon="check" />
          <Metric label="Factor limitante" value={snapshot?.context.limitingFactor || 'No confirmado'} hint={`Revisión ${String(snapshot?.context.revision || '—')}`} icon="warning" />
        </section>

        <section className="context-actions-panel">
          <div className="context-actions">
            <ActionButton icon="evidence" primary onClick={() => props.onInspect(receiptSelection, 'detail')} disabled={!snapshot?.context.receiptId && !inspect}>Ver receipt</ActionButton>
            <ActionButton icon="filter" onClick={() => props.onRunContextCommand('/context tune')} disabled={!snapshot?.permissions.canInspectContext}>Proponer reducción</ActionButton>
            <ActionButton icon="expand" onClick={() => setContextExpanded((value) => !value)}>Detalle</ActionButton>
            <ActionButton icon="refresh" onClick={() => props.onRunContextCommand('/context measure')} disabled={!snapshot?.permissions.canInspectContext}>Medir</ActionButton>
          </div>
        </section>

        {contextExpanded && (
          <section className="context-details">
            <div className="context-detail-card"><span>Inspección</span><strong>{inspect?.message || (inspect ? 'Disponible' : 'No ejecutada')}</strong><button type="button" onClick={() => props.onInspect(receiptSelection, 'detail')}>Abrir detalle</button></div>
            <div className="context-detail-card"><span>Medición</span><strong>{measure?.message || (measure ? 'Disponible' : 'No ejecutada')}</strong><button type="button" onClick={() => props.onRunContextCommand('/context measure')}>Actualizar</button></div>
            <div className="context-detail-card"><span>Certificación</span><strong>{snapshot?.context.certificationStatus || 'No disponible'}</strong><button type="button" onClick={() => props.onRunContextCommand('/context certify')}>Comprobar</button></div>
          </section>
        )}
      </div>
    );
  }

  const providers = props.providers?.providers || [];
  const systemItems = [
    { label: 'Herramientas', state: snapshot?.permissions.canRunTools ? 'confirmed' : 'blocked', detail: `${snapshot?.system.activeBridges?.length || 0} bridges activos`, icon: 'actions' as IconName },
    { label: 'Contexto', state: snapshot?.context.state || 'unknown', detail: snapshot?.context.receiptId || 'Sin receipt', icon: 'context' as IconName }
  ];
  return (
    <div className="system-surface">
      <section className="system-grid">
        {systemItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className="system-item"
            onClick={() => props.onInspect(buildSelection(item.label.toLowerCase(), 'system-component', item.label, item.detail, [`state: ${item.state}`], item))}
          >
            <span className="system-item-icon"><Icon name={item.icon} size={18} /></span>
            <span><small>{item.label}</small><strong>{item.detail}</strong></span>
            <StatusBadge status={item.state} />
          </button>
        ))}
      </section>

      <section className="system-secondary-grid">
        <article className="system-panel">
          <div className="compact-list">
            {providers.slice(0, 8).map((provider, index) => (
              <button
                key={String(provider.id || provider.name || index)}
                type="button"
                onClick={() => props.onInspect(buildSelection(
                  String(provider.id || provider.name || index),
                  'provider',
                  String(provider.name || provider.id || 'Provider'),
                  String(provider.description || provider.state || 'Sin descripción'),
                  [`configured: ${String(provider.configured ?? false)}`, `models: ${Array.isArray(provider.models) ? provider.models.length : 0}`],
                  provider
                ))}
              >
                <span className="compact-list-icon"><Icon name="model" size={16} /></span>
                <span><strong>{String(provider.name || provider.id || 'Provider')}</strong><small>{String(provider.state || provider.description || '')}</small></span>
                <Icon name="chevron" size={14} />
              </button>
            ))}
          </div>
        </article>

        <article className="system-panel">
          <dl className="authority-list">
            <div><dt>Framework</dt><dd>{snapshot?.framework.root || 'No confirmado'}</dd></div>
            <div><dt>Proyecto</dt><dd>{snapshot?.project.root || 'No confirmado'}</dd></div>
            <div><dt>Scope</dt><dd>{snapshot?.workspace.scopeRoot || 'No confirmado'}</dd></div>
          </dl>
          <button
            className="text-button"
            type="button"
            onClick={() => props.onInspect(buildSelection('routes', 'backend-routes', 'Rutas del backend', `${props.routes?.count || 0} rutas`, [`auth: ${String(props.routes?.auth || 'unknown')}`, `prefixes: ${props.routes?.api_prefixes?.join(', ') || 'none'}`], props.routes), 'raw')}
          >
            Inspeccionar rutas API <Icon name="chevron" size={14} />
          </button>
        </article>
      </section>
    </div>
  );
}
