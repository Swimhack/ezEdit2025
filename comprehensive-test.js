const puppeteer = require('puppeteer');
const path = require('path');

async function runComprehensiveTests() {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const testResults = {
        javascriptFiles: {
            passed: [],
            failed: []
        },
        mobileNavigation: {
            passed: [],
            failed: []
        },
        monacoEditor: {
            passed: [],
            failed: []
        },
        formValidation: {
            passed: [],
            failed: []
        },
        resources404: {
            passed: [],
            failed: []
        },
        mobileFirst: {
            passed: [],
            failed: []
        }
    };

    try {
        const page = await browser.newPage();
        
        // Track 404 errors
        const failedResources = [];
        page.on('response', response => {
            if (response.status() === 404) {
                failedResources.push({
                    url: response.url(),
                    status: response.status()
                });
            }
        });

        // Track console errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        console.log('🧪 Starting Comprehensive EzEdit.co Tests...\n');

        // Test 1: JavaScript File Loading
        console.log('📁 Testing JavaScript File Loading...');
        const jsFiles = [
            '/js/auth.js',
            '/js/dashboard.js', 
            '/js/editor.js',
            '/js/ftp-client.js',
            '/js/ai-assistant.js'
        ];

        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
        
        for (const jsFile of jsFiles) {
            const loaded = await page.evaluate((file) => {
                const scripts = Array.from(document.querySelectorAll('script'));
                return scripts.some(script => script.src.includes(file));
            }, jsFile);
            
            if (loaded) {
                testResults.javascriptFiles.passed.push(`✅ ${jsFile} is referenced in HTML`);
            } else {
                // Check if file loads without 404
                const response = await page.goto(`http://localhost:3000${jsFile}`, { waitUntil: 'networkidle0' });
                if (response && response.status() === 200) {
                    testResults.javascriptFiles.passed.push(`✅ ${jsFile} exists and loads (status: 200)`);
                } else {
                    testResults.javascriptFiles.failed.push(`❌ ${jsFile} not found or fails to load`);
                }
            }
        }

        // Test 2: Mobile Navigation
        console.log('\n📱 Testing Mobile Navigation...');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
        await page.setViewport({ width: 375, height: 667 }); // iPhone size
        
        // Check for hamburger menu
        const hamburgerMenu = await page.$('.hamburger-menu, .mobile-menu-toggle, .menu-toggle, [aria-label*="menu"]');
        if (hamburgerMenu) {
            testResults.mobileNavigation.passed.push('✅ Hamburger menu element found');
            
            // Test clicking functionality
            try {
                await hamburgerMenu.click();
                await page.waitForTimeout(500);
                
                const mobileMenuVisible = await page.evaluate(() => {
                    const menus = document.querySelectorAll('.mobile-menu, .nav-menu, nav');
                    return Array.from(menus).some(menu => {
                        const style = window.getComputedStyle(menu);
                        return style.display !== 'none' && style.visibility !== 'hidden';
                    });
                });
                
                if (mobileMenuVisible) {
                    testResults.mobileNavigation.passed.push('✅ Mobile menu opens on hamburger click');
                } else {
                    testResults.mobileNavigation.failed.push('❌ Mobile menu does not open properly');
                }
            } catch (e) {
                testResults.mobileNavigation.failed.push('❌ Error clicking hamburger menu: ' + e.message);
            }
        } else {
            testResults.mobileNavigation.failed.push('❌ No hamburger menu element found');
        }

        // Test 3: Monaco Editor Integration
        console.log('\n🖥️ Testing Monaco Editor Integration...');
        await page.goto('http://localhost:3000/editor.html', { waitUntil: 'networkidle0' });
        
        // Check for Monaco script loading
        const monacoLoaded = await page.evaluate(() => {
            return typeof window.monaco !== 'undefined' || 
                   Array.from(document.querySelectorAll('script')).some(s => s.src.includes('monaco'));
        });
        
        if (monacoLoaded) {
            testResults.monacoEditor.passed.push('✅ Monaco editor script is loaded');
        } else {
            testResults.monacoEditor.failed.push('❌ Monaco editor script not found');
        }

        // Check for editor container
        const editorContainer = await page.$('#editor, .editor-container, [data-editor]');
        if (editorContainer) {
            testResults.monacoEditor.passed.push('✅ Editor container element found');
        } else {
            testResults.monacoEditor.failed.push('❌ No editor container element found');
        }

        // Test 4: Form Validation
        console.log('\n📝 Testing Form Validation...');
        
        // Test login form
        await page.goto('http://localhost:3000/auth/login.html', { waitUntil: 'networkidle0' });
        const loginForm = await page.$('form');
        
        if (loginForm) {
            testResults.formValidation.passed.push('✅ Login form found');
            
            // Test required fields
            const emailInput = await page.$('input[type="email"], input[name="email"]');
            const passwordInput = await page.$('input[type="password"]');
            
            if (emailInput) {
                const emailRequired = await page.evaluate(el => el.hasAttribute('required'), emailInput);
                if (emailRequired) {
                    testResults.formValidation.passed.push('✅ Email field has required validation');
                } else {
                    testResults.formValidation.failed.push('❌ Email field missing required attribute');
                }
            }
            
            if (passwordInput) {
                const passwordRequired = await page.evaluate(el => el.hasAttribute('required'), passwordInput);
                if (passwordRequired) {
                    testResults.formValidation.passed.push('✅ Password field has required validation');
                } else {
                    testResults.formValidation.failed.push('❌ Password field missing required attribute');
                }
            }
        } else {
            testResults.formValidation.failed.push('❌ No login form found');
        }

        // Test registration form
        await page.goto('http://localhost:3000/auth/register.html', { waitUntil: 'networkidle0' });
        const registerForm = await page.$('form');
        
        if (registerForm) {
            testResults.formValidation.passed.push('✅ Registration form found');
        } else {
            testResults.formValidation.failed.push('❌ No registration form found');
        }

        // Test 5: Check for 404 errors
        console.log('\n🔍 Checking for 404 Errors...');
        if (failedResources.length === 0) {
            testResults.resources404.passed.push('✅ No 404 errors detected');
        } else {
            failedResources.forEach(resource => {
                testResults.resources404.failed.push(`❌ 404 Error: ${resource.url}`);
            });
        }

        // Test 6: Mobile-First Design
        console.log('\n📱 Testing Mobile-First Design...');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
        
        // Check viewport meta tag
        const viewportMeta = await page.$('meta[name="viewport"]');
        if (viewportMeta) {
            const content = await page.evaluate(el => el.getAttribute('content'), viewportMeta);
            if (content && content.includes('width=device-width')) {
                testResults.mobileFirst.passed.push('✅ Viewport meta tag properly configured');
            } else {
                testResults.mobileFirst.failed.push('❌ Viewport meta tag misconfigured');
            }
        } else {
            testResults.mobileFirst.failed.push('❌ No viewport meta tag found');
        }

        // Check responsive design
        const responsiveElements = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            let hasFlexbox = false;
            let hasGrid = false;
            let hasMediaQueries = false;
            
            // Check stylesheets for media queries
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules) {
                        if (rule.media) {
                            hasMediaQueries = true;
                        }
                    }
                } catch (e) {
                    // Skip cross-origin stylesheets
                }
            }
            
            // Check for flexbox/grid usage
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.display === 'flex') hasFlexbox = true;
                if (style.display === 'grid') hasGrid = true;
            });
            
            return { hasFlexbox, hasGrid, hasMediaQueries };
        });
        
        if (responsiveElements.hasFlexbox) {
            testResults.mobileFirst.passed.push('✅ Uses flexbox for responsive layouts');
        }
        if (responsiveElements.hasGrid) {
            testResults.mobileFirst.passed.push('✅ Uses CSS Grid for responsive layouts');
        }
        if (responsiveElements.hasMediaQueries) {
            testResults.mobileFirst.passed.push('✅ Uses media queries for responsive design');
        }

        // Print Results
        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPREHENSIVE TEST RESULTS');
        console.log('='.repeat(60));

        for (const [category, results] of Object.entries(testResults)) {
            console.log(`\n${getCategoryName(category)}:`);
            console.log('-'.repeat(40));
            
            if (results.passed.length > 0) {
                results.passed.forEach(msg => console.log(msg));
            }
            
            if (results.failed.length > 0) {
                results.failed.forEach(msg => console.log(msg));
            }
            
            if (results.passed.length === 0 && results.failed.length === 0) {
                console.log('⚠️  No tests run for this category');
            }
        }

        // Summary
        const totalPassed = Object.values(testResults).reduce((sum, r) => sum + r.passed.length, 0);
        const totalFailed = Object.values(testResults).reduce((sum, r) => sum + r.failed.length, 0);
        const successRate = totalPassed / (totalPassed + totalFailed) * 100;

        console.log('\n' + '='.repeat(60));
        console.log('📈 OVERALL SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${totalPassed}`);
        console.log(`❌ Failed: ${totalFailed}`);
        console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`);
        
        if (consoleErrors.length > 0) {
            console.log(`\n⚠️  Console Errors Detected: ${consoleErrors.length}`);
            consoleErrors.forEach((err, i) => {
                console.log(`   ${i + 1}. ${err}`);
            });
        }

    } catch (error) {
        console.error('Test execution error:', error);
    } finally {
        await browser.close();
    }
}

function getCategoryName(key) {
    const names = {
        javascriptFiles: '1️⃣  JavaScript File Loading',
        mobileNavigation: '2️⃣  Mobile Navigation',
        monacoEditor: '3️⃣  Monaco Editor Integration',
        formValidation: '4️⃣  Form Validation',
        resources404: '5️⃣  Resource Loading (404 Check)',
        mobileFirst: '6️⃣  Mobile-First Design'
    };
    return names[key] || key;
}

// Run the tests
runComprehensiveTests().then(() => {
    console.log('\n✅ Comprehensive testing complete!');
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});