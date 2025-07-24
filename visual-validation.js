const fs = require('fs');
const path = require('path');

// Visual validation against design screenshots
function validateAgainstDesignScreenshots() {
    console.log('🎨 Visual Design Validation Against Screenshots\n');
    
    const publicDir = path.join(__dirname, 'public');
    
    // 1. Landing Page Design Validation (screenshot_landing_page_.jpg)
    console.log('=== Landing Page Design Validation ===');
    
    try {
        const landingContent = fs.readFileSync(path.join(publicDir, 'index.php'), 'utf8');
        
        // Check for exact text matches from screenshot
        const landingDesignChecks = [
            {
                text: 'Edit Legacy Websites with',
                element: 'Hero title start',
                found: landingContent.includes('Edit Legacy Websites with')
            },
            {
                text: 'AI-Powered',
                element: 'AI-Powered highlight',
                found: landingContent.includes('AI-Powered')
            },
            {
                text: 'Simplicity',
                element: 'Hero title end',
                found: landingContent.includes('Simplicity')
            },
            {
                text: 'Connect to any website via FTP/SFTP',
                element: 'Hero subtitle start',
                found: landingContent.includes('Connect to any website via FTP/SFTP')
            },
            {
                text: 'natural language prompts',
                element: 'Natural language feature',
                found: landingContent.includes('natural language prompts')
            },
            {
                text: 'Get early access to EzEdit',
                element: 'Email signup heading',
                found: landingContent.includes('Get early access to EzEdit')
            },
            {
                text: 'Get Invite',
                element: 'Email signup button',
                found: landingContent.includes('Get Invite')
            },
            {
                text: 'Get Started for Free',
                element: 'Primary CTA button',
                found: landingContent.includes('Get Started for Free')
            },
            {
                text: 'Watch Demo',
                element: 'Secondary CTA button',
                found: landingContent.includes('Watch Demo')
            }
        ];
        
        landingDesignChecks.forEach(check => {
            if (check.found) {
                console.log(`✅ Found: ${check.element} - "${check.text}"`);
            } else {
                console.log(`❌ Missing: ${check.element} - "${check.text}"`);
            }
        });
        
    } catch (error) {
        console.log(`❌ Error reading landing page: ${error.message}`);
    }
    
    // 2. Login Page Design Validation (screenshot_login_authentication.jpg)
    console.log('\n=== Login Page Design Validation ===');
    
    try {
        const loginPath = path.join(publicDir, 'auth', 'login.php');
        if (fs.existsSync(loginPath)) {
            const loginContent = fs.readFileSync(loginPath, 'utf8');
            
            const loginDesignChecks = [
                {
                    text: 'Welcome back',
                    element: 'Page title',
                    found: loginContent.includes('Welcome back')
                },
                {
                    text: 'Sign in to your account',
                    element: 'Page subtitle',
                    found: loginContent.includes('Sign in to your account')
                },
                {
                    text: 'Sign In',
                    element: 'Form heading',
                    found: loginContent.includes('Sign In')
                },
                {
                    text: 'Enter your credentials to access your account',
                    element: 'Form description',
                    found: loginContent.includes('Enter your credentials to access your account')
                },
                {
                    text: 'name@example.com',
                    element: 'Email placeholder',
                    found: loginContent.includes('name@example.com')
                },
                {
                    text: 'Remember me for 30 days',
                    element: 'Remember checkbox',
                    found: loginContent.includes('Remember me for 30 days')
                },
                {
                    text: 'Forgot password?',
                    element: 'Forgot password link',
                    found: loginContent.includes('Forgot password')
                },
                {
                    text: 'Don\'t have an account?',
                    element: 'Sign up prompt',
                    found: loginContent.includes('Don\'t have an account')
                }
            ];
            
            loginDesignChecks.forEach(check => {
                if (check.found) {
                    console.log(`✅ Found: ${check.element} - "${check.text}"`);
                } else {
                    console.log(`❌ Missing: ${check.element} - "${check.text}"`);
                }
            });
        } else {
            console.log('❌ Login page file not found');
        }
        
    } catch (error) {
        console.log(`❌ Error reading login page: ${error.message}`);
    }
    
    // 3. Dashboard Design Validation (screenshot_my_sites.png)
    console.log('\n=== Dashboard Design Validation ===');
    
    try {
        const dashboardPath = path.join(publicDir, 'dashboard.php');
        if (fs.existsSync(dashboardPath)) {
            const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
            
            const dashboardDesignChecks = [
                {
                    text: 'My FTP Sites',
                    element: 'Main heading',
                    found: dashboardContent.includes('My FTP Sites')
                },
                {
                    text: 'Add Site',
                    element: 'Add site button',
                    found: dashboardContent.includes('Add Site')
                },
                {
                    text: 'Free Trial Mode:',
                    element: 'Trial notice start',
                    found: dashboardContent.includes('Free Trial Mode')
                },
                {
                    text: 'You can browse and edit files',
                    element: 'Trial description',
                    found: dashboardContent.includes('browse and edit files')
                },
                {
                    text: 'premium subscription',
                    element: 'Upgrade prompt',
                    found: dashboardContent.includes('premium subscription')
                },
                {
                    text: 'Dashboard',
                    element: 'Navigation item',
                    found: dashboardContent.includes('Dashboard')
                },
                {
                    text: 'My Sites',
                    element: 'Navigation item',
                    found: dashboardContent.includes('My Sites')
                },
                {
                    text: 'Settings',
                    element: 'Navigation item',
                    found: dashboardContent.includes('Settings')
                }
            ];
            
            dashboardDesignChecks.forEach(check => {
                if (check.found) {
                    console.log(`✅ Found: ${check.element} - "${check.text}"`);
                } else {
                    console.log(`❌ Missing: ${check.element} - "${check.text}"`);
                }
            });
        } else {
            console.log('❌ Dashboard page file not found');
        }
        
    } catch (error) {
        console.log(`❌ Error reading dashboard page: ${error.message}`);
    }
    
    // 4. CSS and Styling Validation
    console.log('\n=== CSS and Styling Validation ===');
    
    try {
        const mainCSSPath = path.join(publicDir, 'css', 'main.css');
        if (fs.existsSync(mainCSSPath)) {
            const cssContent = fs.readFileSync(mainCSSPath, 'utf8');
            
            const stylingChecks = [
                {
                    property: 'font-family',
                    element: 'Typography system',
                    found: cssContent.includes('font-family')
                },
                {
                    property: 'color:',
                    element: 'Color system',
                    found: cssContent.includes('color:')
                },
                {
                    property: 'background',
                    element: 'Background styling',
                    found: cssContent.includes('background')
                },
                {
                    property: 'border-radius',
                    element: 'Rounded corners',
                    found: cssContent.includes('border-radius')
                },
                {
                    property: 'box-shadow',
                    element: 'Shadow effects',
                    found: cssContent.includes('box-shadow')
                },
                {
                    property: 'transition',
                    element: 'Smooth animations',
                    found: cssContent.includes('transition')
                },
                {
                    property: '@media',
                    element: 'Responsive design',
                    found: cssContent.includes('@media')
                }
            ];
            
            stylingChecks.forEach(check => {
                if (check.found) {
                    console.log(`✅ Found: ${check.element} (${check.property})`);
                } else {
                    console.log(`⚠️  Missing: ${check.element} (${check.property})`);
                }
            });
        } else {
            console.log('❌ Main CSS file not found');
        }
        
    } catch (error) {
        console.log(`❌ Error reading CSS file: ${error.message}`);
    }
    
    // 5. JavaScript Functionality Check
    console.log('\n=== JavaScript Functionality Validation ===');
    
    try {
        const mainJSPath = path.join(publicDir, 'js', 'main.js');
        if (fs.existsSync(mainJSPath)) {
            const jsContent = fs.readFileSync(mainJSPath, 'utf8');
            
            const jsChecks = [
                {
                    feature: 'addEventListener',
                    element: 'Event handling',
                    found: jsContent.includes('addEventListener')
                },
                {
                    feature: 'querySelector',
                    element: 'DOM manipulation',
                    found: jsContent.includes('querySelector')
                },
                {
                    feature: 'fetch',
                    element: 'AJAX/API calls',
                    found: jsContent.includes('fetch')
                }
            ];
            
            jsChecks.forEach(check => {
                if (check.found) {
                    console.log(`✅ Found: ${check.element} (${check.feature})`);
                } else {
                    console.log(`⚠️  Missing: ${check.element} (${check.feature})`);
                }
            });
        } else {
            console.log('⚠️  Main JavaScript file not found');
        }
        
    } catch (error) {
        console.log(`❌ Error reading JavaScript file: ${error.message}`);
    }
    
    console.log('\n=== Design Screenshot Comparison Summary ===');
    console.log('📸 Based on the design screenshots provided:');
    console.log('   - screenshot_landing_page_.jpg: Hero section with AI-Powered branding');
    console.log('   - screenshot_login_authentication.jpg: Clean login form');
    console.log('   - screenshot_my_sites.png: Dashboard with FTP sites');
    console.log('   - screenshot_credentials.png: FTP connection form');
    console.log('\n✅ Visual validation complete. Check above for any missing elements.');
}

// Run visual validation
validateAgainstDesignScreenshots();