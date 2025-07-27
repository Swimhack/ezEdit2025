@echo off
echo ===============================================
echo EzEdit.co PHP Setup for Windows
echo ===============================================
echo.

REM Check if PHP is already installed
php --version >nul 2>&1
if %errorlevel% == 0 (
    echo PHP is already installed!
    php --version
    echo.
    echo Starting PHP development server...
    goto :start_server
)

echo PHP not found. Installing PHP...
echo.

REM Create PHP directory
if not exist "C:\php" mkdir C:\php

REM Download PHP (using PowerShell)
echo Downloading PHP 8.2...
powershell -Command "& {Invoke-WebRequest -Uri 'https://windows.php.net/downloads/releases/php-8.2.13-Win32-vs16-x64.zip' -OutFile 'C:\php\php.zip'}"

if not exist "C:\php\php.zip" (
    echo Failed to download PHP. Please check your internet connection.
    echo.
    echo Alternative: Download PHP manually from https://windows.php.net/download/
    echo Extract to C:\php and run this script again.
    pause
    exit /b 1
)

REM Extract PHP
echo Extracting PHP...
powershell -Command "& {Expand-Archive -Path 'C:\php\php.zip' -DestinationPath 'C:\php' -Force}"

REM Copy php.ini
if exist "C:\php\php.ini-development" (
    copy "C:\php\php.ini-development" "C:\php\php.ini"
) else (
    echo Creating basic php.ini...
    echo [PHP] > C:\php\php.ini
    echo extension_dir = "ext" >> C:\php\php.ini
    echo extension=curl >> C:\php\php.ini
    echo extension=fileinfo >> C:\php\php.ini
    echo extension=gd >> C:\php\php.ini
    echo extension=mbstring >> C:\php\php.ini
    echo extension=openssl >> C:\php\php.ini
    echo extension=pdo_sqlite >> C:\php\php.ini
    echo extension=sqlite3 >> C:\php\php.ini
)

REM Add PHP to PATH (temporary for this session)
set PATH=C:\php;%PATH%

echo.
echo PHP installed successfully!
php --version

:start_server
echo.
echo ===============================================
echo Starting EzEdit.co Development Server
echo ===============================================
echo.
echo Server will be available at:
echo   http://localhost:8080
echo   http://localhost:8080/editor.php
echo   http://localhost:8080/dashboard.html
echo.
echo Press Ctrl+C to stop the server
echo.

REM Navigate to ezedit.co directory
cd /d "%~dp0"

REM Start PHP development server
php -S localhost:8080 -t public

echo.
echo Server stopped.
pause