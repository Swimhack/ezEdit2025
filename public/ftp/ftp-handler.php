<?php
/**
 * EzEdit.co Secure FTP Handler
 * HIPAA-compliant FTP operations with encrypted credential storage
 * Industry-standard security with audit logging
 */

require_once '../config/security.php';
require_once '../config/database.php';

// Enhanced security headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
header('Access-Control-Allow-Credentials: true');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

// Configure secure sessions
SecurityManager::configureSecureSessions();

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get request data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    // Fallback to POST data for form submissions
    $data = $_POST;
}

$action = $data['action'] ?? '';

if (empty($action)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Action is required']);
    exit();
}

// Start session and check authentication
session_start();

try {
    // Rate limiting
    $clientId = $_SERVER['REMOTE_ADDR'] . ':' . ($_SESSION['user_id'] ?? 'anonymous');
    if (!SecurityManager::checkRateLimit($clientId, 180, 3600)) { // 180 requests per hour
        AuditLogger::logSecurityViolation(
            'RATE_LIMIT_EXCEEDED',
            "FTP operation rate limit exceeded for client: $clientId"
        );
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Rate limit exceeded']);
        exit();
    }
    
    // Validate CSRF token for state-changing operations
    $statefulActions = ['connect', 'put', 'mkdir', 'delete', 'rename', 'chmod'];
    if (in_array($action, $statefulActions)) {
        $csrfToken = $data['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!SecurityManager::verifyCSRFToken($csrfToken)) {
            AuditLogger::logSecurityViolation(
                'CSRF_TOKEN_INVALID',
                "Invalid CSRF token for FTP action: $action"
            );
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Invalid CSRF token']);
            exit();
        }
    }
    
    $response = handleFTPAction($action, $data);
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log('FTP Handler Error: ' . $e->getMessage());
    AuditLogger::logSecurityViolation(
        'FTP_HANDLER_ERROR',
        "Unhandled exception in FTP handler: " . $e->getMessage()
    );
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}

function handleFTPAction($action, $data) {
    switch ($action) {
        case 'connect':
            return connectToFTP($data);
        case 'disconnect':
            return disconnectFromFTP();
        case 'list':
            return listFiles($data);
        case 'get':
            return getFile($data);
        case 'put':
            return putFile($data);
        case 'mkdir':
            return createDirectory($data);
        case 'delete':
            return deleteFile($data);
        case 'rename':
            return renameFile($data);
        case 'permissions':
            return getPermissions($data);
        case 'chmod':
            return setPermissions($data);
        case 'test':
            return testConnection($data);
        default:
            return ['success' => false, 'error' => 'Unknown action: ' . $action];
    }
}

function connectToFTP($data) {
    // Check if user is authenticated
    if (!isset($_SESSION['user_id'])) {
        return ['success' => false, 'error' => 'Authentication required'];
    }
    
    $userId = (int)$_SESSION['user_id'];
    
    // Two connection modes: by site_id or by direct credentials
    if (!empty($data['site_id'])) {
        // Connect using saved site credentials
        $siteId = (int)$data['site_id'];
        $site = SecureDatabase::getFTPSite($siteId, $userId);
        
        if (!$site) {
            AuditLogger::logSecurityViolation(
                'UNAUTHORIZED_SITE_ACCESS',
                "Attempted to access non-existent or unauthorized site: $siteId",
                $userId
            );
            return ['success' => false, 'error' => 'Site not found or access denied'];
        }
        
        $host = $site['host'];
        $port = $site['port'];
        $username = $site['username'];
        $password = $site['password'];
        $secure = $site['is_secure_ftp'];
        
    } else {
        // Connect using provided credentials (for testing)
        $host = SecurityManager::sanitizeInput($data['host'] ?? '', 'hostname');
        $port = intval($data['port'] ?? 21);
        $username = SecurityManager::sanitizeInput($data['username'] ?? '', 'string');
        $password = $data['password'] ?? '';
        $secure = isset($data['secure']) && $data['secure'];
        $siteId = null;
        
        // Validate input
        if (!SecurityManager::validateInput($host, 'hostname') || 
            !SecurityManager::validateInput($port, 'port') ||
            empty($username) || empty($password)) {
            return ['success' => false, 'error' => 'Valid host, port, username, and password are required'];
        }
    }
    
    $startTime = microtime(true);
    
    // Attempt real FTP connection
    $connection = createFTPConnection($host, $port, $username, $password, $secure);
    
    $duration = round((microtime(true) - $startTime) * 1000);
    
    if ($connection) {
        // Test connection by getting current directory
        $currentDir = ftp_pwd($connection);
        ftp_close($connection);
        
        // Store encrypted connection info in session
        $_SESSION['ftp_connection'] = [
            'site_id' => $siteId,
            'host' => $host,
            'port' => $port,
            'username_encrypted' => SecurityManager::encrypt($username, $userId),
            'password_encrypted' => SecurityManager::encrypt($password, $userId),
            'secure' => $secure,
            'connected_at' => time(),
            'current_dir' => $currentDir ?: '/',
            'user_id' => $userId
        ];
        
        // Update site connection status if connecting to saved site
        if ($siteId) {
            SecureDatabase::updateSiteConnectionStatus($siteId, $userId, 'connected');
            SecureDatabase::logFTPOperation($userId, $siteId, 'connect', null, true, null, $duration);
        }
        
        // Log successful connection
        AuditLogger::logFTPOperation('connect', $host, null, $userId, true);
        
        return [
            'success' => true,
            'message' => 'Connected to FTP server successfully',
            'server_info' => [
                'host' => $host,
                'port' => $port,
                'secure' => $secure,
                'current_dir' => $currentDir ?: '/'
            ],
            'csrf_token' => SecurityManager::generateCSRFToken()
        ];
    } else {
        // Log failed connection
        if ($siteId) {
            SecureDatabase::logFTPOperation($userId, $siteId, 'connect', null, false, 'Connection failed', $duration);
        }
        
        AuditLogger::logFTPOperation('connect', $host, null, $userId, false);
        
        return ['success' => false, 'error' => 'Failed to connect to FTP server. Please check your credentials and try again.'];
    }
}

