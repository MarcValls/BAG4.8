@echo off
setlocal
set "BAGO_UI_ROOT=%~dp0release\v4\current"
for %%I in ("%BAGO_UI_ROOT%") do set "BAGO_UI_ROOT=%%~fI"
set "BAGO_UI_URL=http://127.0.0.1:8080"

if not exist "%BAGO_UI_ROOT%\bago_core\launcher.py" (
  echo No se encontro %BAGO_UI_ROOT%\bago_core\launcher.py
  exit /b 1
)

start "" /min powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Set-Location -LiteralPath $env:BAGO_UI_ROOT; python .\bago_core\launcher.py serve --port 8080"
for /l %%i in (1,1,20) do (
  powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing '%BAGO_UI_URL%').StatusCode | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
  if not errorlevel 1 goto :open_ui
  timeout /t 1 /nobreak >nul
)
:open_ui
start "" "%BAGO_UI_URL%"
