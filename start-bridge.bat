@echo off
title Pixel Bridge — Claude AI
cd /d "%~dp0bridge"

npm install --silent

node server.js
pause
