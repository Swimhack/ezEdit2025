#!/usr/bin/env python3
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
    
    print(f"\n📊 Test Results: {passed}/{len(tests)} passed")
    
    if passed == len(tests):
        print("🎉 All tests passed! Deployment successful.")
        return True
    else:
        print("⚠️  Some tests failed. Check deployment.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
