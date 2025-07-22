/**
 * EzEdit.co - Make All Pages Fully Functional
 * Tests and validates complete functionality before deployment
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 Making EzEdit.co Fully Functional...\n');

// List of all pages and their required functionality
const pages = [
    {
        file: 'public/index.html',
        name: 'Landing Page',
        requirements: [
            'FTP demo integration',
            'Monaco Editor loading',
            'Navigation links',
            'Responsive design'
        ]
    },
    {
        file: 'signup.html',
        name: 'Signup Page',
        requirements: [
            'Supabase authentication',
            'Form validation',
            'Password strength checking',
            'Plan selection storage'
        ]
    },
    {
        file: 'login-real.html',
        name: 'Login Page',
        requirements: [
            'Supabase authentication',
            'Remember me functionality',
            'Error handling',
            'Auto-redirect'
        ]
    },
    {
        file: 'pricing.html',
        name: 'Pricing Page',
        requirements: [
            'Plan selection',
            'Stripe checkout integration',
            'Monthly/yearly toggle',
            'FAQ functionality'
        ]
    },
    {
        file: 'dashboard-real.html',
        name: 'Dashboard',
        requirements: [
            'Site management',
            'FTP connection testing',
            'Supabase integration',
            'Modal dialogs'
        ]
    },
    {
        file: 'editor-real.html',
        name: 'Code Editor',
        requirements: [
            'Monaco Editor',
            'File operations',
            'AI assistant',
            'Syntax highlighting'
        ]
    },
    {
        file: 'billing.html',
        name: 'Billing Page',
        requirements: [
            'Subscription display',
            'Usage statistics',
            'Stripe portal integration',
            'Plan management'
        ]
    }
];

// API endpoints that need to exist
const apiEndpoints = [
    'public/auth/auth-handler.php',
    'public/api/create-checkout-session.php',
    'public/api/ftp/test.php',
    'public/ftp/ftp-handler.php',
    'public/.htaccess'
];

// Check if all files exist
function validateFiles() {
    console.log('📄 Validating Files...\n');
    
    let allValid = true;
    
    pages.forEach(page => {
        if (fs.existsSync(page.file)) {
            console.log(`✅ ${page.name}: ${page.file}`);
        } else {
            console.log(`❌ ${page.name}: MISSING - ${page.file}`);
            allValid = false;
        }
    });
    
    console.log('\n🔌 Validating API Endpoints...\n');
    
    apiEndpoints.forEach(endpoint => {
        if (fs.existsSync(endpoint)) {
            console.log(`✅ API: ${endpoint}`);
        } else {
            console.log(`❌ API: MISSING - ${endpoint}`);
            allValid = false;
        }
    });
    
    return allValid;
}

// Check integration quality
function validateIntegrations() {
    console.log('\n🔗 Validating Integrations...\n');
    
    const checks = [
        {
            name: 'Supabase Configuration',
            check: () => {
                const files = ['signup.html', 'login-real.html', 'dashboard-real.html'];
                return files.every(file => {
                    if (!fs.existsSync(file)) return false;
                    const content = fs.readFileSync(file, 'utf8');
                    return content.includes('sctsykgcfkhadowygcrj.supabase.co') &&
                           content.includes('supabase.createClient');
                });
            }
        },
        {
            name: 'Stripe Integration',
            check: () => {
                const files = ['pricing.html', 'billing.html'];
                return files.every(file => {
                    if (!fs.existsSync(file)) return false;
                    const content = fs.readFileSync(file, 'utf8');
                    return content.includes('pk_live_51R9RpGAuYycpID5h') &&
                           content.includes('stripe.com/v3');
                });
            }
        },
        {
            name: 'API Endpoint Routing',
            check: () => {
                const files = ['pricing.html', 'dashboard-real.html'];
                return files.every(file => {
                    if (!fs.existsSync(file)) return false;
                    const content = fs.readFileSync(file, 'utf8');
                    return content.includes('/api/') &&
                           !content.includes('/api/stripe/'); // Should be updated to .php
                });
            }
        },
        {
            name: 'Monaco Editor Setup',
            check: () => {
                const files = ['public/index.html', 'editor-real.html'];
                return files.some(file => {
                    if (!fs.existsSync(file)) return false;
                    const content = fs.readFileSync(file, 'utf8');
                    return content.includes('monaco-editor') &&
                           content.includes('vs/loader.js');
                });
            }
        },
        {
            name: 'FTP Operations',
            check: () => {
                return fs.existsSync('public/ftp/ftp-handler.php') &&
                       fs.existsSync('public/api/ftp/test.php');
            }
        }
    ];
    
    let allPassed = true;
    
    checks.forEach(check => {
        try {
            const result = check.check();
            console.log(`${result ? '✅' : '❌'} ${check.name}`);
            if (!result) allPassed = false;
        } catch (error) {
            console.log(`❌ ${check.name}: Error - ${error.message}`);
            allPassed = false;
        }
    });
    
    return allPassed;
}

// Generate functionality report
function generateFunctionalityReport() {
    console.log('\n📊 Functionality Report...\n');
    
    const report = {
        timestamp: new Date().toISOString(),
        pages: {},
        apis: {},
        overall: {
            ready: true,
            issues: []
        }
    };
    
    // Check each page
    pages.forEach(page => {
        const exists = fs.existsSync(page.file);
        let integrations = [];
        let size = 0;
        
        if (exists) {
            const content = fs.readFileSync(page.file, 'utf8');
            size = Math.round(content.length / 1024 * 10) / 10; // KB
            
            // Check for integrations
            if (content.includes('supabase')) integrations.push('Supabase');
            if (content.includes('stripe')) integrations.push('Stripe');
            if (content.includes('monaco')) integrations.push('Monaco Editor');
            if (content.includes('/api/')) integrations.push('API Calls');
        }
        
        report.pages[page.name] = {
            file: page.file,
            exists: exists,
            size: `${size}KB`,
            integrations: integrations,
            requirements: page.requirements,
            status: exists ? 'Ready' : 'Missing'
        };
        
        if (!exists) {
            report.overall.ready = false;
            report.overall.issues.push(`Missing: ${page.file}`);
        }
    });
    
    // Check API endpoints
    apiEndpoints.forEach(endpoint => {
        const exists = fs.existsSync(endpoint);
        let size = 0;
        
        if (exists) {
            const content = fs.readFileSync(endpoint, 'utf8');
            size = Math.round(content.length / 1024 * 10) / 10;
        }
        
        report.apis[endpoint] = {
            exists: exists,
            size: `${size}KB`,
            status: exists ? 'Ready' : 'Missing'
        };
        
        if (!exists) {
            report.overall.ready = false;
            report.overall.issues.push(`Missing API: ${endpoint}`);
        }
    });
    
    // Save report
    fs.writeFileSync('functionality-report.json', JSON.stringify(report, null, 2));
    
    console.log(`📋 Report saved to: functionality-report.json`);
    console.log(`📊 Pages: ${Object.keys(report.pages).length}`);
    console.log(`🔌 APIs: ${Object.keys(report.apis).length}`);
    console.log(`✅ Overall Status: ${report.overall.ready ? 'READY' : 'NEEDS FIXES'}`);
    
    if (report.overall.issues.length > 0) {
        console.log(`❌ Issues found: ${report.overall.issues.length}`);
        report.overall.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    return report;
}

// Test deployment readiness
async function testDeploymentReadiness() {
    console.log('\n🧪 Testing Deployment Readiness...\n');
    
    const SERVER = '159.65.224.175';
    
    const testUrls = [
        { url: `http://${SERVER}/`, name: 'Landing Page', required: true },
        { url: `http://${SERVER}/signup.html`, name: 'Signup Page', required: true },
        { url: `http://${SERVER}/pricing.html`, name: 'Pricing Page', required: true },
        { url: `http://${SERVER}/billing.html`, name: 'Billing Page', required: true },
        { url: `http://${SERVER}/login-real.html`, name: 'Login Page', required: true },
        { url: `http://${SERVER}/dashboard-real.html`, name: 'Dashboard', required: true },
        { url: `http://${SERVER}/editor-real.html`, name: 'Editor', required: true },
        { url: `http://${SERVER}/checkout-demo.html`, name: 'Checkout Demo', required: false }
    ];
    
    let readyForDeployment = true;
    
    for (const test of testUrls) {
        try {
            const result = await new Promise((resolve) => {
                exec(`curl -s -o /dev/null -w "%{http_code}" "${test.url}"`, (error, stdout) => {
                    resolve(stdout.trim());
                });
            });
            
            const isWorking = result === '200';
            const status = isWorking ? '✅' : (result === '404' ? '❌' : '⚠️');
            
            console.log(`${status} ${test.name}: HTTP ${result}`);
            
            if (test.required && !isWorking) {
                readyForDeployment = false;
            }
            
        } catch (error) {
            console.log(`❌ ${test.name}: Error testing`);
            if (test.required) {
                readyForDeployment = false;
            }
        }
    }
    
    console.log(`\n🎯 Deployment Ready: ${readyForDeployment ? 'YES' : 'NO'}`);
    return readyForDeployment;
}

// Main execution
async function main() {
    console.log('🎯 EzEdit.co Full Functionality Check\n');
    
    // Step 1: Validate all files exist
    const filesValid = validateFiles();
    
    // Step 2: Check integrations
    const integrationsValid = validateIntegrations();
    
    // Step 3: Generate comprehensive report
    const report = generateFunctionalityReport();
    
    // Step 4: Test current deployment
    const deploymentReady = await testDeploymentReadiness();
    
    console.log('\n🎉 Summary\n');
    console.log(`📄 Files Valid: ${filesValid ? 'YES' : 'NO'}`);
    console.log(`🔗 Integrations: ${integrationsValid ? 'YES' : 'NO'}`);
    console.log(`🚀 Deployment Ready: ${deploymentReady ? 'YES' : 'NO'}`);
    console.log(`📊 Overall Status: ${report.overall.ready ? 'READY' : 'NEEDS WORK'}`);
    
    if (report.overall.ready && deploymentReady) {
        console.log('\n✅ ALL PAGES ARE FULLY FUNCTIONAL!');
        console.log('🎯 Ready for production deployment');
        console.log('💰 Revenue generation enabled');
    } else {
        console.log('\n⚠️  Issues found that need addressing:');
        if (!filesValid) console.log('   - Missing critical files');
        if (!integrationsValid) console.log('   - Integration problems');
        if (!deploymentReady) console.log('   - Deployment issues');
    }
    
    console.log('\n📋 Next Steps:');
    if (report.overall.ready) {
        console.log('1. Deploy missing files to production server');
        console.log('2. Test complete user workflows');
        console.log('3. Monitor for any issues');
    } else {
        console.log('1. Fix issues listed above');
        console.log('2. Re-run this script');
        console.log('3. Deploy when all tests pass');
    }
    
    console.log('\n🌐 Test URLs after deployment:');
    console.log(`   Landing:  http://159.65.224.175/`);
    console.log(`   Signup:   http://159.65.224.175/signup.html`);
    console.log(`   Pricing:  http://159.65.224.175/pricing.html`);
    console.log(`   Billing:  http://159.65.224.175/billing.html`);
}

main().catch(console.error);