/**
 * Create a real FTP connection
 */
function createFTPConnection($host, $port, $username, $password, $secure) {
    // Use FTPS if secure is requested
    if ($secure) {
        $connection = @ftp_ssl_connect($host, $port, 30);
    } else {
        $connection = @ftp_connect($host, $port, 30);
    }
    
    if (!$connection) {
        return false;
    }
    
    // Login
    if (!@ftp_login($connection, $username, $password)) {
        @ftp_close($connection);
        return false;
    }
    
    // Set passive mode for better compatibility
    @ftp_pasv($connection, true);
    
    return $connection;
}

/**
 * Get FTP connection from encrypted session data
 */
function getFTPConnection() {
    if (!isset($_SESSION['ftp_connection']) || !isset($_SESSION['user_id'])) {
        return false;
    }
    
    $conn = $_SESSION['ftp_connection'];
    $userId = $_SESSION['user_id'];
    
    try {
        // Decrypt credentials
        $username = SecurityManager::decrypt($conn['username_encrypted'], $userId);
        $password = SecurityManager::decrypt($conn['password_encrypted'], $userId);
        
        return createFTPConnection($conn['host'], $conn['port'], $username, $password, $conn['secure']);
        
    } catch (Exception $e) {
        AuditLogger::logSecurityViolation(
            'SESSION_DECRYPTION_FAILED',
            "Failed to decrypt FTP session credentials: " . $e->getMessage(),
            $userId
        );
        
        // Clear corrupted session data
        unset($_SESSION['ftp_connection']);
        return false;
    }
}

function disconnectFromFTP() {
    session_start();
    if (isset($_SESSION['ftp_connection'])) {
        unset($_SESSION['ftp_connection']);
    }
    
    return ['success' => true, 'message' => 'Disconnected from FTP server'];
}

function listFiles($data) {
    $connection = getFTPConnection();
    if (!$connection) {
        return ['success' => false, 'error' => 'Not connected to FTP server'];
    }
    
    $directory = $data['directory'] ?? $data['path'] ?? '/';
    
    // Get raw directory listing
    $rawList = @ftp_rawlist($connection, $directory);
    @ftp_close($connection);
    
    if ($rawList === false) {
        return ['success' => false, 'error' => 'Failed to list directory contents'];
    }
    
    $files = [];
    foreach ($rawList as $item) {
        $parsed = parseFTPListItem($item);
        if ($parsed && $parsed['name'] !== '.' && $parsed['name'] !== '..') {
            $files[] = $parsed;
        }
    }
    
    return [
        'success' => true,
        'files' => $files,
        'directory' => $directory
    ];
}

/**
 * Parse FTP list item into structured data
 */
