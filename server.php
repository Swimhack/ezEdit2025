<?php
/**
 * EzEdit Development Server
 * 
 * This script serves as the main router for the EzEdit application
 * It handles static files, API requests, and integrates with the MVC structure
 */

// Define the base directory
define('EZEDIT_ROOT', __DIR__);
define('EZEDIT_SECURE_ACCESS', true);

// Set error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Load environment variables from .env file
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
}

// Helper function to get environment variables
function env($key, $default = null) {
    return isset($_ENV[$key]) ? $_ENV[$key] : (getenv($key) ?: $default);
}

// Autoloader for MVC structure
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/app/';
    
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    
    if (file_exists($file)) {
        require $file;
    }
});

// Get the request URI
$uri = $_SERVER['REQUEST_URI'];

// Handle API requests
if (strpos($uri, '/api') === 0) {
    require_once __DIR__ . '/app/api.php';
    exit;
}

// Handle legacy FTP API requests (for backward compatibility)
if (strpos($uri, '/ftp/ftp-handler.php') === 0) {
    require_once __DIR__ . '/public/ftp/config.php';
    require_once __DIR__ . '/public/ftp/ftp-handler.php';
    exit;
}

// Handle PHP files in public directory
$filePath = __DIR__ . '/public' . $uri;
if (file_exists($filePath) && is_readable($filePath) && pathinfo($filePath, PATHINFO_EXTENSION) === 'php') {
    require_once $filePath;
    exit;
}

// Handle static files
// Default to index.html for the root path
if ($uri === '/') {
    $filePath = __DIR__ . '/public/index.html';
}

// Check if the file exists and is readable
if (file_exists($filePath) && is_readable($filePath)) {
    // Get the file extension
    $extension = pathinfo($filePath, PATHINFO_EXTENSION);
    
    // Set the content type based on the file extension
    switch ($extension) {
        case 'html':
            header('Content-Type: text/html');
            break;
        case 'css':
            header('Content-Type: text/css');
            break;
        case 'js':
            header('Content-Type: application/javascript');
            break;
        case 'json':
            header('Content-Type: application/json');
            break;
        case 'png':
            header('Content-Type: image/png');
            break;
        case 'jpg':
        case 'jpeg':
            header('Content-Type: image/jpeg');
            break;
        case 'gif':
            header('Content-Type: image/gif');
            break;
        case 'svg':
            header('Content-Type: image/svg+xml');
            break;
        case 'pdf':
            header('Content-Type: application/pdf');
            break;
        case 'zip':
            header('Content-Type: application/zip');
            break;
        case 'ico':
            header('Content-Type: image/x-icon');
            break;
    }
    
    // Output the file content
    readfile($filePath);
    exit;
}

// If we get here, the file was not found
header('HTTP/1.0 404 Not Found');
echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found</title>
    <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
    <div class="container">
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <a href="/">Go back to home</a>
    </div>
</body>
</html>';
