#!/bin/bash

# Deploy directly via DigitalOcean API
echo "🚀 Creating EzEdit.co App via DigitalOcean API"
echo "============================================="

API_TOKEN="dop_v1_f5fb7c9657fa9470aec45e4f40907bf5fa41bdba0eab928704be54d2368995c4"

# Create app spec JSON for API
cat > /tmp/app-spec.json << 'EOF'
{
  "spec": {
    "name": "ezedit-production",
    "region": "nyc",
    "services": [
      {
        "name": "web",
        "environment_slug": "php",
        "instance_count": 1,
        "instance_size_slug": "basic-xxs",
        "http_port": 8080,
        "run_command": "heroku-php-apache2 public/",
        "source_dir": "/",
        "routes": [{"path": "/"}],
        "envs": [
          {"key": "APP_ENV", "value": "production"},
          {"key": "APP_NAME", "value": "EzEdit.co"}
        ],
        "git": {
          "repo_clone_url": "https://github.com/jamesstrickland/ezedit.co.git",
          "branch": "main"
        }
      }
    ]
  }
}
EOF

echo "📡 Making API request to create app..."

RESPONSE=$(curl -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/app-spec.json \
  "https://api.digitalocean.com/v2/apps" 2>/dev/null)

if [ $? -eq 0 ]; then
    APP_ID=$(echo "$RESPONSE" | jq -r '.app.id' 2>/dev/null)
    
    if [ "$APP_ID" != "null" ] && [ -n "$APP_ID" ]; then
        echo "✅ App created successfully!"
        echo "📱 App ID: $APP_ID"
        echo "🌐 Console: https://cloud.digitalocean.com/apps/$APP_ID"
        echo ""
        echo "⏳ Deployment starting... Check console for progress"
        echo "🎯 Your app will be live in ~10-15 minutes"
        
        # Save app info
        echo "{\"app_id\": \"$APP_ID\", \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > .app-info.json
        echo "📄 App info saved to .app-info.json"
    else
        echo "❌ App creation failed. Response:"
        echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    fi
else
    echo "❌ Failed to connect to DigitalOcean API"
fi

# Cleanup
rm -f /tmp/app-spec.json