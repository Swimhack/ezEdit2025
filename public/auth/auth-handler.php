<?php
/**
 * EzEdit.co Authentication Handler
 * Handles login, registration, and demo authentication
 */

// Enable CORS for frontend requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// JWT configuration
$jwt_secret = $_ENV['JWT_SECRET'] ?? 'ezedit-dev-secret-change-in-production-2024';

// Helper function to create JWT token
function createJWT($payload, $secret) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode($payload);
    
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $secret, true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64Header . "." . $base64Payload . "." . $base64Signature;
}

// Helper function to verify JWT token
function verifyJWT($token, $secret) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    $header = $parts[0];
    $payload = $parts[1];
    $signature = $parts[2];
    
    $expectedSignature = hash_hmac('sha256', $header . "." . $payload, $secret, true);
    $expectedBase64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($expectedSignature));
    
    if (!hash_equals($expectedBase64Signature, $signature)) {
        return false;
    }
    
    $payloadData = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
    
    // Check expiration
    if (isset($payloadData['exp']) && $payloadData['exp'] < time()) {
        return false;
    }
    
    return $payloadData;
}

// Get action from query parameter or request
$action = $_GET['action'] ?? $_POST['action'] ?? 'unknown';

try {
    switch ($action) {
        case 'demo-login':
            // Demo login for testing FTP functionality
            $demoUser = [
                'id' => 'demo-user-' . uniqid(),
                'email' => 'demo@ezedit.co',
                'name' => 'Demo User',
                'plan' => 'trial',
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ];
            
            $token = createJWT($demoUser, $jwt_secret);
            
            echo json_encode([
                'success' => true,
                'token' => $token,
                'user' => $demoUser,
                'message' => 'Demo authentication successful'
            ]);
            break;
            
        case 'login':
            // Handle real user login (would integrate with Supabase)
            $email = $_POST['email'] ?? '';
            $password = $_POST['password'] ?? '';
            
            if (empty($email) || empty($password)) {
                throw new Exception('Email and password are required');
            }
            
            // For now, return demo user for any valid email
            if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $user = [
                    'id' => 'user-' . md5($email),
                    'email' => $email,
                    'name' => 'User',
                    'plan' => 'trial',
                    'exp' => time() + (7 * 24 * 60 * 60) // 7 days
                ];
                
                $token = createJWT($user, $jwt_secret);
                
                echo json_encode([
                    'success' => true,
                    'token' => $token,
                    'user' => $user,
                    'message' => 'Login successful'
                ]);
            } else {
                throw new Exception('Invalid email format');
            }
            break;
            
        case 'register':
            // Handle user registration
            $email = $_POST['email'] ?? '';
            $password = $_POST['password'] ?? '';
            $name = $_POST['name'] ?? '';
            
            if (empty($email) || empty($password) || empty($name)) {
                throw new Exception('Email, password, and name are required');
            }
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email format');
            }
            
            if (strlen($password) < 6) {
                throw new Exception('Password must be at least 6 characters');
            }
            
            // Create new user
            $user = [
                'id' => 'user-' . uniqid(),
                'email' => $email,
                'name' => $name,
                'plan' => 'trial',
                'trial_ends' => time() + (7 * 24 * 60 * 60), // 7 days
                'created_at' => time(),
                'exp' => time() + (7 * 24 * 60 * 60)
            ];
            
            $token = createJWT($user, $jwt_secret);
            
            echo json_encode([
                'success' => true,
                'token' => $token,
                'user' => $user,
                'message' => 'Registration successful'
            ]);
            break;
            
        case 'verify':
            // Verify JWT token
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            $token = '';
            
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
            } else {
                $token = $_POST['token'] ?? $_GET['token'] ?? '';
            }
            
            if (empty($token)) {
                throw new Exception('No token provided');
            }
            
            $payload = verifyJWT($token, $jwt_secret);
            
            if (!$payload) {
                throw new Exception('Invalid or expired token');
            }
            
            echo json_encode([
                'success' => true,
                'user' => $payload,
                'message' => 'Token is valid'
            ]);
            break;
            
        case 'logout':
            // Handle logout (token-based auth doesn't need server-side logout)
            echo json_encode([
                'success' => true,
                'message' => 'Logout successful'
            ]);
            break;
            
        default:
            throw new Exception('Unknown action: ' . $action);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'action' => $action
    ]);
}

// Log request for debugging (in development only)
if ($_ENV['NODE_ENV'] !== 'production') {
    error_log("Auth request: " . $action . " - " . json_encode($_POST));
}
?>