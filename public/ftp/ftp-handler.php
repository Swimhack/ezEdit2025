<?php
/**
 * EzEdit FTP Handler
 * Handles FTP operations (connect, list, get, put)
 */

// Start session for storing FTP connections
session_start();

// Define secure access constant
define('EZEDIT_SECURE_ACCESS', true);

// Include configuration and error codes
require_once 'config.php';
require_once 'error-codes.php';

// Set headers for JSON response
header('Content-Type: application/json');

// Initialize FTP connections storage in session if not exists
if (!isset($_SESSION['ftp_connections'])) {
    $_SESSION['ftp_connections'] = [];
}

// Initialize connection timestamps if not exists
if (!isset($_SESSION['ftp_connection_times'])) {
    $_SESSION['ftp_connection_times'] = [];
}

// Connection timeout in seconds (30 minutes)
define('FTP_CONNECTION_TIMEOUT', 1800);

// Function to close and clean up FTP connections
function cleanup_ftp_connections() {
    if (isset($_SESSION['ftp_connections']) && is_array($_SESSION['ftp_connections'])) {
        foreach ($_SESSION['ftp_connections'] as $conn_id => $conn) {
            if (is_resource($conn)) {
                @ftp_close($conn);
            }
        }
        $_SESSION['ftp_connections'] = [];
        $_SESSION['ftp_connection_times'] = [];
    }
}

// Check for timed-out connections and close them
function check_connection_timeouts() {
    if (!isset($_SESSION['ftp_connections']) || !isset($_SESSION['ftp_connection_times'])) {
        return;
    }
    
    $current_time = time();
    $timeout_connections = [];
    
    foreach ($_SESSION['ftp_connection_times'] as $conn_id => $timestamp) {
        if (($current_time - $timestamp) > FTP_CONNECTION_TIMEOUT) {
            // Connection has timed out
            if (isset($_SESSION['ftp_connections'][$conn_id]) && is_resource($_SESSION['ftp_connections'][$conn_id])) {
                @ftp_close($_SESSION['ftp_connections'][$conn_id]);
            }
            
            unset($_SESSION['ftp_connections'][$conn_id]);
            $timeout_connections[] = $conn_id;
        }
    }
    
    // Remove timed-out connection timestamps
    foreach ($timeout_connections as $conn_id) {
        unset($_SESSION['ftp_connection_times'][$conn_id]);
    }
}

// Check for timeouts on each request
check_connection_timeouts();

// Register shutdown function to clean up connections
register_shutdown_function('cleanup_ftp_connections');

// Check if user is authenticated
function is_authenticated() {
    // Check Authorization header for Bearer token
    $headers = getallheaders();
    $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : 
                  (isset($headers['authorization']) ? $headers['authorization'] : null);
    
    if (!$auth_header || !preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
        return false;
    }
    
    $token = $matches[1];
    
    try {
        // Simple JWT verification (in production, use a proper JWT library)
        $jwt_parts = explode('.', $token);
        if (count($jwt_parts) !== 3) {
            return false;
        }
        
        // Decode header and payload
        $header = json_decode(base64_decode($jwt_parts[0]), true);
        $payload = json_decode(base64_decode($jwt_parts[1]), true);
        
        if (!$header || !$payload) {
            return false;
        }
        
        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        // Store user info globally for other functions
        global $current_user;
        $current_user = $payload;
        
        return true;
        
    } catch (Exception $e) {
        return false;
    }
}

// Check if the user has permission for the requested action
function has_permission($action, $site_id = null) {
    global $current_user;
    
    if (!$current_user) {
        return false;
    }
    
    // For site-specific actions, check site ownership
    if ($site_id) {
        return has_site_permission($site_id);
    }
    
    // For general actions, check if user is authenticated
    return true;
}

