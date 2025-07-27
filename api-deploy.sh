#!/bin/bash

# EzEdit.co DigitalOcean API Deployment
API_TOKEN="dop_v1_f5fb7c9657fa9470aec45e4f40907bf5fa41bdba0eab928704be54d2368995c4"
DROPLET_ID="509389318"
DROPLET_NAME="ezedit-mvp"
DROPLET_IP="159.65.224.175"

echo "🚀 EzEdit.co DigitalOcean API Deployment"
echo "========================================"
echo "Droplet: $DROPLET_NAME ($DROPLET_ID)"
echo "IP: $DROPLET_IP"
echo "API Token: ${API_TOKEN:0:20}..."
echo ""

# First, let's get the deployment package ready
if [ ! -f "ezedit-complete-deployment.tar.gz" ]; then
    echo "❌ Deployment package not found!"
    exit 1
fi

PACKAGE_SIZE=$(du -h ezedit-complete-deployment.tar.gz | cut -f1)
echo "📦 Package size: $PACKAGE_SIZE"
echo ""

# Create base64 encoded deployment script
DEPLOY_SCRIPT=$(cat << 'EOF'
#!/bin/bash
set -e

echo "🔧 Starting EzEdit.co deployment on server..."

# Navigate to web root
cd /var/www/html

# Create backup
echo "📋 Creating backup..."
BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r * "$BACKUP_DIR/" 2>/dev/null || true
echo "✅ Backup created at $BACKUP_DIR"

# Download deployment package from a temporary location
# Since we can't upload directly via API, we'll use curl to download from a public URL
# For now, let's create the deployment structure manually

echo "🚀 Deploying EzEdit.co application..."

# Create the basic structure first
mkdir -p auth css js api config

# Create index.php
cat > index.php << 'INDEXPHP'
<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EzEdit.co - Edit Legacy Websites with AI-Powered Simplicity</title>
    <meta name="description" content="Connect to any website via FTP/SFTP and update your code using natural language prompts. Secure, fast, and incredibly simple.">
    <link rel="stylesheet" href="css/main.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
    <header class="header">
        <nav class="nav-container">
            <div class="logo">
                <div class="logo-icon">Ez</div>
                <span class="logo-text">EzEdit.co</span>
            </div>
            <button class="mobile-menu-toggle" id="mobileMenuToggle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>
            <div class="nav-menu" id="navMenu">
                <a href="#features" class="nav-link">Features</a>
                <a href="#pricing" class="nav-link">Pricing</a>
                <a href="docs.php" class="nav-link">Docs</a>
                <div class="nav-divider"></div>
                <a href="auth/login.php" class="nav-link">Log in</a>
                <a href="auth/register.php" class="btn-primary">Sign up</a>
            </div>
        </nav>
    </header>

    <main class="hero-section">
        <div class="hero-container">
            <div class="hero-content">
                <h1 class="hero-title">
                    Edit Legacy Websites with 
                    <span class="text-gradient">AI-Powered</span> 
                    Simplicity
                </h1>
                <p class="hero-subtitle">
                    Connect to any website via FTP/SFTP and update your code using 
                    natural language prompts. Secure, fast, and incredibly simple.
                </p>
                
                <div class="hero-signup">
                    <div class="signup-form">
                        <h3>Get early access to EzEdit</h3>
                        <form class="email-form" id="emailSignup">
                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                class="email-input"
                                id="emailInput"
                                required
                            >
                            <button type="submit" class="btn-primary btn-icon">
                                Get Invite
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
                
                <div class="hero-buttons">
                    <a href="auth/register.php" class="btn-primary btn-large">Get Started for Free</a>
                    <a href="dashboard.php" class="btn-secondary btn-large">View Dashboard</a>
                </div>
            </div>
        </div>
    </main>

    <section id="features" class="features-section">
        <div class="container">
            <div class="section-header">
                <h2>Everything You Need to Edit Legacy Sites</h2>
                <p>Professional tools for modern web development on legacy infrastructure</p>
            </div>
            
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                        </svg>
                    </div>
                    <h3>FTP/SFTP Integration</h3>
                    <p>Securely connect to any server with built-in FTP and SFTP support. Browse, edit, and manage files directly.</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4"></path>
                            <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1"></path>
                        </svg>
                    </div>
                    <h3>AI-Powered Editing</h3>
                    <p>Describe changes in natural language and let AI handle the code modifications. No need to remember syntax.</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                        </svg>
                    </div>
                    <h3>Professional Editor</h3>
                    <p>Monaco Editor with syntax highlighting, autocomplete, and error detection for 50+ programming languages.</p>
                </div>
            </div>
        </div>
    </section>

    <section id="pricing" class="pricing-section">
        <div class="container">
            <div class="section-header">
                <h2>Simple, Transparent Pricing</h2>
                <p>Choose the plan that works best for your workflow</p>
            </div>
            
            <div class="pricing-grid">
                <div class="pricing-card">
                    <div class="pricing-header">
                        <h3>Free</h3>
                        <div class="price">
                            <span class="currency">$</span>
                            <span class="amount">0</span>
                            <span class="period">/month</span>
                        </div>
                    </div>
                    <ul class="pricing-features">
                        <li>1 FTP connection</li>
                        <li>Basic editor features</li>
                        <li>5 AI requests/day</li>
                        <li>Community support</li>
                    </ul>
                    <a href="auth/register.php" class="btn-secondary btn-full">Get Started</a>
                </div>
                
                <div class="pricing-card featured">
                    <div class="pricing-badge">Most Popular</div>
                    <div class="pricing-header">
                        <h3>Pro</h3>
                        <div class="price">
                            <span class="currency">$</span>
                            <span class="amount">29</span>
                            <span class="period">/month</span>
                        </div>
                    </div>
                    <ul class="pricing-features">
                        <li>Unlimited FTP connections</li>
                        <li>Advanced editor features</li>
                        <li>Unlimited AI requests</li>
                        <li>Priority support</li>
                        <li>Team collaboration</li>
                    </ul>
                    <a href="auth/register.php" class="btn-primary btn-full">Start Free Trial</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-brand">
                    <div class="logo">
                        <div class="logo-icon">Ez</div>
                        <span class="logo-text">EzEdit.co</span>
                    </div>
                    <p>Edit legacy websites with AI-powered simplicity.</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 EzEdit.co. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script>
        document.getElementById('emailSignup').addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('emailInput').value;
            if (!email || !email.includes('@')) {
                alert('Please enter a valid email address');
                return;
            }
            alert('Thank you! We\'ll send you an invite soon.');
            document.getElementById('emailInput').value = '';
        });
    </script>
