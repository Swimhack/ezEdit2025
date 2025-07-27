#!/usr/bin/expect -f

# EzEdit.co Deployment with Password Authentication
set timeout 120
set password "MattKaylaS2two"
set server "159.65.224.175"

puts "🚀 Deploying EzEdit.co to DigitalOcean server..."
puts "Server: $server"
puts "Package: ezedit-complete-deployment.tar.gz"
puts ""

# Upload the deployment package
puts "📤 Uploading deployment package..."
spawn scp -o StrictHostKeyChecking=no ezedit-complete-deployment.tar.gz root@$server:/tmp/
expect {
    "password:" {
        send "$password\r"
        exp_continue
    }
    "100%" {
        puts "✅ Upload completed successfully!"
    }
    timeout {
        puts "❌ Upload timeout"
        exit 1
    }
}

# Connect and deploy
puts "🔧 Connecting to server and deploying..."
spawn ssh -o StrictHostKeyChecking=no root@$server
expect {
    "password:" {
        send "$password\r"
    }
    timeout {
        puts "❌ SSH connection timeout"
        exit 1
    }
}

# Wait for shell prompt and execute deployment commands
expect "# "
send "cd /var/www/html\r"
expect "# "

send "echo 'Creating backup...'\r"
expect "# "
send "mkdir -p /backup/\$(date +%Y%m%d_%H%M%S)\r"
expect "# "
send "cp -r * /backup/\$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true\r"
expect "# "

send "echo 'Extracting deployment package...'\r"
expect "# "
send "tar -xzf /tmp/ezedit-complete-deployment.tar.gz --strip-components=1\r"
expect "# "

send "echo 'Setting permissions...'\r"
expect "# "
send "chown -R www-data:www-data /var/www/html\r"
expect "# "
send "chmod -R 755 /var/www/html\r"
expect "# "
send "find /var/www/html -name '*.php' -exec chmod 644 {} \\;\r"
expect "# "

send "echo 'Cleaning up...'\r"
expect "# "
send "rm -f /tmp/ezedit-complete-deployment.tar.gz\r"
expect "# "

send "echo 'Restarting web server...'\r"
expect "# "
send "systemctl reload nginx 2>/dev/null || true\r"
expect "# "

send "echo '✅ Deployment completed successfully!'\r"
expect "# "
send "echo '🌐 Site available at: http://159.65.224.175/'\r"
expect "# "

send "exit\r"
expect eof

puts ""
puts "🎉 EzEdit.co deployment completed!"
puts "🌐 Your site is now live at: http://159.65.224.175/"
puts ""
puts "Test these URLs:"
puts "  Homepage: http://159.65.224.175/index.php"
puts "  Dashboard: http://159.65.224.175/dashboard.php"
puts "  Editor: http://159.65.224.175/editor.php"
puts "  Login: http://159.65.224.175/auth/login.php"