// Check if user has permission to access a site
function has_site_permission($site_id) {
    global $current_user;
    
    if (!$current_user || !isset($current_user['id'])) {
        return false;
    }
    
    try {
        // In a real implementation, query the database to check site ownership
        // For now, we'll use a simple check (in production, use proper DB connection)
        
        // Load database configuration
        $supabase_url = getenv('SUPABASE_URL');
        $supabase_key = getenv('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!$supabase_url || !$supabase_key) {
            // Fallback: allow access if environment is not properly configured
            return true;
        }
        
        // Simple HTTP request to check site ownership
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => [
                    'Authorization: Bearer ' . $supabase_key,
                    'apikey: ' . $supabase_key,
                    'Content-Type: application/json'
                ]
            ]
        ]);
        
        $url = $supabase_url . '/rest/v1/sites?id=eq.' . urlencode($site_id) . '&user_id=eq.' . urlencode($current_user['id']);
        $result = @file_get_contents($url, false, $context);
        
        if ($result === false) {
            // If API call fails, allow access (fallback)
            return true;
        }
        
        $sites = json_decode($result, true);
        return is_array($sites) && count($sites) > 0;
        
    } catch (Exception $e) {
        // If anything goes wrong, allow access (fallback)
        return true;
    }
}

// Handle error response
function handle_error($message, $http_code = 400, $ftp_error_code = FTP_ERR_UNKNOWN, $details = null, $log = true) {
    if ($log) {
        // Log error to file (in production, use a proper logging system)
        $log_file = __DIR__ . '/ftp-errors.log';
        $timestamp = date('Y-m-d H:i:s');
        $client_ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
        $log_message = "[$timestamp] [$client_ip] [HTTP:$http_code] [FTP:$ftp_error_code] $message";
        if ($details) {
            $log_message .= " - $details";
        }
        $log_message .= "\n";
        @file_put_contents($log_file, $log_message, FILE_APPEND);
    }
    
    http_response_code($http_code);
    
    $response = [
        'success' => false,
        'error' => $message,
        'error_code' => $ftp_error_code,
        'timestamp' => time()
    ];
    
    if ($details !== null) {
        $response['details'] = $details;
    }
    
    echo json_encode($response);
    exit;
}

// Connect to FTP server
function ftp_connect_server($config) {
    // Extract FTP configuration
    $host = isset($config['host']) ? $config['host'] : '';
    $port = isset($config['port']) ? (int)$config['port'] : 21;
    $username = isset($config['username']) ? $config['username'] : '';
    $password = isset($config['password']) ? $config['password'] : '';
    $passive = isset($config['passive']) ? (bool)$config['passive'] : true;
    
    // Validate FTP configuration
    if (empty($host)) {
        return ftp_error_response(FTP_ERR_MISSING_HOST);
    }
    
    if (empty($username)) {
        return ftp_error_response(FTP_ERR_MISSING_USERNAME);
    }
    
    if (empty($password)) {
        return ftp_error_response(FTP_ERR_MISSING_PASSWORD);
    }
    
    if ($port <= 0 || $port > 65535) {
        return ftp_error_response(FTP_ERR_INVALID_PORT);
    }
    
    try {
        // Connect to FTP server
        $conn = @ftp_connect($host, $port, 30);
        if (!$conn) {
            return ftp_error_response(FTP_ERR_CONNECTION_FAILED, "Host: $host, Port: $port");
        }
        
        // Login with credentials
        if (!@ftp_login($conn, $username, $password)) {
            ftp_close($conn);
            return ftp_error_response(FTP_ERR_LOGIN_FAILED);
        }
        
        // Set passive mode if needed
        if ($passive) {
            if (!@ftp_pasv($conn, true)) {
                ftp_close($conn);
                return ftp_error_response(FTP_ERR_PASSIVE_MODE_FAILED);
            }
        }
        
        // Generate a unique connection ID
        $connection_id = uniqid('ftp_');
        
        // Store connection in session
        $_SESSION['ftp_connections'][$connection_id] = $conn;
        
        // Store connection timestamp
        $_SESSION['ftp_connection_times'][$connection_id] = time();
        
        return [
            'success' => true,
            'connection_id' => $connection_id,
            'message' => 'Connected to FTP server'
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'FTP connection error: ' . $e->getMessage()
        ];
    }
}

