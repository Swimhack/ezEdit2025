<?php
/**
 * File Explorer Controller
 * Handles file operations for the ezEdit application
 */

namespace App\Controllers;

class FileExplorerController {
    /**
     * Create a new file
     * 
     * @param string $conn_id FTP connection ID
     * @param string $path File path
     * @param string $content File content (base64 encoded)
     * @return array Creation status
     */
    public function createFile($conn_id, $path, $content = '') {
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
        
        // Write content to temp file if provided
        if (!empty($content)) {
            $decoded = base64_decode($content);
            file_put_contents($temp_path, $decoded);
        }
        
        // Upload the file
        $result = @ftp_put($conn, $path, $temp_path, FTP_BINARY);
        fclose($temp);
        
        if (!$result) {
            return [
                'success' => false,
                'error' => 'Failed to create file',
                'error_code' => 'FTP_ERR_CREATE_FAILED'
            ];
        }
        
        return [
            'success' => true,
            'path' => $path,
            'message' => 'File created successfully'
        ];
    }
    
    /**
     * Create a new directory
     * 
     * @param string $conn_id FTP connection ID
     * @param string $path Directory path
     * @return array Creation status
     */
    public function createDirectory($conn_id, $path) {
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
        
        // Create directory
        $result = @ftp_mkdir($conn, $path);
        
        if (!$result) {
            return [
                'success' => false,
                'error' => 'Failed to create directory',
                'error_code' => 'FTP_ERR_MKDIR_FAILED'
            ];
        }
        
        return [
            'success' => true,
            'path' => $path,
            'message' => 'Directory created successfully'
        ];
    }
    
    /**
     * Rename a file or directory
     * 
     * @param string $conn_id FTP connection ID
     * @param string $old_path Old path
     * @param string $new_path New path
     * @return array Rename status
     */
    public function rename($conn_id, $old_path, $new_path) {
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
        
        // Rename file or directory
        $result = @ftp_rename($conn, $old_path, $new_path);
        
        if (!$result) {
            return [
                'success' => false,
                'error' => 'Failed to rename item',
                'error_code' => 'FTP_ERR_RENAME_FAILED'
            ];
        }
        
        return [
            'success' => true,
            'old_path' => $old_path,
            'new_path' => $new_path,
            'message' => 'Item renamed successfully'
        ];
    }
    
    /**
     * Delete a file
     * 
     * @param string $conn_id FTP connection ID
     * @param string $path File path
     * @return array Deletion status
     */
    public function deleteFile($conn_id, $path) {
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
        
        // Delete file
        $result = @ftp_delete($conn, $path);
        
        if (!$result) {
            return [
                'success' => false,
                'error' => 'Failed to delete file',
                'error_code' => 'FTP_ERR_DELETE_FAILED'
            ];
        }
        
        return [
            'success' => true,
            'path' => $path,
            'message' => 'File deleted successfully'
        ];
    }
    
    /**
     * Delete a directory
     * 
     * @param string $conn_id FTP connection ID
     * @param string $path Directory path
     * @return array Deletion status
     */
    public function deleteDirectory($conn_id, $path) {
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
        
        // Delete directory
        $result = @ftp_rmdir($conn, $path);
        
        if (!$result) {
            return [
                'success' => false,
                'error' => 'Failed to delete directory',
                'error_code' => 'FTP_ERR_RMDIR_FAILED'
            ];
        }
        
        return [
            'success' => true,
            'path' => $path,
            'message' => 'Directory deleted successfully'
        ];
    }
    
    /**
     * Get file information
     * 
     * @param string $conn_id FTP connection ID
     * @param string $path File path
     * @return array File information
     */
    public function getFileInfo($conn_id, $path) {
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
        
        // Get file size
        $size = @ftp_size($conn, $path);
        
        // Get file modification time
        $mdtm = @ftp_mdtm($conn, $path);
        
        return [
            'success' => true,
            'path' => $path,
            'size' => $size,
            'modified' => $mdtm > 0 ? date('Y-m-d H:i:s', $mdtm) : null,
            'filename' => basename($path)
        ];
    }
}
