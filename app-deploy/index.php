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