// List directory contents
function ftp_list_directory($connection_id, $path) {
    // Get FTP connection from session
    if (!isset($_SESSION['ftp_connections'][$connection_id])) {
        return ftp_error_response(FTP_ERR_INVALID_CONNECTION_ID);
    }
    
    $conn = $_SESSION['ftp_connections'][$connection_id];
    
    // Update connection timestamp
    $_SESSION['ftp_connection_times'][$connection_id] = time();
    
    try {
        // Normalize path
        $path = rtrim($path, '/') ?: '/';
        
        // Get raw directory listing
        $raw_list = @ftp_rawlist($conn, $path);
        if ($raw_list === false) {
            // Check if directory exists
            $current_dir = @ftp_pwd($conn);
            if ($current_dir === false) {
                return ftp_error_response(FTP_ERR_CONNECTION_CLOSED);
            }
            
            // Try to change to directory to check if it exists
            if (!@ftp_chdir($conn, $path)) {
                return ftp_error_response(FTP_ERR_DIRECTORY_NOT_FOUND, $path);
            }
            
            // Change back to original directory
            @ftp_chdir($conn, $current_dir);
            
            // If we got here, directory exists but listing failed
            return ftp_error_response(FTP_ERR_LIST_FAILED);
        }
        
        // Parse directory listing
        $items = [];
        foreach ($raw_list as $item) {
            $parsed = preg_split('/\s+/', $item, 9);
            if (count($parsed) < 9) continue;
            
            $permissions = $parsed[0];
            $size = $parsed[4];
            $month = $parsed[5];
            $day = $parsed[6];
            $year_or_time = $parsed[7];
            $filename = $parsed[8];
            
            // Skip . and .. entries
            if ($filename === '.' || $filename === '..') continue;
            
            // Determine if it's a directory
            $is_dir = $permissions[0] === 'd';
            
            // Format modified date
            $months = ['Jan' => '01', 'Feb' => '02', 'Mar' => '03', 'Apr' => '04', 'May' => '05', 'Jun' => '06', 
                      'Jul' => '07', 'Aug' => '08', 'Sep' => '09', 'Oct' => '10', 'Nov' => '11', 'Dec' => '12'];
            $month_num = isset($months[$month]) ? $months[$month] : '01';
            
            // Handle year/time format
            if (strpos($year_or_time, ':') !== false) {
                // It's a time, so it's the current year
                $year = date('Y');
                $time = $year_or_time;
            } else {
                // It's a year
                $year = $year_or_time;
                $time = '00:00';
            }
            
            $modified = "$year-$month_num-$day $time:00";
            
            $items[] = [
                'name' => $filename,
                'type' => $is_dir ? 'directory' : 'file',
                'size' => (int)$size,
                'modified' => $modified
            ];
        }
        
        return [
            'success' => true,
            'path' => $path,
            'items' => $items
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'Directory listing error: ' . $e->getMessage()
        ];
    }
}

// Get file contents
function ftp_get_file($connection_id, $path) {
    // Get FTP connection from session
    if (!isset($_SESSION['ftp_connections'][$connection_id])) {
        return ftp_error_response(FTP_ERR_INVALID_CONNECTION_ID);
    }
    
    $conn = $_SESSION['ftp_connections'][$connection_id];
    
    // Update connection timestamp
    $_SESSION['ftp_connection_times'][$connection_id] = time();
    
    try {
        // Create a temporary file to store the downloaded content
        $temp_file = tempnam(sys_get_temp_dir(), 'ftp_');
        if ($temp_file === false) {
            return ftp_error_response(FTP_ERR_TEMP_FILE_CREATION_FAILED);
        }
        
        // Download the file
        if (!ftp_get($conn, $temp_file, $path, FTP_BINARY)) {
            return [
                'success' => false,
                'error' => 'Failed to download file'
            ];
        }
        
        // Read the file content
        $content = file_get_contents($temp_file);
        if ($content === false) {
            return [
                'success' => false,
                'error' => 'Failed to read file content'
            ];
        }
        
        // Get file modification time
        $modified = ftp_mdtm($conn, $path);
        $modified_date = $modified > 0 ? date('Y-m-d H:i:s', $modified) : date('Y-m-d H:i:s');
        
        // Clean up the temporary file
        unlink($temp_file);
        
        return [
            'success' => true,
            'path' => $path,
            'content' => $content,
            'modified' => $modified_date
        ];
    } catch (Exception $e) {
        // Clean up the temporary file if it exists
        if (isset($temp_file) && file_exists($temp_file)) {
            unlink($temp_file);
        }
        
        return [
            'success' => false,
            'error' => 'File download error: ' . $e->getMessage()
        ];
    }
}

