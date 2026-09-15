@echo off
title TravelSathi Backend (FastAPI :8000)
color 0B

echo ===============================================================================
echo                TRAVELSATHI BACKEND (FASTAPI :8000)
echo ===============================================================================
echo.

cd /d "%~dp0..\backend"

if exist ".venv\Scripts\python.exe" (
    echo [*] Using virtual environment: %CD%\.venv
    .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
) else (
    echo [*] Using system python
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] Backend process stopped with error code %ERRORLEVEL%.
)
pause
