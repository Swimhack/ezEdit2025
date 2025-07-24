const fs = require('fs');
const path = require('path');

// Validation results
let validationResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    validationResults.details.push({
        type,
        message,
        timestamp
    });
    
    if (type === 'error') validationResults.failed++;
    else if (type === 'warning') validationResults.warnings++;
    else validationResults.passed++;
}

function validateFileExists(filePath, description) {
    if (fs.existsSync(filePath)) {
        log(`${description} exists at: ${filePath}`);
        return true;
    } else {
        log(`${description} is missing at: ${filePath}`, 'error');
        return false;
    }
}

function validateHTMLStructure(filePath, expectedElements) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        expectedElements.forEach(element => {
            if (content.includes(element.selector)) {
                log(`Found expected element: ${element.description}`);
            } else {
                log(`Missing expected element: ${element.description} (${element.selector})`, 'error');
            }
        });
    } catch (error) {
        log(`Error reading file ${filePath}: ${error.message}`, 'error');
    }
}

function validateCSSFile(filePath, expectedClasses) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        expectedClasses.forEach(className => {
            if (content.includes(`.${className}`) || content.includes(`${className} {`)) {
                log(`Found CSS class: ${className}`);
            } else {
                log(`Missing CSS class: ${className}`, 'warning');
            }
        });
    } catch (error) {
        log(`Error reading CSS file ${filePath}: ${error.message}`, 'error');
    }
}

function validateResponsiveDesign(cssFilePath) {
    try {
        const content = fs.readFileSync(cssFilePath, 'utf8');
        
        const responsiveFeatures = [
            '@media',
            'max-width',
            'min-width',
            'mobile',
            'tablet',
            'desktop'
        ];
        
        responsiveFeatures.forEach(feature => {
            if (content.includes(feature)) {
                log(`Found responsive design feature: ${feature}`);
            }
        });
        
        if (!content.includes('@media')) {
            log('No responsive design (@media queries) found', 'warning');
        }
    } catch (error) {
        log(`Error validating responsive design: ${error.message}`, 'error');
    }
}

