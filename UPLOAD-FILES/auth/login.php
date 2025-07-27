<?php
session_start();

// Handle login form submission
if ($_POST) {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    
    // Mock authentication - accept any email/password for testing
    if (!empty($email) && !empty($password) && strlen($password) >= 6) {
        $_SESSION['user_logged_in'] = true;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_name'] = explode('@', $email)[0];
        $_SESSION['user_id'] = 1;
        
        header('Location: ../dashboard.php');
        exit();
    } else {
        $error = 'Please enter a valid email and password (min 6 characters)';
    }
}

// Redirect if already logged in
if (isset($_SESSION['user_logged_in']) && $_SESSION['user_logged_in']) {
    header('Location: ../dashboard.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - EzEdit.co</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .login-container { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); padding: 3rem; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        .logo { text-align: center; margin-bottom: 2rem; }
        .logo-icon { background: #3b82f6; color: white; width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.5rem; margin-bottom: 1rem; }
        .logo-text { display: block; font-size: 1.5rem; font-weight: 700; color: #1f2937; }
        h1 { text-align: center; margin-bottom: 2rem; color: #1f2937; font-weight: 600; font-size: 1.75rem; }
        .demo-info { background: #f0f9ff; border: 1px solid #bae6fd; color: #0c4a6e; padding: 1rem; border-radius: 12px; margin-bottom: 2rem; font-size: 0.875rem; }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; font-size: 0.875rem; }
        input { width: 100%; padding: 0.875rem 1rem; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 1rem; }
        input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .btn { width: 100%; padding: 0.875rem; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; border: none; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5); }
        .links { text-align: center; margin-top: 2rem; }
        .links a { color: #3b82f6; text-decoration: none; font-weight: 500; font-size: 0.875rem; }
        .links p { margin: 0.75rem 0; color: #6b7280; font-size: 0.875rem; }
        .error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem; }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <div class="logo-icon">Ez</div>
            <span class="logo-text">EzEdit.co</span>
        </div>
        
        <h1>Welcome back</h1>
        
        <div class="demo-info">
            <strong>Demo Mode:</strong> Enter any email and password (6+ characters) to sign in.
        </div>
        
        <?php if (isset($error)): ?>
        <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <form method="POST">
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" required placeholder="test@example.com">
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required placeholder="password">
            </div>
            <button type="submit" class="btn">Sign In</button>
        </form>
        
        <div class="links">
            <p><a href="../index.php">← Back to homepage</a></p>
        </div>
    </div>
</body>
</html>