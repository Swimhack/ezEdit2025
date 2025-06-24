/**
 * Fix absolute paths to relative paths in HTML and JS files
 * This script is used to make the ezEdit project work when opened directly from the filesystem
 */

const fs = require('fs');
const path = require('path');

// Files to process
const filesToFix = [
  'public/dashboard.html',
  'public/auth-callback.html',
  'public/components/header.js',
  'public/js/app.js',
  'public/js/authentication.js',
  'public/js/dashboard.js',
  'public/signup.html',
  'public/js/settings.js'
];

// Process each file
filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  // Read file content
  fs.readFile(fullPath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);
      return;
    }
    
    // Replace absolute paths with relative paths
    // window.location.href = '/page.html' -> window.location.href = 'page.html'
    const fixedContent = data.replace(/window\.location\.href\s*=\s*['"]\/([^'"]+)['"]/g, 'window.location.href = \'$1\'');
    
    // Write fixed content back to file
    fs.writeFile(fullPath, fixedContent, 'utf8', err => {
      if (err) {
        console.error(`Error writing file ${filePath}:`, err);
        return;
      }
      
      console.log(`Fixed paths in ${filePath}`);
    });
  });
});

console.log('Path fixing script completed!');
