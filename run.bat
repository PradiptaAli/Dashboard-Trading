@echo off
title TradeOS Terminal - Starting...
echo.
echo  ████████╗██████╗  █████╗ ██████╗ ███████╗ ██████╗ ███████╗
echo  ╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔═══██╗██╔════╝
echo     ██║   ██████╔╝███████║██║  ██║█████╗  ██║   ██║███████╗
echo     ██║   ██╔══██╗██╔══██║██║  ██║██╔══╝  ██║   ██║╚════██║
echo     ██║   ██║  ██║██║  ██║██████╔╝███████╗╚██████╔╝███████║
echo     ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝
echo.
echo  Trading Journal ^& AI Vision Scanner
echo  ============================================
echo.

:: Auto-detect Node.js location
set "NODE_WINGET=%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64"
set "NODE_STANDARD=C:\Program Files\nodejs"

where node >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo  [OK] Node.js ditemukan di PATH sistem
    goto :run
)

if exist "%NODE_WINGET%\node.exe" (
    echo  [OK] Node.js ditemukan di WinGet packages
    set "PATH=%NODE_WINGET%;%PATH%"
    goto :run
)

if exist "%NODE_STANDARD%\node.exe" (
    echo  [OK] Node.js ditemukan di Program Files
    set "PATH=%NODE_STANDARD%;%PATH%"
    goto :run
)

echo  [ERROR] Node.js tidak ditemukan!
echo  Silakan install dari: https://nodejs.org
pause
exit /b 1

:run
echo  Node.js: 
node -v
echo  NPM: 
npm -v
echo.
echo  Membuka browser otomatis dalam 3 detik...
echo  URL: http://localhost:3000
echo.
timeout /t 3 /nobreak >nul
start http://localhost:3000
echo  [RUNNING] Server TradeOS aktif. Tekan Ctrl+C untuk stop.
echo.
npm run dev
pause
