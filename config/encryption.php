<?php
/**
 * Secure Encryption Service for EzEdit
 * Provides AES-256-GCM encryption for sensitive data
 */

class SecureEncryption {
    
    private $method = 'aes-256-gcm';
    private $key;
    
    public function __construct($encryptionKey = null) {
        if (!$encryptionKey) {
            $encryptionKey = $_ENV['ENCRYPTION_KEY'] ?? null;
        }
        
        if (!$encryptionKey) {
            throw new Exception('Encryption key not provided');
        }
        
        if (strlen($encryptionKey) < 32) {
            throw new Exception('Encryption key must be at least 32 characters');
        }
        
        $this->key = substr(hash('sha256', $encryptionKey), 0, 32);
    }
    
    /**
     * Encrypt sensitive data using AES-256-GCM
     * 
     * @param string $data Data to encrypt
     * @return array Encrypted data with IV and tag
     */
    public function encrypt($data) {
        if (empty($data)) {
            throw new InvalidArgumentException('Data cannot be empty');
        }
        
        $iv = random_bytes(16); // 128-bit IV for GCM
        $tag = '';
        
        $encrypted = openssl_encrypt(
            $data,
            $this->method,
            $this->key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            'ezedit' // Additional authenticated data
        );
        
        if ($encrypted === false) {
            throw new Exception('Encryption failed: ' . openssl_error_string());
        }
        
        return [
            'data' => base64_encode($encrypted),
            'iv' => base64_encode($iv),
            'tag' => base64_encode($tag),
            'method' => $this->method
        ];
    }
    
    /**
     * Decrypt data using AES-256-GCM
     * 
     * @param array $encryptedData Encrypted data array
     * @return string Decrypted data
     */
    public function decrypt($encryptedData) {
        if (!is_array($encryptedData) || !isset($encryptedData['data'], $encryptedData['iv'], $encryptedData['tag'])) {
            throw new InvalidArgumentException('Invalid encrypted data format');
        }
        
        $data = base64_decode($encryptedData['data']);
        $iv = base64_decode($encryptedData['iv']);
        $tag = base64_decode($encryptedData['tag']);
        
        if ($data === false || $iv === false || $tag === false) {
            throw new InvalidArgumentException('Invalid base64 encoded data');
        }
        
        $decrypted = openssl_decrypt(
            $data,
            $this->method,
            $this->key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            'ezedit' // Additional authenticated data
        );
        
        if ($decrypted === false) {
            throw new Exception('Decryption failed: ' . openssl_error_string());
        }
        
        return $decrypted;
    }
    
    /**
     * Encrypt FTP credentials for secure storage
     * 
     * @param array $credentials FTP credentials
     * @return string JSON encoded encrypted credentials
     */
    public function encryptFTPCredentials($credentials) {
        $jsonCredentials = json_encode($credentials);
        $encrypted = $this->encrypt($jsonCredentials);
        return json_encode($encrypted);
    }
    
    /**
     * Decrypt FTP credentials
     * 
     * @param string $encryptedCredentials JSON encoded encrypted credentials
     * @return array FTP credentials
     */
    public function decryptFTPCredentials($encryptedCredentials) {
        $encryptedData = json_decode($encryptedCredentials, true);
        if (!$encryptedData) {
            throw new InvalidArgumentException('Invalid encrypted credentials format');
        }
        
        $decrypted = $this->decrypt($encryptedData);
        $credentials = json_decode($decrypted, true);
        
        if (!$credentials) {
            throw new Exception('Failed to parse decrypted credentials');
        }
        
        return $credentials;
    }
    
    /**
     * Generate a secure random key
     * 
     * @param int $length Key length in bytes
     * @return string Hex encoded key
     */
    public static function generateSecureKey($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    /**
     * Hash password using Argon2
     * 
     * @param string $password Plain text password
     * @return string Hashed password
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_ARGON2ID, [
            'memory_cost' => 1024,
            'time_cost' => 2,
            'threads' => 2
        ]);
    }
    
    /**
     * Verify password against hash
     * 
     * @param string $password Plain text password
     * @param string $hash Hashed password
     * @return bool Verification result
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
}

/**
 * Global encryption instance
 */
function getEncryption() {
    static $encryption = null;
    if ($encryption === null) {
        $encryption = new SecureEncryption();
    }
    return $encryption;
}

/**
 * Legacy function replacements for secure encryption
 */
function encrypt_ftp_credential($value, $key = null) {
    try {
        $encryption = new SecureEncryption($key);
        $encrypted = $encryption->encrypt($value);
        return json_encode($encrypted);
    } catch (Exception $e) {
        error_log('Encryption error: ' . $e->getMessage());
        throw new Exception('Failed to encrypt credential');
    }
}

function decrypt_ftp_credential($encrypted, $key = null) {
    try {
        $encryption = new SecureEncryption($key);
        $encryptedData = json_decode($encrypted, true);
        return $encryption->decrypt($encryptedData);
    } catch (Exception $e) {
        error_log('Decryption error: ' . $e->getMessage());
        throw new Exception('Failed to decrypt credential');
    }
}
?>