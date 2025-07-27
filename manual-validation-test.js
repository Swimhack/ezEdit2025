const fs = require('fs');
const path = require('path');
const http = require('http');

async function validateEzeditApp() {
    console.log('🧪 EzEdit.co Manual Validation Test\n');
    console.log('=' .repeat(60));
    
    const results = {
        javascriptFiles: [],
        mobileNavigation: [],
        monacoEditor: [],
        formValidation: [],
        resources: [],
        mobileFirst: []
    };

    // Test 1: Check JavaScript Files Exist
    console.log('\n1️⃣  Checking JavaScript Files...');
    const jsFiles = [
        'public/js/auth.js',
        'public/js/dashboard.js',
        'public/js/editor.js',
        'public/js/ftp-client.js',
        'public/js/ai-assistant.js'
    ];

    for (const file of jsFiles) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const size = fs.statSync(filePath).size;
            
            if (size > 0) {
                results.javascriptFiles.push(`✅ ${file} exists (${size} bytes)`);
                
                // Check for common patterns
                if (content.includes('addEventListener')) {
                    results.javascriptFiles.push(`   └─ Contains event listeners`);
                }
                if (content.includes('fetch') || content.includes('XMLHttpRequest')) {
                    results.javascriptFiles.push(`   └─ Contains API calls`);
                }
            } else {
                results.javascriptFiles.push(`⚠️  ${file} exists but is empty`);
            }
        } else {
            results.javascriptFiles.push(`❌ ${file} not found`);
        }
    }

    // Test 2: Check Mobile Navigation in HTML/CSS
    console.log('\n2️⃣  Checking Mobile Navigation...');
    const htmlFiles = ['public/index.php', 'public/dashboard.php', 'public/editor.php'];
    
    for (const file of htmlFiles) {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            
            // Check for hamburger menu elements
            if (content.match(/hamburger|mobile-menu|menu-toggle/i)) {
                results.mobileNavigation.push(`✅ ${path.basename(file)} contains mobile menu elements`);
            }
            
            // Check for viewport meta tag
            if (content.includes('viewport') && content.includes('width=device-width')) {
                results.mobileNavigation.push(`✅ ${path.basename(file)} has proper viewport meta tag`);
            }
        }
    }

    // Check main.js for mobile menu functionality
    const mainJsPath = 'public/js/main.js';
    if (fs.existsSync(mainJsPath)) {
        const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
        if (mainJsContent.includes('hamburger') || mainJsContent.includes('mobile-menu')) {
            results.mobileNavigation.push('✅ main.js contains mobile menu logic');
        }
    }

    // Test 3: Check Monaco Editor Integration
    console.log('\n3️⃣  Checking Monaco Editor Integration...');
    const editorPhpPath = 'public/editor.php';
    const editorJsPath = 'public/js/editor.js';
    
    if (fs.existsSync(editorPhpPath)) {
        const editorContent = fs.readFileSync(editorPhpPath, 'utf8');
        
        // Check for Monaco script loading
        if (editorContent.includes('monaco') || editorContent.includes('vs/loader')) {
            results.monacoEditor.push('✅ editor.php references Monaco editor');
        } else {
            results.monacoEditor.push('❌ editor.php does not reference Monaco editor');
        }
        
        // Check for editor container
        if (editorContent.includes('id="editor"') || editorContent.includes('class="editor')) {
            results.monacoEditor.push('✅ editor.php has editor container element');
        }
    }
    
    if (fs.existsSync(editorJsPath)) {
        const editorJsContent = fs.readFileSync(editorJsPath, 'utf8');
        
        if (editorJsContent.includes('monaco.editor')) {
            results.monacoEditor.push('✅ editor.js contains Monaco editor initialization');
        }
        
        // Check for known issues
        if (editorJsContent.includes('downloadFile') && !editorJsContent.includes('getFile')) {
            results.monacoEditor.push('⚠️  editor.js may have downloadFile/getFile mismatch issue');
        }
    }

    // Test 4: Check Form Validation
    console.log('\n4️⃣  Checking Form Validation...');
    const formFiles = ['public/auth/login.php', 'public/auth/register.php', 'public/dashboard.php'];
    
    for (const file of formFiles) {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            
            // Check for form elements
            if (content.includes('<form')) {
                results.formValidation.push(`✅ ${path.basename(file)} contains form element`);
                
                // Check for required attributes
                const requiredCount = (content.match(/required/g) || []).length;
                if (requiredCount > 0) {
                    results.formValidation.push(`   └─ Has ${requiredCount} required field(s)`);
                }
                
                // Check for input types
                if (content.includes('type="email"')) {
                    results.formValidation.push(`   └─ Has email input with validation`);
                }
                if (content.includes('type="password"')) {
                    results.formValidation.push(`   └─ Has password input`);
                }
            }
        }
    }

    // Check auth.js for validation logic
    if (fs.existsSync('public/js/auth.js')) {
        const authContent = fs.readFileSync('public/js/auth.js', 'utf8');
        if (authContent.includes('validate') || authContent.includes('checkValidity')) {
            results.formValidation.push('✅ auth.js contains validation logic');
        }
    }

    // Test 5: Check for Missing Resources
    console.log('\n5️⃣  Checking for Missing Resources...');
    
    // Check if critical CSS files exist
    const cssFiles = ['public/css/main.css', 'public/css/auth.css', 'public/css/dashboard.css', 'public/css/editor.css'];
    for (const file of cssFiles) {
        if (fs.existsSync(file)) {
            results.resources.push(`✅ ${file} exists`);
        } else {
            results.resources.push(`❌ ${file} not found (404)`);
        }
    }

    // Check for common missing files in HTML
    const checkHtmlReferences = (filePath) => {
        if (!fs.existsSync(filePath)) return;
        
        const content = fs.readFileSync(filePath, 'utf8');
        const srcMatches = content.match(/(?:src|href)="([^"]+)"/g) || [];
        
        srcMatches.forEach(match => {
            const resource = match.match(/(?:src|href)="([^"]+)"/)[1];
            if (!resource.startsWith('http') && !resource.startsWith('//')) {
                const resourcePath = path.join('public', resource.replace(/^\//, ''));
                if (!fs.existsSync(resourcePath) && !resource.includes('monaco')) {
                    results.resources.push(`⚠️  ${path.basename(filePath)} references missing: ${resource}`);
                }
            }
        });
    };

    ['public/index.php', 'public/editor.php', 'public/dashboard.php'].forEach(checkHtmlReferences);

    // Test 6: Check Mobile-First Design
    console.log('\n6️⃣  Checking Mobile-First Design...');
    
    // Check CSS for mobile-first patterns
    if (fs.existsSync('public/css/main.css')) {
        const mainCss = fs.readFileSync('public/css/main.css', 'utf8');
        
        // Check for media queries
        const minWidthQueries = (mainCss.match(/@media.*min-width/g) || []).length;
        const maxWidthQueries = (mainCss.match(/@media.*max-width/g) || []).length;
        
        if (minWidthQueries > maxWidthQueries) {
            results.mobileFirst.push('✅ CSS uses mobile-first approach (more min-width queries)');
        } else if (maxWidthQueries > 0) {
            results.mobileFirst.push('⚠️  CSS appears to use desktop-first approach');
        }
        
        // Check for responsive units
        if (mainCss.includes('rem') || mainCss.includes('em')) {
            results.mobileFirst.push('✅ CSS uses relative units (rem/em)');
        }
        if (mainCss.includes('vw') || mainCss.includes('vh')) {
            results.mobileFirst.push('✅ CSS uses viewport units (vw/vh)');
        }
        if (mainCss.includes('flex') || mainCss.includes('grid')) {
            results.mobileFirst.push('✅ CSS uses modern layout techniques (flexbox/grid)');
        }
    }

    // Print Results
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(60));

    Object.entries(results).forEach(([category, items]) => {
        if (items.length > 0) {
            console.log(`\n${getCategoryTitle(category)}:`);
            items.forEach(item => console.log(item));
        }
    });

    // Calculate summary
    let passed = 0, failed = 0, warnings = 0;
    Object.values(results).flat().forEach(item => {
        if (item.includes('✅')) passed++;
        else if (item.includes('❌')) failed++;
        else if (item.includes('⚠️')) warnings++;
    });

    console.log('\n' + '='.repeat(60));
    console.log('📈 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${(passed / (passed + failed + warnings) * 100).toFixed(1)}%`);

    // Specific recommendations
    console.log('\n' + '='.repeat(60));
    console.log('🎯 KEY FINDINGS');
    console.log('='.repeat(60));

    // Check for critical issues mentioned in requirements
    const criticalIssues = [];
    
    if (!fs.existsSync('public/js/auth.js') || fs.statSync('public/js/auth.js').size === 0) {
        criticalIssues.push('❌ auth.js is missing or empty');
    }
    
    if (results.monacoEditor.some(r => r.includes('mismatch'))) {
        criticalIssues.push('⚠️  Potential downloadFile/getFile mismatch in editor');
    }
    
    if (results.resources.some(r => r.includes('404'))) {
        criticalIssues.push('❌ Some CSS/JS resources are missing (404 errors)');
    }

    if (criticalIssues.length > 0) {
        console.log('\n⚠️  Critical Issues Found:');
        criticalIssues.forEach(issue => console.log(`   - ${issue}`));
    } else {
        console.log('\n✅ No critical issues detected!');
    }

    console.log('\n✅ Manual validation complete!');
}

function getCategoryTitle(key) {
    const titles = {
        javascriptFiles: 'JavaScript Files',
        mobileNavigation: 'Mobile Navigation',
        monacoEditor: 'Monaco Editor',
        formValidation: 'Form Validation',
        resources: 'Resource Loading',
        mobileFirst: 'Mobile-First Design'
    };
    return titles[key] || key;
}

// Run validation
validateEzeditApp().catch(console.error);