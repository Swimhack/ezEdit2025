<?php
/**
 * EzEdit.co AI Assistant API
 * Real Claude API Integration for Code Analysis and Assistance
 */

require_once '../config/bootstrap.php';
require_once '../config/User.php';

// Security headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('X-Content-Type-Options: nosniff');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Check authentication
$user = new User();
if (!$user->isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authentication required']);
    exit();
}

// Get request data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit();
}

// Validate required fields
$message = $data['message'] ?? '';
$code = $data['code'] ?? '';
$language = $data['language'] ?? 'plaintext';
$filename = $data['filename'] ?? '';
$action = $data['action'] ?? 'chat';

if (empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Message is required']);
    exit();
}

try {
    $response = processClaudeRequest($message, $code, $language, $filename, $action);
    echo json_encode($response);
} catch (Exception $e) {
    error_log('Claude API Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'AI service temporarily unavailable']);
}

/**
 * Process request using real Claude API
 */
function processClaudeRequest($message, $code = '', $language = 'plaintext', $filename = '', $action = 'chat') {
    $apiConfig = Environment::getAPIConfig();
    $claudeApiKey = $apiConfig['claude_api_key'];
    
    if (empty($claudeApiKey)) {
        // Fallback to mock responses if no API key
        return processLocalAI($message, $code, $language, $filename, $action);
    }
    
    // Build context for Claude
    $context = buildClaudeContext($code, $language, $filename, $action);
    $prompt = $context . "\n\nUser: " . $message;
    
    // Call Claude API
    $response = callClaudeAPI($claudeApiKey, $prompt, $action);
    
    return [
        'success' => true,
        'response' => $response['content'],
        'action' => $action,
        'filename' => $filename,
        'language' => $language,
        'timestamp' => date('c')
    ];
}

/**
 * Call Claude API
 */
function callClaudeAPI($apiKey, $prompt, $action = 'chat') {
    $apiConfig = Environment::getAPIConfig();
    $url = $apiConfig['claude_api_url'] . '/messages';
    
    $payload = [
        'model' => 'claude-3-sonnet-20240229',
        'max_tokens' => 4000,
        'messages' => [
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ]
    ];
    
    $headers = [
        'Content-Type: application/json',
        'x-api-key: ' . $apiKey,
        'anthropic-version: 2023-06-01'
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("CURL Error: $error");
    }
    
    if ($httpCode !== 200) {
        throw new Exception("Claude API Error: HTTP $httpCode");
    }
    
    $data = json_decode($response, true);
    if (!$data || !isset($data['content'][0]['text'])) {
        throw new Exception("Invalid API response");
    }
    
    return ['content' => $data['content'][0]['text']];
}

/**
 * Build context for Claude based on code and action
 */
function buildClaudeContext($code, $language, $filename, $action) {
    $context = "You are Claude Code, an AI assistant specialized in helping developers edit and improve code. ";
    
    switch ($action) {
        case 'explain':
            $context .= "Please explain what this code does in a clear and concise way.";
            break;
        case 'optimize':
            $context .= "Please analyze this code and suggest optimizations for better performance, readability, or maintainability.";
            break;
        case 'debug':
            $context .= "Please analyze this code for potential bugs, errors, or issues and suggest fixes.";
            break;
        case 'comment':
            $context .= "Please add helpful comments to this code to make it more readable and maintainable.";
            break;
        case 'test':
            $context .= "Please create unit tests for this code that cover the main functionality and edge cases.";
            break;
        case 'refactor':
            $context .= "Please refactor this code to improve its structure, readability, and maintainability while preserving functionality.";
            break;
        default:
            $context .= "Please help with this code-related question or task.";
    }
    
    if (!empty($code)) {
        $context .= "\n\nHere's the code";
        if (!empty($filename)) {
            $context .= " from file '$filename'";
        }
        if (!empty($language)) {
            $context .= " (language: $language)";
        }
        $context .= ":\n\n```$language\n$code\n```";
    }
    
    return $context;
}

/**
 * Fallback local AI processing when no Claude API key
 */
function processLocalAI($message, $code, $language, $filename, $action) {
    // Simple pattern matching for common requests
    $response = generateLocalResponse($message, $code, $language, $action);
    
    return [
        'success' => true,
        'response' => $response,
        'action' => $action,
        'filename' => $filename,
        'language' => $language,
        'timestamp' => date('c'),
        'source' => 'local_fallback'
    ];
}

/**
 * Generate local response for common patterns
 */
function generateLocalResponse($message, $code, $language, $action) {
    $message_lower = strtolower($message);
    
    // Action-based responses
    switch ($action) {
        case 'explain':
            if (!empty($code)) {
                return "This " . ($language ?: 'code') . " appears to implement functionality related to the file structure and logic shown. For a detailed explanation, please configure the Claude API key in your environment settings.";
            }
            break;
            
        case 'optimize':
            return "To provide specific optimization suggestions, I would need access to the Claude API. Please configure your CLAUDE_API_KEY environment variable. In general, consider: code efficiency, readability, error handling, and following best practices for " . ($language ?: 'your programming language') . ".";
            
        case 'debug':
            return "For detailed debugging analysis, please configure the Claude API. Common things to check: syntax errors, null pointer exceptions, array bounds, type mismatches, and logic errors.";
            
        case 'comment':
            return "To add meaningful comments to your code automatically, please set up the Claude API key. Good comments should explain the 'why' rather than the 'what'.";
    }
    
    // Pattern-based responses
    if (strpos($message_lower, 'error') !== false || strpos($message_lower, 'bug') !== false) {
        return "I'd be happy to help debug your code! For detailed error analysis, please configure the Claude API key in your .env file. In the meantime, check for common issues like syntax errors, undefined variables, or incorrect function calls.";
    }
    
    if (strpos($message_lower, 'optimize') !== false || strpos($message_lower, 'performance') !== false) {
        return "For specific optimization recommendations, please set up the Claude API. General optimization tips: minimize database queries, use appropriate data structures, cache frequently accessed data, and profile your code to identify bottlenecks.";
    }
    
    if (strpos($message_lower, 'security') !== false) {
        return "Security is crucial! For detailed security analysis, please configure the Claude API. Key security practices: validate all inputs, use parameterized queries, implement proper authentication, sanitize outputs, and keep dependencies updated.";
    }
    
    // Default response
    return "Hello! I'm your AI coding assistant. To provide detailed, context-aware help with your code, please configure the CLAUDE_API_KEY in your environment variables. I can help with debugging, optimization, code explanation, testing, and more once the API is set up.";
}
?>