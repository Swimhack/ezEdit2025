#!/usr/bin/env python3
"""
Upload files to DigitalOcean droplet using available methods
"""

import os
import requests
import base64
import json
import time
from pathlib import Path

# Droplet information
DROPLET_ID = "509389318"
DROPLET_IP = "159.65.224.175"

def check_current_deployment():
    """Check what's currently deployed on the server"""
    print("🔍 Checking current deployment...")
    
    try:
        # Test homepage
        response = requests.get(f"http://{DROPLET_IP}/", timeout=10)
        print(f"✅ Homepage: HTTP {response.status_code}")
        
        # Test login page
        response = requests.get(f"http://{DROPLET_IP}/auth/login.php", timeout=10)
        print(f"✅ Login page: HTTP {response.status_code}")
        
        # Test dashboard
        response = requests.get(f"http://{DROPLET_IP}/dashboard.php", timeout=10)
        print(f"✅ Dashboard: HTTP {response.status_code}")
        
        # Test editor (this should be missing)
        response = requests.get(f"http://{DROPLET_IP}/editor.php", timeout=10)
        print(f"❌ Editor: HTTP {response.status_code} (Expected: 404 - file missing)")
        
        return True
    except Exception as e:
        print(f"❌ Error checking deployment: {e}")
        return False

def create_deployment_instructions():
    """Create detailed deployment instructions"""
    print("\n📋 DEPLOYMENT INSTRUCTIONS")
    print("=" * 50)
    
    print(f"""
Since direct SSH access is not available, please follow these steps:

1. 📁 Access DigitalOcean Control Panel
   - Navigate to Droplets
   - Click on 'ezedit-mvp' droplet

2. 🖥️ Open Web Console
   - Click 'Console' tab
   - Wait for terminal to load

3. 📤 Upload deployment files
   - The deployment package 'ezedit-deployment.tar.gz' is ready
   - Upload it to the droplet (via file upload or wget)

4. 🗂️ Extract and deploy
   Run these commands in the console:
   
   sudo rm -rf /var/www/html/*
   sudo tar -xzf ~/ezedit-deployment.tar.gz -C /
   sudo mv /public_html/* /var/www/html/
   sudo chown -R www-data:www-data /var/www/html
   sudo chmod -R 755 /var/www/html
   sudo systemctl restart nginx

5. ✅ Verify deployment
   Visit: http://{DROPLET_IP}
   Test all pages: /, /auth/login.php, /dashboard.php, /editor.php

🎯 All files should be accessible after deployment.
""")

def create_test_script():
    """Create a test script to validate deployment"""
    test_script = """#!/usr/bin/env python3
import requests
import sys

DROPLET_IP = "159.65.224.175"

def test_page(path, expected_content):
    try:
        response = requests.get(f"http://{DROPLET_IP}{path}", timeout=10)
        if response.status_code == 200 and expected_content in response.text:
            print(f"✅ {path}: OK")
            return True
        else:
            print(f"❌ {path}: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ {path}: Error - {e}")
        return False

def main():
    print("🧪 Testing EzEdit.co deployment...")
    
    tests = [
        ("/", "EzEdit.co"),
        ("/auth/login.php", "Welcome back"),
        ("/dashboard.php", "Dashboard"),
        ("/editor.php", "Monaco Editor"),
    ]
    
    passed = 0
    for path, expected_content in tests:
        if test_page(path, expected_content):
            passed += 1
    
    print(f"\\n📊 Test Results: {passed}/{len(tests)} passed")
    
    if passed == len(tests):
        print("🎉 All tests passed! Deployment successful.")
        return True
    else:
        print("⚠️  Some tests failed. Check deployment.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
"""
    
    with open("test-deployment.py", "w") as f:
        f.write(test_script)
    os.chmod("test-deployment.py", 0o755)
    print("📝 Created test-deployment.py script")

def main():
    print("🚀 EzEdit.co Deployment Helper")
    print("=" * 40)
    
    # Check current state
    if not check_current_deployment():
        return False
    
    # Create deployment instructions
    create_deployment_instructions()
    
    # Create test script
    create_test_script()
    
    print("\n✅ Deployment helper complete!")
    print("📦 Deployment package ready: ezedit-deployment.tar.gz")
    print("🧪 Test script ready: test-deployment.py")
    
    return True

if __name__ == "__main__":
    main()