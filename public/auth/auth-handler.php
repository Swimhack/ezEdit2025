<?php
/**
 * EzEdit PHP Authentication Handler (LEGACY)
 * 
 * Provides server-side authentication functionality that works alongside Supabase
 * for enhanced security and flexibility.
 * 
 * This handler provides:
 * - Server-side user registration with additional validation
 * - Server-side login with enhanced security
 * - Token verification endpoint
 * - Integration with Supabase Auth API
 */

// Load environment variables
require_once __DIR__ . '/../../.env.php';

// Set headers for CORS and JSON responses
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request data
$requestData = json_decode(file_get_contents('php://input'), true);
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Initialize response
$response = [
    'success' => false,
    'message' => 'Invalid request',
    'data' => null
];

// Handle different actions
switch ($action) {
    case 'debug':
        $response['success'] = true;
        $response['message'] = 'Auth handler is working';
        $response['data'] = [
            'timestamp' => date('Y-m-d H:i:s'),
            'supabase_url_loaded' => !empty($_ENV['SUPABASE_URL']),
            'service_key_loaded' => !empty($_ENV['SUPABASE_SERVICE_KEY']),
            'anon_key_loaded' => !empty($_ENV['SUPABASE_ANON_KEY']),
            'logs_dir_exists' => is_dir(__DIR__ . '/../../logs'),
            'logs_dir_writable' => is_writable(__DIR__ . '/../../logs')
        ];
        break;
    case 'login':
        handleLogin($requestData, $_ENV['SUPABASE_URL'], $_ENV['SUPABASE_SERVICE_KEY'], $response);
        break;
    case 'register':
        handleRegister($requestData, $_ENV['SUPABASE_URL'], $_ENV['SUPABASE_SERVICE_KEY'], $response);
        break;
    case 'verify':
        handleVerifyToken($requestData, $_ENV['SUPABASE_URL'], $_ENV['SUPABASE_SERVICE_KEY'], $response);
        break;
    case 'refresh':
        handleRefreshToken($requestData, $_ENV['SUPABASE_URL'], $_ENV['SUPABASE_SERVICE_KEY'], $response);
        break;
    case 'logout':
        handleLogout($requestData, $_ENV['SUPABASE_URL'], $_ENV['SUPABASE_SERVICE_KEY'], $response);
        break;
    case 'log_client_auth':
        handleClientAuthLog($requestData, $response);
        break;
    default:
        $response['message'] = 'Unknown action';
        break;
}

// Return JSON response
echo json_encode($response);
exit;

/**
 * Handle login request
 * 
 * @param array $data Request data
 * @param string $supabaseUrl Supabase URL
 * @param string $supabaseKey Supabase service key
 * @param array &$response Response array
 */
function handleLogin($data, $supabaseUrl, $supabaseKey, &$response) {
    // Validate required fields
    if (!isset($data['email']) || !isset($data['password'])) {
        $response['message'] = 'Email and password are required';
        return;
    }

    $email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
    $password = $data['password'];

    if (!$email) {
        $response['message'] = 'Invalid email format';
        return;
    }

    // Call Supabase Auth API to sign in
    $ch = curl_init($supabaseUrl . '/auth/v1/token?grant_type=password');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'email' => $email,
        'password' => $password
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseKey
    ]);

    $result = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $resultData = json_decode($result, true);

    if ($statusCode === 200 && isset($resultData['access_token'])) {
        // Login successful
        $response['success'] = true;
        $response['message'] = 'Login successful';
        
        // Get user profile from Supabase
        $profile = getUserProfile($resultData['user']['id'], $supabaseUrl, $supabaseKey);
        
        // Return auth data
        $response['data'] = [
            'user' => $resultData['user'],
            'session' => [
                'access_token' => $resultData['access_token'],
                'refresh_token' => $resultData['refresh_token'],
                'expires_in' => $resultData['expires_in'],
                'expires_at' => time() + $resultData['expires_in']
            ],
            'profile' => $profile
        ];
        
        // Log successful login
        logDetailedAuthAttempt('login', $email, true, null, $resultData['user']);
    } else {
        // Login failed
        $response['message'] = isset($resultData['error_description']) 
            ? $resultData['error_description'] 
            : 'Invalid email or password';
        
        // Log failed login attempt
        logDetailedAuthAttempt('login', $email, false, $response['message']);
    }
}

