@echo off
:: No need for chcp 65001 if using only English

echo ============================================
echo   MediaMTX Video Stream Service - Installer
echo ============================================
echo.

set MTX_URL=https://github.com/bluenviron/mediamtx/releases/download/v1.9.3/mediamtx_v1.9.3_windows_amd64.zip
set ZIP_FILE=mediamtx.zip
set TARGET_DIR=backend\media-server

if exist "%TARGET_DIR%\mediamtx.exe" (
    echo [OK] MediaMTX already installed: %TARGET_DIR%\mediamtx.exe
    goto :config
)

echo [1/3] Downloading MediaMTX v1.9.3 ...
echo     Source: %MTX_URL%
powershell -Command "Invoke-WebRequest -Uri '%MTX_URL%' -OutFile '%ZIP_FILE%'"
if errorlevel 1 (
    echo [ERROR] Download failed. Please download manually:
    echo         %MTX_URL%
    echo         Extract to %TARGET_DIR%
    pause
    exit /b 1
)

echo [2/3] Extracting...
powershell -Command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath 'temp_mtx' -Force"
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
xcopy /E /Y /I "temp_mtx\*" "%TARGET_DIR%\" >nul 2>&1
rmdir /S /Q temp_mtx >nul 2>&1
del %ZIP_FILE% >nul 2>&1

echo [3/3] Copying config file...
copy /Y backend\mediamtx.yml "%TARGET_DIR%\mediamtx.yml" >nul 2>&1

echo.
echo ============================================
echo   Installation Complete!
echo   Config file: %TARGET_DIR%\mediamtx.yml
echo   To start: Double click %TARGET_DIR%\mediamtx.exe
echo ============================================

:config
echo.
echo Current Camera RTSP Config (Please update with real addresses):
type backend\mediamtx.yml | findstr "source:"
echo.
pause