<?php
header("Content-Type: application/json");

// Load environment variables from .env file
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
  $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  foreach ($lines as $line) {
    if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
      list($key, $value) = explode('=', $line, 2);
      $_ENV[$key] = $value;
      putenv("$key=$value");
    }
  }
}

// Helper function to get environment variables
function env($key, $default = null) {
  return isset($_ENV[$key]) ? $_ENV[$key] : (getenv($key) ?: $default);
}

// Authentication middleware
function authenticate() {
  $headers = getallheaders();
  $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
  
  if (empty($authHeader) || !preg_match('/Bearer\s+(.*)/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode([
      "status" => "error",
      "message" => "Unauthorized: No valid authentication token provided"
    ]);
    exit;
  }
  
  $token = $matches[1];
  
  // Verify token with Supabase (simplified)
  // In a production app, you would make an API call to Supabase to verify the token
  // For now, we'll just check if it's not empty
  if (empty($token)) {
    http_response_code(401);
    echo json_encode([
      "status" => "error",
      "message" => "Unauthorized: Invalid token"
    ]);
    exit;
  }
  
  return $token;
}

// FTP save action
if ($_GET["action"] === "save") {
  // Require authentication for save operations
  authenticate();
  
  $content = $_POST["content"] ?? "";
  $path    = $_POST["path"]    ?? "/index.html";

  $ftp = ftp_connect(env("EZ_FTP_HOST", "ftp.test.rebex.net"));
  ftp_login($ftp, env("EZ_FTP_USER", "demo"), env("EZ_FTP_PASS", "password"));

  $tmp = tmpfile();
  fwrite($tmp, $content);
  rewind($tmp);
  
  $result = ftp_fput($ftp, $path, $tmp, FTP_ASCII);
  fclose($tmp);
  ftp_close($ftp);
  
  echo json_encode([
    "status" => $result ? "ok" : "error",
    "message" => $result ? "File saved successfully" : "Failed to save file"
  ]);
  exit;
}

// Auth verification endpoint
if ($_GET["action"] === "verify-auth") {
  try {
    $token = authenticate();
    echo json_encode([
      "status" => "ok",
      "message" => "Authentication valid",
      "user" => ["authenticated" => true]
    ]);
  } catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
      "status" => "error",
      "message" => $e->getMessage()
    ]);
  }
  exit;
}

// Stripe checkout session creation endpoint
if ($_GET["action"] === "create-checkout-session") {
  // Require authentication
  $token = authenticate();
  
  // Parse request body
  $requestBody = file_get_contents('php://input');
  $data = json_decode($requestBody, true);
  
  if (!isset($data['priceId']) || empty($data['priceId'])) {
    http_response_code(400);
    echo json_encode([
      "status" => "error",
      "message" => "Price ID is required"
    ]);
    exit;
  }
  
  // Set default URLs if not provided
  $successUrl = $data['successUrl'] ?? (isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'https://ezedit.co/dashboard.html') . '?checkout=success';
  $cancelUrl = $data['cancelUrl'] ?? (isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'https://ezedit.co/pricing.html') . '?checkout=canceled';
  
  try {
    // Initialize Stripe
    require_once __DIR__ . '/../vendor/autoload.php';
    $stripeSecretKey = env('STRIPE_SECRET_KEY', 'sk_test_your_stripe_key');
    \Stripe\Stripe::setApiKey($stripeSecretKey);
    
    // Create checkout session
    $session = \Stripe\Checkout\Session::create([
      'payment_method_types' => ['card'],
      'line_items' => [[
        'price' => $data['priceId'],
        'quantity' => 1,
      ]],
      'mode' => strpos($data['priceId'], 'oneTime') !== false ? 'payment' : 'subscription',
      'success_url' => $successUrl,
      'cancel_url' => $cancelUrl,
      'client_reference_id' => $token, // Store the user token for reference
      'metadata' => [
        'user_id' => $token,
        'price_id' => $data['priceId']
      ]
    ]);
    
    echo json_encode([
      "status" => "success",
      "id" => $session->id,
      "url" => $session->url
    ]);
  } catch (\Exception $e) {
    http_response_code(500);
    echo json_encode([
      "status" => "error",
      "message" => $e->getMessage()
    ]);
  }
  exit;
}

// Stripe webhook handler for subscription events
if ($_GET["action"] === "stripe-webhook") {
  $payload = @file_get_contents('php://input');
  $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
  $webhookSecret = env('STRIPE_WEBHOOK_SECRET', 'whsec_your_webhook_secret');
  
  try {
    require_once __DIR__ . '/../vendor/autoload.php';
    $stripeSecretKey = env('STRIPE_SECRET_KEY', 'sk_test_your_stripe_key');
    \Stripe\Stripe::setApiKey($stripeSecretKey);
    
    // Verify webhook signature
    $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
    
    // Handle the event
    switch ($event->type) {
      case 'checkout.session.completed':
        $session = $event->data->object;
        // Update user subscription status in your database
        // For this example, we'll just log it
        error_log('Checkout completed for user: ' . $session->client_reference_id);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        $subscription = $event->data->object;
        // Update subscription status
        error_log('Subscription updated: ' . $subscription->id);
        break;
      default:
        error_log('Unhandled event type: ' . $event->type);
    }
    
    echo json_encode(['status' => 'success']);
  } catch (\Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

echo json_encode([
  "status" => "error",
  "message" => "Invalid action"
]);
