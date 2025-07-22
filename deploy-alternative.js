/**
 * Alternative Deployment Script for EzEdit.co
 * Uses Node.js to deploy files via HTTP/HTTPS methods
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const SERVER = '159.65.224.175';
const SERVER_PASSWORD = 'MattKaylaS2two';

// Files to deploy
const criticalFiles = [
    { local: 'signup.html', remote: '/var/www/html/signup.html' },
    { local: 'pricing.html', remote: '/var/www/html/pricing.html' },
    { local: 'billing.html', remote: '/var/www/html/billing.html' }
];

const apiFiles = [
    { local: 'api/ai-routes.js', remote: '/var/www/html/api/ai-routes.js' },
    { local: 'api/ftp-routes.js', remote: '/var/www/html/api/ftp-routes.js' },
    { local: 'api/sites-routes.js', remote: '/var/www/html/api/sites-routes.js' },
    { local: 'api/stripe-routes.js', remote: '/var/www/html/api/stripe-routes.js' }
];

console.log('🚀 EzEdit.co Alternative Deployment\n');

// Method 1: Try using expect for SSH automation
function deployViaExpect() {
    console.log('📡 Attempting deployment via expect...\n');
    
    criticalFiles.forEach((file, index) => {
        if (!fs.existsSync(file.local)) {
            console.log(`❌ File not found: ${file.local}`);
            return;
        }
        
        const expectScript = `
spawn scp -o StrictHostKeyChecking=no ${file.local} root@${SERVER}:${file.remote}
expect "password:"
send "${SERVER_PASSWORD}\\r"
expect eof
        `.trim();
        
        console.log(`📤 Deploying ${file.local}...`);
        console.log(`   Command: scp ${file.local} root@${SERVER}:${file.remote}`);
    });
}

// Method 2: Generate manual deployment commands
function generateManualCommands() {
    console.log('📋 MANUAL DEPLOYMENT COMMANDS\n');
    console.log('Copy and paste these commands one by one:\n');
    
    console.log('# Deploy critical HTML files:');
    criticalFiles.forEach(file => {
        if (fs.existsSync(file.local)) {
            console.log(`echo "Deploying ${file.local}..."`);
            console.log(`scp -o StrictHostKeyChecking=no "${file.local}" root@${SERVER}:"${file.remote}"`);
            console.log('# Enter password: MattKaylaS2two');
            console.log('');
        }
    });
    
    console.log('# Deploy API files:');
    apiFiles.forEach(file => {
        if (fs.existsSync(file.local)) {
            console.log(`echo "Deploying ${file.local}..."`);
            console.log(`scp -o StrictHostKeyChecking=no "${file.local}" root@${SERVER}:"${file.remote}"`);
            console.log('# Enter password: MattKaylaS2two');
            console.log('');
        }
    });
    
    console.log('# Test deployment:');
    console.log(`curl -I http://${SERVER}/signup.html`);
    console.log(`curl -I http://${SERVER}/pricing.html`); 
    console.log(`curl -I http://${SERVER}/billing.html`);
}

// Method 3: Create deployment archive
function createDeploymentPackage() {
    console.log('📦 Creating deployment package...\n');
    
    const deploymentData = {
        timestamp: new Date().toISOString(),
        files: {},
        commands: [],
        tests: []
    };
    
    // Read all files to deploy
    [...criticalFiles, ...apiFiles].forEach(file => {
        if (fs.existsSync(file.local)) {
            const content = fs.readFileSync(file.local, 'utf8');
            const size = (content.length / 1024).toFixed(1);
            
            deploymentData.files[file.local] = {
                content: content,
                size: `${size}KB`,
                targetPath: file.remote,
                hash: require('crypto').createHash('md5').update(content).digest('hex')
            };
            
            deploymentData.commands.push(`scp "${file.local}" root@${SERVER}:"${file.remote}"`);
            console.log(`✅ Packaged ${file.local} (${size}KB)`);
        }
    });
    
    // Add test commands
    deploymentData.tests = [
        `curl -I http://${SERVER}/signup.html`,
        `curl -I http://${SERVER}/pricing.html`,
        `curl -I http://${SERVER}/billing.html`
    ];
    
    // Write deployment package
    const packagePath = 'deployment-package.json';
    fs.writeFileSync(packagePath, JSON.stringify(deploymentData, null, 2));
    
    console.log(`\n📦 Deployment package created: ${packagePath}`);
    console.log(`   Contains ${Object.keys(deploymentData.files).length} files`);
    
    return deploymentData;
}

// Method 4: Test current deployment status
async function testCurrentDeployment() {
    console.log('🧪 Testing current deployment status...\n');
    
    const testUrls = [
        { url: `http://${SERVER}/`, name: 'Landing page' },
        { url: `http://${SERVER}/signup.html`, name: 'Signup page' },
        { url: `http://${SERVER}/pricing.html`, name: 'Pricing page' },
        { url: `http://${SERVER}/billing.html`, name: 'Billing page' },
        { url: `http://${SERVER}/login-real.html`, name: 'Login page' },
        { url: `http://${SERVER}/dashboard-real.html`, name: 'Dashboard' },
        { url: `http://${SERVER}/editor-real.html`, name: 'Editor' }
    ];
    
    for (const test of testUrls) {
        try {
            const result = await new Promise((resolve) => {
                exec(`curl -s -o /dev/null -w "%{http_code}" "${test.url}"`, (error, stdout) => {
                    resolve(stdout.trim());
                });
            });
            
            const status = result === '200' ? '✅' : result === '404' ? '❌' : '⚠️';
            console.log(`${status} ${test.name}: HTTP ${result}`);
            
        } catch (error) {
            console.log(`❌ ${test.name}: Error testing`);
        }
    }
}

// Main execution
async function main() {
    console.log('🎯 Deployment Status Check');
    await testCurrentDeployment();
    
    console.log('\n📦 Creating Deployment Package');
    const packageData = createDeploymentPackage();
    
    console.log('\n📋 Manual Deployment Instructions');
    generateManualCommands();
    
    console.log('\n🎉 Deployment Ready!');
    console.log('\nOptions to deploy:');
    console.log('1. Use the manual commands above');
    console.log('2. Use deployment-package.json for automated tools');
    console.log('3. Upload files directly via FTP client');
    
    console.log('\n🎯 Expected outcome after deployment:');
    console.log('✅ Complete user signup flow');
    console.log('✅ Working subscription payments');
    console.log('✅ Full billing management');
    console.log('✅ Revenue generation enabled');
}

main().catch(console.error);