async function runValidation() {
    console.log('🚀 Starting EzEdit.co UI Validation...\n');
    
    const publicDir = path.join(__dirname, 'public');
    
    // 1. Validate core files exist
    log('=== File Existence Validation ===');
    const coreFiles = [
        { path: path.join(publicDir, 'index.php'), desc: 'Landing page' },
        { path: path.join(publicDir, 'auth', 'login.php'), desc: 'Login page' },
        { path: path.join(publicDir, 'dashboard.php'), desc: 'Dashboard page' },
        { path: path.join(publicDir, 'css', 'main.css'), desc: 'Main CSS' },
        { path: path.join(publicDir, 'css', 'auth.css'), desc: 'Auth CSS' },
        { path: path.join(publicDir, 'css', 'dashboard.css'), desc: 'Dashboard CSS' },
        { path: path.join(publicDir, 'js', 'main.js'), desc: 'Main JavaScript' }
    ];
    
    coreFiles.forEach(file => {
        validateFileExists(file.path, file.desc);
    });
    
    // 2. Validate Landing Page Structure (matches screenshot_landing_page_.jpg)
    log('\n=== Landing Page Structure Validation ===');
    const landingPageElements = [
        { selector: 'class="logo"', description: 'EzEdit.co logo' },
        { selector: 'class="nav-menu"', description: 'Navigation menu' },
        { selector: 'class="hero-title"', description: 'Hero title' },
        { selector: 'AI-Powered', description: 'AI-Powered text in title' },
        { selector: 'class="hero-subtitle"', description: 'Hero subtitle' },
        { selector: 'FTP/SFTP', description: 'FTP/SFTP mention' },
        { selector: 'class="email-form"', description: 'Email signup form' },
        { selector: 'Get early access', description: 'Early access text' },
        { selector: 'Get Started for Free', description: 'CTA button' },
        { selector: 'Watch Demo', description: 'Demo button' },
        { selector: 'class="features-section"', description: 'Features section' },
        { selector: 'class="pricing-section"', description: 'Pricing section' }
    ];
    
    validateHTMLStructure(path.join(publicDir, 'index.php'), landingPageElements);
    
    // 3. Validate Login Page Structure (matches screenshot_login_authentication.jpg)
    log('\n=== Login Page Structure Validation ===');
    const loginPageElements = [
        { selector: 'Welcome back', description: 'Welcome back title' },
        { selector: 'Sign in to your account', description: 'Subtitle' },
        { selector: 'Sign In', description: 'Sign In heading' },
        { selector: 'Enter your credentials', description: 'Instructions text' },
        { selector: 'type="email"', description: 'Email input field' },
        { selector: 'type="password"', description: 'Password input field' },
        { selector: 'Remember me', description: 'Remember me checkbox' },
        { selector: 'Forgot password', description: 'Forgot password link' },
        { selector: 'Sign in', description: 'Sign in button' },
        { selector: 'Don\'t have an account', description: 'Sign up link text' }
    ];
    
    if (fs.existsSync(path.join(publicDir, 'auth', 'login.php'))) {
        validateHTMLStructure(path.join(publicDir, 'auth', 'login.php'), loginPageElements);
    }
    
    // 4. Validate Dashboard Structure (matches screenshot_my_sites.png)
    log('\n=== Dashboard Structure Validation ===');
    const dashboardElements = [
        { selector: 'Dashboard', description: 'Dashboard title/navigation' },
        { selector: 'My FTP Sites', description: 'My FTP Sites heading' },
        { selector: 'Add Site', description: 'Add Site button' },
        { selector: 'Free Trial Mode', description: 'Trial mode notice' },
        { selector: 'browse and edit files', description: 'Trial limitation text' },
        { selector: 'premium subscription', description: 'Upgrade text' },
        { selector: 'My Sites', description: 'My Sites navigation' },
        { selector: 'Settings', description: 'Settings navigation' }
    ];
    
    if (fs.existsSync(path.join(publicDir, 'dashboard.php'))) {
        validateHTMLStructure(path.join(publicDir, 'dashboard.php'), dashboardElements);
    }
    
    // 5. Validate CSS Classes
    log('\n=== CSS Structure Validation ===');
    const expectedCSSClasses = [
        'logo', 'nav-menu', 'hero-section', 'hero-title', 'text-gradient',
        'hero-subtitle', 'btn-primary', 'btn-secondary', 'email-form',
        'features-section', 'feature-card', 'pricing-section', 'pricing-card'
    ];
    
    if (fs.existsSync(path.join(publicDir, 'css', 'main.css'))) {
        validateCSSFile(path.join(publicDir, 'css', 'main.css'), expectedCSSClasses);
    }
    
    // 6. Validate Responsive Design
    log('\n=== Responsive Design Validation ===');
    if (fs.existsSync(path.join(publicDir, 'css', 'main.css'))) {
        validateResponsiveDesign(path.join(publicDir, 'css', 'main.css'));
    }
    
    // 7. Validate Navigation Links
    log('\n=== Navigation Links Validation ===');
    const indexContent = fs.existsSync(path.join(publicDir, 'index.php')) ? 
        fs.readFileSync(path.join(publicDir, 'index.php'), 'utf8') : '';
    
    const expectedLinks = [
        { href: 'auth/login.php', desc: 'Login link' },
        { href: 'auth/register.php', desc: 'Register/Sign up link' },
        { href: '#features', desc: 'Features anchor' },
        { href: '#pricing', desc: 'Pricing anchor' }
    ];
    
    expectedLinks.forEach(link => {
        if (indexContent.includes(`href="${link.href}"`)) {
            log(`Found navigation link: ${link.desc}`);
        } else {
            log(`Missing navigation link: ${link.desc} (${link.href})`, 'warning');
        }
    });
    
    // 8. Check for design consistency
    log('\n=== Design Consistency Validation ===');
    
    // Check for consistent button classes
    const buttonConsistency = [
        'btn-primary',
        'btn-secondary',
        'btn-large',
        'btn-full'
    ];
    
    buttonConsistency.forEach(btnClass => {
        if (indexContent.includes(btnClass)) {
            log(`Found consistent button class: ${btnClass}`);
        }
    });
    
    // Check for color scheme consistency
    const colorElements = [
        'text-gradient',
        'logo-icon',
        'btn-primary'
    ];
    
    colorElements.forEach(element => {
        if (indexContent.includes(element)) {
            log(`Found color scheme element: ${element}`);
        }
    });
    
    // Summary
    log('\n=== Validation Summary ===');
    log(`✅ Passed: ${validationResults.passed}`);
    log(`⚠️  Warnings: ${validationResults.warnings}`);
    log(`❌ Failed: ${validationResults.failed}`);
    
    const totalTests = validationResults.passed + validationResults.warnings + validationResults.failed;
    const successRate = ((validationResults.passed / totalTests) * 100).toFixed(2);
    
    log(`\n📊 Success Rate: ${successRate}%`);
    
    if (validationResults.failed === 0) {
        log('\n🎉 All critical validations passed! Application is ready for deployment.');
        return true;
    } else {
        log(`\n🔧 ${validationResults.failed} critical issues need to be addressed before deployment.`);
        return false;
    }
}

// Run validation
runValidation().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Validation failed with error:', error);
    process.exit(1);
});