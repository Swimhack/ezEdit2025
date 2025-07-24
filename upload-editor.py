#!/usr/bin/env python3
"""
Upload editor.php file to the droplet using HTTP method
"""

import requests
import os
from pathlib import Path

DROPLET_IP = "159.65.224.175"

def upload_editor_file():
    """Upload the editor.php file"""
    
    # Read the editor.php file from our deployment package
    editor_file_path = "deployment-package/public_html/editor.php"
    
    if not os.path.exists(editor_file_path):
        print(f"❌ Editor file not found at {editor_file_path}")
        return False
    
    print("📖 Reading editor.php file...")
    with open(editor_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"✅ Read {len(content)} characters from editor.php")
    
    # Since we can't directly upload, let's create a data URI that can be used
    # to manually recreate the file on the server
    
    print("\n📋 MANUAL DEPLOYMENT INSTRUCTIONS FOR EDITOR.PHP")
    print("=" * 60)
    
    # Split content into smaller chunks for easier copying
    chunk_size = 2000
    chunks = [content[i:i+chunk_size] for i in range(0, len(content), chunk_size)]
    
    print(f"""
To manually deploy editor.php, follow these steps:

1. 🖥️ Access DigitalOcean droplet console
2. 📝 Create the editor.php file:
   sudo nano /var/www/html/editor.php

3. 📋 Copy and paste this content (in {len(chunks)} parts):
""")
    
    for i, chunk in enumerate(chunks, 1):
        print(f"\n--- PART {i}/{len(chunks)} ---")
        print(chunk[:200] + "..." if len(chunk) > 200 else chunk)
        if i == 1:
            print("(Continue copying the full content...)")
    
    print(f"""
4. 💾 Save the file (Ctrl+X, Y, Enter)
5. 🔧 Set permissions:
   sudo chown www-data:www-data /var/www/html/editor.php
   sudo chmod 644 /var/www/html/editor.php

6. ✅ Test: Visit http://{DROPLET_IP}/editor.php
""")
    
    # Also create a simple upload file
    print("\n📄 Creating editor.php for manual upload...")
    with open("editor-for-upload.php", "w") as f:
        f.write(content)
    
    print("✅ Created editor-for-upload.php for manual upload")
    
    return True

def create_complete_deployment_package():
    """Create a complete deployment with all files"""
    
    print("📦 Creating complete deployment package...")
    
    # Create upload script content
    upload_script = f"""
# Complete EzEdit.co Deployment Script
# Run this on the droplet console

echo "🚀 Deploying EzEdit.co complete package..."

# Create web directory if not exists
sudo mkdir -p /var/www/html

# Download and extract files (if you have the tar.gz uploaded)
# sudo tar -xzf ~/ezedit-deployment.tar.gz -C /
# sudo mv /public_html/* /var/www/html/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
sudo find /var/www/html -name "*.php" -exec chmod 644 {{}} \\;

# Restart web server
sudo systemctl restart nginx

echo "✅ Deployment complete!"
echo "🌐 Test at: http://{DROPLET_IP}"
"""
    
    with open("complete-deploy.sh", "w") as f:
        f.write(upload_script)
    
    print("✅ Created complete-deploy.sh script")

def main():
    print("🔧 EzEdit.co File Upload Helper")
    print("=" * 40)
    
    # Upload editor file
    upload_editor_file()
    
    # Create deployment package
    create_complete_deployment_package()
    
    print("\n🎯 SUMMARY")
    print("=" * 20)
    print("✅ editor-for-upload.php - Ready for manual upload")
    print("✅ complete-deploy.sh - Complete deployment script")
    print("✅ ezedit-deployment.tar.gz - Full deployment package")
    
    print(f"\n🌐 Current site status: http://{DROPLET_IP}")
    print("📋 Follow the manual deployment instructions above")

if __name__ == "__main__":
    main()