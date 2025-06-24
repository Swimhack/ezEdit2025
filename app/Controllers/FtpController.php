<?php
/**
 * FTP Controller
 * Handles all FTP-related operations
 */

namespace App\Controllers;

class FtpController {
    /**
     * Connect to an FTP server
     * 
     * @param array $config FTP connection configuration
     * @return array Response with connection status
     */
    public function connect($config) {
        // Extract FTP configuration
        $host = isset($config['host']) ? $config['host'] : '';
        $port = isset($config['port']) ? (int)$config['port'] : 21;
        $username = isset($config['username']) ? $config['username'] : '';
        $password = isset($config['password']) ? $config['password'] : '';
        $passive = isset($config['passive']) ? (bool)$config['passive'] : true;
        
        // Validate required fields
        if (empty($host) || empty($username) || empty($password)) {
            return [
                'success' => false,
                'error' => 'Missing required FTP connection parameters',
                'error_code' => 'FTP_ERR_MISSING_PARAMS'
            ];
        }
        
        // Attempt FTP connection
        $conn = @ftp_connect($host, $port);
        if (!$conn) {
            return [
                'success' => false,
                'error' => 'Failed to connect to FTP server',
                'error_code' => 'FTP_ERR_CONNECTION_FAILED'
            ];
        }
        
        // Attempt login
        $login_result = @ftp_login($conn, $username, $password);
        if (!$login_result) {
            @ftp_close($conn);
            return [
                'success' => false,
                'error' => 'FTP login failed. Check credentials and try again.',
                'error_code' => 'FTP_ERR_LOGIN_FAILED'
            ];
        }
        
        // Set passive mode if requested
        if ($passive) {
            @ftp_pasv($conn, true);
        }
        
        // Generate a unique connection ID
        $conn_id = uniqid('ftp_', true);
        
        // Store connection in session
        $_SESSION['ftp_connections'][$conn_id] = $conn;
        $_SESSION['ftp_connection_times'][$conn_id] = time();
        
        return [
            'success' => true,
            'connection_id' => $conn_id,
            'message' => 'Successfully connected to FTP server'
        ];
    }
    
    /**
     * List directory contents
     * 
     * @param string $conn_id FTP connection ID
     * @param string $path Directory path to list
     * @return array Directory listing or error
     */
    public function listDirectory($conn_id, $path = '/') {
        // Check if connection exists
        if (!isset($_SESSION['ftp_connections'][$conn_id])) {
            return [
                'success' => false,
                'error' => 'Invalid or expired FTP connection',
                'error_code' => 'FTP_ERR_INVALID_CONNECTION'
            ];
        }
        
        $conn = $_SESSION['ftp_connections'][$conn_id];
        
        // Update connection timestamp
        $_SESSION['ftp_connection_times'][$conn_id] = time();
        
        // Get raw listing
        $list = @ftp_rawlist($conn, $path);
        if ($list === false) {
            return [
                'success' => false,
                'error' => 'Failed to list directory contents',
                'error_code' => 'FTP_ERR_LIST_FAILED'
            ];
        }
        
        // Parse the listing
        $items = [];
        foreach ($list as $item) {
            $parsed = $this->parseListItem($item);
            if ($parsed) {
                $items[] = $parsed;
            }
        }
        
        return [
            'success' => true,
            'path' => $path,
            'items' => $items
        ];
    }
    
