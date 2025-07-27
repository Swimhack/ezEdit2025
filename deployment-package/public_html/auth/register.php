<?php
/**
 * EzEdit.co - Registration Page
 */

session_start();

// Redirect if already logged in
if (isset($_SESSION['user_id'])) {
    header('Location: /dashboard.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign up - EzEdit.co</title>
    
    <!-- Styles -->
    <link rel="stylesheet" href="../css/main.css">
    <link rel="stylesheet" href="../css/auth.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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
                <a href="login.php" class="nav-link">Log in</a>
                <a href="register.php" class="btn-primary active">Sign up</a>
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main class="auth-main">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Create your account</h1>
                    <p>Get started with your free trial</p>
                </div>

                <form class="auth-form" id="registerForm">
                    <div class="form-group">
                        <label for="fullName">Full Name</label>
                        <input 
                            type="text" 
                            id="fullName" 
                            name="fullName" 
                            placeholder="John Doe" 
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="email">Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            placeholder="name@example.com" 
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="password">Password</label>
                        <div class="password-input-container">
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                placeholder="At least 8 characters"
                                required
                                minlength="8"
                            >
                            <button type="button" class="password-toggle" id="passwordToggle">
                                <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="btn-primary btn-full">
                        Create Account
                    </button>

                    <div class="auth-footer">
                        <p>Already have an account? <a href="login.php" class="auth-link">Sign in</a></p>
                    </div>
                </form>
            </div>
        </div>
    </main>

    <!-- Scripts -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const registerForm = document.getElementById('registerForm');
            const passwordToggle = document.getElementById('passwordToggle');
            const passwordInput = document.getElementById('password');

            // Password visibility toggle
            passwordToggle.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                passwordToggle.style.opacity = type === 'text' ? '0.7' : '1';
            });

            // Form submission
            registerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // For demo purposes - redirect to dashboard
                alert('Account created successfully! (This is a demo)');
                window.location.href = '../dashboard.php';
            });
        });
    </script>
</body>
</html>