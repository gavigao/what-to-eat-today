@echo off
chcp 65001 >nul
cd /d "%~dp0"

:: 获取本机局域网 IP（中文/英文 Windows 兼容）
set LOCAL_IP=Unknown
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do set RAW_IP=%%a
if not defined RAW_IP (
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r "[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*"') do set RAW_IP=%%a
)
set LOCAL_IP=%RAW_IP: =%

echo.
echo ================================
echo   Today's Menu - Launching...
echo ================================
echo.

echo [1/2] Starting backend (port 3001) ...
start "Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo [2/2] Starting frontend (port 5173) ...
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ================================
echo   Computer: http://localhost:5173
if not "%LOCAL_IP%"=="Unknown" echo   Mobile:   http://%LOCAL_IP%:5173
echo.
if "%LOCAL_IP%"=="Unknown" echo   (Could not detect IP - check WiFi)
echo ================================
echo.
pause
