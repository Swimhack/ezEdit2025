<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required']);
    exit;
}

$message = $input['message'];
$code = $input['code'] ?? '';
$fileName = $input['fileName'] ?? '';
$language = $input['language'] ?? 'text';

$response = simulateAIResponse($message, $code, $fileName, $language);
echo json_encode($response);

function simulateAIResponse($message, $code, $fileName, $language) {
    $message = strtolower($message);
    
    if (strpos($message, 'add') !== false && strpos($message, 'button') !== false) {
        return [
            'response' => "I'll help you add a button to your " . ($fileName ?: 'file') . ". Here's a professional button with modern styling:",
            'codeChanges' => addButtonToCode($code, $language)
        ];
    }
    
    if (strpos($message, 'fix') !== false || strpos($message, 'error') !== false) {
        return [
            'response' => "I'll help you fix any issues in your code. I've analyzed it and found some improvements:",
            'codeChanges' => fixCodeIssues($code, $language)
        ];
    }
    
    if (strpos($message, 'style') !== false || strpos($message, 'css') !== false) {
        return [
            'response' => "I'll help improve the styling with modern CSS best practices:",
            'codeChanges' => improveCSS($code, $language)
        ];
    }
    
    if (strpos($message, 'responsive') !== false || strpos($message, 'mobile') !== false) {
        return [
            'response' => "I'll make your site responsive with mobile-friendly CSS:",
            'codeChanges' => makeResponsive($code, $language)
        ];
    }
    
    return [
        'response' => "I'm your AI coding assistant! I can help you:\n\n• Fix bugs and improve code quality\n• Add new features and functionality\n• Optimize performance and styling\n• Make websites responsive\n• Explain code and suggest best practices\n\nWhat would you like me to help you with?"
    ];
}

function addButtonToCode($code, $language) {
    if ($language === 'html') {
        if (strpos($code, '</body>') !== false) {
            $button = "\n    <button class=\"btn btn-primary\" onclick=\"handleClick()\">Click Me</button>\n";
            return str_replace('</body>', $button . '</body>', $code);
        }
    }
    
    if ($language === 'css') {
        $buttonCSS = "\n/* Modern Button Styles */\n.btn {\n    padding: 12px 24px;\n    border: none;\n    border-radius: 8px;\n    font-weight: 600;\n    cursor: pointer;\n    transition: all 0.3s ease;\n    font-family: inherit;\n}\n\n.btn-primary {\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    color: white;\n    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);\n}\n\n.btn-primary:hover {\n    transform: translateY(-2px);\n    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);\n}\n";
        return $code . $buttonCSS;
    }
    
    return $code;
}

function fixCodeIssues($code, $language) {
    if ($language === 'html') {
        $fixed = $code;
        
        if (strpos($fixed, 'viewport') === false && strpos($fixed, '<head>') !== false) {
            $fixed = str_replace('<head>', "<head>\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">", $fixed);
        }
        
        if (strpos($fixed, 'charset') === false && strpos($fixed, '<head>') !== false) {
            $fixed = str_replace('<head>', "<head>\n    <meta charset=\"UTF-8\">", $fixed);
        }
        
        return $fixed;
    }
    
    if ($language === 'css') {
        $fixed = $code;
        
        if (strpos($fixed, 'box-sizing') === false) {
            $fixed = "* {\n    box-sizing: border-box;\n}\n\n" . $fixed;
        }
        
        return $fixed;
    }
    
    return $code;
}

function improveCSS($code, $language) {
    if ($language === 'css') {
        $improvements = "\n/* Modern CSS Variables */\n:root {\n    --primary: #667eea;\n    --secondary: #764ba2;\n    --success: #10b981;\n    --danger: #ef4444;\n    --warning: #f59e0b;\n    --dark: #1f2937;\n    --light: #f9fafb;\n    --font-family: system-ui, -apple-system, sans-serif;\n    --border-radius: 8px;\n    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n}\n\nbody {\n    font-family: var(--font-family);\n    line-height: 1.6;\n    color: var(--dark);\n    margin: 0;\n    padding: 0;\n}\n\n.container {\n    max-width: 1200px;\n    margin: 0 auto;\n    padding: 0 20px;\n}\n\n.btn {\n    display: inline-block;\n    padding: 12px 24px;\n    background: var(--primary);\n    color: white;\n    text-decoration: none;\n    border-radius: var(--border-radius);\n    border: none;\n    cursor: pointer;\n    transition: all 0.3s ease;\n    font-weight: 600;\n}\n\n.btn:hover {\n    transform: translateY(-2px);\n    box-shadow: var(--shadow);\n}\n";
        
        return $code . $improvements;
    }
    
    return $code;
}

function makeResponsive($code, $language) {
    if ($language === 'css') {
        $responsiveCSS = "\n/* Responsive Design */\n@media (max-width: 768px) {\n    .container {\n        padding: 0 15px;\n    }\n    \n    .btn {\n        width: 100%;\n        margin-bottom: 10px;\n    }\n    \n    h1 { font-size: 2rem; }\n    h2 { font-size: 1.75rem; }\n    h3 { font-size: 1.5rem; }\n}\n\n@media (max-width: 480px) {\n    body { font-size: 14px; }\n    .container { padding: 0 10px; }\n    h1 { font-size: 1.75rem; }\n    h2 { font-size: 1.5rem; }\n}\n\n/* Flexbox Utilities */\n.d-flex { display: flex; }\n.flex-column { flex-direction: column; }\n.justify-center { justify-content: center; }\n.align-center { align-items: center; }\n.flex-wrap { flex-wrap: wrap; }\n.gap-1 { gap: 1rem; }\n.gap-2 { gap: 2rem; }\n";
        
        return $code . $responsiveCSS;
    }
    
    if ($language === 'html') {
        if (strpos($code, 'viewport') === false && strpos($code, '<head>') !== false) {
            return str_replace('<head>', "<head>\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">", $code);
        }
    }
    
    return $code;
}
?>
