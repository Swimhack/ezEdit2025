#!/usr/bin/env node

/**
 * Deployment Analysis Tool
 * Analyzes the current deployment to understand the structure and issues
 */

const http = require('http');
const fs = require('fs');

const BASE_URL = 'http://159.65.224.175';

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const req = http.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function analyzeDeployment() {
  console.log('🔍 EzEdit.co Deployment Analysis');
  console.log('==================================\n');
  
  // 1. Analyze working pages
  const workingPages = ['/', '/login-real.html', '/dashboard-real.html', '/editor-real.html'];
  
  for (const page of workingPages) {
    console.log(`📄 Analyzing ${page}...`);
    try {
      const response = await makeRequest(page);
      
      if (response.statusCode === 200) {
        // Extract referenced resources
        const resources = extractResources(response.body);
        console.log(`  ✅ Status: ${response.statusCode}`);
        console.log(`  📦 Resources found: ${resources.length}`);
        
        // Check each resource
        for (const resource of resources.slice(0, 5)) { // Check first 5
          try {
            const resResponse = await makeRequest(resource);
            const status = resResponse.statusCode === 200 ? '✅' : '❌';
            console.log(`    ${status} ${resource} (${resResponse.statusCode})`);
          } catch (error) {
            console.log(`    ❌ ${resource} (ERROR)`);
          }
        }
        
        if (resources.length > 5) {
          console.log(`    ... and ${resources.length - 5} more resources`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }
  
  // 2. Test common paths for missing files
  console.log('🔍 Testing common file locations...');
  
  const commonFiles = [
    '/signup.html',
    '/pricing.html', 
    '/billing.html',
    '/css/styles.css',
    '/js/app.js',
    '/assets/css/main.css',
    '/static/css/styles.css'
  ];
  
  for (const file of commonFiles) {
    try {
      const response = await makeRequest(file);
      const status = response.statusCode === 200 ? '✅' : '❌';
      console.log(`${status} ${file} (${response.statusCode})`);
    } catch (error) {
      console.log(`❌ ${file} (ERROR)`);
    }
  }
  
  console.log('\n📋 Deployment Structure Analysis Complete');
}

function extractResources(html) {
  const resources = [];
  
  // Extract CSS files
  const cssRegex = /<link[^>]*href=["']([^"']*\.css[^"']*)["']/g;
  let match;
  while ((match = cssRegex.exec(html)) !== null) {
    if (!match[1].startsWith('http')) {
      resources.push(match[1]);
    }
  }
  
  // Extract JS files
  const jsRegex = /<script[^>]*src=["']([^"']*\.js[^"']*)["']/g;
  while ((match = jsRegex.exec(html)) !== null) {
    if (!match[1].startsWith('http') && !match[1].includes('cdn')) {
      resources.push(match[1]);
    }
  }
  
  // Extract image files
  const imgRegex = /<img[^>]*src=["']([^"']*\.(png|jpg|jpeg|gif|svg)[^"']*)["']/g;
  while ((match = imgRegex.exec(html)) !== null) {
    if (!match[1].startsWith('http')) {
      resources.push(match[1]);
    }
  }
  
  return [...new Set(resources)]; // Remove duplicates
}

analyzeDeployment().catch(console.error);