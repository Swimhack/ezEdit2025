<?php
/**
 * EzEdit.co FTP Connection Test API
 * Tests FTP connection credentials
 */

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);
    
    $host = $input['host'] ?? '';
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $port = $input['port'] ?? 21;
    $passive = $input['passive'] ?? true;
    
    if (empty($host) || empty($username) || empty($password)) {
        throw new Exception('Host, username, and password are required');
    }
    
    // Validate host format
    if (!filter_var($host, FILTER_VALIDATE_IP) && !filter_var('http://' . $host, FILTER_VALIDATE_URL)) {
        // Check if it's a valid hostname
        if (!preg_match('/^[a-zA-Z0-9.-]+$/', $host)) {
            throw new Exception('Invalid host format');
        }
    }
    
    // Validate port
    $port = intval($port);
    if ($port < 1 || $port > 65535) {
        $port = 21;
    }
    
    // Test FTP connection
    $connection_id = @ftp_connect($host, $port, 10); // 10 second timeout
    
    if (!$connection_id) {
        throw new Exception("Could not connect to FTP server $host:$port");
    }
    
    // Attempt login
    $login_result = @ftp_login($connection_id, $username, $password);
    
    if (!$login_result) {
        ftp_close($connection_id);
        throw new Exception('FTP login failed. Please check your credentials.');
    }
    
    // Set passive mode
    if ($passive) {
        ftp_pasv($connection_id, true);
    }
    
    // Test directory listing to verify full access
    $files = @ftp_nlist($connection_id, '.');
    
    if ($files === false) {
        // Try alternate method
        $files = @ftp_rawlist($connection_id, '.');
        if ($files === false) {
            ftp_close($connection_id);
            throw new Exception('Connected but unable to list directory. Check permissions.');
        }
    }
    
    // Get system info
    $system_type = @ftp_systype($connection_id);
    
    // Get current directory
    $current_dir = @ftp_pwd($connection_id);
    
    // Close connection
    ftp_close($connection_id);
    
    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'FTP connection successful',
        'details' => [
            'host' => $host,
            'port' => $port,
            'username' => $username,
            'system_type' => $system_type ?: 'Unknown',
            'current_directory' => $current_dir ?: '/',
            'file_count' => is_array($files) ? count($files) : 0,
            'passive_mode' => $passive,
            'connection_time' => date('Y-m-d H:i:s')
        ]
    ]);
    
} catch (Exception $e) {
    // Clean up connection if it exists
    if (isset($connection_id) && $connection_id) {
        @ftp_close($connection_id);
    }
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'details' => [
            'host' => $host ?? 'unknown',
            'port' => $port ?? 21,
            'username' => $username ?? 'unknown'
        ]
    ]);
}

// Log request for debugging
if ($_ENV['NODE_ENV'] !== 'production') {
    error_log("FTP test request: " . $host . " - " . $username);
}
?>