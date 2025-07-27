<?php
/**
 * EzEdit.co Database Connection Test
 * Test script to verify Supabase PostgreSQL connection
 */

// Set error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'public/config/bootstrap.php';
require_once 'public/config/database.php';

echo "<h1>EzEdit.co Database Connection Test</h1>\n";

try {
    echo "<h2>Environment Variables:</h2>\n";
    $envVars = [
        'DB_CONNECTION' => Environment::get('DB_CONNECTION'),
        'DB_HOST' => Environment::get('DB_HOST'),
        'DB_PORT' => Environment::get('DB_PORT'),
        'DB_DATABASE' => Environment::get('DB_DATABASE'),
        'DB_USERNAME' => Environment::get('DB_USERNAME'),
        'DB_PASSWORD' => Environment::get('DB_PASSWORD') ? '***HIDDEN***' : 'NOT SET',
        'SUPABASE_URL' => Environment::get('SUPABASE_URL')
    ];
    
    echo "<ul>\n";
    foreach ($envVars as $key => $value) {
        echo "<li><strong>$key:</strong> $value</li>\n";
    }
    echo "</ul>\n";
    
    echo "<h2>Database Connection Test:</h2>\n";
    
    // Test database connection
    $db = Database::getInstance();
    $connection = $db->getConnection();
    
    if ($connection) {
        echo "<p style='color: green;'>✅ Database connection successful!</p>\n";
        
        // Test basic query
        $stmt = $connection->query("SELECT version()");
        $version = $stmt->fetchColumn();
        echo "<p><strong>Database Version:</strong> $version</p>\n";
        
        // Test table creation
        echo "<h3>Testing Table Creation:</h3>\n";
        try {
            // Check if users table exists
            $stmt = $connection->query("SELECT COUNT(*) FROM users");
            echo "<p style='color: green;'>✅ Users table exists and is accessible</p>\n";
            
            $stmt = $connection->query("SELECT COUNT(*) FROM ftp_connections");
            echo "<p style='color: green;'>✅ FTP connections table exists and is accessible</p>\n";
            
            $stmt = $connection->query("SELECT COUNT(*) FROM user_sessions");
            echo "<p style='color: green;'>✅ User sessions table exists and is accessible</p>\n";
            
            $stmt = $connection->query("SELECT COUNT(*) FROM audit_logs");
            echo "<p style='color: green;'>✅ Audit logs table exists and is accessible</p>\n";
            
        } catch (PDOException $e) {
            echo "<p style='color: orange;'>⚠️ Table access issue: " . $e->getMessage() . "</p>\n";
        }
        
        // Test basic database operations
        echo "<h3>Testing Database Operations:</h3>\n";
        try {
            // Test user creation (if no users exist)
            $userCount = $connection->query("SELECT COUNT(*) FROM users")->fetchColumn();
            echo "<p><strong>Current user count:</strong> $userCount</p>\n";
            
            if ($userCount == 0) {
                echo "<p>Creating test user...</p>\n";
                $testUserId = $db->insert('users', [
                    'email' => 'test@ezedit.co',
                    'password_hash' => password_hash('test123', PASSWORD_DEFAULT),
                    'name' => 'Test User',
                    'email_verified' => true,
                    'is_active' => true
                ]);
                echo "<p style='color: green;'>✅ Test user created with ID: $testUserId</p>\n";
            }
            
        } catch (Exception $e) {
            echo "<p style='color: red;'>❌ Database operation failed: " . $e->getMessage() . "</p>\n";
        }
        
    } else {
        echo "<p style='color: red;'>❌ Database connection failed!</p>\n";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>\n";
    echo "<p><strong>Stack trace:</strong></p>\n";
    echo "<pre>" . $e->getTraceAsString() . "</pre>\n";
}

echo "<h2>Next Steps:</h2>\n";
echo "<ol>\n";
echo "<li>Ensure your .env file has the correct Supabase credentials</li>\n";
echo "<li>Replace [YOUR-PASSWORD] with your actual database password</li>\n";
echo "<li>Add your Supabase anon and service role keys</li>\n";
echo "<li>Test the connection again</li>\n";
echo "</ol>\n";

echo "<p><a href='public/dashboard.html'>Go to Dashboard</a> | <a href='public/index.html'>Go to Home</a></p>\n";
?>