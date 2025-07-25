#!/usr/bin/env python3
"""
Verify EzEdit deployment on http://172.26.71.145:9090/
"""

import requests
import time

SERVER_URL = "http://172.26.71.145:9090"

def test_endpoint(path, description):
    """Test a specific endpoint"""
    url = f"{SERVER_URL}{path}"
    try:
        response = requests.get(url, timeout=10)
        status = "✅" if response.status_code == 200 else "❌"
        print(f"{status} {description}: {url} ({response.status_code})")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ {description}: {url} (Error: {e})")
        return False

def main():
    print("🔍 EzEdit Deployment Verification")
    print(f"📍 Server: {SERVER_URL}")
    print("-" * 50)
    
    endpoints = [
        ("/", "Homepage"),
        ("/index.php", "Main Index"),
        ("/editor.php", "Code Editor"),
        ("/dashboard.php", "Dashboard"),
        ("/auth/login.php", "Login Page"),
        ("/health.php", "Health Check"),
        ("/api/ftp/test-connection.php", "FTP API"),
        ("/api/ai/chat.php", "AI Assistant API"),
    ]
    
    passed = 0
    total = len(endpoints)
    
    for path, description in endpoints:
        if test_endpoint(path, description):
            passed += 1
        time.sleep(0.5)  # Be nice to the server
    
    print("-" * 50)
    print(f"📊 Results: {passed}/{total} endpoints accessible")
    
    if passed >= total * 0.7:  # 70% success rate
        print("🎉 Deployment appears successful!")
        print(f"🚀 Access EzEdit at: {SERVER_URL}/editor.php")
    else:
        print("⚠️ Deployment may need attention")
        print("💡 Try the manual upload method if needed")

if __name__ == "__main__":
    main()