<?php
/**
 * EzEdit.co - Login Page with Mock Authentication
 */

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
        $_SESSION['user_id'] = 1; // Mock user ID
        
        // Redirect to dashboard
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
    <title>Welcome back - EzEdit.co</title>
    
    <!-- Styles -->
    <link rel="stylesheet" href="../css/main.css">
    <link rel="stylesheet" href="../css/auth.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Supabase -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body class="auth-page">
    <!-- Header Navigation -->
    <header class="header">
        <nav class="nav-container">
            <a href="../index.php" class="logo">
                <div class="logo-icon">Ez</div>
                <span class="logo-text">EzEdit.co</span>
            </a>
            <div class="nav-menu">
                <a href="../index.php#features" class="nav-link">Features</a>
                <a href="../index.php#pricing" class="nav-link">Pricing</a>
                <a href="#docs" class="nav-link">Docs</a>
                <div class="nav-divider"></div>
                <a href="login.php" class="nav-link active">Log in</a>
                <a href="register.php" class="btn-primary">Sign up</a>
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main class="auth-main">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Welcome back</h1>
                    <p>Sign in to your account</p>
                </div>

                <form class="auth-form" id="loginForm" method="POST">
                    <div class="form-section">
                        <h2>Sign In</h2>
                        <p class="form-subtitle">Enter your credentials to access your account</p>
                        <?php if (isset($error)): ?>
                        <div class="error-message" style="display: block; margin-bottom: 1rem;">
                            <div class="error-content">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                                <span><?php echo htmlspecialchars($error); ?></span>
                            </div>
                        </div>
                        <?php endif; ?>
                        <div class="demo-info" style="background: #f0f9ff; border: 1px solid #bae6fd; color: #0c4a6e; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem;">
                            <strong>Demo Mode:</strong> Enter any email and password (6+ characters) to sign in.
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="email">Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            placeholder="name@example.com" 
                            required
                            autocomplete="email"
                        >
                    </div>

                    <div class="form-group">
                        <div class="form-group-header">
                            <label for="password">Password</label>
                            <a href="reset-password.php" class="forgot-link">Forgot password?</a>
                        </div>
                        <div class="password-input-container">
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                required
                                autocomplete="current-password"
                            >
                            <button type="button" class="password-toggle" id="passwordToggle">
                                <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="remember" name="remember">
                            <span class="checkbox-text">Remember me for 30 days</span>
                        </label>
                    </div>

                    <button type="submit" class="btn-primary btn-full btn-with-icon" id="loginButton">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10,17 15,12 10,7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                        Sign in
                    </button>

                    <div class="auth-footer">
                        <p>Don't have an account? <a href="register.php" class="auth-link">Sign up</a></p>
                    </div>
                </form>

                <!-- Loading State -->
                <div class="loading-overlay" id="loadingOverlay" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p>Signing you in...</p>
                </div>

                <!-- Error Message -->
                <div class="error-message" id="errorMessage" style="display: none;">
                    <div class="error-content">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <span id="errorText">Something went wrong. Please try again.</span>
                    </div>
                    <button class="error-close" id="errorClose">&times;</button>
                </div>
            </div>
        </div>
    </main>

    <!-- Scripts -->
    <script src="../js/auth.js"></script>
    <script>
        // Initialize login functionality
        document.addEventListener('DOMContentLoaded', function() {
            const loginForm = document.getElementById('loginForm');
            const passwordToggle = document.getElementById('passwordToggle');
            const passwordInput = document.getElementById('password');
            const loadingOverlay = document.getElementById('loadingOverlay');
            const errorMessage = document.getElementById('errorMessage');
            const errorText = document.getElementById('errorText');
            const errorClose = document.getElementById('errorClose');

            // Password visibility toggle
            passwordToggle.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                // Update icon (you could add different icons here)
                passwordToggle.style.opacity = type === 'text' ? '0.7' : '1';
            });

            // Error message close
            errorClose.addEventListener('click', function() {
                errorMessage.style.display = 'none';
            });

            // Form submission
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const remember = document.getElementById('remember').checked;

                // Show loading state
                loadingOverlay.style.display = 'flex';
                errorMessage.style.display = 'none';

                try {
                    // Simulate login process (replace with actual authentication)
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // For demo purposes - you would replace this with actual Supabase auth
                    if (email && password.length >= 6) {
                        // Successful login
                        window.location.href = '../dashboard.php';
                    } else {
                        throw new Error('Invalid email or password. Please check your credentials and try again.');
                    }
                } catch (error) {
                    // Show error message
                    loadingOverlay.style.display = 'none';
                    errorText.textContent = error.message;
                    errorMessage.style.display = 'flex';
                }
            });

            // Auto-hide error message after 5 seconds
            let errorTimeout;
            const showError = (message) => {
                clearTimeout(errorTimeout);
                errorText.textContent = message;
                errorMessage.style.display = 'flex';
                errorTimeout = setTimeout(() => {
                    errorMessage.style.display = 'none';
                }, 5000);
            };
        });
    </script>
</body>
</html>