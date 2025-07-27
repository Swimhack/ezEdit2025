<?php
/**
 * EzEdit.co Site Management API with Supabase
 * FTP site configuration management using PostgreSQL
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

require_once '../public/config/bootstrap.php';
require_once '../public/config/database.php';

// Check for authentication
if (!isset($_SESSION['user_id'])) {
    // Set up demo user for development
    $_SESSION['user_id'] = 1;
    $_SESSION['authenticated'] = true;
    $_SESSION['user_email'] = 'demo@ezedit.co';
}

// Get database instance
try {
    $db = Database::getInstance();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Get request data
$method = $_SERVER['REQUEST_METHOD'];
$input = file_get_contents('php://input');
$data = json_decode($input, true) ?: $_POST;

try {
    switch ($method) {
        case 'GET':
            handleGetSites($db);
            break;
        case 'POST':
            handleCreateSite($db, $data);
            break;
        case 'PUT':
            handleUpdateSite($db, $data);
            break;
        case 'DELETE':
            handleDeleteSite($db, $data);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => Environment::isDebug() ? $e->getMessage() : 'Database operation failed'
    ]);
}

function handleGetSites($db) {
    try {
        $userId = $_SESSION['user_id'];
        
        // Get user's FTP connections
        $sites = $db->find('ftp_connections', 'user_id = ?', [$userId], 
            'id, name, host, port, username, root_directory, web_url, secure, created_at, updated_at, last_used');
        
        // Format sites for frontend
        $formattedSites = array_map(function($site) {
            return [
                'id' => $site['id'],
                'site_name' => $site['name'],
                'host' => $site['host'],
                'port' => $site['port'],
                'username' => $site['username'],
                'root_directory' => $site['root_directory'],
                'web_url' => $site['web_url'],
                'is_secure' => $site['secure'],
                'created_at' => $site['created_at'],
                'updated_at' => $site['updated_at'],
                'last_used' => $site['last_used'],
                'connection_status' => $site['last_used'] ? 'connected' : 'never_connected'
            ];
        }, $sites);
        
        echo json_encode([
            'success' => true,
            'data' => $formattedSites,
            'csrf_token' => generateCSRFToken()
        ]);
        
    } catch (Exception $e) {
        throw new Exception('Failed to retrieve sites: ' . $e->getMessage());
    }
}

function handleCreateSite($db, $data) {
    try {
        // Validate required fields
        if (empty($data['site_name']) || empty($data['host']) || empty($data['username'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Site name, host, and username are required']);
            return;
        }
        
        $userId = $_SESSION['user_id'];
        
        // Encrypt password if provided
        $encryptedPassword = '';
        if (!empty($data['password'])) {
            $encryptedPassword = SimpleEncryption::encrypt($data['password']);
        }
        
        // Prepare site data
        $siteData = [
            'user_id' => $userId,
            'name' => htmlspecialchars(trim($data['site_name'])),
            'host' => htmlspecialchars(trim($data['host'])),
            'port' => intval($data['port'] ?? 21),
            'username' => htmlspecialchars(trim($data['username'])),
            'password_encrypted' => $encryptedPassword,
            'root_directory' => htmlspecialchars(trim($data['root_directory'] ?? '')),
            'web_url' => !empty($data['web_url']) ? htmlspecialchars(trim($data['web_url'])) : null,
            'secure' => !empty($data['is_secure']),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        // Insert into database
        $siteId = $db->insert('ftp_connections', $siteData);
        
        echo json_encode([
            'success' => true,
            'data' => ['id' => $siteId],
            'message' => 'Site created successfully',
            'csrf_token' => generateCSRFToken()
        ]);
        
    } catch (Exception $e) {
        throw new Exception('Failed to create site: ' . $e->getMessage());
    }
}

function handleUpdateSite($db, $data) {
    try {
        if (empty($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Site ID is required']);
            return;
        }
        
        $userId = $_SESSION['user_id'];
        $siteId = intval($data['id']);
        
        // Check if site belongs to user
        $existingSite = $db->findOne('ftp_connections', 'id = ? AND user_id = ?', [$siteId, $userId]);
        if (!$existingSite) {
            http_response_code(404);
            echo json_encode(['error' => 'Site not found']);
            return;
        }
        
        // Prepare update data
        $updateData = [
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        if (!empty($data['site_name'])) {
            $updateData['name'] = htmlspecialchars(trim($data['site_name']));
        }
        if (!empty($data['host'])) {
            $updateData['host'] = htmlspecialchars(trim($data['host']));
        }
        if (isset($data['port'])) {
            $updateData['port'] = intval($data['port']);
        }
        if (!empty($data['username'])) {
            $updateData['username'] = htmlspecialchars(trim($data['username']));
        }
        if (!empty($data['password'])) {
            $updateData['password_encrypted'] = SimpleEncryption::encrypt($data['password']);
        }
        if (isset($data['root_directory'])) {
            $updateData['root_directory'] = htmlspecialchars(trim($data['root_directory']));
        }
        if (isset($data['web_url'])) {
            $updateData['web_url'] = !empty($data['web_url']) ? htmlspecialchars(trim($data['web_url'])) : null;
        }
        if (isset($data['is_secure'])) {
            $updateData['secure'] = !empty($data['is_secure']);
        }
        
        // Update database
        $db->update('ftp_connections', $updateData, 'id = ? AND user_id = ?', [$siteId, $userId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Site updated successfully',
            'csrf_token' => generateCSRFToken()
        ]);
        
    } catch (Exception $e) {
        throw new Exception('Failed to update site: ' . $e->getMessage());
    }
}

function handleDeleteSite($db, $data) {
    try {
        if (empty($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Site ID is required']);
            return;
        }
        
        $userId = $_SESSION['user_id'];
        $siteId = intval($data['id']);
        
        // Delete site (only if it belongs to the user)
        $db->delete('ftp_connections', 'id = ? AND user_id = ?', [$siteId, $userId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Site deleted successfully',
            'csrf_token' => generateCSRFToken()
        ]);
        
    } catch (Exception $e) {
        throw new Exception('Failed to delete site: ' . $e->getMessage());
    }
}

function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}
?>