<?php
/**
 * Authentication Controller
 * Handles user authentication and plan management
 */

namespace App\Controllers;

class AuthController {
    private $supabaseUrl;
    private $supabaseKey;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->supabaseUrl = getenv('SUPABASE_URL');
        $this->supabaseKey = getenv('SUPABASE_KEY');
    }
    
    /**
     * Authenticate user with email and password
     * 
     * @param string $email User email
     * @param string $password User password
     * @return array Authentication result
     */
    public function login($email, $password) {
        // Validate input
        if (empty($email) || empty($password)) {
            return [
                'success' => false,
                'error' => 'Email and password are required',
                'error_code' => 'AUTH_ERR_MISSING_CREDENTIALS'
            ];
        }
        
        // Make API request to Supabase
        $ch = curl_init($this->supabaseUrl . '/auth/v1/token?grant_type=password');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'email' => $email,
            'password' => $password
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'apikey: ' . $this->supabaseKey
        ]);
        
        $response = curl_exec($ch);
        $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        // Parse response
        $data = json_decode($response, true);
        
        if ($status_code !== 200 || !isset($data['access_token'])) {
            return [
                'success' => false,
                'error' => isset($data['error_description']) ? $data['error_description'] : 'Authentication failed',
                'error_code' => 'AUTH_ERR_INVALID_CREDENTIALS'
            ];
        }
        
        // Get user data
        $user_data = $this->getUserData($data['access_token']);
        
        // Store token in session
        $_SESSION['user_token'] = $data['access_token'];
        $_SESSION['user_id'] = $user_data['id'];
        $_SESSION['user_email'] = $user_data['email'];
        
        return [
            'success' => true,
            'token' => $data['access_token'],
            'user' => $user_data
        ];
    }
    
    /**
     * Register a new user
     * 
     * @param string $email User email
     * @param string $password User password
     * @return array Registration result
     */
    public function register($email, $password) {
        // Validate input
        if (empty($email) || empty($password)) {
            return [
                'success' => false,
                'error' => 'Email and password are required',
                'error_code' => 'AUTH_ERR_MISSING_CREDENTIALS'
            ];
        }
        
        // Make API request to Supabase
        $ch = curl_init($this->supabaseUrl . '/auth/v1/signup');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'email' => $email,
            'password' => $password
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'apikey: ' . $this->supabaseKey
        ]);
        
        $response = curl_exec($ch);
        $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        // Parse response
        $data = json_decode($response, true);
        
        if ($status_code !== 200 || !isset($data['id'])) {
            return [
                'success' => false,
                'error' => isset($data['msg']) ? $data['msg'] : 'Registration failed',
                'error_code' => 'AUTH_ERR_REGISTRATION_FAILED'
            ];
        }
        
        return [
            'success' => true,
            'message' => 'Registration successful. Please check your email to confirm your account.',
            'user' => [
                'id' => $data['id'],
                'email' => $data['email']
            ]
        ];
    }
    
    /**
     * Logout current user
     * 
     * @return array Logout result
     */
    public function logout() {
        // Check if user is logged in
        if (!isset($_SESSION['user_token'])) {
            return [
                'success' => false,
                'error' => 'No active session',
                'error_code' => 'AUTH_ERR_NO_SESSION'
            ];
        }
        
        $token = $_SESSION['user_token'];
        
        // Make API request to Supabase
        $ch = curl_init($this->supabaseUrl . '/auth/v1/logout');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'apikey: ' . $this->supabaseKey,
            'Authorization: Bearer ' . $token
        ]);
        
        curl_exec($ch);
        curl_close($ch);
        
        // Clear session
        unset($_SESSION['user_token']);
        unset($_SESSION['user_id']);
        unset($_SESSION['user_email']);
        
        return [
            'success' => true,
            'message' => 'Logged out successfully'
        ];
    }
    
    /**
     * Get user plan information
     * 
     * @param string $user_id User ID
     * @return array User plan information
     */
    public function getUserPlan($user_id = null) {
        // Use current user if no user_id provided
        if ($user_id === null) {
            if (!isset($_SESSION['user_id'])) {
                return [
                    'success' => false,
                    'error' => 'No active session',
                    'error_code' => 'AUTH_ERR_NO_SESSION'
                ];
            }
            
            $user_id = $_SESSION['user_id'];
        }
        
        // Make API request to Supabase
        $token = $_SESSION['user_token'] ?? null;
        if (!$token) {
            return [
                'success' => false,
                'error' => 'No active session',
                'error_code' => 'AUTH_ERR_NO_SESSION'
            ];
        }
        
        $ch = curl_init($this->supabaseUrl . '/rest/v1/user_plans?user_id=eq.' . urlencode($user_id));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $this->supabaseKey,
            'Authorization: Bearer ' . $token
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        // Parse response
        $data = json_decode($response, true);
        
        if (!is_array($data) || empty($data)) {
            // No plan found, assume free trial
            return [
                'success' => true,
                'plan' => 'free_trial',
                'trial_end' => date('Y-m-d', strtotime('+7 days')),
                'can_save' => false,
                'can_publish' => false
            ];
        }
        
        $plan = $data[0];
        
        return [
            'success' => true,
            'plan' => $plan['plan_type'],
            'trial_end' => $plan['trial_end'] ?? null,
            'subscription_id' => $plan['subscription_id'] ?? null,
            'can_save' => $plan['plan_type'] === 'pro',
            'can_publish' => $plan['plan_type'] === 'pro'
        ];
    }
    
    /**
     * Upgrade user to Pro plan
     * 
     * @param string $payment_method_id Stripe payment method ID
     * @return array Upgrade result
     */
    public function upgradeToPro($payment_method_id) {
        // Check if user is logged in
        if (!isset($_SESSION['user_id'])) {
            return [
                'success' => false,
                'error' => 'No active session',
                'error_code' => 'AUTH_ERR_NO_SESSION'
            ];
        }
        
        $user_id = $_SESSION['user_id'];
        $token = $_SESSION['user_token'];
        
        // Make API request to our subscription endpoint
        // In a real implementation, this would call Stripe API
        $ch = curl_init($this->supabaseUrl . '/rest/v1/rpc/create_subscription');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'user_id' => $user_id,
            'payment_method_id' => $payment_method_id,
            'price_id' => 'price_subPro_$100' // From .env
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'apikey: ' . $this->supabaseKey,
            'Authorization: Bearer ' . $token
        ]);
        
        $response = curl_exec($ch);
        $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        // Parse response
        $data = json_decode($response, true);
        
        if ($status_code !== 200 || !isset($data['subscription_id'])) {
            return [
                'success' => false,
                'error' => isset($data['error']) ? $data['error'] : 'Subscription creation failed',
                'error_code' => 'PAYMENT_ERR_SUBSCRIPTION_FAILED'
            ];
        }
        
        return [
            'success' => true,
            'message' => 'Upgraded to Pro plan successfully',
            'subscription_id' => $data['subscription_id']
        ];
    }
    
    /**
     * Get user data from token
     * 
     * @param string $token JWT token
     * @return array User data
     */
    private function getUserData($token) {
        $ch = curl_init($this->supabaseUrl . '/auth/v1/user');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $this->supabaseKey,
            'Authorization: Bearer ' . $token
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
}
