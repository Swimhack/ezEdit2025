<?php
/**
 * EzEdit.co - Password Reset Page
 */

session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - EzEdit.co</title>
    
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
                <a href="../docs.php" class="nav-link">Docs</a>
                <div class="nav-divider"></div>
                <a href="login.php" class="nav-link">Log in</a>
                <a href="register.php" class="btn-primary">Sign up</a>
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main class="auth-main">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Reset your password</h1>
                    <p>Enter your email address and we'll send you a link to reset your password</p>
                </div>

                <form class="auth-form" id="resetForm">
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

                    <button type="submit" class="btn-primary btn-full" id="resetButton">
                        Send Reset Link
                    </button>

                    <div class="auth-footer">
                        <p>Remember your password? <a href="login.php" class="auth-link">Sign in</a></p>
                    </div>
                </form>

                <!-- Success Message -->
                <div class="success-message" id="successMessage" style="display: none;">
                    <div class="success-content">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        <span>If an account with that email exists, we've sent you a password reset link.</span>
                    </div>
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
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const resetForm = document.getElementById('resetForm');
            const resetButton = document.getElementById('resetButton');
            const successMessage = document.getElementById('successMessage');
            const errorMessage = document.getElementById('errorMessage');
            const errorClose = document.getElementById('errorClose');

            // Error message close
            errorClose.addEventListener('click', function() {
                errorMessage.style.display = 'none';
            });

            // Form submission
            resetForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value;

                // Show loading state
                const originalText = resetButton.textContent;
                resetButton.textContent = 'Sending...';
                resetButton.disabled = true;

                // Hide messages
                successMessage.style.display = 'none';
                errorMessage.style.display = 'none';

                try {
                    // Simulate password reset request
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Show success message
                    resetForm.style.display = 'none';
                    successMessage.style.display = 'flex';
                    
                } catch (error) {
                    // Show error message
                    errorMessage.style.display = 'flex';
                } finally {
                    // Reset button
                    resetButton.textContent = originalText;
                    resetButton.disabled = false;
                }
            });
        });
    </script>
</body>
</html>