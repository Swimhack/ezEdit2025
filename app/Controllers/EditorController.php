<?php
/**
 * Editor Controller
 * Handles code editing operations for the ezEdit application
 */

namespace App\Controllers;

class EditorController {
    /**
     * Get file content for editing
     * 
     * @param string $conn_id FTP connection ID
     * @param string $path File path
     * @return array File content or error
     */
    public function getFileContent($conn_id, $path) {
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
        $result = @ftp_get($conn, $temp_path, $path, FTP_BINARY);
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
        $info = pathinfo($path);
        $extension = isset($info['extension']) ? $info['extension'] : '';
        
        // Store original content in session for diff
        $_SESSION['file_originals'][$conn_id][$path] = $content;
        
        return [
            'success' => true,
            'path' => $path,
            'filename' => $info['basename'],
            'extension' => $extension,
            'content' => $content,
            'size' => strlen($content)
        ];
    }
    
    /**
     * Save file content
     * 
     * @param string $conn_id FTP connection ID
     * @param string $path File path
     * @param string $content File content
     * @param bool $checkPlan Whether to check user plan before saving
     * @return array Save status
     */
    public function saveFileContent($conn_id, $path, $content, $checkPlan = true) {
        // Check if user has permission to save (based on plan)
        if ($checkPlan && !$this->canUserSave()) {
            return [
                'success' => false,
                'error' => 'Your current plan does not allow saving files. Please upgrade to Pro.',
                'error_code' => 'PLAN_ERR_NO_SAVE_PERMISSION',
                'upgrade_required' => true
            ];
        }
        
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
        
        // Write content to temp file
        file_put_contents($temp_path, $content);
        
        // Upload the file
        $result = @ftp_put($conn, $path, $temp_path, FTP_BINARY);
        fclose($temp);
        
        if (!$result) {
            return [
                'success' => false,
                'error' => 'Failed to save file',
                'error_code' => 'FTP_ERR_SAVE_FAILED'
            ];
        }
        
        // Update original content in session
        $_SESSION['file_originals'][$conn_id][$path] = $content;
        
        return [
            'success' => true,
            'path' => $path,
            'message' => 'File saved successfully'
        ];
    }
    
    /**
     * Generate diff between original and modified content
     * 
     * @param string $conn_id FTP connection ID
     * @param string $path File path
     * @param string $modified_content Modified file content
     * @return array Diff result
     */
    public function generateDiff($conn_id, $path, $modified_content) {
        // Check if original content exists
        if (!isset($_SESSION['file_originals'][$conn_id][$path])) {
            return [
                'success' => false,
                'error' => 'Original file content not found',
                'error_code' => 'DIFF_ERR_NO_ORIGINAL'
            ];
        }
        
        $original = $_SESSION['file_originals'][$conn_id][$path];
        
        // Generate line-by-line diff
        $diff = $this->computeLineDiff($original, $modified_content);
        
        return [
            'success' => true,
            'path' => $path,
            'diff' => $diff
        ];
    }
    
    /**
     * Apply AI-suggested patch to content
     * 
     * @param string $original_content Original content
     * @param string $patch Patch to apply
     * @return array Result with patched content
     */
    public function applyPatch($original_content, $patch) {
        // Simple patch application (in a real implementation, use a proper diff/patch library)
        // This is a placeholder implementation
        $patched_content = $original_content . "\n" . $patch;
        
        return [
            'success' => true,
            'patched_content' => $patched_content
        ];
    }
    
    /**
     * Check if user can save files based on their plan
     * 
     * @return bool Whether user can save
     */
    private function canUserSave() {
        // This is a placeholder - in a real app, check user's plan from database
        // For now, we'll assume all authenticated users can save
        // In production, check Supabase for user's plan
        
        // Example implementation:
        // $user_id = $_SESSION['user_id'];
        // $plan = getUserPlan($user_id);
        // return $plan === 'pro' || $plan === 'enterprise';
        
        return true;
    }
    
    /**
     * Compute line-by-line diff between two strings
     * 
     * @param string $old Original content
     * @param string $new Modified content
     * @return array Diff information
     */
    private function computeLineDiff($old, $new) {
        // Split into lines
        $old_lines = explode("\n", $old);
        $new_lines = explode("\n", $new);
        
        // Simple diff algorithm (in production, use a proper diff library)
        $changes = [];
        $max_lines = max(count($old_lines), count($new_lines));
        
        for ($i = 0; $i < $max_lines; $i++) {
            $old_line = isset($old_lines[$i]) ? $old_lines[$i] : null;
            $new_line = isset($new_lines[$i]) ? $new_lines[$i] : null;
            
            if ($old_line !== $new_line) {
                $changes[] = [
                    'line' => $i + 1,
                    'old' => $old_line,
                    'new' => $new_line,
                    'type' => $old_line === null ? 'add' : ($new_line === null ? 'remove' : 'change')
                ];
            }
        }
        
        return [
            'changes' => $changes,
            'total_changes' => count($changes)
        ];
    }
}
