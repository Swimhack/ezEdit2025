<?php
/**
 * EzEdit.co - Documentation Page
 */

session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation - EzEdit.co</title>
    <meta name="description" content="Learn how to use EzEdit.co to edit your legacy websites with AI-powered simplicity.">
    
    <!-- Styles -->
    <link rel="stylesheet" href="css/main.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        .docs-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            display: grid;
            grid-template-columns: 250px 1fr;
            gap: 3rem;
            margin-top: 2rem;
        }
        
        .docs-sidebar {
            position: sticky;
            top: 2rem;
            height: fit-content;
        }
        
        .docs-nav {
            background: var(--bg-secondary);
            border-radius: var(--border-radius-lg);
            padding: 1.5rem;
        }
        
        .docs-nav h3 {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-bottom: 1rem;
        }
        
        .docs-nav-link {
            display: block;
            padding: 0.5rem 0.75rem;
            color: var(--text-secondary);
            text-decoration: none;
            border-radius: var(--border-radius);
            transition: all 0.2s;
            margin-bottom: 0.25rem;
        }
        
        .docs-nav-link:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }
        
        .docs-nav-link.active {
            background: var(--primary-blue);
            color: white;
        }
        
        .docs-content {
            max-width: 800px;
        }
        
        .docs-section {
            margin-bottom: 4rem;
        }
        
        .docs-section h2 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--text-primary);
        }
        
        .docs-section h3 {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 2rem 0 1rem;
            color: var(--text-primary);
        }
        
        .docs-section p {
            line-height: 1.7;
            color: var(--text-secondary);
            margin-bottom: 1rem;
        }
        
        .code-block {
            background: var(--gray-900);
            color: #e5e7eb;
            padding: 1.5rem;
            border-radius: var(--border-radius);
            overflow-x: auto;
            margin: 1rem 0;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
        }
        
        .docs-video {
            background: var(--bg-secondary);
            border-radius: var(--border-radius-lg);
            padding: 2rem;
            text-align: center;
            margin: 2rem 0;
        }
        
        .docs-video iframe {
            max-width: 100%;
            border-radius: var(--border-radius);
        }
        
        @media (max-width: 768px) {
            .docs-container {
                grid-template-columns: 1fr;
                gap: 2rem;
            }
            
            .docs-sidebar {
                position: static;
            }
        }
    </style>
</head>
<body>
    <!-- Header Navigation -->
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
                <a href="index.php#features" class="nav-link">Features</a>
                <a href="index.php#pricing" class="nav-link">Pricing</a>
                <a href="docs.php" class="nav-link active">Docs</a>
                <div class="nav-divider"></div>
                <?php if (isset($_SESSION['user_id'])): ?>
                    <a href="dashboard.php" class="nav-link">Dashboard</a>
                    <a href="#" onclick="logout()" class="btn-secondary">Log out</a>
                <?php else: ?>
                    <a href="auth/login.php" class="nav-link">Log in</a>
                    <a href="auth/register.php" class="btn-primary">Sign up</a>
                <?php endif; ?>
            </div>
        </nav>
    </header>

    <!-- Documentation Content -->
    <main class="docs-container">
        <!-- Sidebar Navigation -->
        <aside class="docs-sidebar">
            <nav class="docs-nav">
                <h3>Getting Started</h3>
                <a href="#quick-start" class="docs-nav-link active">Quick Start</a>
                <a href="#installation" class="docs-nav-link">Installation</a>
                <a href="#first-connection" class="docs-nav-link">First Connection</a>
                
                <h3 style="margin-top: 1.5rem;">Core Features</h3>
                <a href="#ftp-connection" class="docs-nav-link">FTP/SFTP Connection</a>
                <a href="#editor" class="docs-nav-link">Code Editor</a>
                <a href="#ai-assistant" class="docs-nav-link">AI Assistant</a>
                <a href="#file-management" class="docs-nav-link">File Management</a>
                
                <h3 style="margin-top: 1.5rem;">Advanced</h3>
                <a href="#security" class="docs-nav-link">Security</a>
                <a href="#api" class="docs-nav-link">API Reference</a>
                <a href="#troubleshooting" class="docs-nav-link">Troubleshooting</a>
            </nav>
        </aside>

        <!-- Main Documentation -->
        <div class="docs-content">
            <section id="quick-start" class="docs-section">
                <h2>Quick Start Guide</h2>
                <p>Welcome to EzEdit.co! This guide will help you get started with editing your legacy websites in just a few minutes.</p>
                
                <div class="docs-video">
                    <h3>Watch the Quick Start Video</h3>
                    <p>Learn the basics in under 5 minutes</p>
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>
                </div>
                
                <h3>Step 1: Create Your Account</h3>
                <p>Sign up for a free account at <a href="auth/register.php">ezedit.co/register</a>. You'll get 7 days of full access to try all features.</p>
                
                <h3>Step 2: Add Your First Site</h3>
                <p>Once logged in, click "Add New Site" from your dashboard and enter your FTP credentials:</p>
                
                <div class="code-block">