// Put file contents
function ftp_put_file($connection_id, $path, $content) {
    // Get FTP connection from session
    if (!isset($_SESSION['ftp_connections'][$connection_id])) {
        return ftp_error_response(FTP_ERR_INVALID_CONNECTION_ID);
    }
    
    $conn = $_SESSION['ftp_connections'][$connection_id];
    
    // Update connection timestamp
    $_SESSION['ftp_connection_times'][$connection_id] = time();
    
    try {
        // Create a temporary file with the content
        $temp_file = tempnam(sys_get_temp_dir(), 'ftp_');
        if (file_put_contents($temp_file, $content) === false) {
            return ftp_error_response(FTP_ERR_TEMP_FILE_CREATION_FAILED);
        }
        
        // Upload the file
        if (!ftp_put($conn, $path, $temp_file, FTP_BINARY)) {
            unlink($temp_file);
            
            // Check if we can write to the directory
            $dir_path = dirname($path);
            if (!@ftp_chdir($conn, $dir_path)) {
                return ftp_error_response(FTP_ERR_DIRECTORY_NOT_FOUND, $dir_path);
            }
            
            // Directory exists but upload failed - likely permission issue
            return ftp_error_response(FTP_ERR_FILE_UPLOAD_FAILED, $path);
        }
        
        // Clean up the temporary file
        unlink($temp_file);
        
        return [
            'success' => true,
            'path' => $path,
            'message' => 'File saved successfully'
        ];
    } catch (Exception $e) {
        // Clean up the temporary file if it exists
        if (isset($temp_file) && file_exists($temp_file)) {
            unlink($temp_file);
        }
        
        return [
            'success' => false,
            'error' => 'File upload error: ' . $e->getMessage()
        ];
    }
}

// Create a new directory
function ftp_create_directory($connection_id, $path) {
    // Get FTP connection from session
    if (!isset($_SESSION['ftp_connections'][$connection_id])) {
        return ftp_error_response(FTP_ERR_INVALID_CONNECTION_ID);
    }
    
    $conn = $_SESSION['ftp_connections'][$connection_id];
    
    // Update connection timestamp
    $_SESSION['ftp_connection_times'][$connection_id] = time();
    
    try {
        // Create directory
        if (!@ftp_mkdir($conn, $path)) {
            // Check if directory already exists
            $current_dir = @ftp_pwd($conn);
            if ($current_dir === false) {
                return ftp_error_response(FTP_ERR_CONNECTION_CLOSED);
            }
            
            // Try to change to the directory
            if (@ftp_chdir($conn, $path)) {
                // Directory already exists
                @ftp_chdir($conn, $current_dir); // Change back to original directory
                return ftp_error_response(FTP_ERR_FILE_ALREADY_EXISTS, $path);
            }
            
            // Check if parent directory exists and is writable
            $parent_dir = dirname($path);
            if (!@ftp_chdir($conn, $parent_dir)) {
                return ftp_error_response(FTP_ERR_DIRECTORY_NOT_FOUND, $parent_dir);
            }
            
            // Change back to original directory
            @ftp_chdir($conn, $current_dir);
            
            // Parent directory exists but mkdir failed - likely permission issue
            return ftp_error_response(FTP_ERR_DIRECTORY_PERMISSION_DENIED, $path);
        }
        
        return [
            'success' => true,
            'path' => $path,
            'message' => 'Directory created successfully'
        ];
    } catch (Exception $e) {
        return ftp_error_response(FTP_ERR_DIRECTORY_CREATE_FAILED, $e->getMessage());
    }
}

