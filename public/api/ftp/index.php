<?php
/**
 * EzEdit FTP API Wrapper
 * Provides RESTful API endpoints that match the JavaScript ftp-service.js expectations
 */

// Enable CORS for JavaScript requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include the main FTP handler
require_once '../../ftp/ftp-handler.php';

// The FTP handler already processes all the requests we need
// This file just serves as a router to make the /api/ftp endpoint work
?>