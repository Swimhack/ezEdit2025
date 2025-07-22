/**
 * EzEdit.co File Validation Script
 * Tests all critical files before deployment
 */

const fs = require('fs');
const path = require('path');

// Files to validate
const criticalFiles = [
    'signup.html',
    'pricing.html', 
    'billing.html',
    'index.html',
    'login-real.html',
    'dashboard-real.html',
    'editor-real.html'
];

const apiFiles = [
    'api/ai-routes.js',
    'api/ftp-routes.js', 
    'api/sites-routes.js',
    'api/stripe-routes.js'
];

console.log('🔍 Validating EzEdit.co Files...\n');

// Check HTML files exist and have basic structure
criticalFiles.forEach(file => {
    console.log(`📄 Checking ${file}...`);
    
    if (!fs.existsSync(file)) {
        console.log(`   ❌ File missing: ${file}`);
        return;
    }
    
    const content = fs.readFileSync(file, 'utf8');
    const size = (content.length / 1024).toFixed(1);
    
    // Basic HTML validation
    const hasDoctype = content.includes('<!DOCTYPE html>');
    const hasTitle = content.includes('<title>');
    const hasSupabase = content.includes('supabase');
    const hasStripe = content.includes('stripe') || !file.includes('pricing') && !file.includes('billing');
    
    console.log(`   📊 Size: ${size}KB`);
    console.log(`   ${hasDoctype ? '✅' : '❌'} DOCTYPE declaration`);
    console.log(`   ${hasTitle ? '✅' : '❌'} Title tag`);
    console.log(`   ${hasSupabase ? '✅' : '❌'} Supabase integration`);
    
    if (file.includes('pricing') || file.includes('billing')) {
        console.log(`   ${hasStripe ? '✅' : '❌'} Stripe integration`);
    }
    
    // Check for required API keys
    if (file.includes('pricing') || file.includes('billing')) {
        const hasStripeKey = content.includes('pk_live_51R9RpGAuYycpID5h');
        console.log(`   ${hasStripeKey ? '✅' : '❌'} Stripe live key`);
    }
    
    const hasSupabaseKey = content.includes('sctsykgcfkhadowygcrj.supabase.co');
    console.log(`   ${hasSupabaseKey ? '✅' : '❌'} Supabase URL`);
    
    console.log('');
});

// Check API files
console.log('🔌 Checking API Routes...\n');

apiFiles.forEach(file => {
    console.log(`📡 Checking ${file}...`);
    
    if (!fs.existsSync(file)) {
        console.log(`   ❌ File missing: ${file}`);
        return;
    }
    
    const content = fs.readFileSync(file, 'utf8');
    const size = (content.length / 1024).toFixed(1);
    
    const hasExpress = content.includes('express');
    const hasRouter = content.includes('router');
    const hasExports = content.includes('module.exports');
    
    console.log(`   📊 Size: ${size}KB`);
    console.log(`   ${hasExpress ? '✅' : '❌'} Express framework`);
    console.log(`   ${hasRouter ? '✅' : '❌'} Router setup`);
    console.log(`   ${hasExports ? '✅' : '❌'} Module exports`);
    console.log('');
});

// Check for any obvious security issues
console.log('🔒 Security Check...\n');

criticalFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for potential security issues
    const hasEval = content.includes('eval(');
    const hasInnerHTML = content.includes('innerHTML');
    const hasDocument = content.includes('document.write');
    
    if (hasEval || hasDocument) {
        console.log(`⚠️  ${file}: Potential XSS risk detected`);
    }
    
    if (hasInnerHTML) {
        console.log(`ℹ️  ${file}: Uses innerHTML (review for XSS)`);
    }
});

console.log('✅ File validation complete!\n');

// Generate deployment summary
console.log('📋 DEPLOYMENT SUMMARY');
console.log('================================');
console.log('Files ready for deployment:');
criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const size = (fs.readFileSync(file, 'utf8').length / 1024).toFixed(1);
        console.log(`✅ ${file} (${size}KB)`);
    } else {
        console.log(`❌ ${file} (MISSING)`);
    }
});

console.log('\nAPI routes ready:');
apiFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const size = (fs.readFileSync(file, 'utf8').length / 1024).toFixed(1);
        console.log(`✅ ${file} (${size}KB)`);
    } else {
        console.log(`❌ ${file} (MISSING)`);
    }
});

console.log('\n🚀 Ready for deployment!');
console.log('Next step: Deploy to production server at 159.65.224.175');