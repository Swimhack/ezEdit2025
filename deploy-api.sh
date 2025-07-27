#!/bin/bash

# Deploy to DigitalOcean App Platform using API
echo "🚀 Deploying EzEdit.co to App Platform via API"
echo "=============================================="

# DigitalOcean API token (you'll need to set this)
if [ -z "$DO_API_TOKEN" ]; then
    echo "❌ Please set your DigitalOcean API token:"
    echo "   export DO_API_TOKEN=your_token_here"
    echo "   Get token from: https://cloud.digitalocean.com/account/api/tokens"
    exit 1
fi

# Create app spec JSON
echo "📝 Creating app specification..."

cat > app-spec.json << 'JSON_EOF'
{
  "name": "ezedit-production",
  "region": "nyc",
  "services": [
    {
      "name": "web",
      "source_dir": "/",
      "github": {
        "repo": "your-username/ezedit.co",
        "branch": "main",
        "deploy_on_push": true
      },
      "run_command": "heroku-php-apache2 -C apache.conf public/",
      "environment_slug": "php",
      "instance_count": 2,
      "instance_size_slug": "professional-xs",
      "http_port": 8080,
      "routes": [{"path": "/"}],
      "health_check": {
        "http_path": "/health",
        "initial_delay_seconds": 60,
        "period_seconds": 10,
        "timeout_seconds": 5,
        "success_threshold": 1,
        "failure_threshold": 3
      },
      "autoscaling": {
        "min_instance_count": 1,
        "max_instance_count": 10,
        "metrics": {
          "cpu": {"percent": 70},
          "memory": {"percent": 80}
        }
      },
      "envs": [
        {"key": "APP_ENV", "value": "production"},
        {"key": "APP_NAME", "value": "EzEdit.co"},
        {"key": "PHP_VERSION", "value": "8.2"}
      ]
    },
    {
      "name": "worker",
      "source_dir": "/",
      "run_command": "php worker.php",
      "environment_slug": "php",
      "instance_count": 1,
      "instance_size_slug": "basic-xxs",
      "envs": [
        {"key": "APP_ENV", "value": "production"},
        {"key": "WORKER_TIMEOUT", "value": "300"}
      ]
    }
  ],
  "databases": [
    {
      "engine": "PG",
      "name": "ezedit-db",
      "num_nodes": 1,
      "size": "db-s-1vcpu-1gb",
      "version": "14"
    }
  ],
  "domains": [
    {"domain": "ezedit.co", "type": "PRIMARY"},
    {"domain": "www.ezedit.co", "type": "ALIAS"}
  ]
}
JSON_EOF

echo "✅ App specification created"
echo ""

# Deploy using curl
echo "🚀 Deploying to DigitalOcean App Platform..."

RESPONSE=$(curl -X POST \
  -H "Authorization: Bearer $DO_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @app-spec.json \
  "https://api.digitalocean.com/v2/apps" 2>/dev/null)

if [ $? -eq 0 ]; then
    APP_ID=$(echo $RESPONSE | jq -r '.app.id' 2>/dev/null)
    
    if [ "$APP_ID" != "null" ] && [ -n "$APP_ID" ]; then
        echo "✅ App deployment started!"
        echo "📱 App ID: $APP_ID"
        echo "🌐 Monitor at: https://cloud.digitalocean.com/apps/$APP_ID"
        echo ""
        echo "⏳ Deployment typically takes 5-15 minutes"
        echo "📧 You'll receive an email when deployment completes"
    else
        echo "❌ Deployment failed. Response:"
        echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    fi
else
    echo "❌ Failed to connect to DigitalOcean API"
fi

# Cleanup
rm -f app-spec.json

echo ""
echo "🎯 Next Steps:"
echo "1. Monitor deployment in DigitalOcean console"
echo "2. Configure custom domain after deployment"
echo "3. Test your app endpoints"
echo "4. Set up monitoring alerts"