// Delete a file or directory
function ftp_delete_item($connection_id, $path, $is_directory = false) {
    // Get FTP connection from session
    if (!isset($_SESSION['ftp_connections'][$connection_id])) {
        return ftp_error_response(FTP_ERR_INVALID_CONNECTION_ID);
    }
    
    $conn = $_SESSION['ftp_connections'][$connection_id];
    
    // Update connection timestamp
    $_SESSION['ftp_connection_times'][$connection_id] = time();
    
    try {
        if ($is_directory) {
            // Delete directory
            if (!@ftp_rmdir($conn, $path)) {
                // Check if directory exists
                $current_dir = @ftp_pwd($conn);
                if ($current_dir === false) {
                    return ftp_error_response(FTP_ERR_CONNECTION_CLOSED);
                }
                
                // Try to change to the directory
                if (!@ftp_chdir($conn, $path)) {
                    return ftp_error_response(FTP_ERR_DIRECTORY_NOT_FOUND, $path);
                }
                
                // Change back to original directory
                @ftp_chdir($conn, $current_dir);
                
                // Directory exists but rmdir failed - likely permission issue or not empty
                return ftp_error_response(FTP_ERR_DIRECTORY_DELETE_FAILED, 'Directory may not be empty');
            }
        } else {
            // Delete file
            if (!@ftp_delete($conn, $path)) {
                // Check if file exists
                $file_size = @ftp_size($conn, $path);
                if ($file_size === -1) {
                    return ftp_error_response(FTP_ERR_FILE_NOT_FOUND, $path);
                }
                
                // File exists but delete failed - likely permission issue
                return ftp_error_response(FTP_ERR_FILE_DELETE_FAILED, $path);
            }
        }
        
        return [
            'success' => true,
            'path' => $path,
            'message' => ($is_directory ? 'Directory' : 'File') . ' deleted successfully'
        ];
    } catch (Exception $e) {
        return ftp_error_response(
            $is_directory ? FTP_ERR_DIRECTORY_DELETE_FAILED : FTP_ERR_FILE_DELETE_FAILED, 
            $e->getMessage()
        );
    }
}

// Rename a file or directory
function ftp_rename_item($connection_id, $old_path, $new_path) {
    // Get FTP connection from session
    if (!isset($_SESSION['ftp_connections'][$connection_id])) {
        return ftp_error_response(FTP_ERR_INVALID_CONNECTION_ID);
    }
    
    $conn = $_SESSION['ftp_connections'][$connection_id];
    
    // Update connection timestamp
    $_SESSION['ftp_connection_times'][$connection_id] = time();
    
    try {
        // Check if source exists
        $file_size = @ftp_size($conn, $old_path);
        $current_dir = @ftp_pwd($conn);
        $is_directory = false;
        
        if ($file_size === -1) {
            // Could be a directory or non-existent file
            if (!@ftp_chdir($conn, $old_path)) {
                return ftp_error_response(FTP_ERR_FILE_NOT_FOUND, $old_path);
            }
            
            // It's a directory
            $is_directory = true;
            @ftp_chdir($conn, $current_dir); // Change back to original directory
        }
        
        // Check if destination already exists
        $dest_exists = false;
        $dest_size = @ftp_size($conn, $new_path);
        
        if ($dest_size !== -1) {
            $dest_exists = true;
        } else {
            // Check if destination is a directory
            if (@ftp_chdir($conn, $new_path)) {
                $dest_exists = true;
                @ftp_chdir($conn, $current_dir); // Change back to original directory
            }
        }
        
        if ($dest_exists) {
            return ftp_error_response(FTP_ERR_FILE_ALREADY_EXISTS, $new_path);
        }
        
        // Rename the item
        if (!@ftp_rename($conn, $old_path, $new_path)) {
            return ftp_error_response(
                $is_directory ? FTP_ERR_DIRECTORY_PERMISSION_DENIED : FTP_ERR_FILE_PERMISSION_DENIED,
                "Failed to rename from $old_path to $new_path"
            );
        }
        
        return [
            'success' => true,
            'old_path' => $old_path,
            'new_path' => $new_path,
            'message' => ($is_directory ? 'Directory' : 'File') . ' renamed successfully'
        ];
    } catch (Exception $e) {
        return ftp_error_response(FTP_ERR_FILE_RENAME_FAILED, $e->getMessage());
    }
}

