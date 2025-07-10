<?php
/**
 * ezEdit Authentication Log Viewer
 * Admin utility for viewing detailed authentication logs
 * SECURE VERSION - Requires proper admin authentication
 */

// Load authentication system
require_once __DIR__ . '/../../config/auth.php';

// Require admin authentication
try {
    $adminUser = requireAdmin();
    
    // Log admin access for audit trail
    error_log("Admin log viewer accessed by: " . $adminUser['email'] . " at " . date('Y-m-d H:i:s'));
    
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 403);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => $e->getMessage(),
        'timestamp' => date('c')
    ]);
    exit;
}

// Log directory
$logDir = __DIR__ . '/../../logs';
$availableLogs = [];

// Get available log files
if (is_dir($logDir)) {
    $files = glob($logDir . '/*.log');
    foreach ($files as $file) {
        $availableLogs[basename($file)] = $file;
    }
}

// Selected log file
$selectedLog = $_GET['log'] ?? 'auth.log';
$logFile = $availableLogs[$selectedLog] ?? null;

// Read log entries
$logEntries = [];
if ($logFile && file_exists($logFile)) {
    $content = file_get_contents($logFile);
    $entries = explode("---\n", $content);
    
    foreach ($entries as $entry) {
        $entry = trim($entry);
        if (!empty($entry)) {
            $decoded = json_decode($entry, true);
            if ($decoded) {
                $logEntries[] = $decoded;
            }
        }
    }
    
    // Sort by timestamp (newest first)
    usort($logEntries, function($a, $b) {
        return strtotime($b['timestamp'] ?? '0') - strtotime($a['timestamp'] ?? '0');
    });
}

// Filter options
$filterAction = $_GET['filter_action'] ?? '';
$filterStatus = $_GET['filter_status'] ?? '';
$filterEmail = $_GET['filter_email'] ?? '';
$limit = (int)($_GET['limit'] ?? 50);

// Apply filters
if (!empty($filterAction) || !empty($filterStatus) || !empty($filterEmail)) {
    $logEntries = array_filter($logEntries, function($entry) use ($filterAction, $filterStatus, $filterEmail) {
        if (!empty($filterAction) && stripos($entry['action'] ?? '', $filterAction) === false) {
            return false;
        }
        if (!empty($filterStatus) && ($entry['status'] ?? '') !== $filterStatus) {
            return false;
        }
        if (!empty($filterEmail) && stripos($entry['email'] ?? '', $filterEmail) === false) {
            return false;
        }
        return true;
    });
}

