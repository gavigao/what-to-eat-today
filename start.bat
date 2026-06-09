@echo off
chcp 65001 >nul

:: 获取本机局域网 IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do set LOCAL_IP=%%a
set LOCAL_IP=%LOCAL_IP: =%

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
echo   Computer: http://localhost:5173
echo   Mobile:   http://%LOCAL_IP%:5173
echo.
echo   (Make sure phone is on same WiFi)
echo ================================
echo.
pause
