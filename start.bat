@echo off
chcp 65001 >nul
echo ============================================
echo   海洋智能牧场监测预测系统 - 启动脚本
echo ============================================
echo.

echo [1/3] 启动后端服务...
start "后端服务" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 2 >nul

echo [2/3] 启动前端服务...
start "前端服务" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 3 >nul

echo [3/3] 检测视频流服务...
if exist "%~dp0backend\media-server\mediamtx.exe" (
    echo     发现 MediaMTX，是否启动视频流服务？(Y/N)
    choice /C YN /M "选择:" /T 5 /D N
    if errorlevel 2 goto :skip_media
    start "视频流服务" cmd /k "cd /d "%~dp0backend\media-server" && mediamtx.exe"
    timeout /t 2 >nul
) else (
    echo     [提示] 未检测到 MediaMTX
    echo           运行 install-mediamtx.bat 可安装
)

:skip_media
echo.
echo ============================================
echo   系统已启动！
echo   后端地址: http://localhost:666
echo   前端地址: http://localhost:888
echo   视频流:   http://localhost:8888 (需启动MediaMTX)
echo   默认账号: admin / admin123
echo ============================================
echo.
pause
