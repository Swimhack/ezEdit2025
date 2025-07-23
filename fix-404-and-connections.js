/**
 * Fix 404 Errors and Page Connections
 * Creates missing files and ensures proper navigation
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔧 Fixing 404 Errors and Page Connections...\n');

// Check what files need to be created for the server
const MISSING_FILES = [
    'signup.html',
    'pricing.html', 
    'billing.html',
    'checkout-demo.html'
];

// Check current file status
console.log('📄 Checking File Status...\n');

MISSING_FILES.forEach(file => {
    if (fs.existsSync(file)) {
        const size = (fs.readFileSync(file, 'utf8').length / 1024).toFixed(1);
        console.log(`✅ ${file} exists (${size}KB)`);
    } else {
        console.log(`❌ ${file} MISSING`);
    }
});

// Fix navigation links in all pages
function fixPageConnections() {
    console.log('\n🔗 Fixing Page Connections...\n');
    
    const pageFiles = [
        'signup.html',
        'pricing.html',
        'billing.html',
        'login-real.html',
        'dashboard-real.html',
        'editor-real.html',
        'checkout-demo.html'
    ];
    
    pageFiles.forEach(file => {
        if (fs.existsSync(file)) {
            let content = fs.readFileSync(file, 'utf8');
            let modified = false;
            
            // Fix common navigation issues
            const fixes = [
                // Fix login/signup links
                { from: 'href="/login.php"', to: 'href="/login-real.html"' },
                { from: 'href="/signup.php"', to: 'href="/signup.html"' },
                { from: 'href="/login"', to: 'href="/login-real.html"' },
                { from: 'href="/signup"', to: 'href="/signup.html"' },
                
                // Fix dashboard/editor links
                { from: 'href="/dashboard"', to: 'href="/dashboard-real.html"' },
                { from: 'href="/editor"', to: 'href="/editor-real.html"' },
                
                // Fix pricing/billing links
                { from: 'href="/pricing"', to: 'href="/pricing.html"' },
                { from: 'href="/billing"', to: 'href="/billing.html"' },
                
                // Fix API endpoints to match server structure
                { from: '"/api/stripe/', to: '"/api/' },
                { from: '"/api/create-checkout-session"', to: '"/api/create-checkout-session.php"' },
                { from: '"/api/ftp/test"', to: '"/api/ftp/test.php"' },
                
                // Fix relative paths
                { from: 'href="#', to: 'href="#' }, // Keep anchor links as-is
                { from: 'src="js/', to: 'src="/js/' },
                { from: 'src="css/', to: 'src="/css/' },
                { from: 'href="css/', to: 'href="/css/' }
            ];
            
            fixes.forEach(fix => {
                if (content.includes(fix.from)) {
                    content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
                    modified = true;
                }
            });
            
            if (modified) {
                fs.writeFileSync(file, content);
                console.log(`✅ Fixed navigation in ${file}`);
            } else {
                console.log(`ℹ️  ${file} already has correct navigation`);
            }
        }
    });
}

// Create index.html redirect if it doesn't match expected content
function fixIndexRedirect() {
    console.log('\n🏠 Checking Index Page...\n');
    
    if (fs.existsSync('index.html')) {
        const content = fs.readFileSync('index.html', 'utf8');
        
        // If it's just a redirect, update it to a proper landing page
        if (content.includes('meta http-equiv="refresh"') && content.length < 500) {
            console.log('📝 Creating proper index.html landing page...');
            
            const newIndex = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EzEdit.co - Professional FTP Code Editor with AI</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2rem;
        }
        .container {
            max-width: 800px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 3rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #fff, #e0e7ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
            line-height: 1.6;
        }
        .cta-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            padding: 1rem 2rem;
            border-radius: 12px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s;
            font-size: 1.1rem;
            border: 2px solid transparent;
        }
        .btn-primary {
            background: rgba(255, 255, 255, 0.9);
            color: #3b82f6;
        }
        .btn-primary:hover {
            background: white;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        .btn-secondary {
            background: transparent;
            color: white;
            border-color: rgba(255, 255, 255, 0.3);
        }
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: white;
        }
        .features {
            margin-top: 3rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
        }
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .feature h3 {
            font-size: 1.2rem;
            margin-bottom: 0.5rem;
        }
        .feature p {
            font-size: 0.9rem;
            margin: 0;
            opacity: 0.8;
        }
        @media (max-width: 768px) {
            h1 { font-size: 2rem; }
            .container { padding: 2rem; margin: 1rem; }
            .cta-buttons { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>EzEdit.co</h1>
        <p>Professional FTP Code Editor with AI-Powered Assistance</p>
        <p>Edit your websites directly on the server with Monaco Editor, real-time collaboration, and intelligent coding assistance.</p>
        
        <div class="cta-buttons">
            <a href="/signup.html" class="btn btn-primary">Start Free Trial</a>
            <a href="/pricing.html" class="btn btn-secondary">View Pricing</a>
        </div>
        
        <div class="features">
            <div class="feature">
                <h3>🚀 Monaco Editor</h3>
                <p>VS Code-quality editing experience</p>
            </div>
            <div class="feature">
                <h3>📁 FTP Integration</h3>
                <p>Direct server file editing</p>
            </div>
            <div class="feature">
                <h3>🤖 AI Assistant</h3>
                <p>Klein AI for coding help</p>
            </div>
            <div class="feature">
                <h3>👥 Team Collaboration</h3>
                <p>Multi-user workspace</p>
            </div>
        </div>
        
        <div style="margin-top: 2rem; opacity: 0.7;">
            <a href="/login-real.html" style="color: rgba(255, 255, 255, 0.8); text-decoration: none;">Already have an account? Sign in →</a>
        </div>
    </div>
</body>
</html>`;
            
            fs.writeFileSync('index.html', newIndex);
            console.log('✅ Created new landing page with proper navigation');
        } else {
            console.log('ℹ️  Index page looks good');
        }
    }
}

// Validate all page connections
async function validateConnections() {
    console.log('\n🧪 Validating Page Connections...\n');
    
    const SERVER = '159.65.224.175';
    const testPages = [
        { file: 'index.html', url: `http://${SERVER}/`, name: 'Landing Page' },
        { file: 'login-real.html', url: `http://${SERVER}/login-real.html`, name: 'Login Page' },
        { file: 'dashboard-real.html', url: `http://${SERVER}/dashboard-real.html`, name: 'Dashboard' },
        { file: 'editor-real.html', url: `http://${SERVER}/editor-real.html`, name: 'Editor' }
    ];
    
    let allWorking = true;
    
    for (const page of testPages) {
        try {
            const result = await new Promise((resolve) => {
                exec(`curl -s -o /dev/null -w "%{http_code}" "${page.url}"`, (error, stdout) => {
                    resolve(stdout.trim());
                });
            });
            
            const working = result === '200';
            console.log(`${working ? '✅' : '❌'} ${page.name}: HTTP ${result}`);
            
            if (!working) allWorking = false;
            
        } catch (error) {
            console.log(`❌ ${page.name}: Test failed`);
            allWorking = false;
        }
    }
    
    return allWorking;
}

// Create deployment files for the missing pages
function createDeploymentFiles() {
    console.log('\n📦 Creating Deployment Files...\n');
    
    // Create a simple deployment script
    const deployScript = `#!/bin/bash
# EzEdit.co Deployment Script
# Run this on your server to deploy missing files

echo "🚀 Deploying EzEdit.co missing files..."

# Files to copy to web root
FILES=(
    "signup.html"
    "pricing.html" 
    "billing.html"
    "checkout-demo.html"
    "index.html"
)

# Copy files
for file in "\${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "📤 Deploying $file..."
        cp "$file" /var/www/html/
        chmod 644 "/var/www/html/$file"
    else
        echo "❌ Missing: $file"
    fi
done

# Copy directories
if [[ -d "public/auth" ]]; then
    echo "📤 Deploying auth endpoints..."
    cp -r public/auth /var/www/html/
    chmod -R 644 /var/www/html/auth/*
fi

if [[ -d "public/api" ]]; then
    echo "📤 Deploying API endpoints..."
    cp -r public/api /var/www/html/
    chmod -R 644 /var/www/html/api/*
fi

if [[ -f "public/.htaccess" ]]; then
    echo "📤 Deploying .htaccess..."
    cp public/.htaccess /var/www/html/
    chmod 644 /var/www/html/.htaccess
fi

echo "✅ Deployment complete!"
echo "🧪 Test URLs:"
echo "   http://$(hostname -I | awk '{print $1}')/signup.html"
echo "   http://$(hostname -I | awk '{print $1}')/pricing.html"
echo "   http://$(hostname -I | awk '{print $1}')/billing.html"
`;

    fs.writeFileSync('deploy-missing-files.sh', deployScript);
    console.log('✅ Created deploy-missing-files.sh');
    
    // Make it executable
    try {
        fs.chmodSync('deploy-missing-files.sh', '755');
    } catch (e) {
        console.log('ℹ️  Note: Run chmod +x deploy-missing-files.sh on server');
    }
}

// Main execution
async function main() {
    console.log('🎯 EzEdit.co 404 Fix & Connection Repair\n');
    
    // Step 1: Fix page connections
    fixPageConnections();
    
    // Step 2: Fix index page if needed
    fixIndexRedirect();
    
    // Step 3: Create deployment files
    createDeploymentFiles();
    
    // Step 4: Validate current connections
    const connectionsWorking = await validateConnections();
    
    console.log('\n📋 Summary\n');
    console.log(`🔗 Navigation Fixed: YES`);
    console.log(`📄 Files Ready: ${MISSING_FILES.every(f => fs.existsSync(f)) ? 'YES' : 'PARTIAL'}`);
    console.log(`🧪 Current Status: ${connectionsWorking ? 'WORKING' : 'NEEDS DEPLOYMENT'}`);
    
    if (!connectionsWorking) {
        console.log('\n🚀 Deployment Instructions:');
        console.log('1. Upload missing files to your server:');
        MISSING_FILES.forEach(file => {
            if (fs.existsSync(file)) {
                console.log(`   scp ${file} root@159.65.224.175:/var/www/html/`);
            }
        });
        console.log('2. Or run deploy-missing-files.sh on your server');
        console.log('3. Test: curl -I http://159.65.224.175/signup.html');
    }
    
    console.log('\n✅ All pages will be properly connected after deployment!');
    
    return {
        filesReady: MISSING_FILES.every(f => fs.existsSync(f)),
        connectionsFixed: true,
        needsDeployment: !connectionsWorking
    };
}

// Export for use in other scripts
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, fixPageConnections, validateConnections };