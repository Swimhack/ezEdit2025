#!/usr/bin/env python3
"""
Upload the deployment helper script to the server
"""

import requests
import os
import base64

DROPLET_IP = "159.65.224.175"

def create_simple_uploader():
    """Create a simple PHP file uploader"""
    
    uploader_content = '''<?php
// Simple file uploader for deployment
if ($_POST && isset($_FILES['file'])) {
    $target = '/var/www/html/' . basename($_FILES['file']['name']);
    if (move_uploaded_file($_FILES['file']['tmp_name'], $target)) {
        chmod($target, 0644);
        echo "✅ Uploaded successfully: " . basename($_FILES['file']['name']);
        echo "<br><a href='/" . basename($_FILES['file']['name']) . "'>View File</a>";
    } else {
        echo "❌ Upload failed";
    }
}
?>
<html>
<head><title>File Uploader</title></head>
<body>
<h2>📤 File Uploader</h2>
<form method="post" enctype="multipart/form-data">
    <input type="file" name="file" accept=".php">
    <button type="submit">Upload</button>
</form>
</body>
</html>'''
    
    with open("simple-uploader.php", "w") as f:
        f.write(uploader_content)
    
    print("✅ Created simple-uploader.php")

def test_current_status():
    """Test what's currently working on the server"""
    
    print("🔍 Testing current server status...")
    
    tests = [
        ("Homepage", "/"),
        ("Login", "/auth/login.php"),
        ("Dashboard", "/dashboard.php"),
        ("Editor", "/editor.php"),
        ("CSS", "/css/main.css"),
        ("JS", "/js/main.js")
    ]
    
    for name, path in tests:
        try:
            response = requests.get(f"http://{DROPLET_IP}{path}", timeout=5)
            status = "✅" if response.status_code == 200 else "❌"
            print(f"{status} {name}: HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ {name}: Error - {e}")

def create_browser_instructions():
    """Create instructions for browser-based deployment"""
    
    instructions = f"""
🌐 BROWSER-BASED DEPLOYMENT INSTRUCTIONS
========================================

Since we can't directly upload files, here's how to deploy using a web browser:

1. 📋 Copy the deployment helper content:
   - Open: deploy-missing.php in a text editor
   - Copy all content (Ctrl+A, Ctrl+C)

2. 🌐 Access the current server:
   - Visit: http://{DROPLET_IP}
   - The homepage should be working

3. 📝 Create the deployment helper:
   - Access droplet console via DigitalOcean web interface
   - Run: sudo nano /var/www/html/deploy-helper.php
   - Paste the deployment helper content
   - Save: Ctrl+X, Y, Enter

4. 🚀 Use the deployment helper:
   - Visit: http://{DROPLET_IP}/deploy-helper.php?force=1
   - Upload the missing editor.php file
   - Test that all pages work

5. 🧹 Clean up:
   - Delete the helper: sudo rm /var/www/html/deploy-helper.php

📋 QUICK DEPLOYMENT COMMANDS (Run in droplet console):
====================================================

# Create editor.php directly
sudo nano /var/www/html/editor.php
# (Paste the content from editor-for-upload.php)

# Set permissions
sudo chown www-data:www-data /var/www/html/editor.php
sudo chmod 644 /var/www/html/editor.php

# Test
curl http://localhost/editor.php

🌐 Test URLs after deployment:
- http://{DROPLET_IP}/
- http://{DROPLET_IP}/auth/login.php  
- http://{DROPLET_IP}/dashboard.php
- http://{DROPLET_IP}/editor.php

"""
    
    with open("browser-deployment.txt", "w") as f:
        f.write(instructions)
    
    print("📋 Created browser-deployment.txt with detailed instructions")

def main():
    print("🔧 EzEdit.co Upload Helper")
    print("=" * 30)
    
    # Test current status
    test_current_status()
    
    # Create helper files
    create_simple_uploader()
    create_browser_instructions()
    
    print("\n📦 Created deployment files:")
    print("- simple-uploader.php")
    print("- browser-deployment.txt")
    print("- deploy-missing.php")
    print("- editor-for-upload.php")
    
    print(f"\n🎯 Current server: http://{DROPLET_IP}")
    print("📖 Read browser-deployment.txt for detailed instructions")

if __name__ == "__main__":
    main()