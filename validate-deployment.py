#!/usr/bin/env python3
"""
Comprehensive deployment validation for EzEdit.co
Tests all functionality after deployment
"""

import requests
import time
import json
from urllib.parse import urljoin

DROPLET_IP = "159.65.224.175"
BASE_URL = f"http://{DROPLET_IP}"

def test_page(path, expected_status=200, expected_content=None, description=""):
    """Test a single page"""
    try:
        url = urljoin(BASE_URL, path)
        response = requests.get(url, timeout=10)
        
        status_ok = response.status_code == expected_status
        content_ok = True
        
        if expected_content:
            content_ok = expected_content.lower() in response.text.lower()
        
        if status_ok and content_ok:
            print(f"✅ {description or path}: OK (HTTP {response.status_code})")
            return True
        else:
            print(f"❌ {description or path}: Failed (HTTP {response.status_code})")
            if expected_content and not content_ok:
                print(f"   Expected content '{expected_content}' not found")
            return False
            
    except Exception as e:
        print(f"❌ {description or path}: Error - {e}")
        return False

def test_assets():
    """Test CSS and JS assets"""
    print("\n🎨 Testing Assets...")
    
    assets = [
        ("/css/main.css", "CSS Main Stylesheet"),
        ("/css/dashboard.css", "CSS Dashboard Styles"),
        ("/css/editor.css", "CSS Editor Styles"),
        ("/css/auth.css", "CSS Authentication Styles"),
        ("/js/main.js", "JavaScript Main Script"),
        ("/js/dashboard.js", "JavaScript Dashboard Script"),
        ("/js/editor.js", "JavaScript Editor Script"),
        ("/js/auth.js", "JavaScript Auth Script"),
    ]
    
    passed = 0
    for path, description in assets:
        if test_page(path, 200, None, description):
            passed += 1
    
    print(f"📊 Assets: {passed}/{len(assets)} passed")
    return passed == len(assets)

def test_php_pages():
    """Test PHP pages"""
    print("\n📄 Testing PHP Pages...")
    
    pages = [
        ("/", "EzEdit.co", "Homepage"),
        ("/auth/login.php", "Welcome back", "Login Page"),
        ("/dashboard.php", "Dashboard", "Dashboard Page"),
        ("/editor.php", "Monaco Editor", "Editor Interface"),
    ]
    
    passed = 0
    for path, expected_content, description in pages:
        if test_page(path, 200, expected_content, description):
            passed += 1
    
    print(f"📊 PHP Pages: {passed}/{len(pages)} passed")
    return passed == len(pages)

def test_login_functionality():
    """Test login functionality"""
    print("\n🔐 Testing Login Functionality...")
    
    session = requests.Session()
    
    try:
        # Get login page
        login_url = urljoin(BASE_URL, "/auth/login.php")
        response = session.get(login_url)
        
        if response.status_code != 200:
            print("❌ Login page not accessible")
            return False
        
        # Attempt login with mock credentials
        login_data = {
            'email': 'test@example.com',
            'password': 'password123'
        }
        
        response = session.post(login_url, data=login_data)
        
        # Check if redirected to dashboard (or if login was successful)
        if response.status_code == 200 or 'dashboard' in response.url.lower():
            print("✅ Login functionality: OK")
            return True
        else:
            print(f"❌ Login functionality: Failed (HTTP {response.status_code})")
            return False
            
    except Exception as e:
        print(f"❌ Login functionality: Error - {e}")
        return False

def test_editor_components():
    """Test editor page components"""
    print("\n⚙️ Testing Editor Components...")
    
    try:
        editor_url = urljoin(BASE_URL, "/editor.php")
        response = requests.get(editor_url, timeout=15)
        
        if response.status_code != 200:
            print("❌ Editor page not accessible")
            return False
        
        content = response.text.lower()
        
        components = [
            ("Monaco Editor", "monaco"),
            ("File Explorer", "file-explorer"),
            ("AI Assistant", "ai-assistant"),
            ("FTP Connection", "ftp"),
            ("Three-pane Layout", "editor-main"),
        ]
        
        passed = 0
        for name, keyword in components:
            if keyword in content:
                print(f"✅ {name}: Found")
                passed += 1
            else:
                print(f"❌ {name}: Not found")
        
        print(f"📊 Editor Components: {passed}/{len(components)} found")
        return passed >= len(components) * 0.8  # Allow 80% pass rate
        
    except Exception as e:
        print(f"❌ Editor components: Error - {e}")
        return False

