# 🚀 DEPLOY EZEDIT.CO NOW - Copy These Commands

## **Step 1: Open DigitalOcean Console**
- Go to: https://cloud.digitalocean.com/droplets/509389318
- Click "Console" tab
- Login as root (you should already be logged in)

## **Step 2: Copy and Paste These Commands One by One**

### Command 1: Navigate and Backup
```bash
cd /var/www/html && mkdir -p /backup/$(date +%Y%m%d_%H%M%S) && cp -r * /backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
```

### Command 2: Deploy Fixed Homepage
```bash
cat > index.php << 'EOF'
<?php session_start(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EzEdit.co - Edit Legacy Websites with AI-Powered Simplicity</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #ffffff; color: #1f2937; }
        .header { background: #ffffff; border-bottom: 1px solid #e5e7eb; padding: 1rem 0; }
        .nav-container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: #1f2937; }
        .logo-icon { background: #3b82f6; color: white; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .nav-menu { display: flex; align-items: center; gap: 2rem; }
        .nav-link { text-decoration: none; color: #6b7280; font-weight: 500; }
        .nav-link:hover { color: #1f2937; }
        .btn-primary { padding: 0.75rem 1.5rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; }
        .btn-secondary { background: #f3f4f6; color: #1f2937; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 8px; }
        .hero-section { padding: 4rem 2rem; text-align: center; background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); }
        .hero-title { font-size: 3rem; font-weight: 700; margin-bottom: 1.5rem; }
        .text-gradient { color: #3b82f6; }
        .hero-subtitle { font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem; }
        .hero-buttons { display: flex; justify-content: center; gap: 1rem; margin-bottom: 2rem; }
        .btn-large { padding: 1rem 2rem; }
        .features-section { padding: 4rem 2rem; background: #f9fafb; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; max-width: 1000px; margin: 0 auto; }
        .feature-card { background: white; padding: 2rem; border-radius: 8px; text-align: center; }
        .pricing-section { padding: 4rem 2rem; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 800px; margin: 0 auto; }
        .pricing-card { background: white; padding: 2rem; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center; }
        .pricing-card.featured { border-color: #3b82f6; border-width: 2px; }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav-container">
            <a href="index.php" class="logo">
                <div class="logo-icon">Ez</div>
                <span>EzEdit.co</span>
            </a>
            <div class="nav-menu">
                <a href="#features" class="nav-link">Features</a>
                <a href="#pricing" class="nav-link">Pricing</a>
                <a href="docs.php" class="nav-link">Docs</a>
                <a href="auth/login.php" class="nav-link">Log in</a>
                <a href="auth/login.php" class="btn-primary">Sign up</a>
            </div>
        </nav>
    </header>
    
    <main class="hero-section">
        <h1 class="hero-title">
            Edit Legacy Websites with <span class="text-gradient">AI-Powered</span> Simplicity
        </h1>
        <p class="hero-subtitle">
            Connect to any website via FTP/SFTP and update your code using natural language prompts.
        </p>
        <div class="hero-buttons">
            <a href="auth/login.php" class="btn-primary btn-large">Get Started for Free</a>
            <a href="dashboard.php" class="btn-secondary btn-large">View Dashboard</a>
        </div>
    </main>
    
    <section id="features" class="features-section">
        <h2 style="text-align: center; margin-bottom: 3rem; font-size: 2rem;">Everything You Need</h2>
        <div class="features-grid">
            <div class="feature-card">
                <h3>🔗 FTP/SFTP Integration</h3>
                <p>Securely connect to any server with built-in FTP and SFTP support.</p>
            </div>
            <div class="feature-card">
                <h3>🤖 AI-Powered Editing</h3>
                <p>Describe changes in natural language and let AI handle the code.</p>
            </div>
            <div class="feature-card">
                <h3>⚡ Professional Editor</h3>
                <p>Monaco Editor with syntax highlighting and autocomplete.</p>
            </div>
        </div>
    </section>
    
    <section id="pricing" class="pricing-section">
        <h2 style="text-align: center; margin-bottom: 3rem; font-size: 2rem;">Simple Pricing</h2>
        <div class="pricing-grid">
            <div class="pricing-card">
                <h3>Free</h3>
                <div style="font-size: 2rem; margin: 1rem 0; color: #3b82f6;">$0<span style="font-size: 1rem;">/month</span></div>
                <p>Perfect for trying out EzEdit</p>
                <a href="auth/login.php" class="btn-secondary" style="display: block; margin-top: 1rem;">Get Started</a>
            </div>
            <div class="pricing-card featured">
                <h3>Pro</h3>
                <div style="font-size: 2rem; margin: 1rem 0; color: #3b82f6;">$29<span style="font-size: 1rem;">/month</span></div>
                <p>For professional developers</p>
                <a href="auth/login.php" class="btn-primary" style="display: block; margin-top: 1rem;">Start Free Trial</a>
            </div>
        </div>
    </section>
</body>
</html>
EOF
```

