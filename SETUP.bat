@echo off
title Pixel Desktop Pet — One-Click Setup
color 0D
echo.
echo  ========================================
echo       PIXEL DESKTOP PET — SETUP
echo  ========================================
echo.

:: ── Step 1: Check Node.js ──
echo  [1/4] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Node.js is not installed!
    echo.
    echo  Please install Node.js first:
    echo  https://nodejs.org/
    echo.
    echo  Download the LTS version, install it,
    echo  then run this setup again.
    echo.
    start https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo   Found Node.js %%v

:: ── Step 2: Install dependencies ──
echo.
echo  [2/4] Installing bridge dependencies...
cd /d "%~dp0bridge"
npm install --silent >nul 2>&1
if errorlevel 1 (
    echo   npm install failed, retrying...
    npm install
)
echo   Dependencies installed!

:: ── Step 3: Add to Windows startup ──
echo.
echo  [3/4] Adding bridge to Windows startup...
cd /d "%~dp0"

set SRC=%~dp0start-bridge-hidden.vbs
set DST=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\PixelBridge.vbs

copy /Y "%SRC%" "%DST%" >nul 2>&1
if errorlevel 1 (
    echo   Could not add to startup — bridge will work but won't auto-start.
) else (
    echo   Bridge will auto-start on login!
)

:: ── Step 4: Start bridge now ──
echo.
echo  [4/4] Starting bridge server...

:: Kill any existing bridge to avoid port conflicts
taskkill /f /im node.exe /fi "WINDOWTITLE eq Pixel*" >nul 2>&1

wscript "%SRC%"
echo   Bridge is running in the background!

:: ── Done ──
echo.
echo  ========================================
echo        SETUP COMPLETE!
echo  ========================================
echo.
echo  Next step: Add the wallpaper to Lively Wallpaper
echo.
echo  1. Open Lively Wallpaper
echo  2. Click the + button (Add Wallpaper)
echo  3. Select this file:
echo     %~dp0pixel-offline-online.html
echo.
echo  That's it! Your pixel pet will appear on
echo  your desktop. The bridge starts automatically
echo  every time you log in.
echo.
echo  To remove: double-click remove-from-startup.bat
echo.
pause
