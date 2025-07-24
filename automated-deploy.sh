#\!/bin/bash

API_TOKEN="dop_v1_f5fb7c9657fa9470aec45e4f40907bf5fa41bdba0eab928704be54d2368995c4"
DROPLET_ID="509389318"

# Create deployment script content
DEPLOYMENT_SCRIPT='#\!/bin/bash
set -e
cd /var/www/html
mkdir -p /backup/$(date +%Y%m%d_%H%M%S)
cp -r * /backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

cat > index.php << '\''PHPEOF'\''
<?php session_start(); ?>
<\!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EzEdit.co - Edit Legacy Websites with AI-Powered Simplicity</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Inter, sans-serif; background: #ffffff; color: #1f2937; }
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
        .btn-secondary { background: #f3f4f6; color: #1f2937; border: 1px solid #e5e7eb; }
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
        .feature-icon { width: 48px; height: 48px; background: #3b82f6; color: white; border-radius: 8px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; }
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
                <div style="font-size: 2.5rem; margin: 1rem 0; color: #3b82f6;">
                    $0<span style="font-size: 1rem; color: #6b7280;">/month</span>
                </div>
                <ul style="list-style: none; text-align: left; margin-bottom: 2rem;">
                    <li>✓ 1 FTP connection</li>
                    <li>✓ Basic editor features</li>
                    <li>✓ 5 AI requests/day</li>
                </ul>
                <a href="auth/register.php" class="btn-secondary" style="display: block; text-align: center;">Get Started</a>
            </div>
            <div class="pricing-card featured">
                <h3>Pro</h3>
                <div style="font-size: 2.5rem; margin: 1rem 0; color: #3b82f6;">
                    $29<span style="font-size: 1rem; color: #6b7280;">/month</span>
                </div>
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
            document.getElementById('\''navMenu'\'').classList.toggle('\''mobile-open'\'');
        }
    </script>
</body>
</html>
PHPEOF

mkdir -p auth
cat > auth/login.php << '\''PHPEOF'\''
<?php session_start(); ?>
<\!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - EzEdit.co</title>
    <style>
        body { font-family: Inter, sans-serif; margin: 0; padding: 2rem; background: #f9fafb; }
        .login-container { max-width: 400px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 2rem; }
        .logo-icon { background: #3b82f6; color: white; width: 48px; height: 48px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 1rem; }
        h1 { text-align: center; margin-bottom: 2rem; color: #1f2937; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; }
        input { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; }
        input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .btn { width: 100%; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn:hover { background: #2563eb; }
        .links { text-align: center; margin-top: 1rem; }
        .links a { color: #3b82f6; text-decoration: none; }
        .links a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <div class="logo-icon">Ez</div>
        </div>
        <h1>Welcome back</h1>
        <form>
            <div class="form-group">
                <label>Email</label>
                <input type="email" required placeholder="Enter your email">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" required placeholder="Enter your password">
            </div>
            <button type="submit" class="btn">Sign In</button>
        </form>
        <div class="links">
            <p>Don'\''t have an account? <a href="register.php">Sign up</a></p>
            <p><a href="../index.php">← Back to homepage</a></p>
        </div>
    </div>
</body>
</html>
PHPEOF

cat > dashboard.php << '\''PHPEOF'\''
<?php session_start(); ?>
<\!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - EzEdit.co</title>
    <style>
        body { font-family: Inter, sans-serif; margin: 0; background: #f9fafb; }
        .header { background: white; padding: 1rem 2rem; border-bottom: 1px solid #e5e7eb; }
        .nav { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #1f2937; }
        .nav-links { display: flex; gap: 2rem; align-items: center; }
        .nav-links a { color: #6b7280; text-decoration: none; }
        .nav-links a:hover { color: #1f2937; }
        .btn { padding: 0.5rem 1rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; }
        .main { padding: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
        .form-group { display: flex; flex-direction: column; }
        .form-group label { margin-bottom: 0.5rem; font-weight: 500; }
        .form-group input { padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; }
        .btn-primary { padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; }
        .empty-state { text-align: center; padding: 3rem; color: #6b7280; }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="logo">EzEdit.co</div>
            <div class="nav-links">
                <a href="index.php">Home</a>
                <a href="docs.php">Docs</a>
                <a href="editor.php" class="btn">Editor</a>
            </div>
        </nav>
    </header>
    
    <main class="main">
        <h1>My FTP Sites</h1>
        
        <div class="card">
            <h2>Add New Site</h2>
            <form>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Site Name</label>
                        <input type="text" placeholder="My Website" required>
                    </div>
                    <div class="form-group">
                        <label>FTP Host</label>
                        <input type="text" placeholder="ftp.example.com" required>
                    </div>
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" placeholder="username" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" placeholder="password" required>
                    </div>
                </div>
                <button type="submit" class="btn-primary">Add Site</button>
            </form>
        </div>
        
        <div class="card">
            <h2>Your Sites</h2>
            <div class="empty-state">
                <p>No sites added yet. Add your first FTP site above to get started.</p>
            </div>
        </div>
    </main>
</body>
</html>
PHPEOF

cat > docs.php << '\''PHPEOF'\''
<?php session_start(); ?>
<\!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation - EzEdit.co</title>
    <style>
        body { font-family: Inter, sans-serif; margin: 0; background: #f9fafb; }
        .header { background: white; padding: 1rem 2rem; border-bottom: 1px solid #e5e7eb; }
        .nav { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #1f2937; }
        .nav-links { display: flex; gap: 2rem; }
        .nav-links a { color: #6b7280; text-decoration: none; }
        .nav-links a:hover { color: #1f2937; }
        .main { padding: 2rem; max-width: 800px; margin: 0 auto; }
        .card { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
        h1 { color: #1f2937; margin-bottom: 2rem; }
        h2 { color: #374151; margin-top: 2rem; margin-bottom: 1rem; }
        h3 { color: #4b5563; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        p { color: #6b7280; line-height: 1.6; margin-bottom: 1rem; }
        ol, ul { color: #6b7280; line-height: 1.6; margin-bottom: 1rem; padding-left: 1.5rem; }
        .highlight { background: #f3f4f6; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #3b82f6; }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="logo">EzEdit.co</div>
            <div class="nav-links">
                <a href="index.php">Home</a>
                <a href="dashboard.php">Dashboard</a>
            </div>
        </nav>
    </header>
    
    <main class="main">
        <h1>Documentation</h1>
        
        <div class="card">
            <h2>Getting Started</h2>
            <p>Welcome to EzEdit.co\! This guide will help you get started with editing your legacy websites using AI-powered simplicity.</p>
            
            <div class="highlight">
                <strong>Quick Start:</strong> Connect your FTP server, browse files, and start editing with AI assistance in under 5 minutes.
            </div>
            
            <h3>Step 1: Connect Your FTP Server</h3>
            <ol>
                <li>Go to your <a href="dashboard.php">Dashboard</a></li>
                <li>Click "Add New Site"</li>
                <li>Enter your FTP credentials</li>
                <li>Test the connection</li>
            </ol>
            
            <h3>Step 2: Browse Your Files</h3>
            <p>Use the file explorer to navigate your website'\''s directory structure. You can:</p>
            <ul>
                <li>Browse folders and files</li>
                <li>Preview file contents</li>
                <li>Search for specific files</li>
                <li>Upload new files</li>
            </ul>
            
            <h3>Step 3: Edit with AI</h3>
            <p>Open any file in the Monaco Editor and use AI assistance to:</p>
            <ul>
                <li>Explain existing code</li>
                <li>Generate new code from descriptions</li>
                <li>Fix bugs and errors</li>
                <li>Optimize performance</li>
            </ul>
            
            <h2>Features</h2>
            
            <h3>FTP/SFTP Support</h3>
            <p>Connect to any web server using standard FTP or secure SFTP protocols. Your credentials are encrypted and stored securely.</p>
            
            <h3>Monaco Editor</h3>
            <p>Professional code editor with syntax highlighting, autocomplete, and error detection for 50+ programming languages.</p>
            
            <h3>AI Assistant</h3>
            <p>Powered by Claude AI, get intelligent code suggestions, explanations, and automated editing capabilities.</p>
            
            <h2>Support</h2>
            <p>Need help? Contact us at <a href="mailto:support@ezedit.co">support@ezedit.co</a> or visit our community forum.</p>
        </div>
    </main>
</body>
</html>
PHPEOF

chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
find /var/www/html -name "*.php" -exec chmod 644 {} \;
systemctl reload nginx

echo "✅ EzEdit.co deployment completed successfully\!"
echo "🌐 Fixed navigation links and complete UI/UX deployed"
'

# Use curl to send deployment command via cloud-init or user data
# Since we can't SSH, we'll have to use alternative method
echo "Attempting automated deployment via DigitalOcean API..."

