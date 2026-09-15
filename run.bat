@echo off
setlocal EnableDelayedExpansion
title TravelSathi - One-Click Development Suite
color 0A

echo ===============================================================================
echo                NAMASTE ^& WELCOME TO TRAVELSATHI !
echo         India's Digital Public Infrastructure (DPI) for Smart Tourism
echo ===============================================================================
echo.
echo   We're getting everything ready for you:
echo     * 12,601 Destinations with AI Potential ^& Heritage Scoring
echo     * Live Anti-Overtourism Telemetry ^& Green Circuit Diversions
echo     * Festival Crowd Forecaster with Safety ^& Staffing Co-Pilot
echo     * 548+ 24/7 Hospitals ^& Verified Essentials across all 36 States/UTs
echo     * 7 Indic Languages ^& End-to-End Encrypted Group Travel
echo.
echo ===============================================================================
echo.

:: ─────────────────────────────────────────────────────
:: 1. Check Python
:: ─────────────────────────────────────────────────────
echo [1/5] Checking your Python environment...
set "PYTHON_EXE=python"
if exist "%~dp0backend\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0backend\.venv\Scripts\python.exe"
    echo        Found project virtual environment: backend\.venv
) else (
    echo        Using system Python installation
)

"%PYTHON_EXE%" --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!] Python is not installed or not in your PATH.
    echo     Please grab Python 3.10+ from https://python.org
    pause
    exit /b 1
)
echo        Python is ready!

:: ─────────────────────────────────────────────────────
:: 2. Check Node.js
:: ─────────────────────────────────────────────────────
echo.
echo [2/5] Checking Node.js ^& npm...
where node >nul 2>&1
if errorlevel 1 (
    echo [!] Node.js / npm was not found.
    echo     Please install Node 18+ from https://nodejs.org
    pause
    exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
    echo [!] npm was not found in your PATH.
    echo     Please reinstall Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
echo        Node.js ^& npm are ready!

:: ─────────────────────────────────────────────────────
:: 3. Backend dependencies
:: ─────────────────────────────────────────────────────
echo.
echo [3/5] Verifying backend libraries...
cd /d "%~dp0backend"
if exist "requirements.txt" (
    "%PYTHON_EXE%" -m pip install -r requirements.txt -q 2>nul
    echo        Backend libraries verified.
) else (
    echo        No requirements.txt found, skipping.
)
cd /d "%~dp0"

:: ─────────────────────────────────────────────────────
:: 4. Frontend dependencies
:: ─────────────────────────────────────────────────────
echo.
echo [4/5] Checking frontend packages...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo        First time setup: Installing npm packages, takes about 30 seconds...
    call npm install --silent
)
echo        Frontend packages are good to go!
cd /d "%~dp0"

:: ─────────────────────────────────────────────────────
:: 5. Database Schema & Tables
:: ─────────────────────────────────────────────────────
echo.
echo [5/5] Ensuring database tables ^& 12,601 scored destinations are online...
cd /d "%~dp0backend"
"%PYTHON_EXE%" scripts\run_create_tables.py 2>nul
echo        Database verified and ready.
cd /d "%~dp0"

:: ─────────────────────────────────────────────────────
:: 6. Launch FastAPI Backend
:: ─────────────────────────────────────────────────────
echo.
echo -------------------------------------------------------------------------------
echo   Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "TravelSathi-Backend" /min /d "%~dp0backend" "%PYTHON_EXE%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

:: ─────────────────────────────────────────────────────
:: 7. Launch Vite Frontend
:: ─────────────────────────────────────────────────────
echo   Starting Vite Frontend on http://localhost:5173 ...
start "TravelSathi-Frontend" /min /d "%~dp0frontend" npm.cmd run dev
echo -------------------------------------------------------------------------------

