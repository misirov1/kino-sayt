@echo off
title Kinoverse Server
echo ===================================================
echo   KINOVERSE - KINO PLATFORMASI ISHGA TUSHMOQDA...
echo ===================================================
cd /d "%~dp0server"
node src/index.js
pause
