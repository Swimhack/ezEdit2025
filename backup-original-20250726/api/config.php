<?php
/**
 * EzEdit.co Configuration API
 * Provides frontend configuration including Supabase settings
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    require_once '../public/config/bootstrap.php';
    
    // Get public configuration (never expose sensitive keys)
    $config = [
        'app' => [
            'name' => 'EzEdit.co',
            'env' => Environment::get('APP_ENV', 'production'),
            'debug' => Environment::get('APP_DEBUG', false),
            'url' => Environment::get('APP_URL', 'https://ezedit.co')
        ],
        'supabase_url' => Environment::get('SUPABASE_URL', ''),
        'supabase_anon_key' => Environment::get('SUPABASE_ANON_KEY', ''),
        'features' => [
            'auth' => true,
            'ftp_connections' => true,
            'ai_assistant' => !empty(Environment::get('CLAUDE_API_KEY')),
            'file_editor' => true
        ],
        'limits' => [
            'max_file_size' => Environment::get('MAX_FILE_SIZE', 10485760),
            'max_files_per_user' => Environment::get('MAX_FILES_PER_USER', 1000),
            'ftp_timeout' => Environment::get('EZEDIT_FTP_TIMEOUT', 30)
        ]
    ];
    
    // Remove empty values
    $config = array_filter($config, function($value) {
        return !empty($value) || $value === false || $value === 0;
    });
    
    echo json_encode($config, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Configuration unavailable',
        'message' => Environment::isDebug() ? $e->getMessage() : 'Internal server error'
    ]);
}
?>