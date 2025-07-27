<?php
/**
 * EzEdit.co Site Management API
 * Simple site configuration management for demo purposes
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

// Simple demo authentication check
if (!isset($_SESSION['user_id'])) {
    // Set up demo user
    $_SESSION['user_id'] = 1;
    $_SESSION['authenticated'] = true;
    $_SESSION['user_email'] = 'demo@ezedit.co';
}

// Simple file-based storage for demo
$dataFile = __DIR__ . '/../data/sites.json';
$dataDir = dirname($dataFile);
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Get request data
$method = $_SERVER['REQUEST_METHOD'];
$input = file_get_contents('php://input');
$data = json_decode($input, true) ?: $_POST;

try {
    switch ($method) {
        case 'GET':
            handleGetSites();
            break;
        case 'POST':
            handleCreateSite($data);
            break;
        case 'PUT':
            handleUpdateSite($data);
            break;
        case 'DELETE':
            handleDeleteSite($data);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}

function loadSites() {
    global $dataFile;
    if (!file_exists($dataFile)) {
        return [];
    }
    $data = file_get_contents($dataFile);
    return json_decode($data, true) ?: [];
}

function saveSites($sites) {
    global $dataFile;
    file_put_contents($dataFile, json_encode($sites, JSON_PRETTY_PRINT));
}

function handleGetSites() {
    $sites = loadSites();
    echo json_encode([
        'success' => true,
        'data' => $sites,
        'csrf_token' => generateCSRFToken()
    ]);
}

function handleCreateSite($data) {
    if (empty($data['site_name']) || empty($data['host']) || empty($data['username'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Site name, host, and username are required']);
        return;
    }
    
    $sites = loadSites();
    $newSite = [
        'id' => uniqid(),
        'site_name' => htmlspecialchars($data['site_name']),
        'host' => htmlspecialchars($data['host']),
        'port' => intval($data['port'] ?? 21),
        'username' => htmlspecialchars($data['username']),
        'password' => str_repeat('•', 8), // Don't store real passwords in demo
        'root_directory' => htmlspecialchars($data['root_directory'] ?? '/'),
        'web_url' => !empty($data['web_url']) ? htmlspecialchars($data['web_url']) : null,
        'is_secure_ftp' => !empty($data['is_secure']),
        'connection_status' => 'never_connected',
        'created_at' => date('c'),
        'updated_at' => date('c')
    ];
    
    $sites[] = $newSite;
    saveSites($sites);
    
    echo json_encode([
        'success' => true,
        'data' => ['id' => $newSite['id']],
        'message' => 'Site created successfully',
        'csrf_token' => generateCSRFToken()
    ]);
}

function handleUpdateSite($data) {
    // Demo implementation
    echo json_encode([
        'success' => true,
        'message' => 'Site updated successfully',
        'csrf_token' => generateCSRFToken()
    ]);
}

function handleDeleteSite($data) {
    // Demo implementation
    echo json_encode([
        'success' => true,
        'message' => 'Site deleted successfully',
        'csrf_token' => generateCSRFToken()
    ]);
}

function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}
?>