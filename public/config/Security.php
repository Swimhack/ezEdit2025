<?php
/**
 * EzEdit.co Security Headers and Utilities
 */

require_once 'Environment.php';

class Security {
    
    /**
     * Set comprehensive security headers
     */
    public static function setSecurityHeaders() {
        // Prevent MIME type sniffing
        header('X-Content-Type-Options: nosniff');
        
        // Prevent clickjacking
        header('X-Frame-Options: DENY');
        
        // XSS Protection (legacy, but still useful)
        header('X-XSS-Protection: 1; mode=block');
        
        // Referrer Policy
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Force HTTPS
        if (!Environment::isDevelopment()) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        }
        
        // Content Security Policy
        self::setContentSecurityPolicy();
        
        // Permissions Policy (Feature Policy replacement)
        self::setPermissionsPolicy();
    }
    
    /**
     * Set Content Security Policy header
     */
    private static function setContentSecurityPolicy() {
        $isDev = Environment::isDevelopment();
        
        $csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com" . ($isDev ? " 'unsafe-eval'" : ""),
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https:",
            "connect-src 'self' https://api.anthropic.com",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "object-src 'none'"
        ];
        
        if ($isDev) {
            // More permissive CSP for development
            $csp[] = "upgrade-insecure-requests";
        }
        
        $cspHeader = implode('; ', $csp);
        header("Content-Security-Policy: $cspHeader");
    }
    
    /**
     * Set Permissions Policy header
     */
    private static function setPermissionsPolicy() {
        $policies = [
            'accelerometer=()',
            'camera=()',
            'geolocation=()',
            'gyroscope=()',
            'magnetometer=()',
            'microphone=()',
            'payment=()',
            'usb=()'
        ];
        
        $policyHeader = implode(', ', $policies);
        header("Permissions-Policy: $policyHeader");
    }
    
    /**
     * Sanitize output for display
     */
    public static function sanitizeOutput($data, $encoding = 'UTF-8') {
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeOutput'], $data);
        }
        
        return htmlspecialchars($data, ENT_QUOTES | ENT_HTML5, $encoding);
    }
    
    /**
     * Validate and sanitize input
     */
    public static function sanitizeInput($data, $type = 'string') {
        if (is_array($data)) {
            return array_map(function($item) use ($type) {
                return self::sanitizeInput($item, $type);
            }, $data);
        }
        
        // Remove null bytes
        $data = str_replace("\0", '', $data);
        
        switch ($type) {
            case 'email':
                return filter_var($data, FILTER_SANITIZE_EMAIL);
                
            case 'url':
                return filter_var($data, FILTER_SANITIZE_URL);
                
            case 'int':
                return filter_var($data, FILTER_SANITIZE_NUMBER_INT);
                
            case 'float':
                return filter_var($data, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
                
            case 'filename':
                // Remove directory traversal attempts and dangerous characters
                $data = basename($data);
                $data = preg_replace('/[^a-zA-Z0-9._-]/', '', $data);
                return substr($data, 0, 255);
                
            case 'string':
            default:
                return trim($data);
        }
    }
    
    /**
     * Validate email address
     */
    public static function isValidEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Validate URL
     */
    public static function isValidUrl($url) {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }
    
    /**
     * Generate secure random token
     */
    public static function generateToken($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    /**
     * Constant time string comparison
     */
    public static function compareStrings($str1, $str2) {
        return hash_equals($str1, $str2);
    }
    
    /**
     * Rate limiting check
     */
    public static function checkRateLimit($identifier, $maxRequests = 100, $windowSeconds = 3600) {
        $key = 'rate_limit_' . md5($identifier);
        $dataFile = __DIR__ . '/../data/rate_limits.json';
        
        // Ensure data directory exists
        $dataDir = dirname($dataFile);
        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0755, true);
        }
        
        // Load existing rate limit data
        $rateLimits = [];
        if (file_exists($dataFile)) {
            $rateLimitsJson = file_get_contents($dataFile);
            $rateLimits = json_decode($rateLimitsJson, true) ?: [];
        }
        
        $now = time();
        $windowStart = $now - $windowSeconds;
        
        // Clean old entries
        foreach ($rateLimits as $k => $v) {
            if ($v['time'] < $windowStart) {
                unset($rateLimits[$k]);
            }
        }
        
        // Count requests for this identifier
        $requests = array_filter($rateLimits, function($entry) use ($identifier, $windowStart) {
            return $entry['identifier'] === $identifier && $entry['time'] >= $windowStart;
        });
        
        if (count($requests) >= $maxRequests) {
            return false; // Rate limit exceeded
        }
        
        // Record this request
        $rateLimits[] = [
            'identifier' => $identifier,
            'time' => $now
        ];
        
        // Save updated rate limits
        file_put_contents($dataFile, json_encode($rateLimits), LOCK_EX);
        
        return true; // Request allowed
    }
    
    /**
     * Get client IP address
     */
    public static function getClientIP() {
        $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                // Handle comma-separated IPs (from proxies)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                // Validate IP
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
    
    /**
     * Log security events
     */
    public static function logSecurityEvent($event, $details = []) {
        $logEntry = [
            'timestamp' => date('c'),
            'event' => $event,
            'ip' => self::getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'details' => $details
        ];
        
        $logFile = __DIR__ . '/../data/security.log';
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Initialize security for a page
     */
    public static function initialize() {
        // Set security headers
        self::setSecurityHeaders();
        
        // Start secure session
        self::startSecureSession();
        
        // Check rate limiting for non-authenticated requests
        if (!isset($_SESSION['user_logged_in'])) {
            $clientIP = self::getClientIP();
            if (!self::checkRateLimit($clientIP, 200, 3600)) {
                http_response_code(429);
                header('Retry-After: 3600');
                die('Rate limit exceeded. Please try again later.');
            }
        }
    }
    
    /**
     * Start secure session
     */
    private static function startSecureSession() {
        if (session_status() === PHP_SESSION_NONE) {
            // Set secure session parameters
            ini_set('session.cookie_httponly', 1);
            ini_set('session.use_only_cookies', 1);
            ini_set('session.cookie_samesite', 'Strict');
            
            if (!Environment::isDevelopment()) {
                ini_set('session.cookie_secure', 1);
            }
            
            session_start();
            
            // Regenerate session ID periodically
            if (!isset($_SESSION['last_regeneration'])) {
                $_SESSION['last_regeneration'] = time();
            } elseif (time() - $_SESSION['last_regeneration'] > 300) {
                // Regenerate every 5 minutes
                session_regenerate_id(true);
                $_SESSION['last_regeneration'] = time();
            }
        }
    }
}
?>