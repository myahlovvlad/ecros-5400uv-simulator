@echo off
setlocal
chcp 65001 >nul

for %%I in ("%~dp0..") do set "ROOT_DIR=%%~fI"
set "APP_URL=http://127.0.0.1:3000"

pushd "%ROOT_DIR%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to switch to repository directory: %ROOT_DIR%
    pause
    exit /b 1
)

echo ============================================================
echo   ECROS-5400UV Simulator - Windows launcher
echo ============================================================
echo.

if not exist package.json (
    echo [ERROR] package.json not found in %CD%
    echo Make sure scripts\init.bat is launched from the simulator repository.
    pause
    popd >nul
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Install Node.js from https://nodejs.org/
    pause
    popd >nul
    exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm.cmd is not available in PATH.
    pause
    popd >nul
    exit /b 1
)

if not exist node_modules (
    echo [1/3] Installing dependencies...
    call npm.cmd install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        popd >nul
        exit /b 1
    )
) else (
    echo [1/3] Dependencies already installed.
)

echo [2/3] Opening emulator URL in the browser...
start "" "%APP_URL%"

echo [3/3] Starting Vite dev server in this window...
echo If the browser page opens before the server is ready, wait a few seconds and refresh.
echo Emulator URL: %APP_URL%
echo Press Ctrl+C in this window to stop the simulator.
echo.

call npm.cmd run dev
set "EXIT_CODE=%ERRORLEVEL%"

popd >nul
endlocal & exit /b %EXIT_CODE%
