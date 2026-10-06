@echo off
set "ROOT_DIR=%~dp0"

echo ===================================================
echo             Starting CampusPlace
echo ===================================================

if not exist "%ROOT_DIR%.venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found in .venv!
    pause
    exit /b 1
)

echo [1/2] Starting Backend (Daphne ASGI at http://127.0.0.1:8000)...
start "CampusPlace Backend" cmd /k "cd /d "%ROOT_DIR%backend" && call "%ROOT_DIR%.venv\Scripts\activate.bat" && daphne -b 127.0.0.1 -p 8000 config.asgi:application"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend (Next.js at http://localhost:3000)...
start "CampusPlace Frontend" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"

echo.
echo Application started:
echo - Backend:  http://127.0.0.1:8000
echo - Frontend: http://localhost:3000
echo.
echo Default DB: SQLite. Optional: docker compose up -d + USE_POSTGRES/USE_REDIS=True in backend/.env
echo.
echo Close individual command windows to stop servers.
timeout /t 4 >nul