/**
 * Handle user registration
 * 
 * @param array $data Request data
 * @param string $supabaseUrl Supabase URL
 * @param string $supabaseKey Supabase service key
 * @param array &$response Response array
 */
function handleRegister($data, $supabaseUrl, $supabaseKey, &$response) {
    // Validate required fields
    if (!isset($data['email']) || !isset($data['password']) || 
        !isset($data['firstName']) || !isset($data['lastName'])) {
        $response['message'] = 'Email, password, first name, and last name are required';
        return;
    }

    $email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
    $password = $data['password'];
    $firstName = trim($data['firstName']);
    $lastName = trim($data['lastName']);
    $metadata = isset($data['metadata']) ? $data['metadata'] : [];

    // Validate email
    if (!$email) {
        $response['message'] = 'Invalid email format';
        return;
    }

    // Validate password strength
    if (strlen($password) < 8) {
        $response['message'] = 'Password must be at least 8 characters long';
        return;
    }

    // Combine metadata
    $userMetadata = array_merge([
        'first_name' => $firstName,
        'last_name' => $lastName,
        'full_name' => $firstName . ' ' . $lastName,
        'plan' => 'free_trial',
        'trial_ends_at' => date('c', strtotime('+7 days')),
        'signup_source' => isset($data['signupSource']) ? $data['signupSource'] : 'php_api'
    ], $metadata);

    // Call Supabase Auth API to register
    $ch = curl_init($supabaseUrl . '/auth/v1/signup');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'email' => $email,
        'password' => $password,
        'data' => $userMetadata
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseKey
    ]);

    $result = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $resultData = json_decode($result, true);

    if ($statusCode === 200 && isset($resultData['id'])) {
        // Registration successful
        $response['success'] = true;
        $response['message'] = 'Registration successful';
        
        // Create user profile in Supabase
        createUserProfile($resultData['id'], $userMetadata, $supabaseUrl, $supabaseKey);
        
        // Return user data
        $response['data'] = [
            'user' => $resultData,
            'emailConfirmation' => !isset($resultData['confirmed_at'])
        ];
        
        // Log successful registration
        logDetailedAuthAttempt('register', $email, true, null, $resultData);
    } else {
        // Registration failed
        $response['message'] = isset($resultData['msg']) 
            ? $resultData['msg'] 
            : 'Registration failed';
        
        // Log failed registration
        logDetailedAuthAttempt('register', $email, false, $response['message']);
    }
}

/**
 * Handle token verification
 * 
 * @param array $data Request data
 * @param string $supabaseUrl Supabase URL
 * @param string $supabaseKey Supabase service key
 * @param array &$response Response array
 */
function handleVerifyToken($data, $supabaseUrl, $supabaseKey, &$response) {
    // Validate required fields
    if (!isset($data['token'])) {
        $response['message'] = 'Token is required';
        return;
    }

    $token = $data['token'];

    // Call Supabase Auth API to verify token
    $ch = curl_init($supabaseUrl . '/auth/v1/user');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $token
    ]);

    $result = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $resultData = json_decode($result, true);

    if ($statusCode === 200 && isset($resultData['id'])) {
        // Token is valid
        $response['success'] = true;
        $response['message'] = 'Token is valid';
        
        // Get user profile
        $profile = getUserProfile($resultData['id'], $supabaseUrl, $supabaseKey);
        
        // Return user data
        $response['data'] = [
            'user' => $resultData,
            'profile' => $profile
        ];
        
        // Log successful token verification
        logDetailedAuthAttempt('token_verify', $resultData['email'] ?? 'unknown', true, null, $resultData);
    } else {
        // Token is invalid
        $response['message'] = 'Invalid or expired token';
        
        // Log failed token verification
        logDetailedAuthAttempt('token_verify', 'unknown', false, $response['message']);
    }
}

/**
 * Handle token refresh
 * 
 * @param array $data Request data
 * @param string $supabaseUrl Supabase URL
 * @param string $supabaseKey Supabase service key
 * @param array &$response Response array
 */
