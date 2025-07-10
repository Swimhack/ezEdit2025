#!/usr/bin/env node

/**
 * EzEdit Integration Test Runner
 * Tests the complete FTP-Monaco integration workflow
 */

const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor() {
        this.testResults = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    async runAllTests() {
        console.log('🧪 EzEdit Integration Test Suite');
        console.log('================================\n');
        
        // Test 1: File Structure Validation
        await this.testFileStructure();
        
        // Test 2: Method Name Consistency
        await this.testMethodConsistency();
        
        // Test 3: Netlify Configuration
        await this.testNetlifyConfig();
        
        // Test 4: Function Dependencies
        await this.testFunctionDependencies();
        
        // Test 5: Monaco Editor Setup
        await this.testMonacoSetup();
        
        // Print Results
        this.printResults();
        
        return this.failed === 0;
    }
    
    async testFileStructure() {
        this.log('Testing file structure...');
        
        const requiredFiles = [
            'public/js/monaco-editor.js',
            'public/js/ftp-service.js',
            'public/js/file-explorer.js',
            'public/ftp/ftp-handler.php',
            'netlify/functions/ftp-handler.js',
            'netlify/functions/package.json',
            'netlify.toml',
            'claude.md',
            'docs/PRD.md',
            'docs/TECHNICAL_GUIDE.md',
            'docs/API_ENDPOINTS.md',
            'docs/TESTING_GUIDE.md'
        ];
        
        let missing = [];
        
        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, '..', file);
            if (!fs.existsSync(filePath)) {
                missing.push(file);
            }
        }
        
        if (missing.length === 0) {
            this.pass('✅ All required files present');
        } else {
            this.fail(`❌ Missing files: ${missing.join(', ')}`);
        }
    }
    
    async testMethodConsistency() {
        this.log('Testing method name consistency...');
        
        try {
            // Read Monaco editor file
            const monacoContent = fs.readFileSync(
                path.join(__dirname, '..', 'public/js/monaco-editor.js'),
                'utf8'
            );
            
            // Read FTP service file
            const ftpContent = fs.readFileSync(
                path.join(__dirname, '..', 'public/js/ftp-service.js'),
                'utf8'
            );
            
            // Check for method consistency
            const errors = [];
            
            // Check for downloadFile vs getFile
            if (monacoContent.includes('downloadFile')) {
                errors.push('Monaco editor still uses downloadFile instead of getFile');
            }
            
            // Check for uploadFile vs saveFile
            if (monacoContent.includes('uploadFile')) {
                errors.push('Monaco editor still uses uploadFile instead of saveFile');
            }
            
            // Check if FTP service has required methods
            if (!ftpContent.includes('function getFile')) {
                errors.push('FTP service missing getFile method');
            }
            
            if (!ftpContent.includes('function saveFile')) {
                errors.push('FTP service missing saveFile method');
            }
            
            if (errors.length === 0) {
                this.pass('✅ Method names are consistent');
            } else {
                this.fail(`❌ Method consistency issues: ${errors.join(', ')}`);
            }
            
        } catch (error) {
            this.fail(`❌ Error reading files: ${error.message}`);
        }
    }
    
    async testNetlifyConfig() {
        this.log('Testing Netlify configuration...');
        
        try {
            const netlifyContent = fs.readFileSync(
                path.join(__dirname, '..', 'netlify.toml'),
                'utf8'
            );
            
            const errors = [];
            
            // Check for FTP handler redirect
            if (!netlifyContent.includes('/ftp/ftp-handler.php')) {
                errors.push('Missing FTP handler redirect');
            }
            
            if (!netlifyContent.includes('/.netlify/functions/ftp-handler')) {
                errors.push('Missing Netlify function redirect');
            }
            
            if (errors.length === 0) {
                this.pass('✅ Netlify configuration is correct');
            } else {
                this.fail(`❌ Netlify config issues: ${errors.join(', ')}`);
            }
            
        } catch (error) {
            this.fail(`❌ Error reading netlify.toml: ${error.message}`);
        }
    }
    
    async testFunctionDependencies() {
        this.log('Testing Netlify function dependencies...');
        
        try {
            const packageContent = fs.readFileSync(
                path.join(__dirname, '..', 'netlify/functions/package.json'),
                'utf8'
            );
            
            const packageJson = JSON.parse(packageContent);
            
            const errors = [];
            
            // Check for basic-ftp dependency
            if (!packageJson.dependencies || !packageJson.dependencies['basic-ftp']) {
                errors.push('Missing basic-ftp dependency');
            }
            
            // Check Node.js version
            if (!packageJson.engines || !packageJson.engines.node) {
                errors.push('Missing Node.js version specification');
            }
            
            if (errors.length === 0) {
                this.pass('✅ Function dependencies are correct');
            } else {
                this.fail(`❌ Dependency issues: ${errors.join(', ')}`);
            }
            
        } catch (error) {
            this.fail(`❌ Error reading package.json: ${error.message}`);
        }
    }
    
    async testMonacoSetup() {
        this.log('Testing Monaco editor setup...');
        
        try {
            const monacoContent = fs.readFileSync(
                path.join(__dirname, '..', 'public/js/monaco-editor.js'),
                'utf8'
            );
            
            const errors = [];
            
            // Check for CDN URL
            if (!monacoContent.includes('cdnjs.cloudflare.com/ajax/libs/monaco-editor')) {
                errors.push('Monaco CDN URL not found');
            }
            
            // Check for event listeners
            if (!monacoContent.includes('addEventListener(\'fileSelected\'')) {
                errors.push('Missing fileSelected event listener');
            }
            
            // Check for FTP service integration
            if (!monacoContent.includes('window.ezEdit.ftpService')) {
                errors.push('Missing FTP service integration');
            }
            
            // Check for proper data access
            if (!monacoContent.includes('result.data.content')) {
                errors.push('Incorrect data access pattern');
            }
            
            if (errors.length === 0) {
                this.pass('✅ Monaco editor setup is correct');
            } else {
                this.fail(`❌ Monaco setup issues: ${errors.join(', ')}`);
            }
            
        } catch (error) {
            this.fail(`❌ Error reading Monaco editor: ${error.message}`);
        }
    }
    
    log(message) {
        console.log(`🔍 ${message}`);
    }
    
    pass(message) {
        console.log(`   ${message}`);
        this.testResults.push({ status: 'PASS', message });
        this.passed++;
    }
    
    fail(message) {
        console.log(`   ${message}`);
        this.testResults.push({ status: 'FAIL', message });
        this.failed++;
    }
    
    printResults() {
        console.log('\n📊 Test Results');
        console.log('================');
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📝 Total: ${this.testResults.length}`);
        
        if (this.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`   - ${r.message}`));
        }
        
        if (this.failed === 0) {
            console.log('\n🎉 All tests passed! The FTP-Monaco integration is ready.');
        } else {
            console.log('\n⚠️  Some tests failed. Please fix the issues above.');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = TestRunner;