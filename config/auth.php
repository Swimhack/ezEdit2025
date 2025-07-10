<?php
/**
 * Secure Authentication System for EzEdit
 * Handles JWT tokens, session management, and authorization
 */

require_once __DIR__ . '/encryption.php';

class AuthManager {
    
    private $jwtSecret;
    private $sessionTimeout = 3600; // 1 hour
    
    public function __construct() {
        $this->jwtSecret = $_ENV['JWT_SECRET'] ?? null;
        if (!$this->jwtSecret) {
            throw new Exception('JWT_SECRET environment variable not set');
        }
        
        if (strlen($this->jwtSecret) < 32) {
            throw new Exception('JWT_SECRET must be at least 32 characters long');
        }
    }
    
    /**
     * Generate a secure JWT token
     * 
     * @param array $payload Token payload
     * @param int $expiry Expiry time in seconds (default 1 hour)
     * @return string JWT token
     */
    public function generateJWT($payload, $expiry = 3600) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        
        $payload['iat'] = time();
        $payload['exp'] = time() + $expiry;
        $payload['iss'] = 'ezedit.co';
        
        $payloadEncoded = json_encode($payload);
        
        $base64Header = $this->base64UrlEncode($header);
        $base64Payload = $this->base64UrlEncode($payloadEncoded);
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $this->jwtSecret, true);
        $base64Signature = $this->base64UrlEncode($signature);
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    /**
     * Verify and decode JWT token
     * 
     * @param string $token JWT token
     * @return array|false Decoded payload or false if invalid
     */
    public function verifyJWT($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        [$header, $payload, $signature] = $parts;
        
        // Verify signature
        $expectedSignature = hash_hmac('sha256', $header . "." . $payload, $this->jwtSecret, true);
        $expectedSignature = $this->base64UrlEncode($expectedSignature);
        
        if (!hash_equals($expectedSignature, $signature)) {
            return false;
        }
        
        // Decode payload
        $payloadData = json_decode($this->base64UrlDecode($payload), true);
        if (!$payloadData) {
            return false;
        }
        
        // Check expiry
        if (isset($payloadData['exp']) && $payloadData['exp'] < time()) {
            return false;
        }
        
        return $payloadData;
    }
    
    /**
     * Authenticate user with credentials
     * 
     * @param string $email User email
     * @param string $password User password
     * @return array|false User data or false if invalid
     */
    public function authenticateUser($email, $password) {
        // This would integrate with your user database
        // For now, implement with Supabase integration
        
        try {
            // Example implementation - replace with actual Supabase auth
            $hashedPassword = $this->getUserPasswordHash($email);
            
            if ($hashedPassword && SecureEncryption::verifyPassword($password, $hashedPassword)) {
                $userData = $this->getUserData($email);
                
                // Generate JWT token
                $token = $this->generateJWT([
                    'user_id' => $userData['id'],
                    'email' => $userData['email'],
                    'role' => $userData['role'] ?? 'user'
                ]);
                
                return [
                    'success' => true,
                    'token' => $token,
                    'user' => $userData
                ];
            }
            
            return false;
        } catch (Exception $e) {
            error_log('Authentication error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if user is authenticated from request
     * 
     * @param array $headers Request headers
     * @return array|false User data or false if not authenticated
     */
    public function checkAuthentication($headers) {
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        
        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return false;
        }
        
        $token = $matches[1];
        return $this->verifyJWT($token);
    }
    
    /**
     * Check if user has admin privileges
     * 
     * @param array $userData User data from JWT
     * @return bool True if user is admin
     */
    public function isAdmin($userData) {
        return isset($userData['role']) && $userData['role'] === 'admin';
    }
    
    /**
     * Require admin authentication
     * 
     * @param array $headers Request headers
     * @throws Exception If not authenticated or not admin
     */
    public function requireAdmin($headers) {
        $userData = $this->checkAuthentication($headers);
        
        if (!$userData) {
            http_response_code(401);
            throw new Exception('Authentication required');
        }
        
        if (!$this->isAdmin($userData)) {
            http_response_code(403);
            throw new Exception('Admin privileges required');
        }
        
        return $userData;
    }
    
    /**
     * Base64 URL encode
     */
    private function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Base64 URL decode
     */
    private function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
    
    /**
     * Get user password hash from database
     * This should be implemented with your actual database
     */
    private function getUserPasswordHash($email) {
        // TODO: Implement with Supabase integration
        // For now, return null to indicate no user found
        return null;
    }
    
    /**
     * Get user data from database
     * This should be implemented with your actual database
     */
    private function getUserData($email) {
        // TODO: Implement with Supabase integration
        return [
            'id' => null,
            'email' => $email,
            'role' => 'user'
        ];
    }
}

/**
 * Global auth instance
 */
function getAuth() {
    static $auth = null;
    if ($auth === null) {
        $auth = new AuthManager();
    }
    return $auth;
}

/**
 * Helper function to require authentication
 */
function requireAuth() {
    $headers = getallheaders();
    $auth = getAuth();
    return $auth->checkAuthentication($headers);
}

/**
 * Helper function to require admin authentication
 */
function requireAdmin() {
    $headers = getallheaders();
    $auth = getAuth();
    return $auth->requireAdmin($headers);
}
?>