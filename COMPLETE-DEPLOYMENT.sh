#!/bin/bash

# EzEdit.co Complete Deployment Script
# Run this in your DigitalOcean console

echo "🚀 EzEdit.co Complete Deployment"
echo "================================"
echo "Starting deployment to fix navigation and complete UI/UX"
echo ""

# Navigate to web root
cd /var/www/html

# Create backup
echo "📋 Creating backup..."
mkdir -p /backup/$(date +%Y%m%d_%H%M%S)
cp -r * /backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# Deploy fixed index.php
echo "🏠 Deploying homepage with fixed navigation..."
cat > index.php << 'EOF'
<?php session_start(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EzEdit.co - Edit Legacy Websites with AI-Powered Simplicity</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #ffffff; color: #1f2937; }
        .header { background: #ffffff; border-bottom: 1px solid #e5e7eb; padding: 1rem 0; position: sticky; top: 0; z-index: 100; }
        .nav-container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: #1f2937; }
        .logo-icon { background: #3b82f6; color: white; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .nav-menu { display: flex; align-items: center; gap: 2rem; }
        .mobile-menu-toggle { display: none; background: none; border: none; color: #6b7280; cursor: pointer; padding: 0.5rem; }
        .nav-link { text-decoration: none; color: #6b7280; font-weight: 500; }
        .nav-link:hover { color: #1f2937; }
        .btn-primary { padding: 0.75rem 1.5rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .btn-primary:hover { background: #2563eb; }
        .btn-secondary { background: #f3f4f6; color: #1f2937; border: 1px solid #e5e7eb; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 8px; }
        .hero-section { padding: 4rem 2rem 6rem; text-align: center; background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); }
        .hero-title { font-size: 3.5rem; font-weight: 700; margin-bottom: 1.5rem; line-height: 1.1; }
        .text-gradient { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-subtitle { font-size: 1.25rem; color: #6b7280; margin-bottom: 3rem; }
        .hero-buttons { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 3rem; }
        .btn-large { padding: 1rem 2rem; font-size: 1rem; }
        .features-section { padding: 6rem 2rem; background: #f9fafb; }
        .section-header { text-align: center; margin-bottom: 4rem; }
        .section-header h2 { font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; }
        .section-header p { font-size: 1.125rem; color: #6b7280; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; max-width: 1200px; margin: 0 auto; }
        .feature-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 2rem; text-align: center; transition: all 0.3s; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
        .feature-icon { width: 48px; height: 48px; background: #3b82f6; color: white; border-radius: 8px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        .pricing-section { padding: 6rem 2rem; background: #ffffff; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 1000px; margin: 0 auto; }
        .pricing-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 2rem; text-align: center; }
        .pricing-card.featured { border-color: #3b82f6; border-width: 2px; transform: scale(1.02); }
        @media (max-width: 768px) {
            .mobile-menu-toggle { display: flex; }
            .nav-menu { display: none; flex-direction: column; position: absolute; top: 100%; left: 0; right: 0; background: white; border-top: 1px solid #e5e7eb; padding: 1rem; }
            .nav-menu.mobile-open { display: flex; }
            .hero-title { font-size: 2.5rem; }
        }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav-container">
            <a href="index.php" class="logo">
                <div class="logo-icon">Ez</div>
                <span>EzEdit.co</span>
            </a>
            <button class="mobile-menu-toggle" onclick="toggleMenu()">☰</button>
            <div class="nav-menu" id="navMenu">
                <a href="#features" class="nav-link">Features</a>
                <a href="#pricing" class="nav-link">Pricing</a>
                <a href="docs.php" class="nav-link">Docs</a>
                <a href="auth/login.php" class="nav-link">Log in</a>
                <a href="auth/register.php" class="btn-primary">Sign up</a>
            </div>
        </nav>
    </header>
    
    <main class="hero-section">
        <h1 class="hero-title">
            Edit Legacy Websites with <span class="text-gradient">AI-Powered</span> Simplicity
        </h1>
        <p class="hero-subtitle">
            Connect to any website via FTP/SFTP and update your code using natural language prompts. Secure, fast, and incredibly simple.
        </p>
        <div class="hero-buttons">
            <a href="auth/register.php" class="btn-primary btn-large">Get Started for Free</a>
            <a href="dashboard.php" class="btn-secondary btn-large">View Dashboard</a>
        </div>
    </main>
    
    <section id="features" class="features-section">
        <div class="section-header">
            <h2>Everything You Need to Edit Legacy Sites</h2>
            <p>Professional tools for modern web development on legacy infrastructure</p>
        </div>
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">🔗</div>
                <h3>FTP/SFTP Integration</h3>
                <p>Securely connect to any server with built-in FTP and SFTP support. Browse, edit, and manage files directly.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🤖</div>
                <h3>AI-Powered Editing</h3>
                <p>Describe changes in natural language and let AI handle the code modifications. No need to remember syntax.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">⚡</div>
                <h3>Professional Editor</h3>
                <p>Monaco Editor with syntax highlighting, autocomplete, and error detection for 50+ programming languages.</p>
            </div>
        </div>
    </section>
    
    <section id="pricing" class="pricing-section">
        <div class="section-header">
            <h2>Simple, Transparent Pricing</h2>
            <p>Choose the plan that works best for your workflow</p>
        </div>
        <div class="pricing-grid">
            <div class="pricing-card">
                <h3>Free</h3>
                <div style="font-size: 2.5rem; margin: 1rem 0; color: #3b82f6;">$0<span style="font-size: 1rem; color: #6b7280;">/month</span></div>
                <ul style="list-style: none; text-align: left; margin-bottom: 2rem;">
                    <li>✓ 1 FTP connection</li>
                    <li>✓ Basic editor features</li>
                    <li>✓ 5 AI requests/day</li>
                </ul>
                <a href="auth/register.php" class="btn-secondary" style="display: block; text-align: center;">Get Started</a>
            </div>
            <div class="pricing-card featured">
                <h3>Pro</h3>
                <div style="font-size: 2.5rem; margin: 1rem 0; color: #3b82f6;">$29<span style="font-size: 1rem; color: #6b7280;">/month</span></div>
                <ul style="list-style: none; text-align: left; margin-bottom: 2rem;">
                    <li>✓ Unlimited FTP connections</li>
                    <li>✓ Advanced editor features</li>
                    <li>✓ Unlimited AI requests</li>
                    <li>✓ Priority support</li>
                </ul>
                <a href="auth/register.php" class="btn-primary" style="display: block; text-align: center;">Start Free Trial</a>
            </div>
        </div>
    </section>
    
    <script>
        function toggleMenu() {
            document.getElementById('navMenu').classList.toggle('mobile-open');
        }
    </script>
</body>
</html>
EOF

# Create auth directory and login page
echo "🔐 Deploying login system..."
mkdir -p auth
cat > auth/login.php << 'EOF'
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
EOF

# Deploy dashboard
echo "📊 Deploying dashboard..."
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
EOF

# Set proper permissions
echo "⚙️  Setting permissions..."
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
find /var/www/html -name "*.php" -exec chmod 644 {} \;

# Reload web server
echo "🔄 Reloading web server..."
systemctl reload nginx

echo ""
echo "✅ EzEdit.co deployment completed successfully!"
echo ""
echo "🌐 Test these URLs:"
echo "- Homepage: http://159.65.224.175/index.php"
echo "- Login: http://159.65.224.175/auth/login.php"
echo "- Dashboard: http://159.65.224.175/dashboard.php"
echo ""
echo "🔑 Test Login Credentials:"
echo "- Email: test@example.com (or any email)"
echo "- Password: password (or any 6+ characters)"
echo ""
echo "🎉 Your site is now live with:"
echo "- ✅ Fixed navigation links"
echo "- ✅ Professional UI/UX"
echo "- ✅ Mock authentication system"
echo "- ✅ Mobile responsive design"
echo "- ✅ Complete user flow"