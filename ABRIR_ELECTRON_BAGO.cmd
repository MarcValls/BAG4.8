@echo off
setlocal
set "BAGO_UI_ROOT=%~dp0release\v4\current"
for %%I in ("%BAGO_UI_ROOT%") do set "BAGO_UI_ROOT=%%~fI"

if not exist "%BAGO_UI_ROOT%\package.json" (
  echo No se encontro %BAGO_UI_ROOT%\package.json
  exit /b 1
)

if not exist "%BAGO_UI_ROOT%\electron\main.cjs" (
  echo No se encontro %BAGO_UI_ROOT%\electron\main.cjs
  exit /b 1
)

start "" /min powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$root = $env:BAGO_UI_ROOT; $candidates = @((Join-Path $root 'node_modules\electron\dist\electron.exe'), (Join-Path $root 'ui-react\node_modules\electron\dist\electron.exe')); foreach ($candidate in $candidates) { if (Test-Path $candidate) { Start-Process -FilePath $candidate -WorkingDirectory $root -ArgumentList '.'; exit 0 } }; Set-Location -LiteralPath $root; npm run manager:dev"
exit /b 0
