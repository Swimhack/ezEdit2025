<?php
// public/auth/signup.php

// Check if already authenticated, redirect to dashboard
// This will be handled by a shared PHP function later
// For now, assume unauthenticated

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up - ezEdit</title>
    <link href="/css/styles.css" rel="stylesheet"> <!-- Assuming a global stylesheet -->
    <script type="module" src="/js/supabaseClient.js"></script>
    <script type="module" src="/js/supabaseAuthService.js"></script>
</head>
<body class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 class="text-2xl font-bold text-center">Sign Up for ezEdit</h2>
        <form id="signup-form" class="space-y-4">
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
                Sign Up
            </button>
        </form>
        <p class="text-center text-sm text-gray-600">
            Already have an account? <a href="/auth/login.php" class="font-medium text-blue-600 hover:text-blue-500">Log In</a>
        </p>
    </div>

    <script type="module">
        import { signUpUser, getSession } from '/js/supabaseAuthService.js';

        document.addEventListener('DOMContentLoaded', async () => {
            // Redirect if already authenticated
            const session = await getSession();
            if (session) {
                window.location.href = '/system/dashboard.php';
                return;
            }

            const signupForm = document.getElementById('signup-form');
            const errorMessageDiv = document.getElementById('error-message');

            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                errorMessageDiv.classList.add('hidden');
                errorMessageDiv.textContent = '';

                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                const { success, error } = await signUpUser(email, password);

                if (success) {
                    window.location.href = '/auth/login.php?message=' + encodeURIComponent('Please check your email for a confirmation link.');
                } else {
                    errorMessageDiv.textContent = error || 'An unknown error occurred.';
                    errorMessageDiv.classList.remove('hidden');
                }
            });
        });
    </script>
</body>
</html>
