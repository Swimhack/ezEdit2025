<?php
/**
 * Health check endpoint for DigitalOcean App Platform
 */

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

$health = [
    'status' => 'healthy',
    'timestamp' => date('c'),
    'version' => '1.0.0',
    'app' => 'EzEdit.co',
    'environment' => $_ENV['APP_ENV'] ?? 'production'
];

// Basic health checks
$checks = [
    'php' => [
        'status' => 'ok',
        'version' => PHP_VERSION
    ],
    'memory' => [
        'status' => 'ok',
        'usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
        'peak_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2)
    ],
    'disk' => [
        'status' => 'ok',
        'free_space_mb' => round(disk_free_space(__DIR__) / 1024 / 1024, 2)
    ]
];

// Check if critical files exist
$critical_files = [
    'index.php',
    'auth/login.php',
    'dashboard.php',
    'editor.php'
];

foreach ($critical_files as $file) {
    if (!file_exists(__DIR__ . '/' . $file)) {
        $health['status'] = 'unhealthy';
        $checks['files']['status'] = 'error';
        $checks['files']['missing'][] = $file;
    }
}

if (!isset($checks['files']['status'])) {
    $checks['files']['status'] = 'ok';
}

$health['checks'] = $checks;

// Return appropriate HTTP status
http_response_code($health['status'] === 'healthy' ? 200 : 503);

echo json_encode($health, JSON_PRETTY_PRINT);
?>