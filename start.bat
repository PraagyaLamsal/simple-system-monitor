@echo off
setlocal
set "ROOT=%~dp0"
rem remove trailing backslash if present
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo ====================================
echo   System Monitor - Starting
echo   Root: "%ROOT%"
echo ====================================

if not exist "%ROOT%\backend\" (
  echo ERROR: backend folder not found at "%ROOT%\backend"
  pause
  exit /b 1
)

if not exist "%ROOT%\frontend\" (
  echo ERROR: frontend folder not found at "%ROOT%\frontend"
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js not found. Install Node.js LTS and try again.
  pause
  exit /b 1
)

if not exist "%ROOT%\backend\node_modules\" (
  echo Installing backend dependencies...
  pushd "%ROOT%\backend"
  call npm install
  if errorlevel 1 (
    echo ERROR: backend npm install failed.
    pause
    exit /b 1
  )
  popd
)

if not exist "%ROOT%\frontend\node_modules\" (
  echo Installing frontend dependencies...
  pushd "%ROOT%\frontend"
  call npm install
  if errorlevel 1 (
    echo ERROR: frontend npm install failed.
    pause
    exit /b 1
  )
  popd
)

echo Starting backend in "%ROOT%\backend"...
start "Backend" cmd /k "cd /d ""%ROOT%\backend"" ^&^& npm run dev"

echo Starting frontend in "%ROOT%\frontend"...
start "Frontend" cmd /k "cd /d ""%ROOT%\frontend"" ^&^& npm run dev"

echo Waiting for servers...
timeout /t 4 /nobreak >nul

echo Opening frontend...
start "" "http://localh
