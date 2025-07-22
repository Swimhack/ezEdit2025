<?php
/**
 * EzEdit.co Stripe Checkout Session Creator
 * Handles subscription plan purchases
 */

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Stripe configuration (use environment variables in production)
$stripe_secret_key = $_ENV['STRIPE_SECRET_KEY'] ?? 'sk_test_placeholder';
$stripe_publishable_key = $_ENV['STRIPE_PUBLISHABLE_KEY'] ?? 'pk_live_51R9RpGAuYycpID5hykEKz1PLYpMC5f2xVcejaqipi31fCuAH4Yuwkxaz8oaTW1gxaZKFueKPfxBnj8zmsdhWICM7006c7mCTz2';

// Base URL for redirects
$base_url = isset($_SERVER['HTTPS']) ? 'https://' : 'http://';
$base_url .= $_SERVER['HTTP_HOST'];

// Subscription plans configuration
$plans = [
    'pro_monthly' => [
        'price_id' => 'price_1QXbhKAuYycpID5hJUv8QE1H',
        'amount' => 5000, // $50.00
        'currency' => 'usd',
        'interval' => 'month',
        'name' => 'Pro Monthly'
    ],
    'pro_yearly' => [
        'price_id' => 'price_1QXbhKAuYycpID5hJUv8QE1H_yearly',
        'amount' => 4000, // $40.00 (monthly equivalent for yearly)
        'currency' => 'usd', 
        'interval' => 'year',
        'name' => 'Pro Yearly'
    ],
    'lifetime' => [
        'price_id' => 'price_1QXbhKAuYycpID5hJUv8QE1H_lifetime',
        'amount' => 49700, // $497.00
        'currency' => 'usd',
        'interval' => 'one-time',
        'name' => 'Lifetime License'
    ]
];

try {
    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);
    
    $plan_id = $input['plan'] ?? '';
    $billing = $input['billing'] ?? 'monthly';
    $user_email = $input['userEmail'] ?? '';
    $user_id = $input['userId'] ?? '';
    
    if (empty($plan_id) || empty($user_email)) {
        throw new Exception('Plan and user email are required');
    }
    
    // Determine plan key
    $plan_key = $plan_id;
    if ($plan_id === 'pro') {
        $plan_key = $billing === 'yearly' ? 'pro_yearly' : 'pro_monthly';
    }
    
    if (!isset($plans[$plan_key])) {
        throw new Exception('Invalid plan selected');
    }
    
    $selected_plan = $plans[$plan_key];
    
    // For demo purposes, return mock checkout session
    // In production, integrate with actual Stripe API
    
    $session_data = [
        'id' => 'cs_mock_' . uniqid(),
        'url' => $base_url . '/checkout-demo.html?plan=' . urlencode($plan_key),
        'payment_status' => 'unpaid',
        'customer_email' => $user_email,
        'line_items' => [
            [
                'price' => $selected_plan,
                'quantity' => 1
            ]
        ],
        'mode' => $selected_plan['interval'] === 'one-time' ? 'payment' : 'subscription',
        'success_url' => $base_url . '/billing.html?success=true',
        'cancel_url' => $base_url . '/pricing.html?canceled=true',
        'metadata' => [
            'user_id' => $user_id,
            'plan' => $plan_id,
            'billing' => $billing
        ]
    ];
    
    // Return successful response
    echo json_encode([
        'success' => true,
        'sessionId' => $session_data['id'],
        'url' => $session_data['url'],
        'plan' => $selected_plan,
        'message' => 'Checkout session created successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

// Log request for debugging
if ($_ENV['NODE_ENV'] !== 'production') {
    error_log("Checkout request: " . json_encode($input ?? []));
}
?>