function handleRefreshToken($data, $supabaseUrl, $supabaseKey, &$response) {
    // Validate required fields
    if (!isset($data['refresh_token'])) {
        $response['message'] = 'Refresh token is required';
        return;
    }

    $refreshToken = $data['refresh_token'];

    // Call Supabase Auth API to refresh token
    $ch = curl_init($supabaseUrl . '/auth/v1/token?grant_type=refresh_token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'refresh_token' => $refreshToken
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseKey
    ]);

    $result = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $resultData = json_decode($result, true);

    if ($statusCode === 200 && isset($resultData['access_token'])) {
        // Token refresh successful
        $response['success'] = true;
        $response['message'] = 'Token refreshed successfully';
        
        // Return new tokens
        $response['data'] = [
            'access_token' => $resultData['access_token'],
            'refresh_token' => $resultData['refresh_token'],
            'expires_in' => $resultData['expires_in'],
            'expires_at' => time() + $resultData['expires_in']
        ];
    } else {
        // Token refresh failed
        $response['message'] = isset($resultData['error_description']) 
            ? $resultData['error_description'] 
            : 'Failed to refresh token';
    }
}

/**
 * Handle logout
 * 
 * @param array $data Request data
 * @param string $supabaseUrl Supabase URL
 * @param string $supabaseKey Supabase service key
 * @param array &$response Response array
 */
function handleLogout($data, $supabaseUrl, $supabaseKey, &$response) {
    // Validate required fields
    if (!isset($data['token'])) {
        $response['message'] = 'Token is required';
        return;
    }

    $token = $data['token'];

    // Call Supabase Auth API to logout
    $ch = curl_init($supabaseUrl . '/auth/v1/logout');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $token
    ]);

    $result = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Always return success for logout
    $response['success'] = true;
    $response['message'] = 'Logged out successfully';
    
    // Log successful logout
    logDetailedAuthAttempt('logout', 'unknown', true, null);
}

/**
 * Handle client-side auth logging
 * 
 * @param array $data Request data
 * @param array &$response Response array
 */
function handleClientAuthLog($data, &$response) {
    try {
        $logData = $data['log_data'] ?? [];
        
        if (empty($logData)) {
            $response['message'] = 'No log data provided';
            return;
        }
        
        // Add server-side context to client log
        $logData['server_timestamp'] = date('c');
        $logData['server_ip'] = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $logData['source'] = 'client';
        
        // Write to client-specific log file
        $logDir = __DIR__ . '/../../logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $clientLogFile = $logDir . '/client-auth.log';
        $jsonLog = json_encode($logData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n---\n";
        file_put_contents($clientLogFile, $jsonLog, FILE_APPEND | LOCK_EX);
        
        // Also add to main auth log for overview
        $mainLogFile = $logDir . '/auth.log';
        file_put_contents($mainLogFile, $jsonLog, FILE_APPEND | LOCK_EX);
        
        $response['success'] = true;
        $response['message'] = 'Client auth log saved successfully';
        
    } catch (Exception $e) {
        $response['success'] = false;
        $response['message'] = 'Failed to save client auth log: ' . $e->getMessage();
        
        // Log the error
        error_log('Client auth log error: ' . $e->getMessage());
    }
}

/**
 * Get user profile from Supabase
 * 
 * @param string $userId User ID
 * @param string $supabaseUrl Supabase URL
 * @param string $supabaseKey Supabase service key
 * @return array|null User profile or null if not found
 */
function getUserProfile($userId, $supabaseUrl, $supabaseKey) {
    $ch = curl_init($supabaseUrl . '/rest/v1/profiles?id=eq.' . $userId);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);

    $result = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($statusCode === 200) {
        $profiles = json_decode($result, true);
        return !empty($profiles) ? $profiles[0] : null;
    }

    return null;
}

/**
 * Create user profile in Supabase
 * 
 * @param string $userId User ID
 * @param array $metadata User metadata
 * @param string $supabaseUrl Supabase URL
 * @param string $supabaseKey Supabase service key
 * @return bool Success status
 */
