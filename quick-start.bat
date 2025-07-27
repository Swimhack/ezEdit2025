@echo off
echo ===============================================
echo EzEdit.co Quick Start
echo ===============================================
echo.

REM Check if running from correct directory
if not exist "public\editor.html" (
    echo Error: Please run this from the ezedit.co directory
    echo Make sure you can see the 'public' folder here.
    pause
    exit /b 1
)

REM Check for PHP
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo PHP not found. Running setup...
    call setup-php-windows.bat
    exit /b
)

echo PHP found! Starting EzEdit.co server...
echo.

REM Create required directories
if not exist "public\data" mkdir public\data
if not exist "public\logs" mkdir public\logs

REM Set permissions (basic)
echo Setting up directories...

REM Copy fixed editor file
echo Copying editor.php...
if exist "editor.php" (
    copy "editor.php" "public\editor.php" >nul
    echo ✓ Editor updated
)

echo.
echo ===============================================
echo Starting EzEdit.co Development Server
echo ===============================================
echo.
echo Server starting at:
echo   📝 Editor: http://localhost:8080/editor.php
echo   📊 Dashboard: http://localhost:8080/dashboard.html
echo   🏠 Home: http://localhost:8080/
echo.
echo Features enabled:
echo   ✓ Secure credential storage
echo   ✓ HIPAA-compliant audit logging
echo   ✓ AES-256 encryption
echo   ✓ FTP/SFTP support
echo.
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

REM Start the server in public directory
cd public
php -S localhost:8080

echo.
echo Server stopped.
pause