#!/usr/bin/env python3
"""
EzEdit.co DigitalOcean Deployment Script
Deploys the complete application to the DigitalOcean server
"""

import paramiko
import os
import sys
from pathlib import Path

def deploy_to_server():
    """Deploy EzEdit.co to DigitalOcean server"""
    
    # Server details
    hostname = "159.65.224.175"
    username = "root"
    password = "MattKaylaS2two"
    deployment_file = "ezedit-complete-deployment.tar.gz"
    
    print("🚀 EzEdit.co DigitalOcean Deployment")
    print("====================================")
    print(f"Server: {hostname}")
    print(f"Package: {deployment_file}")
    print("")
    
    # Check if deployment file exists
    if not os.path.exists(deployment_file):
        print(f"❌ Deployment file '{deployment_file}' not found!")
        return False
    
    # Get file size
    file_size = os.path.getsize(deployment_file)
    print(f"📦 Package size: {file_size / 1024:.1f} KB")
    print("")
    
    try:
        # Create SSH client
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        print("🔐 Connecting to server...")
        ssh.connect(hostname, username=username, password=password, timeout=30)
        print("✅ Connected successfully!")
        
        # Create SFTP client for file upload
        sftp = ssh.open_sftp()
        
        print("📤 Uploading deployment package...")
        sftp.put(deployment_file, f"/tmp/{deployment_file}")
        print("✅ Upload completed!")
        
        # Close SFTP
        sftp.close()
        
        # Execute deployment commands
        print("🔧 Deploying application...")
        
        commands = [
            "cd /var/www/html",
            "echo 'Creating backup...'",
            "mkdir -p /backup/$(date +%Y%m%d_%H%M%S)",
            "cp -r * /backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true",
            "echo 'Extracting deployment package...'",
            f"tar -xzf /tmp/{deployment_file} --strip-components=1",
            "echo 'Setting permissions...'",
            "chown -R www-data:www-data /var/www/html",
            "chmod -R 755 /var/www/html",
            "find /var/www/html -name '*.php' -exec chmod 644 {} \\;",
            "find /var/www/html -name '*.css' -exec chmod 644 {} \\;",
            "find /var/www/html -name '*.js' -exec chmod 644 {} \\;",
            "echo 'Cleaning up...'",
            f"rm -f /tmp/{deployment_file}",
            "echo 'Restarting web server...'",
            "systemctl reload nginx 2>/dev/null || true",
            "echo '✅ Deployment completed successfully!'"
        ]
        
        for cmd in commands:
            stdin, stdout, stderr = ssh.exec_command(cmd)
            stdout.channel.recv_exit_status()  # Wait for command to complete
            
            # Print any output
            output = stdout.read().decode().strip()
            if output:
                print(f"   {output}")
        
        # Close SSH connection
        ssh.close()
        
        print("")
        print("🎉 EzEdit.co deployment completed successfully!")
        print(f"🌐 Your site is now live at: http://{hostname}/")
        print("")
        print("Test these URLs:")
        print(f"  Homepage:     http://{hostname}/index.php")
        print(f"  Dashboard:    http://{hostname}/dashboard.php")
        print(f"  Editor:       http://{hostname}/editor.php")
        print(f"  Login:        http://{hostname}/auth/login.php")
        print(f"  Register:     http://{hostname}/auth/register.php")
        print(f"  Documentation: http://{hostname}/docs.php")
        print("")
        
        return True
        
    except Exception as e:
        print(f"❌ Deployment failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = deploy_to_server()
    sys.exit(0 if success else 1)