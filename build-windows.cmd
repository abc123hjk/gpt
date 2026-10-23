@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js LTS 22 or newer from https://nodejs.org first.
  pause
  exit /b 1
)
if exist package-lock.json (
  call npm ci
) else (
  call npm install --save-dev electron@latest electron-builder@latest playwright-core@latest
)
if errorlevel 1 goto failed
call npm test
if errorlevel 1 goto failed
call npm run check
if errorlevel 1 goto failed
call npm run build:win
if errorlevel 1 goto failed
echo Build complete. Open the release folder.
start "" "%cd%\release"
pause
exit /b 0
:failed
echo Build failed. Please save the error above.
pause
exit /b 1