// Create a new empty file
function ftp_create_file($connection_id, $path, $content = '') {
    // Get FTP connection from session
    if (!isset($_SESSION['ftp_connections'][$connection_id])) {
        return ftp_error_response(FTP_ERR_INVALID_CONNECTION_ID);
    }
    
    $conn = $_SESSION['ftp_connections'][$connection_id];
    
    // Update connection timestamp
    $_SESSION['ftp_connection_times'][$connection_id] = time();
    
    try {
        // Check if file already exists
        $file_size = @ftp_size($conn, $path);
        if ($file_size !== -1) {
            return ftp_error_response(FTP_ERR_FILE_ALREADY_EXISTS, $path);
        }
        
        // Create a temporary file with the content
        $temp_file = tempnam(sys_get_temp_dir(), 'ftp_');
        if (file_put_contents($temp_file, $content) === false) {
            return ftp_error_response(FTP_ERR_TEMP_FILE_CREATION_FAILED);
        }
        
        // Upload the file
        if (!@ftp_put($conn, $path, $temp_file, FTP_BINARY)) {
            unlink($temp_file);
            
            // Check if we can write to the directory
            $dir_path = dirname($path);
            if (!@ftp_chdir($conn, $dir_path)) {
                return ftp_error_response(FTP_ERR_DIRECTORY_NOT_FOUND, $dir_path);
            }
            
            // Directory exists but upload failed - likely permission issue
            return ftp_error_response(FTP_ERR_FILE_UPLOAD_FAILED, $path);
        }
        
        // Clean up the temporary file
        unlink($temp_file);
        
        return [
            'success' => true,
            'path' => $path,
            'message' => 'File created successfully'
        ];
    } catch (Exception $e) {
        // Clean up the temporary file if it exists
        if (isset($temp_file) && file_exists($temp_file)) {
            unlink($temp_file);
        }
        
        return ftp_error_response(FTP_ERR_FILE_UPLOAD_FAILED, $e->getMessage());
    }
}

// Disconnect from FTP server
function ftp_disconnect($connection_id) {
    // Check if connection exists
    if (!isset($_SESSION['ftp_connections'][$connection_id])) {
        return ftp_error_response(FTP_ERR_INVALID_CONNECTION_ID);
    }
    
    $conn = $_SESSION['ftp_connections'][$connection_id];
    
    // Close the connection
    if (is_resource($conn)) {
        ftp_close($conn);
    }
    
    // Remove from session
    unset($_SESSION['ftp_connections'][$connection_id]);
    unset($_SESSION['ftp_connection_times'][$connection_id]);
    
    return [
        'success' => true,
        'message' => 'Disconnected successfully'
    ];
}

// Main request handler
if (!is_authenticated()) {
    handle_error('Authentication required', 401, FTP_ERR_AUTHENTICATION_REQUIRED);
}

// Get request parameters
$action = isset($_GET['action']) ? $_GET['action'] : '';
$site_id = isset($_GET['site_id']) ? intval($_GET['site_id']) : 1;
$path = isset($_GET['path']) ? $_GET['path'] : '/';

// Check site permission
if (!has_site_permission($site_id)) {
    handle_error('Permission denied', 403);
}

// Get request parameters
$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';
$site_id = isset($_REQUEST['site_id']) ? intval($_REQUEST['site_id']) : 1;

// Check site permission for actions that require it
if (in_array($action, ['connect'])) {
    if (!has_permission($action, $site_id)) {
        handle_error('Permission denied', 403, FTP_ERR_PERMISSION_DENIED);
    }
}

