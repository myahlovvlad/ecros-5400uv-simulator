@echo off
setlocal
chcp 65001 >nul

echo ============================================================
echo   ECROS-5400UV Simulator - Windows launcher
echo ============================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm.cmd is not available in PATH.
    pause
    exit /b 1
)

if not exist node_modules (
    echo [1/2] Installing dependencies...
    call npm.cmd install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
) else (
    echo [1/2] Dependencies already installed.
)

echo [2/2] Starting GUI...
echo If the browser does not open automatically, use:
echo   http://localhost:3000
echo.

call npm.cmd run dev

endlocal
