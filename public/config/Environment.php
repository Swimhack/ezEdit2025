<?php
/**
 * EzEdit.co Environment Configuration Manager
 */

class Environment {
    private static $loaded = false;
    private static $config = [];
    
    /**
     * Load environment variables from .env file
     */
    public static function load($envFile = null) {
        if (self::$loaded) {
            return;
        }
        
        $envFile = $envFile ?: __DIR__ . '/../.env';
        
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            
            foreach ($lines as $line) {
                // Skip comments
                if (strpos(trim($line), '#') === 0) {
                    continue;
                }
                
                // Parse key=value pairs
                if (strpos($line, '=') !== false) {
                    list($key, $value) = explode('=', $line, 2);
                    $key = trim($key);
                    $value = trim($value);
                    
                    // Remove quotes if present
                    if ((strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) ||
                        (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1)) {
                        $value = substr($value, 1, -1);
                    }
                    
                    // Set environment variable if not already set
                    if (!isset($_ENV[$key])) {
                        $_ENV[$key] = $value;
                        putenv("$key=$value");
                    }
                    
                    self::$config[$key] = $value;
                }
            }
        }
        
        self::$loaded = true;
    }
    
    /**
     * Get environment variable with optional default
     */
    public static function get($key, $default = null) {
        self::load();
        
        // Check $_ENV first
        if (isset($_ENV[$key])) {
            return self::parseValue($_ENV[$key]);
        }
        
        // Check getenv()
        $value = getenv($key);
        if ($value !== false) {
            return self::parseValue($value);
        }
        
        // Check loaded config
        if (isset(self::$config[$key])) {
            return self::parseValue(self::$config[$key]);
        }
        
        return $default;
    }
    
    /**
     * Parse environment value (convert strings to appropriate types)
     */
    private static function parseValue($value) {
        if (is_string($value)) {
            // Convert boolean strings
            $lower = strtolower($value);
            if ($lower === 'true') return true;
            if ($lower === 'false') return false;
            if ($lower === 'null') return null;
            
            // Convert numeric strings
            if (is_numeric($value)) {
                return strpos($value, '.') !== false ? (float)$value : (int)$value;
            }
        }
        
        return $value;
    }
    
    /**
     * Get database configuration
     */
    public static function getDatabaseConfig() {
        return [
            'connection' => self::get('DB_CONNECTION', 'pgsql'),
            'host' => self::get('DB_HOST', 'localhost'),
            'port' => self::get('DB_PORT', 5432),
            'name' => self::get('DB_DATABASE', 'postgres'),
            'username' => self::get('DB_USERNAME', 'postgres'),
            'password' => self::get('DB_PASSWORD', ''),
            'url' => self::get('DATABASE_URL', '')
        ];
    }
    
    /**
     * Get security configuration
     */
    public static function getSecurityConfig() {
        return [
            'app_secret' => self::get('APP_SECRET_KEY', 'default-insecure-key-change-me'),
            'encryption_key' => self::get('ENCRYPTION_KEY', 'default-encryption-key-change-me'),
            'session_lifetime' => self::get('SESSION_LIFETIME', 7200),
            'remember_lifetime' => self::get('REMEMBER_ME_LIFETIME', 2592000)
        ];
    }
    
    /**
     * Get API configuration
     */
    public static function getAPIConfig() {
        return [
            'claude_api_key' => self::get('CLAUDE_API_KEY', ''),
            'claude_api_url' => self::get('CLAUDE_API_URL', 'https://api.anthropic.com/v1'),
            'supabase_url' => self::get('SUPABASE_URL', ''),
            'supabase_anon_key' => self::get('SUPABASE_ANON_KEY', ''),
            'supabase_service_role_key' => self::get('SUPABASE_SERVICE_ROLE_KEY', '')
        ];
    }
    
    /**
     * Get Supabase configuration
     */
    public static function getSupabaseConfig() {
        return [
            'url' => self::get('SUPABASE_URL', ''),
            'anon_key' => self::get('SUPABASE_ANON_KEY', ''),
            'service_role_key' => self::get('SUPABASE_SERVICE_ROLE_KEY', ''),
            'jwt_secret' => self::get('SUPABASE_JWT_SECRET', '')
        ];
    }
    
    /**
     * Get application configuration
     */
    public static function getAppConfig() {
        return [
            'env' => self::get('APP_ENV', 'production'),
            'debug' => self::get('APP_DEBUG', false),
            'url' => self::get('APP_URL', 'https://ezedit.co'),
            'max_file_size' => self::get('MAX_FILE_SIZE', 10485760),
            'max_files_per_user' => self::get('MAX_FILES_PER_USER', 1000)
        ];
    }
    
    /**
     * Check if running in development mode
     */
    public static function isDevelopment() {
        return self::get('APP_ENV', 'production') === 'development';
    }
    
    /**
     * Check if debug mode is enabled
     */
    public static function isDebug() {
        return self::get('APP_DEBUG', false) === true;
    }
}

// Auto-load environment variables
Environment::load();
?>