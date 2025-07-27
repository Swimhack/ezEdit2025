<?php
/**
 * Background worker for EzEdit.co
 * Handles async tasks like file processing, email sending, etc.
 */

set_time_limit(0);
ini_set('memory_limit', '256M');

echo "🚀 EzEdit.co Worker Starting...\n";
echo "Environment: " . ($_ENV['APP_ENV'] ?? 'production') . "\n";
echo "Worker Timeout: " . ($_ENV['WORKER_TIMEOUT'] ?? '300') . "s\n";
echo "Process ID: " . getmypid() . "\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n\n";

$start_time = time();
$timeout = (int)($_ENV['WORKER_TIMEOUT'] ?? 300);

// Worker main loop
while (true) {
    // Check timeout
    if (time() - $start_time > $timeout) {
        echo "Worker timeout reached. Shutting down gracefully.\n";
        break;
    }
    
    // Process background tasks
    processQueue();
    
    // Sleep for a bit to avoid excessive CPU usage
    sleep(5);
}

echo "Worker shut down at " . date('Y-m-d H:i:s') . "\n";

/**
 * Process background task queue
 */
function processQueue() {
    // Example tasks that could be processed:
    
    // 1. File processing tasks
    processFileUploads();
    
    // 2. Email notifications
    processEmailQueue();
    
    // 3. Cleanup old sessions/temp files
    cleanupTempFiles();
    
    // 4. Generate reports or analytics
    processAnalytics();
}

/**
 * Process file upload tasks
 */
function processFileUploads() {
    $upload_dir = '/tmp/uploads';
    
    if (!is_dir($upload_dir)) {
        return;
    }
    
    $files = glob($upload_dir . '/*.pending');
    
    foreach ($files as $file) {
        echo "Processing upload: " . basename($file) . "\n";
        
        // Simulate file processing
        sleep(1);
        
        // Mark as processed
        rename($file, str_replace('.pending', '.processed', $file));
    }
}

/**
 * Process email notification queue
 */
function processEmailQueue() {
    $queue_file = '/tmp/email_queue.json';
    
    if (!file_exists($queue_file)) {
        return;
    }
    
    $emails = json_decode(file_get_contents($queue_file), true);
    
    if (!empty($emails)) {
        foreach ($emails as $email) {
            echo "Sending email to: " . $email['to'] . "\n";
            
            // Simulate email sending
            sleep(1);
        }
        
        // Clear queue
        unlink($queue_file);
    }
}

/**
 * Cleanup temporary files
 */
function cleanupTempFiles() {
    $temp_dirs = ['/tmp/sessions', '/tmp/uploads'];
    $max_age = 3600; // 1 hour
    
    foreach ($temp_dirs as $dir) {
        if (!is_dir($dir)) {
            continue;
        }
        
        $files = glob($dir . '/*');
        $cleaned = 0;
        
        foreach ($files as $file) {
            if (filemtime($file) < time() - $max_age) {
                unlink($file);
                $cleaned++;
            }
        }
        
        if ($cleaned > 0) {
            echo "Cleaned up $cleaned files from $dir\n";
        }
    }
}

/**
 * Process analytics data
 */
function processAnalytics() {
    static $last_analytics = 0;
    
    // Run analytics every 5 minutes
    if (time() - $last_analytics < 300) {
        return;
    }
    
    echo "Processing analytics data...\n";
    
    // Simulate analytics processing
    sleep(2);
    
    $last_analytics = time();
}
?>