<?php
// public/system/dashboard.php

// Check if already authenticated via session (server-side)
// This is a placeholder for a more robust server-side session management.
// For now, we'll rely on client-side JS to get the session.
// In a real PHP app, you'd verify a server-side session here.

// For now, the client-side JS handles the redirect if not authenticated.
// This PHP block is a placeholder for future server-side authentication logic.

?>
<?php
// This is a basic server-side check. A more robust solution would involve
// validating a session token with Supabase from the server.
// For now, we'll let the client-side JavaScript handle the immediate redirect.
// This block is primarily for demonstrating where server-side checks would go.
// It will be expanded upon later if a full PHP session management is required.

// Example of a simple server-side check (requires session_start() and session management)
// if (!isset($_SESSION['user_id'])) {
//     header('Location: /auth/login.php');
//     exit();
// }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - ezEdit</title>
    <link href="/css/styles.css" rel="stylesheet"> <!-- Assuming a global stylesheet -->
    <script type="module" src="/js/supabaseClient.js"></script>
    <script type="module" src="/js/supabaseAuthService.js"></script>
</head>
<body class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <h2 class="text-2xl font-bold">Welcome to your ezEdit Dashboard!</h2>
        <p class="text-gray-700">You are logged in.</p>
        <button id="logout-button" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            Logout
        </button>
    </div>

    <script type="module">
        import { getSession, signOutUser } from '/js/supabaseAuthService.js';

        document.addEventListener('DOMContentLoaded', async () => {
            const session = await getSession();
            if (!session) {
                // Not authenticated, redirect to login page
                window.location.href = '/auth/login.php';
                return;
            }

            // User is authenticated, display dashboard content
            console.log('User authenticated. Session:', session);

            const logoutButton = document.getElementById('logout-button');
            logoutButton.addEventListener('click', async () => {
                const { success } = await signOutUser();
                if (success) {
                    window.location.href = '/auth/login.php';
                } else {
                    alert('Failed to log out. Please try again.');
                }
            });
        });
    </script>
</body>
</html>
