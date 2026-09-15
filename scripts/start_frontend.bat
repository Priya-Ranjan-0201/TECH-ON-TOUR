@echo off
title TravelSathi Frontend (Vite :5173)
color 0E

echo ===============================================================================
echo                TRAVELSATHI FRONTEND (VITE :5173)
echo ===============================================================================
echo.

cd /d "%~dp0..\frontend"

call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] Frontend process stopped with error code %ERRORLEVEL%.
)
pause
