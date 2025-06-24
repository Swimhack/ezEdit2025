<?php
/**
 * EzEdit FTP Error Codes
 * Defines standardized error codes and messages for FTP operations
 */

// Define secure access constant
defined('EZEDIT_SECURE_ACCESS') or die('Unauthorized access');

// FTP Connection Errors (1000-1099)
define('FTP_ERR_CONNECTION_FAILED', 1000);
define('FTP_ERR_LOGIN_FAILED', 1001);
define('FTP_ERR_PASSIVE_MODE_FAILED', 1002);
define('FTP_ERR_CONNECTION_TIMEOUT', 1003);
define('FTP_ERR_INVALID_CONNECTION_ID', 1004);
define('FTP_ERR_CONNECTION_CLOSED', 1005);

// FTP Directory Errors (1100-1199)
define('FTP_ERR_LIST_FAILED', 1100);
define('FTP_ERR_DIRECTORY_NOT_FOUND', 1101);
define('FTP_ERR_DIRECTORY_PERMISSION_DENIED', 1102);
define('FTP_ERR_DIRECTORY_CREATE_FAILED', 1103);
define('FTP_ERR_DIRECTORY_DELETE_FAILED', 1104);

// FTP File Errors (1200-1299)
define('FTP_ERR_FILE_NOT_FOUND', 1200);
define('FTP_ERR_FILE_PERMISSION_DENIED', 1201);
define('FTP_ERR_FILE_READ_FAILED', 1202);
define('FTP_ERR_FILE_WRITE_FAILED', 1203);
define('FTP_ERR_FILE_DELETE_FAILED', 1204);
define('FTP_ERR_FILE_ALREADY_EXISTS', 1205);
define('FTP_ERR_FILE_UPLOAD_FAILED', 1206);
define('FTP_ERR_FILE_DOWNLOAD_FAILED', 1207);
define('FTP_ERR_FILE_RENAME_FAILED', 1208);
define('FTP_ERR_TEMP_FILE_CREATION_FAILED', 1209);

// FTP Configuration Errors (1300-1399)
define('FTP_ERR_INVALID_CONFIG', 1300);
define('FTP_ERR_MISSING_HOST', 1301);
define('FTP_ERR_MISSING_USERNAME', 1302);
define('FTP_ERR_MISSING_PASSWORD', 1303);
define('FTP_ERR_INVALID_PORT', 1304);

// FTP Session Errors (1400-1499)
define('FTP_ERR_SESSION_EXPIRED', 1400);
define('FTP_ERR_SESSION_INVALID', 1401);
define('FTP_ERR_SESSION_CREATION_FAILED', 1402);

// FTP Security Errors (1500-1599)
define('FTP_ERR_AUTHENTICATION_REQUIRED', 1500);
define('FTP_ERR_PERMISSION_DENIED', 1501);
define('FTP_ERR_RATE_LIMIT_EXCEEDED', 1502);

// FTP General Errors (1900-1999)
define('FTP_ERR_UNKNOWN', 1900);
define('FTP_ERR_SERVER_ERROR', 1901);
define('FTP_ERR_OPERATION_TIMEOUT', 1902);
define('FTP_ERR_INVALID_PATH', 1903);

/**
 * Get error message for error code
 * @param int $code Error code
 * @return string Error message
 */
function ftp_get_error_message($code) {
    switch ($code) {
        // Connection errors
        case FTP_ERR_CONNECTION_FAILED:
            return 'Failed to connect to FTP server';
        case FTP_ERR_LOGIN_FAILED:
            return 'Invalid FTP credentials';
        case FTP_ERR_PASSIVE_MODE_FAILED:
            return 'Failed to set passive mode';
        case FTP_ERR_CONNECTION_TIMEOUT:
            return 'FTP connection timed out';
        case FTP_ERR_INVALID_CONNECTION_ID:
            return 'Invalid connection ID';
        case FTP_ERR_CONNECTION_CLOSED:
            return 'FTP connection closed';
            
        // Directory errors
        case FTP_ERR_LIST_FAILED:
            return 'Failed to list directory contents';
        case FTP_ERR_DIRECTORY_NOT_FOUND:
            return 'Directory not found';
        case FTP_ERR_DIRECTORY_PERMISSION_DENIED:
            return 'Permission denied to access directory';
        case FTP_ERR_DIRECTORY_CREATE_FAILED:
            return 'Failed to create directory';
        case FTP_ERR_DIRECTORY_DELETE_FAILED:
            return 'Failed to delete directory';
            
        // File errors
        case FTP_ERR_FILE_NOT_FOUND:
            return 'File not found';
        case FTP_ERR_FILE_PERMISSION_DENIED:
            return 'Permission denied to access file';
        case FTP_ERR_FILE_READ_FAILED:
            return 'Failed to read file';
        case FTP_ERR_FILE_WRITE_FAILED:
            return 'Failed to write to file';
        case FTP_ERR_FILE_DELETE_FAILED:
            return 'Failed to delete file';
        case FTP_ERR_FILE_ALREADY_EXISTS:
            return 'File already exists';
        case FTP_ERR_FILE_UPLOAD_FAILED:
            return 'Failed to upload file';
        case FTP_ERR_FILE_DOWNLOAD_FAILED:
            return 'Failed to download file';
        case FTP_ERR_FILE_RENAME_FAILED:
            return 'Failed to rename file';
        case FTP_ERR_TEMP_FILE_CREATION_FAILED:
            return 'Failed to create temporary file';
            
        // Configuration errors
        case FTP_ERR_INVALID_CONFIG:
            return 'Invalid FTP configuration';
        case FTP_ERR_MISSING_HOST:
            return 'FTP host not specified';
        case FTP_ERR_MISSING_USERNAME:
            return 'FTP username not specified';
        case FTP_ERR_MISSING_PASSWORD:
            return 'FTP password not specified';
        case FTP_ERR_INVALID_PORT:
            return 'Invalid FTP port';
            
        // Session errors
        case FTP_ERR_SESSION_EXPIRED:
            return 'FTP session expired';
        case FTP_ERR_SESSION_INVALID:
            return 'Invalid FTP session';
        case FTP_ERR_SESSION_CREATION_FAILED:
            return 'Failed to create FTP session';
            
        // Security errors
        case FTP_ERR_AUTHENTICATION_REQUIRED:
            return 'Authentication required';
        case FTP_ERR_PERMISSION_DENIED:
            return 'Permission denied';
        case FTP_ERR_RATE_LIMIT_EXCEEDED:
            return 'Rate limit exceeded';
            
        // General errors
        case FTP_ERR_UNKNOWN:
            return 'Unknown FTP error';
        case FTP_ERR_SERVER_ERROR:
            return 'FTP server error';
        case FTP_ERR_OPERATION_TIMEOUT:
            return 'FTP operation timed out';
        case FTP_ERR_INVALID_PATH:
            return 'Invalid path';
            
        default:
            return 'FTP error: ' . $code;
    }
}

/**
 * Create standardized error response
 * @param int $code Error code
 * @param string $details Additional error details (optional)
 * @return array Error response
 */
function ftp_error_response($code, $details = null) {
    $message = ftp_get_error_message($code);
    
    $response = [
        'success' => false,
        'error' => $message,
        'error_code' => $code,
        'timestamp' => time()
    ];
    
    if ($details !== null) {
        $response['details'] = $details;
    }
    
    return $response;
}
