<?php
// public/auth/login.php

// Check if already authenticated, redirect to dashboard
// This will be handled by a shared PHP function later
// For now, assume unauthenticated

$message = '';
if (isset($_GET['message'])) {
    $message = htmlspecialchars($_GET['message']);
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - ezEdit</title>
    <link href="/css/styles.css" rel="stylesheet"> <!-- Assuming a global stylesheet -->
    <script type="module" src="/js/supabaseClient.js"></script>
    <script type="module" src="/js/supabaseAuthService.js"></script>
</head>
<body class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 class="text-2xl font-bold text-center">Login to ezEdit</h2>
        <?php if ($message): ?>
            <div class="p-3 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
                <?php echo $message; ?>
            </div>
        <?php endif; ?>
        <form id="login-form" class="space-y-4">
            <div>
                <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" name="email" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            </div>
            <div>
                <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" id="password" name="password" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            </div>
            <div id="error-message" class="text-red-500 text-sm hidden"></div>
            <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Sign In
            </button>
        </form>
        <p class="text-center text-sm text-gray-600">
            Don't have an account? <a href="/auth/signup.php" class="font-medium text-blue-600 hover:text-blue-500">Sign Up</a>
        </p>
    </div>

    <script type="module">
        import { signInUser, getSession } from '/js/supabaseAuthService.js';

        document.addEventListener('DOMContentLoaded', async () => {
            // Redirect if already authenticated
            const session = await getSession();
            if (session) {
                window.location.href = '/system/dashboard.php';
                return;
            }

            const loginForm = document.getElementById('login-form');
            const errorMessageDiv = document.getElementById('error-message');

            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                errorMessageDiv.classList.add('hidden');
                errorMessageDiv.textContent = '';

                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                const { success, error } = await signInUser(email, password);

                if (success) {
                    // Session is automatically stored in sessionStorage by supabaseAuthService.js
                    window.location.href = '/system/dashboard.php';
                } else {
                    errorMessageDiv.textContent = error || 'An unknown error occurred.';
                    errorMessageDiv.classList.remove('hidden');
                }
            });
        });
    </script>
</body>
</html>
