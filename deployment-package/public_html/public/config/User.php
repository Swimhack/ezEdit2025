<?php
/**
 * EzEdit.co User Authentication Class
 */

require_once 'database.php';

class User {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Register a new user
     */
    public function register($email, $password, $name = '') {
        // Validate input
        if (!$this->isValidEmail($email)) {
            throw new Exception('Invalid email address');
        }
        
        if (strlen($password) < 6) {
            throw new Exception('Password must be at least 6 characters long');
        }
        
        // Check if user already exists
        $existing = $this->db->findOne('users', 'email = :email', ['email' => $email]);
        if ($existing) {
            throw new Exception('User with this email already exists');
        }
        
        // Create user
        $userData = [
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'name' => $name ?: $this->getNameFromEmail($email),
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        $userId = $this->db->insert('users', $userData);
        
        return [
            'success' => true,
            'user_id' => $userId,
            'message' => 'User registered successfully'
        ];
    }
    
    /**
     * Authenticate user login
     */
    public function login($email, $password, $rememberMe = false) {
        // Validate input
        if (!$this->isValidEmail($email)) {
            throw new Exception('Invalid email address');
        }
        
        if (empty($password)) {
            throw new Exception('Password is required');
        }
        
        // Find user
        $user = $this->db->findOne('users', 'email = :email AND is_active = 1', ['email' => $email]);
        if (!$user) {
            throw new Exception('Invalid email or password');
        }
        
        // Verify password
        if (!password_verify($password, $user['password_hash'])) {
            throw new Exception('Invalid email or password');
        }
        
        // Update last login
        $this->db->update('users', 
            ['last_login' => date('Y-m-d H:i:s')], 
            'id = :id', 
            ['id' => $user['id']]
        );
        
        // Create session
        $sessionToken = $this->createSession($user['id'], $rememberMe);
        
        return [
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name']
            ],
            'session_token' => $sessionToken
        ];
    }
    
    /**
     * Create user session
     */
    private function createSession($userId, $rememberMe = false) {
        $sessionToken = bin2hex(random_bytes(32));
        $expiresAt = $rememberMe ? 
            date('Y-m-d H:i:s', strtotime('+30 days')) : 
            date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        $sessionData = [
            'user_id' => $userId,
            'session_token' => $sessionToken,
            'expires_at' => $expiresAt,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        ];
        
        $this->db->insert('user_sessions', $sessionData);
        
        // Set session variables
        session_start();
        $_SESSION['user_logged_in'] = true;
        $_SESSION['user_id'] = $userId;
        $_SESSION['session_token'] = $sessionToken;
        
        // Set cookie if remember me
        if ($rememberMe) {
            setcookie('remember_token', $sessionToken, time() + (30 * 24 * 60 * 60), '/', '', true, true);
        }
        
        return $sessionToken;
    }
    
    /**
     * Validate session
     */
    public function validateSession($sessionToken = null) {
        session_start();
        
        // Get session token from session or parameter
        $token = $sessionToken ?: ($_SESSION['session_token'] ?? null);
        
        if (!$token) {
            return false;
        }
        
        // Check session in database
        $session = $this->db->findOne('user_sessions', 
            'session_token = :token AND expires_at > :now', 
            [
                'token' => $token, 
                'now' => date('Y-m-d H:i:s')
            ]
        );
        
        if (!$session) {
            $this->logout();
            return false;
        }
        
        // Get user data
        $user = $this->db->findOne('users', 'id = :id AND is_active = 1', ['id' => $session['user_id']]);
        if (!$user) {
            $this->logout();
            return false;
        }
        
        // Update session variables
        $_SESSION['user_logged_in'] = true;
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_name'] = $user['name'];
        
        return $user;
    }
    
    /**
     * Logout user
     */
    public function logout($sessionToken = null) {
        session_start();
        
        $token = $sessionToken ?: ($_SESSION['session_token'] ?? null);
        
        if ($token) {
            // Remove session from database
            $this->db->delete('user_sessions', 'session_token = :token', ['token' => $token]);
        }
        
        // Clear session
        session_unset();
        session_destroy();
        
        // Clear remember me cookie
        if (isset($_COOKIE['remember_token'])) {
            setcookie('remember_token', '', time() - 3600, '/', '', true, true);
        }
        
        return ['success' => true, 'message' => 'Logged out successfully'];
    }
    
    /**
     * Get current user
     */
    public function getCurrentUser() {
        return $this->validateSession();
    }
    
    /**
     * Check if user is logged in
     */
    public function isLoggedIn() {
        return $this->validateSession() !== false;
    }
    
    /**
     * Request password reset
     */
    public function requestPasswordReset($email) {
        $user = $this->db->findOne('users', 'email = :email AND is_active = 1', ['email' => $email]);
        if (!$user) {
            // Don't reveal if email exists for security
            return ['success' => true, 'message' => 'If the email exists, you will receive reset instructions'];
        }
        
        // Create reset token
        $token = bin2hex(random_bytes(32));
        $resetData = [
            'user_id' => $user['id'],
            'token' => $token,
            'expires_at' => date('Y-m-d H:i:s', strtotime('+1 hour'))
        ];
        
        $this->db->insert('password_resets', $resetData);
        
        // In a real application, you would send an email here
        // For demo purposes, just return the token
        return [
            'success' => true, 
            'message' => 'Password reset token created',
            'reset_token' => $token // Remove this in production
        ];
    }
    
    /**
     * Reset password with token
     */
    public function resetPassword($token, $newPassword) {
        if (strlen($newPassword) < 6) {
            throw new Exception('Password must be at least 6 characters long');
        }
        
        // Find valid reset token
        $reset = $this->db->findOne('password_resets', 
            'token = :token AND expires_at > :now AND used = 0',
            ['token' => $token, 'now' => date('Y-m-d H:i:s')]
        );
        
        if (!$reset) {
            throw new Exception('Invalid or expired reset token');
        }
        
        // Update password
        $this->db->update('users',
            ['password_hash' => password_hash($newPassword, PASSWORD_DEFAULT)],
            'id = :id',
            ['id' => $reset['user_id']]
        );
        
        // Mark token as used
        $this->db->update('password_resets',
            ['used' => 1],
            'id = :id',
            ['id' => $reset['id']]
        );
        
        return ['success' => true, 'message' => 'Password reset successfully'];
    }
    
    /**
     * Clean up expired sessions and reset tokens
     */
    public function cleanup() {
        $now = date('Y-m-d H:i:s');
        
        // Remove expired sessions
        $this->db->delete('user_sessions', 'expires_at < :now', ['now' => $now]);
        
        // Remove expired/used reset tokens older than 24 hours
        $yesterday = date('Y-m-d H:i:s', strtotime('-24 hours'));
        $this->db->delete('password_resets', 'created_at < :yesterday', ['yesterday' => $yesterday]);
    }
    
    /**
     * Validate email format
     */
    private function isValidEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Extract name from email
     */
    private function getNameFromEmail($email) {
        $parts = explode('@', $email);
        return ucfirst(str_replace(['.', '_', '-'], ' ', $parts[0]));
    }
    
    /**
     * Generate CSRF token
     */
    public function generateCSRFToken() {
        session_start();
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
    
    /**
     * Validate CSRF token
     */
    public function validateCSRFToken($token) {
        session_start();
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }
}
?>