### Command 3: Create Login System
```bash
mkdir -p auth && cat > auth/login.php << 'EOF'
<?php
session_start();
if ($_POST) {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    if (!empty($email) && !empty($password) && strlen($password) >= 6) {
        $_SESSION['user_logged_in'] = true;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_name'] = explode('@', $email)[0];
        header('Location: ../dashboard.php');
        exit();
    } else {
        $error = 'Please enter a valid email and password (min 6 characters)';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - EzEdit.co</title>
    <style>
        body { font-family: Inter, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; margin: 0; }
        .login-container { background: rgba(255, 255, 255, 0.95); padding: 3rem; border-radius: 20px; width: 100%; max-width: 400px; }
        .logo { text-align: center; margin-bottom: 2rem; }
        .logo-icon { background: #3b82f6; color: white; width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.5rem; margin-bottom: 1rem; }
        h1 { text-align: center; margin-bottom: 2rem; color: #1f2937; }
        .demo-info { background: #f0f9ff; border: 1px solid #bae6fd; color: #0c4a6e; padding: 1rem; border-radius: 12px; margin-bottom: 2rem; font-size: 0.875rem; }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        input { width: 100%; padding: 0.875rem; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 1rem; }
        .btn { width: 100%; padding: 0.875rem; background: #3b82f6; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; }
        .links { text-align: center; margin-top: 2rem; }
        .links a { color: #3b82f6; text-decoration: none; }
        .error { background: #fef2f2; color: #dc2626; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <div class="logo-icon">Ez</div>
            <span style="display: block; font-size: 1.5rem; font-weight: 700;">EzEdit.co</span>
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
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="test@example.com">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" required placeholder="password">
            </div>
            <button type="submit" class="btn">Sign In</button>
        </form>
        <div class="links">
            <p><a href="../index.php">← Back to homepage</a></p>
        </div>
    </div>
</body>
</html>
EOF
```

### Command 4: Create Dashboard
```bash
cat > dashboard.php << 'EOF'
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
        body { font-family: Inter, sans-serif; background: #f9fafb; margin: 0; }
        .header { background: white; padding: 1rem 2rem; border-bottom: 1px solid #e5e7eb; }
        .nav { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #1f2937; }
        .nav-links { display: flex; gap: 2rem; align-items: center; }
        .nav-links a { color: #6b7280; text-decoration: none; }
        .btn { padding: 0.75rem 1.5rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; }
        .main { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .welcome { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; text-align: center; }
        .card { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
        .action-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .action-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; text-align: center; }
        .action-icon { font-size: 2rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="logo">EzEdit.co</div>
            <div class="nav-links">
                <a href="index.php">Home</a>
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
            <div class="action-grid">
                <div class="action-card">
                    <div class="action-icon">🎯</div>
                    <h3>Open Editor</h3>
                    <p>Start editing files</p>
                    <a href="editor.php" class="btn" style="display: inline-block; margin-top: 1rem;">Launch</a>
                </div>
                <div class="action-card">
                    <div class="action-icon">🔗</div>
                    <h3>Connect FTP</h3>
                    <p>Browse your files</p>
                    <a href="editor.php" class="btn" style="display: inline-block; margin-top: 1rem;">Connect</a>
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
EOF
```

### Command 5: Set Permissions and Reload
```bash
chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html && systemctl reload nginx
```

## **Step 3: Test Your Site**

After running all commands, test these URLs:
- **Homepage:** http://159.65.224.175/index.php
- **Login:** http://159.65.224.175/auth/login.php 
- **Dashboard:** http://159.65.224.175/dashboard.php

**Test Login:** Use `test@example.com` / `password`

## **🎉 Success!**
Your site will now have:
- ✅ Fixed navigation links
- ✅ Professional UI/UX  
- ✅ Working mock authentication
- ✅ Complete user flow

**Run these 5 commands in your DigitalOcean console and your site will be deployed!** 🚀