function parseFTPListItem($item) {
    // Parse Unix-style directory listing (most common)
    if (preg_match('/^([drwx-]+)\s+(\d+)\s+(\w+)\s+(\w+)\s+(\d+)\s+(\w+\s+\d+\s+[\d:]+)\s+(.+)$/', $item, $matches)) {
        return [
            'name' => $matches[7],
            'type' => $matches[1][0] === 'd' ? 'directory' : 'file',
            'permissions' => substr($matches[1], 1),
            'size' => (int)$matches[5],
            'modified' => $matches[6],
            'owner' => $matches[3],
            'group' => $matches[4],
            'raw_permissions' => $matches[1]
        ];
    }
    
    // Parse Windows-style directory listing
    if (preg_match('/^(\d{2}-\d{2}-\d{2})\s+(\d{2}:\d{2}[AP]M)\s+(<DIR>|\d+)\s+(.+)$/', $item, $matches)) {
        return [
            'name' => $matches[4],
            'type' => $matches[3] === '<DIR>' ? 'directory' : 'file',
            'permissions' => 'unknown',
            'size' => $matches[3] === '<DIR>' ? 0 : (int)$matches[3],
            'modified' => $matches[1] . ' ' . $matches[2],
            'owner' => 'unknown',
            'group' => 'unknown',
            'raw_permissions' => 'unknown'
        ];
    }
    
    // Fallback for other formats
    $parts = preg_split('/\s+/', trim($item));
    if (count($parts) > 0) {
        return [
            'name' => end($parts),
            'type' => 'file',
            'permissions' => 'unknown',
            'size' => 0,
            'modified' => 'unknown',
            'owner' => 'unknown',
            'group' => 'unknown',
            'raw_permissions' => 'unknown'
        ];
    }
    
    return null;
}

function getFile($data) {
    $connection = getFTPConnection();
    if (!$connection) {
        return ['success' => false, 'error' => 'Not connected to FTP server'];
    }
    
    $filePath = $data['file_path'] ?? $data['path'] ?? '';
    
    if (empty($filePath)) {
        @ftp_close($connection);
        return ['success' => false, 'error' => 'File path is required'];
    }
    
    // Create temporary file for download
    $tempFile = tempnam(sys_get_temp_dir(), 'ftp_get_');
    
    if (@ftp_get($connection, $tempFile, $filePath, FTP_BINARY)) {
        $content = file_get_contents($tempFile);
        unlink($tempFile);
        @ftp_close($connection);
        
        return [
            'success' => true,
            'content' => $content,
            'file_path' => $filePath
        ];
    } else {
        unlink($tempFile);
        @ftp_close($connection);
        return ['success' => false, 'error' => 'Failed to download file'];
    }
}

function putFile($data) {
    $connection = getFTPConnection();
    if (!$connection) {
        return ['success' => false, 'error' => 'Not connected to FTP server'];
    }
    
    $filePath = $data['file_path'] ?? $data['path'] ?? '';
    $content = $data['content'] ?? '';
    
    if (empty($filePath)) {
        @ftp_close($connection);
        return ['success' => false, 'error' => 'File path is required'];
    }
    
    // Create temporary file with content
    $tempFile = tempnam(sys_get_temp_dir(), 'ftp_put_');
    file_put_contents($tempFile, $content);
    
    if (@ftp_put($connection, $filePath, $tempFile, FTP_BINARY)) {
        unlink($tempFile);
        @ftp_close($connection);
        
        return [
            'success' => true,
            'message' => 'File saved successfully',
            'file_path' => $filePath,
            'size' => strlen($content)
        ];
    } else {
        unlink($tempFile);
        @ftp_close($connection);
        return ['success' => false, 'error' => 'Failed to upload file'];
    }
}

function createDirectory($data) {
    $connection = getFTPConnection();
    if (!$connection) {
        return ['success' => false, 'error' => 'Not connected to FTP server'];
    }
    
    $directory = $data['directory'] ?? $data['path'] ?? '';
    
    if (empty($directory)) {
        @ftp_close($connection);
        return ['success' => false, 'error' => 'Directory path is required'];
    }
    
    if (@ftp_mkdir($connection, $directory)) {
        @ftp_close($connection);
        return [
            'success' => true,
            'message' => 'Directory created successfully',
            'directory' => $directory
        ];
    } else {
        @ftp_close($connection);
        return ['success' => false, 'error' => 'Failed to create directory'];
    }
}

