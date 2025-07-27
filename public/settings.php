<?php
/**
 * EzEdit.co - Settings Page
 */

session_start();

// Redirect if not logged in
if (!isset($_SESSION['user_id']) && !isset($_SESSION['demo_mode'])) {
    header('Location: auth/login.php');
    exit;
}

// For demo purposes, set a user
if (!isset($_SESSION['user_id'])) {
    $_SESSION['demo_mode'] = true;
    $_SESSION['user_email'] = 'demo@ezedit.co';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings - EzEdit.co</title>
    
    <!-- Styles -->
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/dashboard.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        .settings-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .settings-header {
            margin-bottom: 3rem;
        }
        
        .settings-header h1 {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }
        
        .settings-header p {
            color: var(--text-secondary);
        }
        
        .settings-section {
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-lg);
            padding: 2rem;
            margin-bottom: 2rem;
        }
        
        .settings-section h2 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: var(--text-primary);
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .settings-form .form-group {
            margin-bottom: 1.5rem;
        }
        
        .settings-form label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }
        
        .settings-form input,
        .settings-form select,
        .settings-form textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            font-size: 0.875rem;
            transition: border-color 0.2s;
        }
        
        .settings-form input:focus,
        .settings-form select:focus,
        .settings-form textarea:focus {
            outline: none;
            border-color: var(--primary-blue);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .toggle-switch {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 0;
            border-bottom: 1px solid var(--border-color);
        }
        
        .toggle-switch:last-child {
            border-bottom: none;
        }
        
        .toggle-info h3 {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 0.25rem;
        }
        
        .toggle-info p {
            font-size: 0.75rem;
            color: var(--text-secondary);
        }
        
        .switch {
            position: relative;
            display: inline-block;
            width: 48px;
            height: 24px;
        }
        
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--gray-300);
            transition: .4s;
            border-radius: 24px;
        }
        
        .slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        
        input:checked + .slider {
            background-color: var(--primary-blue);
        }
        
        input:checked + .slider:before {
            transform: translateX(24px);
        }
        
        .danger-zone {
            background: #fef2f2;
            border: 1px solid #fecaca;
        }
        
        .danger-zone h2 {
            color: #dc2626;
        }
        
        .btn-danger {
            background: #dc2626;
            color: white;
        }
        
        .btn-danger:hover {
            background: #b91c1c;
        }
        
        @media (max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .settings-container {
                padding: 1rem;
            }
            
            .settings-section {
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <!-- Header Navigation -->
    <header class="header">
        <nav class="nav-container">
            <a href="index.php" class="logo">
                <div class="logo-icon">Ez</div>
                <span class="logo-text">EzEdit.co</span>
            </a>
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
                <a href="docs.php" class="nav-link">Docs</a>
                <div class="nav-divider"></div>
                <div class="nav-user">
                    <span class="user-email"><?php echo htmlspecialchars($_SESSION['user_email'] ?? 'demo@ezedit.co'); ?></span>
                    <div class="user-badge">
                        <span class="user-badge-icon">👤</span>
                        <span>Admin</span>
                    </div>
                    <a href="#" onclick="logout()" class="nav-link">Log out</a>
                </div>
            </div>
        </nav>
    </header>

    <!-- Dashboard Layout -->
    <div class="dashboard-layout">
        <!-- Sidebar -->
        <aside class="dashboard-sidebar">
            <nav class="sidebar-nav">
                <a href="dashboard.php" class="sidebar-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    Dashboard
                </a>
                <a href="sites.php" class="sidebar-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                    </svg>
                    My Sites
                </a>
                <a href="settings.php" class="sidebar-link active">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                    </svg>
                    Settings
                </a>
            </nav>
            
            <div class="sidebar-footer">
                <div class="upgrade-prompt">
                    <h4>Upgrade to Pro</h4>
                    <p>Unlock unlimited sites and AI requests</p>
                    <a href="index.php#pricing" class="btn-primary btn-sm">Upgrade Now</a>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="settings-container">
            <div class="settings-header">
                <h1>Settings</h1>
                <p>Manage your account settings and preferences</p>
            </div>

            <!-- Profile Settings -->
            <section class="settings-section">
                <h2>Profile Information</h2>
                <form class="settings-form" id="profileForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">First Name</label>
                            <input type="text" id="firstName" name="firstName" value="Demo" required>
                        </div>
                        <div class="form-group">
                            <label for="lastName">Last Name</label>
                            <input type="text" id="lastName" name="lastName" value="User" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($_SESSION['user_email'] ?? 'demo@ezedit.co'); ?>" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="timezone">Timezone</label>
                        <select id="timezone" name="timezone">
                            <option value="UTC">UTC</option>
                            <option value="America/New_York" selected>Eastern Time (US & Canada)</option>
                            <option value="America/Chicago">Central Time (US & Canada)</option>
                            <option value="America/Denver">Mountain Time (US & Canada)</option>
                            <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                            <option value="Europe/London">London</option>
                            <option value="Europe/Paris">Paris</option>
                            <option value="Asia/Tokyo">Tokyo</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="btn-primary">Save Changes</button>
                </form>
            </section>

            <!-- Security Settings -->
            <section class="settings-section">
                <h2>Security</h2>
                <form class="settings-form" id="securityForm">
                    <div class="form-group">
                        <label for="currentPassword">Current Password</label>
                        <input type="password" id="currentPassword" name="currentPassword">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="newPassword">New Password</label>
                            <input type="password" id="newPassword" name="newPassword">
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Confirm New Password</label>
                            <input type="password" id="confirmPassword" name="confirmPassword">
                        </div>
                    </div>
                    
                    <button type="submit" class="btn-primary">Update Password</button>
                </form>
                
                <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Two-Factor Authentication</h3>
                <div class="toggle-switch">
                    <div class="toggle-info">
                        <h3>Enable Two-Factor Authentication</h3>
                        <p>Add an extra layer of security to your account</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="enable2FA">
                        <span class="slider"></span>
                    </label>
                </div>
            </section>

            <!-- Preferences -->
            <section class="settings-section">
                <h2>Preferences</h2>
                
                <div class="toggle-switch">
                    <div class="toggle-info">
                        <h3>Dark Mode</h3>
                        <p>Use dark theme in the editor</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="darkMode" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="toggle-switch">
                    <div class="toggle-info">
                        <h3>Auto-save</h3>
                        <p>Automatically save changes every 30 seconds</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="autoSave" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="toggle-switch">
                    <div class="toggle-info">
                        <h3>Code Suggestions</h3>
                        <p>Show AI-powered code suggestions while typing</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="codeSuggestions" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="toggle-switch">
                    <div class="toggle-info">
                        <h3>Email Notifications</h3>
                        <p>Receive important updates and security alerts</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="emailNotifications" checked>
                        <span class="slider"></span>
                    </label>
                </div>
            </section>

            <!-- API Keys -->
            <section class="settings-section">
                <h2>API Keys</h2>
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">Manage your API keys for programmatic access</p>
                
                <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Production API Key</strong>
                            <p style="font-family: monospace; font-size: 0.875rem; margin-top: 0.25rem;">
                                eze_live_1234567890abcdef...
                            </p>
                        </div>
                        <button class="btn-secondary btn-sm">Regenerate</button>
                    </div>
                </div>
                
                <button class="btn-primary">Create New API Key</button>
            </section>

            <!-- Danger Zone -->
            <section class="settings-section danger-zone">
                <h2>Danger Zone</h2>
                <p style="margin-bottom: 1rem; color: #dc2626;">These actions are irreversible. Please be certain.</p>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-top: 1px solid #fecaca;">
                    <div>
                        <h3 style="font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Delete Account</h3>
                        <p style="font-size: 0.75rem; color: #7f1d1d;">Permanently delete your account and all data</p>
                    </div>
                    <button class="btn-danger">Delete Account</button>
                </div>
            </section>
        </main>
    </div>

    <!-- Scripts -->
    <script src="js/main.js"></script>
    <script>
        // Handle form submissions
        document.getElementById('profileForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show success message
            if (window.EzEdit && window.EzEdit.utils) {
                window.EzEdit.utils.showNotification('Profile updated successfully!', 'success');
            }
        });
        
        document.getElementById('securityForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate passwords match
            const newPass = document.getElementById('newPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;
            
            if (newPass && newPass !== confirmPass) {
                if (window.EzEdit && window.EzEdit.utils) {
                    window.EzEdit.utils.showNotification('Passwords do not match!', 'error');
                }
                return;
            }
            
            // Show success message
            if (window.EzEdit && window.EzEdit.utils) {
                window.EzEdit.utils.showNotification('Password updated successfully!', 'success');
            }
        });
        
        // Handle toggle switches
        document.querySelectorAll('.switch input').forEach(toggle => {
            toggle.addEventListener('change', function() {
                const setting = this.id;
                const enabled = this.checked;
                
                // Save preference
                localStorage.setItem(`ezedit_${setting}`, enabled);
                
                // Show notification
                if (window.EzEdit && window.EzEdit.utils) {
                    window.EzEdit.utils.showNotification(
                        `${setting.replace(/([A-Z])/g, ' $1').trim()} ${enabled ? 'enabled' : 'disabled'}`,
                        'info'
                    );
                }
            });
            
            // Load saved preference
            const saved = localStorage.getItem(`ezedit_${toggle.id}`);
            if (saved !== null) {
                toggle.checked = saved === 'true';
            }
        });
        
        // Logout function
        function logout() {
            sessionStorage.clear();
            localStorage.removeItem('ezedit_remember_token');
            window.location.href = 'auth/login.php';
        }
    </script>
</body>
</html>