    /**
     * Download a file from FTP server
     * 
     * @param string $conn_id FTP connection ID
     * @param string $remote_path Remote file path
     * @return array File content or error
     */
    public function downloadFile($conn_id, $remote_path) {
        // Check if connection exists
        if (!isset($_SESSION['ftp_connections'][$conn_id])) {
            return [
                'success' => false,
                'error' => 'Invalid or expired FTP connection',
                'error_code' => 'FTP_ERR_INVALID_CONNECTION'
            ];
        }
        
        $conn = $_SESSION['ftp_connections'][$conn_id];
        
        // Update connection timestamp
        $_SESSION['ftp_connection_times'][$conn_id] = time();
        
        // Create a temporary file
        $temp = tmpfile();
        $temp_path = stream_get_meta_data($temp)['uri'];
        
        // Download the file
        $result = @ftp_get($conn, $temp_path, $remote_path, FTP_BINARY);
        if (!$result) {
            fclose($temp);
            return [
                'success' => false,
                'error' => 'Failed to download file',
                'error_code' => 'FTP_ERR_DOWNLOAD_FAILED'
            ];
        }
        
        // Read the file content
        $content = file_get_contents($temp_path);
        fclose($temp);
        
        // Get file info
        $info = pathinfo($remote_path);
        $extension = isset($info['extension']) ? $info['extension'] : '';
        
        return [
            'success' => true,
            'path' => $remote_path,
            'filename' => $info['basename'],
            'extension' => $extension,
            'content' => base64_encode($content),
            'size' => strlen($content)
        ];
    }
    
    /**
     * Upload a file to FTP server
     * 
     * @param string $conn_id FTP connection ID
     * @param string $remote_path Remote file path
     * @param string $content Base64 encoded file content
     * @return array Upload status
     */
    public function uploadFile($conn_id, $remote_path, $content) {
        // Check if connection exists
        if (!isset($_SESSION['ftp_connections'][$conn_id])) {
            return [
                'success' => false,
                'error' => 'Invalid or expired FTP connection',
                'error_code' => 'FTP_ERR_INVALID_CONNECTION'
            ];
        }
        
        $conn = $_SESSION['ftp_connections'][$conn_id];
        
        // Update connection timestamp
        $_SESSION['ftp_connection_times'][$conn_id] = time();
        
        // Decode content
        $decoded = base64_decode($content);
        if ($decoded === false) {
            return [
                'success' => false,
                'error' => 'Invalid file content encoding',
                'error_code' => 'FTP_ERR_INVALID_CONTENT'
            ];
        }
        
        // Create a temporary file
        $temp = tmpfile();
        $temp_path = stream_get_meta_data($temp)['uri'];
        
        // Write content to temp file
        file_put_contents($temp_path, $decoded);
        
        // Upload the file
        $result = @ftp_put($conn, $remote_path, $temp_path, FTP_BINARY);
        fclose($temp);
        
        if (!$result) {
            return [
                'success' => false,
                'error' => 'Failed to upload file',
                'error_code' => 'FTP_ERR_UPLOAD_FAILED'
            ];
        }
        
        return [
            'success' => true,
            'path' => $remote_path,
            'message' => 'File uploaded successfully'
        ];
    }
    
    /**
     * Parse a raw FTP list item
     * 
     * @param string $item Raw list item
     * @return array|null Parsed item or null if parsing failed
     */
    private function parseListItem($item) {
        // Unix-style listing
        if (preg_match('/^([drwx-]+)\s+(\d+)\s+(\w+)\s+(\w+)\s+(\d+)\s+(\w{3}\s+\d{1,2})\s+(\d{2}:?\d{2})\s+(.+)$/', $item, $matches)) {
            $perms = $matches[1];
            $size = (int)$matches[5];
            $date = $matches[6] . ' ' . $matches[7];
            $name = $matches[8];
            $isDir = $perms[0] === 'd';
            
            return [
                'name' => $name,
                'is_dir' => $isDir,
                'size' => $size,
                'date' => $date,
                'permissions' => $perms
            ];
        }
        
        // Windows-style listing
        if (preg_match('/^(\d{2}-\d{2}-\d{2}\s+\d{2}:\d{2}[AP]M)\s+(<DIR>|\d+)\s+(.+)$/', $item, $matches)) {
            $date = $matches[1];
            $size = $matches[2] === '<DIR>' ? 0 : (int)$matches[2];
            $name = $matches[3];
            $isDir = $matches[2] === '<DIR>';
            
            return [
                'name' => $name,
                'is_dir' => $isDir,
                'size' => $size,
                'date' => $date,
                'permissions' => $isDir ? 'd---------' : '----------'
            ];
        }
        
        return null;
    }
}
