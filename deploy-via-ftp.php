<?php
/**
 * FTP Deployment Script for EzEdit.co
 * Deploy to DigitalOcean server via FTP if SSH is not available
 */

// Configuration
$ftp_server = "159.65.224.175";
$ftp_port = 21;
$ftp_timeout = 90;
$remote_dir = "/var/www/html";
$local_dir = __DIR__ . "/public";

echo "EzEdit.co FTP Deployment Script\n";
echo "================================\n";
echo "Server: $ftp_server\n";
echo "Remote: $remote_dir\n";
echo "Local:  $local_dir\n\n";

// Get FTP credentials
echo "Enter FTP username: ";
$ftp_user = trim(fgets(STDIN));

echo "Enter FTP password: ";
system('stty -echo');
$ftp_pass = trim(fgets(STDIN));
system('stty echo');
echo "\n\n";

// Connect to FTP
echo "Connecting to FTP server...\n";
$conn = ftp_connect($ftp_server, $ftp_port, $ftp_timeout);

if (!$conn) {
    die("ERROR: Could not connect to FTP server\n");
}

// Login
echo "Logging in...\n";
if (!ftp_login($conn, $ftp_user, $ftp_pass)) {
    ftp_close($conn);
    die("ERROR: Could not login to FTP server\n");
}

// Set passive mode
ftp_pasv($conn, true);

// Change to remote directory
echo "Changing to remote directory...\n";
if (!ftp_chdir($conn, $remote_dir)) {
    echo "WARNING: Could not change to $remote_dir\n";
}

// Function to upload directory recursively
function uploadDirectory($conn, $local_dir, $remote_dir) {
    static $file_count = 0;
    
    // Create remote directory if it doesn't exist
    @ftp_mkdir($conn, $remote_dir);
    
    // Get list of files and directories
    $items = scandir($local_dir);
    
    foreach ($items as $item) {
        if ($item == '.' || $item == '..') continue;
        
        $local_path = $local_dir . '/' . $item;
        $remote_path = $remote_dir . '/' . $item;
        
        if (is_dir($local_path)) {
            // Recursively upload directory
            echo "Creating directory: $remote_path\n";
            uploadDirectory($conn, $local_path, $remote_path);
        } else {
            // Upload file
            echo "Uploading: $item... ";
            if (ftp_put($conn, $remote_path, $local_path, FTP_BINARY)) {
                echo "OK\n";
                $file_count++;
            } else {
                echo "FAILED\n";
            }
        }
    }
    
    return $file_count;
}

// Start deployment
echo "\nStarting deployment...\n";
echo "======================\n";

$start_time = time();
$file_count = uploadDirectory($conn, $local_dir, '.');
$end_time = time();

// Close connection
ftp_close($conn);

// Summary
echo "\n======================\n";
echo "DEPLOYMENT COMPLETE\n";
echo "======================\n";
echo "Files uploaded: $file_count\n";
echo "Time taken: " . ($end_time - $start_time) . " seconds\n";
echo "\nYour site is now live at:\n";
echo "http://$ftp_server/\n\n";

echo "Pages to verify:\n";
echo "- http://$ftp_server/index.php\n";
echo "- http://$ftp_server/dashboard.php\n";
echo "- http://$ftp_server/editor.php\n";
echo "- http://$ftp_server/auth/login.php\n";
echo "- http://$ftp_server/auth/register.php\n";