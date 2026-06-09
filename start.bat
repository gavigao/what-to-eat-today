@echo off
chcp 65001 >nul
echo.
echo ================================
echo   Today's Menu - Launching...
echo ================================
echo.

echo [1/2] Starting backend (port 3001) ...
start "Backend" cmd /c "cd backend && npm run dev"

echo [2/2] Starting frontend (port 5173) ...
start "Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo ================================
echo   Open: http://localhost:5173
echo ================================
echo.
pause
