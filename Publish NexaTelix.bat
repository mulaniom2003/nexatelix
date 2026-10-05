@echo off
title Publish NexaTelix to the internet
cd /d "%~dp0"
echo.
echo   Publishing NexaTelix to Vercel. Keep this window open until it says DONE.
echo.
call npx --yes vercel@latest whoami >nul 2>&1
if errorlevel 1 (
  echo   A browser tab will open. Log in to Vercel there, then come back here.
  call npx --yes vercel@latest login
)
echo   Uploading and building the site, this takes 1-2 minutes...
call npx --yes vercel@latest deploy --prod --yes > publish-log.txt 2>&1
call npx --yes vercel@latest domains add nexatelix.com nexatelix >> publish-log.txt 2>&1
call npx --yes vercel@latest domains add www.nexatelix.com nexatelix >> publish-log.txt 2>&1
call npx --yes vercel@latest domains inspect nexatelix.com >> publish-log.txt 2>&1
type publish-log.txt
echo.
echo   DONE. Tell Claude it finished. Press any key to close this window.
pause >nul
