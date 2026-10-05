@echo off
title NexaTelix website - keep this window open
cd /d "%~dp0"
echo.
echo   NexaTelix is starting...
echo   Your browser will open at http://localhost:3000
echo   Keep this window open. Close it to stop the website.
echo.
if not exist node_modules (
  echo   First run: installing packages, this takes a minute...
  call npm install
)
start "" cmd /c "timeout /t 8 /nobreak >nul & start http://localhost:3000"
call npm run dev
echo.
echo   The website stopped. Press any key to close this window.
pause >nul