// Limit results
$logEntries = array_slice($logEntries, 0, $limit);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ezEdit - Authentication Log Viewer</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: #2563eb;
            color: white;
            padding: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .controls {
            padding: 20px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
        }
        .controls form {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }
        .controls select, .controls input {
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
        }
        .controls button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
        .stats {
            padding: 15px 20px;
            background: #f1f5f9;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
            color: #64748b;
        }
        .log-entry {
            padding: 15px 20px;
            border-bottom: 1px solid #e2e8f0;
        }
        .log-entry:hover {
            background: #f8fafc;
        }
        .log-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 8px;
        }
        .log-meta {
            display: flex;
            gap: 15px;
            font-size: 12px;
            color: #64748b;
        }
        .status {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status.success { background: #dcfce7; color: #166534; }
        .status.error { background: #fecaca; color: #991b1b; }
        .status.info { background: #dbeafe; color: #1e40af; }
        .status.warning { background: #fef3c7; color: #92400e; }
        .action {
            font-weight: 600;
            color: #1e293b;
        }
        .email {
            color: #2563eb;
            font-family: monospace;
        }
        .details {
            margin-top: 10px;
            font-size: 13px;
            color: #475569;
        }
        .details-toggle {
            background: none;
            border: none;
            color: #2563eb;
            cursor: pointer;
            text-decoration: underline;
            font-size: 12px;
        }
        .details-content {
            display: none;
            margin-top: 10px;
            padding: 10px;
            background: #f1f5f9;
            border-radius: 4px;
            font-family: monospace;
            font-size: 11px;
            white-space: pre-wrap;
        }
        .no-logs {
            text-align: center;
            padding: 40px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 ezEdit Authentication Logs</h1>
        </div>
        
        <div class="controls">
            <form method="GET">
                <label>
                    Log File:
                    <select name="log">
                        <?php foreach ($availableLogs as $name => $path): ?>
                            <option value="<?= htmlspecialchars($name) ?>" <?= $name === $selectedLog ? 'selected' : '' ?>>
                                <?= htmlspecialchars($name) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </label>
                
                <label>
                    Action:
                    <input type="text" name="filter_action" value="<?= htmlspecialchars($filterAction) ?>" placeholder="login, signup, etc.">
                </label>
                
                <label>
                    Status:
                    <select name="filter_status">
                        <option value="">All Statuses</option>
                        <option value="success" <?= $filterStatus === 'success' ? 'selected' : '' ?>>Success</option>
                        <option value="error" <?= $filterStatus === 'error' ? 'selected' : '' ?>>Error</option>
                        <option value="info" <?= $filterStatus === 'info' ? 'selected' : '' ?>>Info</option>
                        <option value="warning" <?= $filterStatus === 'warning' ? 'selected' : '' ?>>Warning</option>
                    </select>
                </label>
                
                <label>
                    Email:
                    <input type="text" name="filter_email" value="<?= htmlspecialchars($filterEmail) ?>" placeholder="user@example.com">
                </label>
                
                <label>
                    Limit:
                    <select name="limit">
                        <option value="25" <?= $limit === 25 ? 'selected' : '' ?>>25</option>
                        <option value="50" <?= $limit === 50 ? 'selected' : '' ?>>50</option>
                        <option value="100" <?= $limit === 100 ? 'selected' : '' ?>>100</option>
                        <option value="250" <?= $limit === 250 ? 'selected' : '' ?>>250</option>
                    </select>
                </label>
                
                <button type="submit">Filter</button>
                <a href="?" style="margin-left: 10px; color: #64748b;">Clear Filters</a>
            </form>
        </div>
        
        <div class="stats">
            Showing <?= count($logEntries) ?> entries from <?= htmlspecialchars($selectedLog) ?>
            <?php if (file_exists($logFile)): ?>
                (File size: <?= number_format(filesize($logFile) / 1024, 1) ?> KB, 
                Last modified: <?= date('Y-m-d H:i:s', filemtime($logFile)) ?>)
            <?php endif; ?>
        </div>
        
        <?php if (empty($logEntries)): ?>
            <div class="no-logs">
                <h3>No log entries found</h3>
                <p>No authentication logs match your current filters.</p>
            </div>
        <?php else: ?>
            <?php foreach ($logEntries as $index => $entry): ?>
                <div class="log-entry">
                    <div class="log-header">
                        <div>
                            <span class="status <?= $entry['status'] ?? 'info' ?>"><?= strtoupper($entry['status'] ?? 'info') ?></span>
                            <span class="action"><?= htmlspecialchars($entry['action'] ?? 'unknown') ?></span>
                            <?php if (!empty($entry['email']) && $entry['email'] !== 'unknown'): ?>
                                <span class="email"><?= htmlspecialchars($entry['email']) ?></span>
                            <?php endif; ?>
                        </div>
                        <div class="log-meta">
                            <span><?= htmlspecialchars($entry['timestamp'] ?? 'unknown') ?></span>
                            <?php if (!empty($entry['ip_address'])): ?>
                                <span>IP: <?= htmlspecialchars($entry['ip_address']) ?></span>
                            <?php endif; ?>
                            <?php if (!empty($entry['source'])): ?>
                                <span>Source: <?= htmlspecialchars($entry['source']) ?></span>
                            <?php endif; ?>
                        </div>
                    </div>
                    
                    <?php if (!empty($entry['error_message']) || !empty($entry['additional_data'])): ?>
                        <div class="details">
                            <?php if (!empty($entry['error_message'])): ?>
                                <div style="color: #dc2626; margin-bottom: 5px;">
                                    <strong>Error:</strong> <?= htmlspecialchars($entry['error_message']) ?>
                                </div>
                            <?php endif; ?>
                            
                            <button class="details-toggle" onclick="toggleDetails(<?= $index ?>)">
                                Show Details
                            </button>
                            <div id="details-<?= $index ?>" class="details-content">
<?= htmlspecialchars(json_encode($entry, JSON_PRETTY_PRINT)) ?>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
    
    <script>
        function toggleDetails(index) {
            const content = document.getElementById(`details-${index}`);
            const button = content.previousElementSibling;
            
            if (content.style.display === 'none' || content.style.display === '') {
                content.style.display = 'block';
                button.textContent = 'Hide Details';
            } else {
                content.style.display = 'none';
                button.textContent = 'Show Details';
            }
        }
        
        // Auto-refresh every 30 seconds
        setTimeout(() => {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>
