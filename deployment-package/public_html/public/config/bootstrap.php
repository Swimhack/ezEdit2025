<?php
/**
 * EzEdit.co Bootstrap File
 * Include this at the top of every PHP file to ensure proper security and configuration
 */

// Prevent direct access
if (!defined('EZEDIT_INIT')) {
    define('EZEDIT_INIT', true);
}

// Error reporting based on environment
$isDevelopment = ($_SERVER['APP_ENV'] ?? 'production') === 'development';
if ($isDevelopment) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Load required files
require_once __DIR__ . '/Environment.php';
require_once __DIR__ . '/Security.php';

// Initialize security
Security::initialize();

// Set timezone
date_default_timezone_set('UTC');

// Register error handler for production
if (!$isDevelopment) {
    set_error_handler(function($errno, $errstr, $errfile, $errline) {
        error_log("Error [$errno]: $errstr in $errfile on line $errline");
        return true;
    });
    
    set_exception_handler(function($exception) {
        error_log("Uncaught exception: " . $exception->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Internal server error']);
        exit;
    });
}

// Clean up old sessions and rate limit data periodically
if (mt_rand(1, 100) === 1) { // 1% chance
    // Clean up expired sessions (basic file-based sessions)
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_gc();
    }
    
    // Clean up old rate limit data
    $rateLimitFile = __DIR__ . '/../data/rate_limits.json';
    if (file_exists($rateLimitFile)) {
        $rateLimits = json_decode(file_get_contents($rateLimitFile), true) ?: [];
        $oneHourAgo = time() - 3600;
        $cleaned = array_filter($rateLimits, function($entry) use ($oneHourAgo) {
            return $entry['time'] >= $oneHourAgo;
        });
        if (count($cleaned) !== count($rateLimits)) {
            file_put_contents($rateLimitFile, json_encode(array_values($cleaned)), LOCK_EX);
        }
    }
}
?>