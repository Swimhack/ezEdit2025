<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);
$endpoint = basename($path);

switch ($endpoint) {
    case 'test-connection.php':
    case 'test-connection':
        handleTestConnection();
        break;
    case 'files.php':
    case 'files':
        handleGetFiles();
        break;
    case 'file-content.php':
    case 'file-content':
        handleGetFileContent();
        break;
    case 'save-file.php':
    case 'save-file':
        handleSaveFile();
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}

function handleTestConnection() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['host']) || !isset($input['username']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    $connection = connectToFTP($input);
    if ($connection) {
        ftp_close($connection);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Failed to connect to FTP server']);
    }
}

function handleGetFiles() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input']);
        return;
    }
    
    $connection = connectToFTP($input);
    if (!$connection) {
        http_response_code(400);
        echo json_encode(['error' => 'Failed to connect to FTP server']);
        return;
    }
    
    try {
        $path = $input['path'] ?? '/';
        $files = listFiles($connection, $path);
        ftp_close($connection);
        echo json_encode($files);
    } catch (Exception $e) {
        ftp_close($connection);
        http_response_code(500);
        echo json_encode(['error' => 'Failed to list files: ' . $e->getMessage()]);
    }
}

function handleGetFileContent() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['filePath'])) {
        http_response_code(400);
        echo json_encode(['error' => 'File path required']);
        return;
    }
    
    $connection = connectToFTP($input);
    if (!$connection) {
        http_response_code(400);
        echo json_encode(['error' => 'Failed to connect to FTP server']);
        return;
    }
    
    try {
        $tempFile = tempnam(sys_get_temp_dir(), 'ftp_download_');
        
        if (ftp_get($connection, $tempFile, $input['filePath'], FTP_BINARY)) {
            $content = file_get_contents($tempFile);
            unlink($tempFile);
            ftp_close($connection);
            
            header('Content-Type: text/plain');
            echo $content;
        } else {
            unlink($tempFile);
            ftp_close($connection);
            http_response_code(404);
            echo json_encode(['error' => 'File not found or cannot be read']);
        }
    } catch (Exception $e) {
        ftp_close($connection);
        http_response_code(500);
        echo json_encode(['error' => 'Failed to download file: ' . $e->getMessage()]);
    }
}

function handleSaveFile() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['filePath']) || !isset($input['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'File path and content required']);
        return;
    }
    
    $connection = connectToFTP($input);
    if (!$connection) {
        http_response_code(400);
        echo json_encode(['error' => 'Failed to connect to FTP server']);
        return;
    }
    
    try {
        $tempFile = tempnam(sys_get_temp_dir(), 'ftp_upload_');
        file_put_contents($tempFile, $input['content']);
        
        if (ftp_put($connection, $input['filePath'], $tempFile, FTP_BINARY)) {
            unlink($tempFile);
            ftp_close($connection);
            echo json_encode(['success' => true]);
        } else {
            unlink($tempFile);
            ftp_close($connection);
            http_response_code(500);
            echo json_encode(['error' => 'Failed to upload file']);
        }
    } catch (Exception $e) {
        ftp_close($connection);
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file: ' . $e->getMessage()]);
    }
}

function connectToFTP($config) {
    $host = $config['host'];
    $port = $config['port'] ?? 21;
    $username = $config['username'];
    $password = $config['password'];
    
    $connection = ftp_connect($host, $port, 30);
    if (!$connection) {
        return false;
    }
    
    if (!ftp_login($connection, $username, $password)) {
        ftp_close($connection);
        return false;
    }
    
    ftp_pasv($connection, true);
    
    if (isset($config['path']) && $config['path'] !== '/') {
        ftp_chdir($connection, $config['path']);
    }
    
    return $connection;
}

function listFiles($connection, $path = '/') {
    $files = [];
    
    $rawList = ftp_rawlist($connection, $path);
    if (!$rawList) {
        return [];
    }
    
    foreach ($rawList as $item) {
        $file = parseFileInfo($item, $path);
        if ($file && $file['name'] !== '.' && $file['name'] !== '..') {
            $files[] = $file;
        }
    }
    
    usort($files, function($a, $b) {
        if ($a['type'] === $b['type']) {
            return strcasecmp($a['name'], $b['name']);
        }
        return ($a['type'] === 'directory') ? -1 : 1;
    });
    
    return $files;
}

function parseFileInfo($rawLine, $basePath) {
    if (preg_match('/^([-dlrwx]+)\s+\d+\s+\w+\s+\w+\s+(\d+)\s+(.+?)\s+(.+)$/', $rawLine, $matches)) {
        $permissions = $matches[1];
        $size = intval($matches[2]);
        $name = $matches[4];
        
        $isDirectory = $permissions[0] === 'd';
        $fullPath = rtrim($basePath, '/') . '/' . $name;
        
        return [
            'name' => $name,
            'path' => $fullPath,
            'type' => $isDirectory ? 'directory' : 'file',
            'size' => $size,
            'permissions' => $permissions,
            'modified' => $matches[3] ?? ''
        ];
    }
    
    if (!empty($rawLine)) {
        $name = trim($rawLine);
        return [
            'name' => $name,
            'path' => rtrim($basePath, '/') . '/' . $name,
            'type' => 'file',
            'size' => 0,
            'permissions' => '',
            'modified' => ''
        ];
    }
    
    return null;
}
?>
