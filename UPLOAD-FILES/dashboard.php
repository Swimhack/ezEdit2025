<?php 
session_start();
$authenticated = isset($_SESSION['user_logged_in']) && $_SESSION['user_logged_in'];
$user_name = $_SESSION['user_name'] ?? 'User';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - EzEdit.co</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Inter, sans-serif; background: #f9fafb; }
        .header { background: white; padding: 1rem 2rem; border-bottom: 1px solid #e5e7eb; }
        .nav { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #1f2937; }
        .nav-links { display: flex; gap: 2rem; align-items: center; }
        .nav-links a { color: #6b7280; text-decoration: none; }
        .nav-links a:hover { color: #1f2937; }
        .btn { padding: 0.75rem 1.5rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; }
        .main { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .welcome { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; text-align: center; }
        .card { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .quick-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .action-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; text-align: center; transition: all 0.2s; }
        .action-card:hover { border-color: #3b82f6; transform: translateY(-2px); }
        .action-icon { font-size: 2rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="logo">EzEdit.co</div>
            <div class="nav-links">
                <a href="index.php">Home</a>
                <a href="docs.php">Docs</a>
                <?php if ($authenticated): ?>
                    <span>Welcome, <?php echo htmlspecialchars($user_name); ?>!</span>
                    <a href="editor.php" class="btn">Open Editor</a>
                <?php else: ?>
                    <a href="auth/login.php" class="btn">Login</a>
                <?php endif; ?>
            </div>
        </nav>
    </header>
    
    <main class="main">
        <?php if ($authenticated): ?>
        <div class="welcome">
            <h1>Welcome back, <?php echo htmlspecialchars($user_name); ?>!</h1>
            <p>Ready to edit your legacy websites with AI-powered simplicity.</p>
        </div>
        
        <div class="card">
            <h2>Quick Actions</h2>
            <div class="quick-actions">
                <div class="action-card">
                    <div class="action-icon">🎯</div>
                    <h3>Open Editor</h3>
                    <p>Start editing files with our professional code editor</p>
                    <a href="editor.php" class="btn" style="display: inline-block; margin-top: 1rem;">Launch Editor</a>
                </div>
                
                <div class="action-card">
                    <div class="action-icon">🔗</div>
                    <h3>Connect FTP</h3>
                    <p>Connect to your FTP server and browse files</p>
                    <a href="editor.php" class="btn" style="display: inline-block; margin-top: 1rem;">Connect</a>
                </div>
                
                <div class="action-card">
                    <div class="action-icon">📚</div>
                    <h3>Documentation</h3>
                    <p>Learn how to use EzEdit.co effectively</p>
                    <a href="docs.php" class="btn" style="display: inline-block; margin-top: 1rem;">Read Docs</a>
                </div>
            </div>
        </div>
        <?php else: ?>
        <div class="welcome">
            <h1>Welcome to EzEdit.co</h1>
            <p>Please log in to access your dashboard.</p>
            <a href="auth/login.php" class="btn" style="display: inline-block; margin-top: 1rem;">Sign In</a>
        </div>
        <?php endif; ?>
    </main>
</body>
</html>