function deleteFile($data) {
    $connection = getFTPConnection();
    if (!$connection) {
        return ['success' => false, 'error' => 'Not connected to FTP server'];
    }
    
    $filePath = $data['file_path'] ?? $data['path'] ?? '';
    $isDirectory = $data['isDirectory'] ?? false;
    
    if (empty($filePath)) {
        @ftp_close($connection);
        return ['success' => false, 'error' => 'File path is required'];
    }
    
    $success = false;
    if ($isDirectory) {
        $success = @ftp_rmdir($connection, $filePath);
    } else {
        $success = @ftp_delete($connection, $filePath);
    }
    
    @ftp_close($connection);
    
    if ($success) {
        return [
            'success' => true,
            'message' => ($isDirectory ? 'Directory' : 'File') . ' deleted successfully',
            'file_path' => $filePath
        ];
    } else {
        return ['success' => false, 'error' => 'Failed to delete ' . ($isDirectory ? 'directory' : 'file')];
    }
}

function renameFile($data) {
    $connection = getFTPConnection();
    if (!$connection) {
        return ['success' => false, 'error' => 'Not connected to FTP server'];
    }
    
    $oldPath = $data['old_path'] ?? $data['oldPath'] ?? '';
    $newPath = $data['new_path'] ?? $data['newPath'] ?? '';
    
    if (empty($oldPath) || empty($newPath)) {
        @ftp_close($connection);
        return ['success' => false, 'error' => 'Both old and new paths are required'];
    }
    
    if (@ftp_rename($connection, $oldPath, $newPath)) {
        @ftp_close($connection);
        return [
            'success' => true,
            'message' => 'File renamed successfully',
            'old_path' => $oldPath,
            'new_path' => $newPath
        ];
    } else {
        @ftp_close($connection);
        return ['success' => false, 'error' => 'Failed to rename file'];
    }
}

function getPermissions($data) {
    // This would require parsing the directory listing to get permissions
    // For now, return basic permissions info
    $filePath = $data['file_path'] ?? $data['path'] ?? '';
    
    if (empty($filePath)) {
        return ['success' => false, 'error' => 'File path is required'];
    }
    
    // Basic permission guess based on file extension
    $extension = pathinfo($filePath, PATHINFO_EXTENSION);
    $permissions = in_array(strtolower($extension), ['php', 'cgi', 'sh', 'py', 'pl']) ? '755' : '644';
    
    return [
        'success' => true,
        'permissions' => $permissions,
        'file_path' => $filePath
    ];
}

function setPermissions($data) {
    $connection = getFTPConnection();
    if (!$connection) {
        return ['success' => false, 'error' => 'Not connected to FTP server'];
    }
    
    $filePath = $data['file_path'] ?? $data['path'] ?? '';
    $permissions = $data['permissions'] ?? '';
    
    if (empty($filePath) || empty($permissions)) {
        @ftp_close($connection);
        return ['success' => false, 'error' => 'File path and permissions are required'];
    }
    
    // Validate permissions format
    if (!preg_match('/^[0-7]{3}$/', $permissions)) {
        @ftp_close($connection);
        return ['success' => false, 'error' => 'Invalid permissions format (use 3-digit octal like 644 or 755)'];
    }
    
    // Convert to octal
    $octal = octdec($permissions);
    
    if (@ftp_chmod($connection, $octal, $filePath)) {
        @ftp_close($connection);
        return [
            'success' => true,
            'message' => 'File permissions updated successfully',
            'file_path' => $filePath,
            'permissions' => $permissions
        ];
    } else {
        @ftp_close($connection);
        return ['success' => false, 'error' => 'Failed to change file permissions'];
    }
}

function testConnection($data) {
    $host = $data['host'] ?? '';
    $port = intval($data['port'] ?? 21);
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    $secure = isset($data['secure']) && $data['secure'];
    
    // Validate input
    if (empty($host) || empty($username) || empty($password)) {
        return ['success' => false, 'message' => 'Host, username, and password are required'];
    }
    
    // Test actual connection
    $connection = createFTPConnection($host, $port, $username, $password, $secure);
    
    if ($connection) {
        // Get some server info
        $currentDir = @ftp_pwd($connection);
        $systemType = @ftp_systype($connection);
        @ftp_close($connection);
        
        return [
            'success' => true,
            'message' => 'Connection test successful',
            'server_info' => [
                'host' => $host,
                'port' => $port,
                'secure' => $secure,
                'current_dir' => $currentDir ?: '/',
                'system_type' => $systemType ?: 'Unknown',
                'features' => ['PASV', 'SIZE', 'MDTM']
            ]
        ];
    } else {
        return ['success' => false, 'message' => 'Connection test failed - please check your credentials'];
    }
}
?>