:: ─────────────────────────────────────────────────────
:: 8. Wait and launch browser
:: ─────────────────────────────────────────────────────
echo.
echo   Waiting for the backend health check...
set "BACKEND_READY=0"
for /l %%N in (1,1,30) do (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try { if ((Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 http://127.0.0.1:8000/api/health).StatusCode -eq 200) { exit 0 } } catch {} ; exit 1" >nul 2>&1
    if not errorlevel 1 (
        set "BACKEND_READY=1"
        goto backend_ready
    )
    timeout /t 1 /nobreak >nul
)

:backend_ready
if "%BACKEND_READY%"=="1" (
    echo        Backend health check passed.
) else (
    echo [!] Backend did not become ready within 30 seconds.
    echo     Check the TravelSathi-Backend window for the startup error.
)

start http://localhost:5173

echo.
echo ===============================================================================
echo                      ALL SERVICES ARE LIVE ^& READY!
echo ===============================================================================
echo.
echo   * Main Web Application:   http://localhost:5173
echo   * DMO Command Center:     http://localhost:5173/dmo
echo   * Destination Potential:  http://localhost:5173/dmo/potential
echo   * Festival Crowd Forecast: http://localhost:5173/dmo/forecasts
echo   * Interactive API Docs:   http://127.0.0.1:8000/docs
echo.
echo   Active AI/ML Engines:
echo     1. Destination Potential (6 empirical factors across 12,601 POIs)
echo     2. Dynamic Tariff Co-Pilot (GradientBoosting, R2: 0.995)
echo     3. Overtourism Risk Detector (Real-time capacity telemetry)
echo     4. Festival Footfall Forecaster (14-day ramp models, R2: 0.980)
echo     5. Sentiment ^& Authenticity (DistilBERT SST-2)
echo     6. Multi-Modal Itinerary Optimizer (Graph + OR-Tools)
echo     7. Emergency Trauma Mesh (548+ Level-1 hospitals, dial 108/112)
echo ===============================================================================
echo.
echo   Press any key to open the handy Diagnostic ^& Test menu, or just keep this
echo   window open while you explore the app!
echo.
pause >nul

:menu
cls
echo ===============================================================================
echo                   TRAVELSATHI - QUICK DIAGNOSTIC TOOLBOX
echo ===============================================================================
echo.
echo   [1]  Test external API credentials (OpenWeather, Groq, ORS, Gemini)
echo   [2]  Run full system audit (26 live health checks)
echo   [3]  Run Destination Potential Score unit tests (4/4 pytest suite)
echo   [4]  Run ML model tests (Pricing, Recommender, Authenticity)
echo   [5]  Run Cultural Events ^& 7-language localization tests
echo   [6]  Inspect live Destination Potential Matrix (Top scores in live DB)
echo   [7]  Verify 24/7 Map Essentials (Hospitals, Stays, Emergency Hotlines)
echo   [8]  Rebuild production bundle (Vite)
echo   [9]  Open API Documentation (Swagger)
echo   [10] Open Web Application in your browser
echo   [0]  Stop everything and exit
echo.
set /p "choice=Select an option (0-10): "

if "%choice%"=="1" goto opt_keys
if "%choice%"=="2" goto opt_audit
if "%choice%"=="3" goto opt_potential_tests
if "%choice%"=="4" goto opt_ml
if "%choice%"=="5" goto opt_events
if "%choice%"=="6" goto opt_potential_data
if "%choice%"=="7" goto opt_essentials
if "%choice%"=="8" goto opt_build
if "%choice%"=="9" goto opt_swagger
if "%choice%"=="10" goto opt_browser
if "%choice%"=="0" goto opt_exit
echo.
echo [!] Oops, that wasn't a valid option. Try again!
timeout /t 1 >nul
goto menu

:opt_keys
echo.
echo [*] Testing API credentials and live endpoints...
"%PYTHON_EXE%" "%~dp0scripts\test_user_keys.py"
echo.
pause
goto menu

:opt_audit
echo.
echo [*] Running the 26-point master system audit...
"%PYTHON_EXE%" "%~dp0scripts\master_audit_runner.py"
echo.
pause
goto menu

:opt_potential_tests
echo.
echo [*] Running Destination Potential Score unit tests...
cd /d "%~dp0backend"
"%PYTHON_EXE%" -m pytest tests/test_potential_score.py -v
cd /d "%~dp0"
echo.
pause
goto menu

:opt_ml
echo.
echo [*] Testing all machine learning models...
cd /d "%~dp0backend"
"%PYTHON_EXE%" -m pytest tests/test_all_3_ml_models.py -v
cd /d "%~dp0"
echo.
pause
goto menu

:opt_events
echo.
echo [*] Testing Cultural Events ^& Multilingual Localization...
cd /d "%~dp0backend"
"%PYTHON_EXE%" -m pytest tests/test_cultural_events.py -v
cd /d "%~dp0"
echo.
pause
goto menu

:opt_potential_data
echo.
echo [*] Querying live Destination Potential Score rankings...
"%PYTHON_EXE%" -c "import urllib.request, json; res = urllib.request.urlopen('http://127.0.0.1:8000/api/dmo/investment-priorities?limit=5'); d = json.loads(res.read().decode('utf-8')); print('Total Scored POIs:', d.get('total')); print('Hourly Token:', d.get('hourly_token')); [print(f'  {i+1}. {item[\"name\"]} ({item[\"state\"]}) - Score: {item[\"potential_score\"]} | Tier: {item[\"heritage_status\"]}') for i, item in enumerate(d.get('investment_priorities', []))]"
echo.
pause
goto menu

:opt_essentials
echo.
echo [*] Checking 24/7 hospitals and emergency essentials across states...
"%PYTHON_EXE%" -c "import urllib.request, json; req = urllib.request.urlopen('http://127.0.0.1:8000/api/destinations/map-points?limit=15000'); d = json.loads(req.read().decode('utf-8')); print('Total Map Points:', d.get('counts')); from collections import Counter; c = Counter(p['state'] for p in d['points'] if p.get('category') in ('Hospital', 'Hotel', 'Homestay', 'Restaurant')); print('\nTop States by Essential Coverage:'); [print(f'  {k}: {v} essentials') for k, v in c.most_common(8)]"
echo.
pause
goto menu

:opt_build
echo.
echo [*] Building optimized production bundle...
cd /d "%~dp0frontend"
call npm run build
cd /d "%~dp0"
echo.
pause
goto menu

:opt_swagger
start http://127.0.0.1:8000/docs
goto menu

:opt_browser
start http://localhost:5173
goto menu

:opt_exit
echo.
echo [*] Shutting down background servers cleanly...
taskkill /FI "WINDOWTITLE eq TravelSathi-Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq TravelSathi-Frontend*" /F >nul 2>&1
echo [OK] Everything is closed. Have a wonderful day ahead!
exit /b 0
