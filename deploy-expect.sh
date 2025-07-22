#!/bin/bash

# Deploy using expect automation
SERVER="159.65.224.175"
PASSWORD="MattKaylaS2two"

echo "🚀 Deploying EzEdit.co files using expect automation..."

# Function to deploy a single file
deploy_file() {
    local file=$1
    echo "📤 Deploying $file..."
    
    expect << EOF
spawn scp -o StrictHostKeyChecking=no "$file" root@$SERVER:/var/www/html/
expect {
    "password:" { send "$PASSWORD\r"; exp_continue }
    "Password:" { send "$PASSWORD\r"; exp_continue }
    eof
}
EOF
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Deployed successfully"
    else
        echo "   ❌ Deployment failed"
    fi
}

# Deploy critical files
deploy_file "signup.html"
deploy_file "pricing.html" 
deploy_file "billing.html"

echo ""
echo "🧪 Testing deployment..."

# Test each deployed file
for file in signup.html pricing.html billing.html; do
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER/$file")
    if [ "$status_code" = "200" ]; then
        echo "✅ $file: HTTP 200 OK"
    else
        echo "❌ $file: HTTP $status_code"
    fi
done

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Test the complete flow at:"
echo "   http://$SERVER/signup.html"
echo "   http://$SERVER/pricing.html"
echo "   http://$SERVER/billing.html"