Host: ftp.yoursite.com
Port: 21 (or 22 for SFTP)
Username: your-ftp-username
Password: your-ftp-password
                </div>
                
                <h3>Step 3: Start Editing</h3>
                <p>Click "Open Editor" on any of your connected sites. The three-pane editor will load with:</p>
                <ul style="margin-left: 2rem; color: var(--text-secondary);">
                    <li>File explorer on the left</li>
                    <li>Monaco code editor in the center</li>
                    <li>AI assistant (Klein) on the right</li>
                </ul>
            </section>

            <section id="installation" class="docs-section">
                <h2>Installation</h2>
                <p>EzEdit.co is a web-based application - no installation required! Simply visit <a href="https://ezedit.co">ezedit.co</a> from any modern browser.</p>
                
                <h3>System Requirements</h3>
                <ul style="margin-left: 2rem; color: var(--text-secondary);">
                    <li>Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)</li>
                    <li>Stable internet connection</li>
                    <li>FTP/SFTP access to your web server</li>
                </ul>
                
                <h3>Browser Extensions</h3>
                <p>For enhanced functionality, install our optional browser extensions:</p>
                <ul style="margin-left: 2rem; color: var(--text-secondary);">
                    <li><strong>Chrome Extension:</strong> Coming soon</li>
                    <li><strong>Firefox Add-on:</strong> Coming soon</li>
                </ul>
            </section>

            <section id="ftp-connection" class="docs-section">
                <h2>FTP/SFTP Connection</h2>
                <p>EzEdit.co supports both standard FTP and secure SFTP connections to your web servers.</p>
                
                <h3>Connection Settings</h3>
                <div class="code-block">
// Standard FTP
Host: ftp.example.com
Port: 21
Protocol: FTP

// Secure FTP (FTPS)
Host: ftp.example.com
Port: 21
Protocol: FTPS (Explicit)

// SSH File Transfer Protocol (SFTP)
Host: ssh.example.com
Port: 22
Protocol: SFTP
                </div>
                
                <h3>Security Best Practices</h3>
                <ul style="margin-left: 2rem; color: var(--text-secondary);">
                    <li>Always use SFTP when available for encrypted connections</li>
                    <li>Use strong, unique passwords for each FTP account</li>
                    <li>Enable two-factor authentication on your EzEdit.co account</li>
                    <li>Regularly rotate your FTP credentials</li>
                </ul>
            </section>

            <section id="ai-assistant" class="docs-section">
                <h2>AI Assistant (Klein)</h2>
                <p>Klein is your AI-powered coding assistant, integrated directly into the editor. Use natural language to:</p>
                
                <h3>Code Generation</h3>
                <div class="code-block">
// Example prompt:
"Create a responsive navigation menu with hamburger icon for mobile"

// Klein will generate complete HTML, CSS, and JavaScript
                </div>
                
                <h3>Code Explanation</h3>
                <p>Select any code and ask Klein to explain what it does, identify potential issues, or suggest improvements.</p>
                
                <h3>Available Commands</h3>
                <ul style="margin-left: 2rem; color: var(--text-secondary);">
                    <li><strong>/explain</strong> - Explain selected code</li>
                    <li><strong>/optimize</strong> - Suggest performance improvements</li>
                    <li><strong>/debug</strong> - Help identify and fix bugs</li>
                    <li><strong>/refactor</strong> - Improve code structure</li>
                    <li><strong>/test</strong> - Generate unit tests</li>
                </ul>
            </section>

            <section id="troubleshooting" class="docs-section">
                <h2>Troubleshooting</h2>
                
                <h3>Common Issues</h3>
                
                <h4>Cannot connect to FTP server</h4>
                <p>Check the following:</p>
                <ul style="margin-left: 2rem; color: var(--text-secondary);">
                    <li>Verify your FTP credentials are correct</li>
                    <li>Ensure your server allows FTP connections from our IP addresses</li>
                    <li>Check if you need to use SFTP (port 22) instead of FTP (port 21)</li>
                    <li>Contact your hosting provider to verify FTP access is enabled</li>
                </ul>
                
                <h4>Editor not loading</h4>
                <p>Try these solutions:</p>
                <ul style="margin-left: 2rem; color: var(--text-secondary);">
                    <li>Clear your browser cache and cookies</li>
                    <li>Disable browser extensions that might interfere</li>
                    <li>Try a different browser</li>
                    <li>Check your internet connection stability</li>
                </ul>
                
                <h3>Get Help</h3>
                <p>If you need additional assistance:</p>
                <ul style="margin-left: 2rem; color: var(--text-secondary);">
                    <li>Email: support@ezedit.co</li>
                    <li>Live Chat: Available in the dashboard</li>
                    <li>Community Forum: Coming soon</li>
                </ul>
            </section>
        </div>
    </main>

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
                <div class="footer-links">
                    <div class="footer-column">
                        <h4>Product</h4>
                        <a href="index.php#features">Features</a>
                        <a href="index.php#pricing">Pricing</a>
                        <a href="docs.php">Documentation</a>
                        <a href="#api">API</a>
                    </div>
                    <div class="footer-column">
                        <h4>Company</h4>
                        <a href="#about">About</a>
                        <a href="#blog">Blog</a>
                        <a href="#careers">Careers</a>
                        <a href="#contact">Contact</a>
                    </div>
                    <div class="footer-column">
                        <h4>Support</h4>
                        <a href="#help">Help Center</a>
                        <a href="#status">Status</a>
                        <a href="#security">Security</a>
                        <a href="#privacy">Privacy</a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 EzEdit.co. All rights reserved.</p>
                <div class="footer-legal">
                    <a href="#terms">Terms</a>
                    <a href="#privacy">Privacy</a>
                    <a href="#cookies">Cookies</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="js/main.js"></script>
    <script>
        // Smooth scroll for docs navigation
        document.querySelectorAll('.docs-nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Update active state
                document.querySelectorAll('.docs-nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Scroll to section
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    </script>
</body>
</html>