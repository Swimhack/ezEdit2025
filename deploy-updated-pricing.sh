#!/bin/bash

# Deploy updated pricing page to EzEdit.co
DROPLET_IP="159.65.224.175"
PASSWORD="MattKaylaS2two"

echo "🚀 Deploying Updated Pricing to EzEdit.co"
echo "=========================================="
echo "Server: $DROPLET_IP"
echo ""

# Upload updated index.php file
echo "📤 Uploading updated index.php..."

# Create temporary expect script for password automation
cat > /tmp/deploy_expect.exp << 'EOF'
#!/usr/bin/expect -f
set timeout 30
set server [lindex $argv 0]
set password [lindex $argv 1]
set file [lindex $argv 2]

spawn scp -o StrictHostKeyChecking=no $file root@$server:/var/www/html/index.php
expect "password:"
send "$password\r"
expect eof

spawn ssh -o StrictHostKeyChecking=no root@$server
expect "password:"
send "$password\r"
expect "# "
send "chown www-data:www-data /var/www/html/index.php\r"
expect "# "
send "chmod 644 /var/www/html/index.php\r"
expect "# "
send "systemctl reload nginx\r"
expect "# "
send "exit\r"
expect eof
EOF

chmod +x /tmp/deploy_expect.exp

# Check if expect is available
if command -v expect >/dev/null 2>&1; then
    echo "Using expect for automated deployment..."
    /tmp/deploy_expect.exp "$DROPLET_IP" "$PASSWORD" "public/index.php"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ DEPLOYMENT SUCCESSFUL!"
        echo "========================="
        echo "🌐 Updated pricing is now live at: http://$DROPLET_IP/"
        echo ""
        echo "The pricing page now shows:"
        echo "  ✅ Free: $0/forever"
        echo "  ✅ Single Site: $20/per month" 
        echo "  ✅ Unlimited: $100/per month"
        echo "  ✅ No setup fees | Cancel anytime | 30-day money back"
        
        # Test the deployment
        echo ""
        echo "🧪 Testing deployment..."
        if curl -s "http://$DROPLET_IP/index.php" | grep -q "No setup fees"; then
            echo "✅ Pricing update verified!"
        else
            echo "⚠️  Could not verify pricing update"
        fi
    else
        echo "❌ Deployment failed"
        exit 1
    fi
else
    echo "❌ expect not available. Please install expect or use manual deployment."
    echo ""
    echo "Manual deployment steps:"
    echo "1. Copy public/index.php to the server"
    echo "2. SSH to root@$DROPLET_IP"
    echo "3. Run: chown www-data:www-data /var/www/html/index.php"
    echo "4. Run: chmod 644 /var/www/html/index.php"
    echo "5. Run: systemctl reload nginx"
fi

# Cleanup
rm -f /tmp/deploy_expect.exp