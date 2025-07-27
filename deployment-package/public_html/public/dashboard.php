<?php
/**
 * EzEdit.co - Dashboard with Real Authentication
 * Matches the design from screenshot_my_sites.png
 */

require_once 'config/bootstrap.php';
require_once 'config/User.php';

$userAuth = new User();

// Check if user is authenticated
if (!$userAuth->isLoggedIn()) {
    header('Location: auth/login.php');
    exit;
}

$currentUser = $userAuth->getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - EzEdit.co</title>
    
    <!-- Styles -->
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/dashboard.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Supabase -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body class="dashboard-layout">
    <!-- Header Navigation -->
    <header class="header">
        <nav class="nav-container">
            <a href="index.php" class="logo">
                <div class="logo-icon">Ez</div>
                <span class="logo-text">EzEdit.co</span>
            </a>
            <div class="nav-menu">
                <a href="index.php#features" class="nav-link">Features</a>
                <a href="index.php#pricing" class="nav-link">Pricing</a>
                <a href="docs.php" class="nav-link">Docs</a>
                <div class="nav-divider"></div>
                <div class="nav-user-section">
                    <div class="nav-icon-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <rect x="7" y="7" width="3" height="9"></rect>
                            <rect x="14" y="7" width="3" height="5"></rect>
                        </svg>
                        <span>Dashboard</span>
                    </div>
                    <div class="user-badge">
                        <span class="user-badge-icon">👤</span>
                        <span>Admin</span>
                    </div>
                    <a href="#" onclick="logout()" class="nav-link">Log out</a>
                </div>
            </div>
        </nav>
    </header>

    <div class="dashboard-container">
        <!-- Sidebar Navigation -->
        <aside class="dashboard-sidebar">
            <div class="sidebar-header">
                <h2>Dashboard</h2>
            </div>
            <nav class="sidebar-nav">
                <a href="dashboard.php" class="sidebar-link active">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <rect x="7" y="7" width="3" height="9"></rect>
                        <rect x="14" y="7" width="3" height="5"></rect>
                    </svg>
                    <span>Dashboard</span>
                </a>
                <a href="sites.php" class="sidebar-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                    </svg>
                    <span>My Sites</span>
                </a>
                <a href="settings.php" class="sidebar-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span>Settings</span>
                </a>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="dashboard-main">
            <div class="main-header">
                <div class="main-title">
                    <h1>My FTP Sites</h1>
                </div>
                <div class="main-actions">
                    <button class="btn-primary btn-add-site" id="addSiteBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Site
                    </button>
                </div>
            </div>

            <!-- Trial Notice -->
            <div class="trial-notice">
                <div class="trial-content">
                    <strong>Free Trial Mode:</strong> You can browse and edit files, but saving changes requires a premium subscription.
                </div>
            </div>

            <!-- Sites Grid -->
            <div class="sites-grid" id="sitesGrid">
                <!-- Demo Site -->
                <div class="site-card">
                    <div class="site-header">
                        <div class="site-info">
                            <h3 class="site-name">Eastga...</h3>
                            <p class="site-host">Host: 72.167.42.141</p>
                            <a href="http://eastgateministrie..." class="site-url" target="_blank">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15,3 21,3 21,9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                                http://eastgateministrie...
                            </a>
                        </div>
                        <div class="site-actions">
                            <button class="btn-icon" title="Edit Connection">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon btn-icon-danger" title="Delete Site">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3,6 5,6 21,6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                            <div class="site-menu-toggle">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="19" cy="12" r="1"></circle>
                                    <circle cx="5" cy="12" r="1"></circle>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div class="site-footer">
                        <div class="site-status">
                            <div class="status-dot status-connected"></div>
                            <span>Connected</span>
                        </div>
                        <button class="btn-secondary site-connect-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4"></path>
                                <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1"></path>
                            </svg>
                            Open Editor
                        </button>
                    </div>
                </div>

                <!-- Add Site Card -->
                <div class="site-card site-card-add" id="addSiteCard">
                    <div class="add-site-content">
                        <div class="add-site-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </div>
                        <h3>Add New Site</h3>
                        <p>Connect to your FTP server to start editing files</p>
                        <button class="btn-primary">Add Site</button>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Add Site Modal -->
    <div class="modal" id="addSiteModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add FTP Site</h3>
                <button class="modal-close" id="closeModal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addSiteForm">
                    <div class="form-group">
                        <label for="siteName">Site Name</label>
                        <input type="text" id="siteName" placeholder="My Website" required>
                    </div>
                    <div class="form-group">
                        <label for="ftpHost">FTP Host</label>
                        <input type="text" id="ftpHost" placeholder="ftp.example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="ftpPort">Port</label>
                        <input type="number" id="ftpPort" value="21" required>
                    </div>
                    <div class="form-group">
                        <label for="ftpUsername">Username</label>
                        <input type="text" id="ftpUsername" required>
                    </div>
                    <div class="form-group">
                        <label for="ftpPassword">Password</label>
                        <input type="password" id="ftpPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="rootDirectory">Root Directory (Optional)</label>
                        <input type="text" id="rootDirectory" placeholder="/public_html">
                    </div>
                    <div class="form-group">
                        <label for="webUrl">Web URL (Optional)</label>
                        <input type="url" id="webUrl" placeholder="https://example.com">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" id="testConnection">Test Connection</button>
                        <button type="button" class="btn-secondary" id="cancelAdd">Cancel</button>
                        <button type="submit" class="btn-primary">Add Site</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="js/dashboard.js"></script>
    <script>
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            const addSiteBtn = document.getElementById('addSiteBtn');
            const addSiteCard = document.getElementById('addSiteCard');
            const addSiteModal = document.getElementById('addSiteModal');
            const closeModal = document.getElementById('closeModal');
            const cancelAdd = document.getElementById('cancelAdd');
            const testConnection = document.getElementById('testConnection');
            const addSiteForm = document.getElementById('addSiteForm');

            // Open modal
            function openModal() {
                addSiteModal.classList.add('show');
            }

            // Close modal
            function closeModalFunc() {
                addSiteModal.classList.remove('show');
                addSiteForm.reset();
            }

            // Event listeners
            addSiteBtn.addEventListener('click', openModal);
            addSiteCard.addEventListener('click', openModal);
            closeModal.addEventListener('click', closeModalFunc);
            cancelAdd.addEventListener('click', closeModalFunc);

            // Test connection
            testConnection.addEventListener('click', async function() {
                const button = this;
                const originalText = button.textContent;
                
                button.textContent = 'Testing...';
                button.disabled = true;
                
                // Simulate connection test
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                button.textContent = 'Connection Successful!';
                button.style.background = 'var(--success-color)';
                button.style.color = 'white';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                    button.style.background = '';
                    button.style.color = '';
                }, 2000);
            });

            // Form submission
            addSiteForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Get form data
                const formData = new FormData(this);
                const siteData = Object.fromEntries(formData);
                
                // Add site to grid (demo)
                alert('Site added successfully! (This is a demo)');
                closeModalFunc();
            });

            // Close modal on backdrop click
            addSiteModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModalFunc();
                }
            });

            // Site connect buttons
            document.querySelectorAll('.site-connect-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    window.location.href = 'editor.php';
                });
            });
        });
    </script>
</body>
</html>