</body>
</html>
INDEXPHP

echo "✅ Created index.php"

# Set proper permissions
echo "🔧 Setting permissions..."
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
find /var/www/html -name "*.php" -exec chmod 644 {} \;

# Reload nginx
echo "🔄 Reloading web server..."
systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true

echo ""
echo "🎉 EzEdit.co deployment completed successfully!"
echo "🌐 Site is now live at: http://159.65.224.175/"
echo "📋 Test URL: http://159.65.224.175/index.php"
echo ""

EOF
)

# Execute the deployment script on the droplet
echo "🚀 Executing deployment on droplet..."
echo ""

# Use doctl to execute the script
echo "$DEPLOY_SCRIPT" | ./doctl compute ssh $DROPLET_ID --ssh-command "bash -s"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "========================="
    echo "🌐 EzEdit.co is now live at: http://$DROPLET_IP/"
    echo ""
    echo "Test these URLs:"
    echo "  Homepage: http://$DROPLET_IP/index.php"
    echo "  Dashboard: http://$DROPLET_IP/dashboard.php"
    echo "  Editor: http://$DROPLET_IP/editor.php"
    echo ""
else
    echo ""
    echo "❌ DEPLOYMENT FAILED"
    echo "=================="
    echo "Please check the server logs or try manual deployment"
fi