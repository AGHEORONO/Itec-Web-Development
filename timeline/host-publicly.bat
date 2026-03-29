@echo off
title iTECify Public Host
color 0b

echo.
echo ========================================================
echo        🚀 Starting iTECify Public Server 🚀
echo ========================================================
echo.
echo Requesting a highly robust public URL from Cloudflare...
echo.
echo ========================================================
echo   ⚠️ IMPORTANT: Wait for the link ending in
echo   ".trycloudflare.com" to appear below!
echo.
echo   Highlight the link and Right-Click to copy it.
echo   DO NOT PRESS CTRL+C TO COPY (It will kill the server)
echo ========================================================
echo.

cmd /c npx -y cloudflared tunnel --url http://localhost:3001
pause
