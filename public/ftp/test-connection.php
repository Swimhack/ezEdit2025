<?php
/**
 * EzEdit FTP Connection Test
 * Tests FTP connection to the demo server
 */

// Start session for storing FTP connections
session_start();

// Define secure access constant
define('EZEDIT_SECURE_ACCESS', true);

// Include configuration
require_once 'config.php';

// Set headers for JSON response
header('Content-Type: application/json');

// Test connection function
function test_ftp_connection($host, $port, $username, $password, $passive = true) {
    try {
        // Connect to FTP server
        $conn = @ftp_connect($host, $port, 30);
        if (!$conn) {
            return [
                'success' => false,
                'error' => 'Could not connect to FTP server'
            ];
        }
        
        // Login with credentials
        if (!@ftp_login($conn, $username, $password)) {
            ftp_close($conn);
            return [
                'success' => false,
                'error' => 'Invalid FTP credentials'
            ];
        }
        
        // Set passive mode if needed
        if ($passive) {
            ftp_pasv($conn, true);
        }
        
        // Try to list the root directory to verify connection
        $list = @ftp_nlist($conn, '/');
        if ($list === false) {
            ftp_close($conn);
            return [
                'success' => false,
                'error' => 'Connected but unable to list directory'
            ];
        }
        
        // Close connection
        ftp_close($conn);
        
        return [
            'success' => true,
            'message' => 'Successfully connected to FTP server',
            'files_found' => count($list)
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'FTP connection error: ' . $e->getMessage()
        ];
    }
}

// Get test parameters
$host = isset($_GET['host']) ? $_GET['host'] : 'ftp.test.rebex.net';
$port = isset($_GET['port']) ? intval($_GET['port']) : 21;
$username = isset($_GET['username']) ? $_GET['username'] : 'demo';
$password = isset($_GET['password']) ? $_GET['password'] : 'password';
$passive = isset($_GET['passive']) ? ($_GET['passive'] === 'true') : true;

// Test the connection
$result = test_ftp_connection($host, $port, $username, $password, $passive);

// Output the result
echo json_encode($result);
