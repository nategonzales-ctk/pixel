@echo off
title Pixel Bridge — Add to Windows Startup

set SRC=%~dp0start-bridge-hidden.vbs
set DST=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\PixelBridge.vbs

copy /Y "%SRC%" "%DST%" >nul

echo.
echo  Done! Pixel Bridge will now start automatically when Windows logs in.
echo  No admin rights required.
echo.
echo  Starting the bridge right now...
wscript "%SRC%"
echo  Bridge is running in the background!
echo.
pause
