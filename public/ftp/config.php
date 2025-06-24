<?php
/**
 * EzEdit FTP Configuration
 * Stores FTP connection credentials and settings
 */

// Prevent direct access to this file
if (!defined('EZEDIT_SECURE_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit('Direct access to this file is forbidden.');
}

// Default demo FTP credentials
$default_ftp_config = [
    'host' => 'ftp.test.rebex.net',
    'port' => 21,
    'username' => 'demo',
    'password' => 'password',
    'passive' => true,
    'timeout' => 30,
    'ssl' => false
];

/**
 * Get FTP configuration for a specific site
 * 
 * @param int $site_id Site ID from database
 * @return array FTP configuration
 */
function get_ftp_config($site_id = null) {
    global $default_ftp_config;
    
    // In a real implementation, we would fetch this from a database
    // based on the site_id and user authentication
    
    // For now, just return the demo FTP config
    return $default_ftp_config;
}

/**
 * Encrypt FTP credentials for secure storage
 * 
 * @param string $value Value to encrypt
 * @param string $key Encryption key
 * @return string Encrypted value
 */
function encrypt_ftp_credential($value, $key) {
    // This is a placeholder for actual encryption
    // In production, use a proper encryption library
    
    // Simple XOR encryption for demonstration purposes only
    // DO NOT USE THIS IN PRODUCTION
    $result = '';
    for($i = 0; $i < strlen($value); $i++) {
        $result .= chr(ord($value[$i]) ^ ord($key[$i % strlen($key)]));
    }
    return base64_encode($result);
}

/**
 * Decrypt FTP credentials
 * 
 * @param string $encrypted Encrypted value
 * @param string $key Encryption key
 * @return string Decrypted value
 */
function decrypt_ftp_credential($encrypted, $key) {
    // This is a placeholder for actual decryption
    // In production, use a proper decryption library
    
    // Simple XOR decryption for demonstration purposes only
    // DO NOT USE THIS IN PRODUCTION
    $encrypted = base64_decode($encrypted);
    $result = '';
    for($i = 0; $i < strlen($encrypted); $i++) {
        $result .= chr(ord($encrypted[$i]) ^ ord($key[$i % strlen($key)]));
    }
    return $result;
}