function createUserProfile($userId, $metadata, $supabaseUrl, $supabaseKey) {
    // Check if user is admin based on email
    $email = $metadata['email'] ?? '';
    $isAdmin = isAdminUser($email);
    
    // Prepare profile data
    $profileData = [
        'id' => $userId,
        'first_name' => $metadata['first_name'],
        'last_name' => $metadata['last_name'],
        'plan' => $metadata['plan'] ?? 'free_trial',
        'trial_days_left' => 7,
        'signup_source' => $metadata['signup_source'] ?? 'php_api',
        'auth_provider' => 'email',
        'role' => $isAdmin ? 'admin' : 'user',
        'created_at' => date('c'),
        'updated_at' => date('c')
    ];

    // Call Supabase API to create profile
    $ch = curl_init($supabaseUrl . '/rest/v1/profiles');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($profileData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Prefer: return=representation'
    ]);

    $result = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ($statusCode === 201);
}

/**
 * Check if user is an admin based on email
 * 
 * @param string $email User email
 * @return bool True if user is admin
 */
function isAdminUser($email) {
    if (empty($email)) return false;
    
    $email = strtolower($email);
    
    // Admin emails list
    $adminEmails = [
        'admin@ezedit.co',
        'support@ezedit.co'
    ];
    
    // Check for exact email matches
    if (in_array($email, $adminEmails)) return true;
    
    // Check for admin domains
    $adminDomains = ['strickland.co', 'ezedit.co'];
    foreach ($adminDomains as $domain) {
        if (str_ends_with($email, '@' . $domain)) return true;
    }
    
    return false;
}

/**
 * Log authentication activity with detailed JSON format
 * 
 * @param string $action Action name
 * @param string $email User email
 * @param array $additionalData Additional data to log
 * @param string $status Status (success/error/warning)
 * @return void
 */
function logAuthActivity($action, $email, $additionalData = [], $status = 'info') {
    $logDir = __DIR__ . '/../../logs';
    
    // Create logs directory if it doesn't exist
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    // Prepare detailed log entry
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'iso_timestamp' => date('c'),
        'action' => $action,
        'status' => $status,
        'email' => $email,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
        'referer' => $_SERVER['HTTP_REFERER'] ?? null,
        'session_id' => session_id(),
        'additional_data' => $additionalData
    ];
    
    // Add security headers if available
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $logEntry['forwarded_for'] = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
    if (isset($_SERVER['HTTP_X_REAL_IP'])) {
        $logEntry['real_ip'] = $_SERVER['HTTP_X_REAL_IP'];
    }
    
    // Determine log file based on action
    $logFile = $logDir . '/auth.log';
    if (strpos($action, 'login') !== false) {
        $logFile = $logDir . '/login.log';
    } elseif (strpos($action, 'register') !== false || strpos($action, 'signup') !== false) {
        $logFile = $logDir . '/signup.log';
    } elseif (strpos($action, 'error') !== false || $status === 'error') {
        $logFile = $logDir . '/errors.log';
    }
    
    // Write JSON log entry
    $jsonLog = json_encode($logEntry, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n---\n";
    file_put_contents($logFile, $jsonLog, FILE_APPEND | LOCK_EX);
    
    // Also write to main auth.log for overview
    if ($logFile !== $logDir . '/auth.log') {
        file_put_contents($logDir . '/auth.log', $jsonLog, FILE_APPEND | LOCK_EX);
    }
}

/**
 * Log detailed authentication attempt
 * 
 * @param string $type Type of auth (login/signup/oauth)
 * @param string $email User email
 * @param bool $success Whether the attempt was successful
 * @param string $errorMessage Error message if failed
 * @param array $userData User data if available
 * @return void
 */
function logDetailedAuthAttempt($type, $email, $success, $errorMessage = null, $userData = []) {
    $action = $type . '_attempt';
    $status = $success ? 'success' : 'error';
    
    $additionalData = [
        'attempt_type' => $type,
        'success' => $success,
        'error_message' => $errorMessage,
        'user_data' => $userData,
        'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
    ];
    
    logAuthActivity($action, $email, $additionalData, $status);
}
