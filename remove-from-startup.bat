@echo off
title Pixel Bridge — Remove from Startup

set DST=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\PixelBridge.vbs

if exist "%DST%" (
  del "%DST%"
  echo  Pixel Bridge removed from startup.
) else (
  echo  Pixel Bridge was not in startup.
)

echo  To stop the bridge now, open Task Manager and end the "node.exe" process.
echo.
pause
