<?php
/**
 * EzEdit.co Demo Authentication Setup
 * This file sets up a demo session for testing purposes
 * WARNING: For development/testing only - not for production use
 */

session_start();

// Set up demo authentication
$_SESSION['user_id'] = 1;
$_SESSION['authenticated'] = true;
$_SESSION['user_email'] = 'demo@ezedit.co';
$_SESSION['last_regeneration'] = time();

// Create demo user in database if needed
require_once '../config/database.php';

try {
    // Check if demo user exists
    $pdo = SecureDatabase::init();
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute(['demo@ezedit.co']);
    $user = $stmt->fetch();
    
    if (!$user) {
        // Create demo user
        $userId = SecureDatabase::createUser('demo@ezedit.co', 'DemoPassword123!', 'Demo User');
        $_SESSION['user_id'] = $userId;
    } else {
        $_SESSION['user_id'] = $user['id'];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Demo authentication set up successfully',
        'user_id' => $_SESSION['user_id'],
        'session_id' => session_id()
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Failed to set up demo authentication: ' . $e->getMessage()
    ]);
}
?>