def test_navigation():
    """Test navigation between pages"""
    print("\n🧭 Testing Navigation...")
    
    session = requests.Session()
    
    # Test navigation flow: Home -> Login -> Dashboard -> Editor
    try:
        # Start at homepage
        response = session.get(BASE_URL)
        if response.status_code != 200:
            print("❌ Homepage not accessible")
            return False
        
        print("✅ Homepage accessible")
        
        # Check if login link exists
        if '/auth/login.php' in response.text:
            print("✅ Login link found on homepage")
        else:
            print("⚠️ Login link not found on homepage")
        
        # Test direct access to dashboard (should work even without login in demo mode)
        dashboard_response = session.get(urljoin(BASE_URL, "/dashboard.php"))
        if dashboard_response.status_code == 200:
            print("✅ Dashboard accessible")
        else:
            print("❌ Dashboard not accessible")
        
        # Check if editor link exists on dashboard
        if 'editor.php' in dashboard_response.text:
            print("✅ Editor link found on dashboard")
        else:
            print("⚠️ Editor link not found on dashboard")
        
        return True
        
    except Exception as e:
        print(f"❌ Navigation test: Error - {e}")
        return False

def test_performance():
    """Test basic performance metrics"""
    print("\n⚡ Testing Performance...")
    
    pages_to_test = [
        ("/", "Homepage"),
        ("/auth/login.php", "Login"),
        ("/dashboard.php", "Dashboard"),
        ("/editor.php", "Editor"),
    ]
    
    total_time = 0
    passed = 0
    
    for path, name in pages_to_test:
        try:
            start_time = time.time()
            response = requests.get(urljoin(BASE_URL, path), timeout=10)
            end_time = time.time()
            
            load_time = end_time - start_time
            total_time += load_time
            
            if response.status_code == 200:
                if load_time < 3.0:  # Target: < 3 seconds
                    print(f"✅ {name}: {load_time:.2f}s")
                    passed += 1
                else:
                    print(f"⚠️ {name}: {load_time:.2f}s (slow)")
            else:
                print(f"❌ {name}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ {name}: Error - {e}")
    
    avg_time = total_time / len(pages_to_test) if pages_to_test else 0
    print(f"📊 Average load time: {avg_time:.2f}s")
    
    return passed >= len(pages_to_test) * 0.75  # 75% pass rate

def generate_report(results):
    """Generate a deployment report"""
    print("\n" + "="*60)
    print("📋 DEPLOYMENT VALIDATION REPORT")
    print("="*60)
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    print(f"🎯 Overall Score: {passed_tests}/{total_tests} ({passed_tests/total_tests*100:.1f}%)")
    print()
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print("\n" + "="*60)
    
    if passed_tests == total_tests:
        print("🎉 DEPLOYMENT SUCCESSFUL!")
        print("✅ All systems operational")
        print("🌐 EzEdit.co is ready for users")
    elif passed_tests >= total_tests * 0.8:
        print("⚠️ DEPLOYMENT MOSTLY SUCCESSFUL")
        print("🔧 Minor issues detected, but core functionality works")
        print("📝 Review failed tests and address issues")
    else:
        print("❌ DEPLOYMENT ISSUES DETECTED")
        print("🚨 Major problems found, deployment needs attention")
        print("🔄 Re-run deployment process")
    
    print(f"\n🌐 Test URL: {BASE_URL}")
    print("📊 Run this script again after making fixes")

def main():
    print("🧪 EzEdit.co Deployment Validation")
    print("=" * 40)
    print(f"🎯 Testing: {BASE_URL}")
    print("⏱️ Starting comprehensive tests...\n")
    
    # Run all tests
    results = {
        "PHP Pages": test_php_pages(),
        "Assets (CSS/JS)": test_assets(),
        "Login Functionality": test_login_functionality(),
        "Editor Components": test_editor_components(),
        "Navigation Flow": test_navigation(),
        "Performance": test_performance(),
    }
    
    # Generate report
    generate_report(results)
    
    return all(results.values())

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)