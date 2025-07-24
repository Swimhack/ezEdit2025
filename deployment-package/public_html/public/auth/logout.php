<?php
/**
 * EzEdit.co - Logout Handler with Real Authentication
 */

require_once '../config/User.php';

$user = new User();
$user->logout();

// Redirect to login page with logout message
header('Location: login.php?message=logged_out');
exit;