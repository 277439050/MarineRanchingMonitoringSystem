@echo off
chcp 65001 >nul
echo ============================================
echo   海洋智能牧场监测预测系统 - 启动脚本
echo ============================================
echo.

echo [1/2] 启动后端服务...
start "后端服务" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 2 >nul

echo [2/2] 启动前端服务...
start "前端服务" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 3 >nul

echo.
echo ============================================
echo   系统已启动！
echo   后端地址: http://localhost:8080
echo   前端地址: http://localhost:5173
echo   默认账号: admin / admin123
echo ============================================
echo.
pause