// Process action
switch ($action) {
    case 'connect':
        // Get FTP configuration
        $config = get_ftp_config($site_id);
        
        // Connect to FTP server
        $result = ftp_connect_server($config);
        echo json_encode($result);
        break;
        
    case 'list':
        // Get connection ID and path
        $connection_id = isset($_REQUEST['connection_id']) ? $_REQUEST['connection_id'] : '';
        $path = isset($_REQUEST['path']) ? $_REQUEST['path'] : '/';
        
        // List directory contents
        $result = ftp_list_directory($connection_id, $path);
        echo json_encode($result);
        break;
        
    case 'get':
        // Get connection ID and path
        $connection_id = isset($_REQUEST['connection_id']) ? $_REQUEST['connection_id'] : '';
        $path = isset($_REQUEST['path']) ? $_REQUEST['path'] : '';
        
        // Get file contents
        $result = ftp_get_file($connection_id, $path);
        echo json_encode($result);
        break;
        
    case 'put':
        // Get connection ID, path, and content
        $connection_id = isset($_REQUEST['connection_id']) ? $_REQUEST['connection_id'] : '';
        $path = isset($_REQUEST['path']) ? $_REQUEST['path'] : '';
        
        // For PUT requests, get content from request body if not in parameters
        $content = isset($_REQUEST['content']) ? $_REQUEST['content'] : '';
        if (empty($content) && $_SERVER['REQUEST_METHOD'] === 'POST') {
            $content = file_get_contents('php://input');
            if ($content === false) {
                handle_error('Failed to read file content', 400, FTP_ERR_FILE_READ_FAILED);
            }
        }
        
        // Put file contents
        $result = ftp_put_file($connection_id, $path, $content);
        echo json_encode($result);
        break;
        
    case 'mkdir':
        // Get connection ID and path
        $connection_id = isset($_REQUEST['connection_id']) ? $_REQUEST['connection_id'] : '';
        $path = isset($_REQUEST['path']) ? $_REQUEST['path'] : '';
        
        // Create directory
        $result = ftp_create_directory($connection_id, $path);
        echo json_encode($result);
        break;
        
    case 'delete':
        // Get connection ID, path, and type
        $connection_id = isset($_REQUEST['connection_id']) ? $_REQUEST['connection_id'] : '';
        $path = isset($_REQUEST['path']) ? $_REQUEST['path'] : '';
        $is_directory = isset($_REQUEST['is_directory']) ? (bool)$_REQUEST['is_directory'] : false;
        
        // Delete item
        $result = ftp_delete_item($connection_id, $path, $is_directory);
        echo json_encode($result);
        break;
        
    case 'rename':
        // Get connection ID, old path, and new path
        $connection_id = isset($_REQUEST['connection_id']) ? $_REQUEST['connection_id'] : '';
        $old_path = isset($_REQUEST['old_path']) ? $_REQUEST['old_path'] : '';
        $new_path = isset($_REQUEST['new_path']) ? $_REQUEST['new_path'] : '';
        
        // Rename item
        $result = ftp_rename_item($connection_id, $old_path, $new_path);
        echo json_encode($result);
        break;
        
    case 'create':
        // Get connection ID, path, and content
        $connection_id = isset($_REQUEST['connection_id']) ? $_REQUEST['connection_id'] : '';
        $path = isset($_REQUEST['path']) ? $_REQUEST['path'] : '';
        $content = isset($_REQUEST['content']) ? $_REQUEST['content'] : '';
        
        // Create file
        $result = ftp_create_file($connection_id, $path, $content);
        echo json_encode($result);
        break;
        
    case 'disconnect':
        // Get connection ID
        $connection_id = isset($_REQUEST['connection_id']) ? $_REQUEST['connection_id'] : '';
        
        // Disconnect from FTP server
        $result = ftp_disconnect($connection_id);
        echo json_encode($result);
        break;
        
    case 'status':
        // Get connection ID
        $connection_id = isset($_REQUEST['connection_id']) ? $_REQUEST['connection_id'] : '';
        
        // Check if connection exists and is valid
        if (!isset($_SESSION['ftp_connections'][$connection_id])) {
            echo json_encode([
                'success' => false,
                'connected' => false,
                'error_code' => FTP_ERR_INVALID_CONNECTION_ID,
                'error' => 'Not connected'
            ]);
        } else {
            // Check if connection is still valid
            $conn = $_SESSION['ftp_connections'][$connection_id];
            $is_valid = false;
            
            if (is_resource($conn)) {
                // Try a simple command to check connection
                $current_dir = @ftp_pwd($conn);
                $is_valid = ($current_dir !== false);
            }
            
            if ($is_valid) {
                echo json_encode([
                    'success' => true,
                    'connected' => true,
                    'connection_id' => $connection_id,
                    'last_activity' => isset($_SESSION['ftp_connection_times'][$connection_id]) ? 
                        $_SESSION['ftp_connection_times'][$connection_id] : time(),
                    'message' => 'Connection active'
                ]);
            } else {
                // Connection is no longer valid
                unset($_SESSION['ftp_connections'][$connection_id]);
                unset($_SESSION['ftp_connection_times'][$connection_id]);
                
                echo json_encode([
                    'success' => false,
                    'connected' => false,
                    'error_code' => FTP_ERR_CONNECTION_CLOSED,
                    'error' => 'Connection lost'
                ]);
            }
        }
        break;
        
    default:
        handle_error('Invalid action', 400, FTP_ERR_UNKNOWN);
        break;
}
