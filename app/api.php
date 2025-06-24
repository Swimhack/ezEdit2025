<?php
/**
 * ezEdit API Router
 * Handles all API requests for the ezEdit application
 */

// Start session
session_start();

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Define secure access constant
define('EZEDIT_SECURE_ACCESS', true);

// Load environment variables from .env file
$envFile = __DIR__ . '/../.env';
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

// Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/';
    
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

// Helper function to get JSON request body
function getRequestBody() {
    $json = file_get_contents('php://input');
    return json_decode($json, true);
}

// Helper function to get environment variables
function env($key, $default = null) {
    return isset($_ENV[$key]) ? $_ENV[$key] : (getenv($key) ?: $default);
}

// Authentication middleware
function authenticate() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "error" => "Unauthorized: No valid authentication token provided",
            "error_code" => "AUTH_ERR_NO_TOKEN"
        ]);
        exit;
    }
    
    $token = $matches[1];
    
    // Verify token with Supabase (simplified)
    // In a production app, you would make an API call to Supabase to verify the token
    // For now, we'll just check if it's not empty
    if (empty($token)) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "error" => "Unauthorized: Invalid token",
            "error_code" => "AUTH_ERR_INVALID_TOKEN"
        ]);
        exit;
    }
    
    return $token;
}

// Parse request URI
$uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Remove query string from URI
if (($pos = strpos($uri, '?')) !== false) {
    $uri = substr($uri, 0, $pos);
}

// Remove base path from URI
$base_path = '/api';
if (strpos($uri, $base_path) === 0) {
    $uri = substr($uri, strlen($base_path));
}

// Define routes
$routes = [
    // Auth routes
    'POST /auth/login' => function() {
        $data = getRequestBody();
        $authController = new App\Controllers\AuthController();
        return $authController->login($data['email'] ?? '', $data['password'] ?? '');
    },
    'POST /auth/register' => function() {
        $data = getRequestBody();
        $authController = new App\Controllers\AuthController();
        return $authController->register($data['email'] ?? '', $data['password'] ?? '');
    },
    'POST /auth/logout' => function() {
        authenticate(); // Ensure user is authenticated
        $authController = new App\Controllers\AuthController();
        return $authController->logout();
    },
    'GET /auth/user-plan' => function() {
        authenticate(); // Ensure user is authenticated
        $authController = new App\Controllers\AuthController();
        return $authController->getUserPlan();
    },
    'POST /auth/upgrade-pro' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $authController = new App\Controllers\AuthController();
        return $authController->upgradeToPro($data['payment_method_id'] ?? '');
    },
    
    // FTP routes
    'POST /ftp/connect' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $ftpController = new App\Controllers\FtpController();
        return $ftpController->connect($data);
    },
    'POST /ftp/list' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $ftpController = new App\Controllers\FtpController();
        return $ftpController->listDirectory($data['connection_id'] ?? '', $data['path'] ?? '/');
    },
    'POST /ftp/download' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $ftpController = new App\Controllers\FtpController();
        return $ftpController->downloadFile($data['connection_id'] ?? '', $data['path'] ?? '');
    },
    'POST /ftp/upload' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $ftpController = new App\Controllers\FtpController();
        return $ftpController->uploadFile($data['connection_id'] ?? '', $data['path'] ?? '', $data['content'] ?? '');
    },
    
    // File Explorer routes
    'POST /files/create-file' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $fileExplorerController = new App\Controllers\FileExplorerController();
        return $fileExplorerController->createFile($data['connection_id'] ?? '', $data['path'] ?? '', $data['content'] ?? '');
    },
    'POST /files/create-directory' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $fileExplorerController = new App\Controllers\FileExplorerController();
        return $fileExplorerController->createDirectory($data['connection_id'] ?? '', $data['path'] ?? '');
    },
    'POST /files/rename' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $fileExplorerController = new App\Controllers\FileExplorerController();
        return $fileExplorerController->rename($data['connection_id'] ?? '', $data['old_path'] ?? '', $data['new_path'] ?? '');
    },
    'POST /files/delete-file' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $fileExplorerController = new App\Controllers\FileExplorerController();
        return $fileExplorerController->deleteFile($data['connection_id'] ?? '', $data['path'] ?? '');
    },
    'POST /files/delete-directory' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $fileExplorerController = new App\Controllers\FileExplorerController();
        return $fileExplorerController->deleteDirectory($data['connection_id'] ?? '', $data['path'] ?? '');
    },
    'POST /files/info' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $fileExplorerController = new App\Controllers\FileExplorerController();
        return $fileExplorerController->getFileInfo($data['connection_id'] ?? '', $data['path'] ?? '');
    },
    
    // Editor routes
    'POST /editor/get-file' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $editorController = new App\Controllers\EditorController();
        return $editorController->getFileContent($data['connection_id'] ?? '', $data['path'] ?? '');
    },
    'POST /editor/save-file' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $editorController = new App\Controllers\EditorController();
        return $editorController->saveFileContent($data['connection_id'] ?? '', $data['path'] ?? '', $data['content'] ?? '', true);
    },
    'POST /editor/generate-diff' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $editorController = new App\Controllers\EditorController();
        return $editorController->generateDiff($data['connection_id'] ?? '', $data['path'] ?? '', $data['modified_content'] ?? '');
    },
    'POST /editor/apply-patch' => function() {
        authenticate(); // Ensure user is authenticated
        $data = getRequestBody();
        $editorController = new App\Controllers\EditorController();
        return $editorController->applyPatch($data['original_content'] ?? '', $data['patch'] ?? '');
    }
];

// Match route
$route_key = $method . ' ' . $uri;
$route_found = false;

foreach ($routes as $pattern => $handler) {
    // Simple route matching (in a real app, use a proper router with parameter support)
    if ($pattern === $route_key) {
        $route_found = true;
        $result = $handler();
        echo json_encode($result);
        break;
    }
}

// Handle 404 if no route matched
if (!$route_found) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'Endpoint not found: ' . $route_key,
        'error_code' => 'API_ERR_ENDPOINT_NOT_FOUND'
    ]);
}
