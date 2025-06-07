/**
 * Case-sensitivity checker script
 * This identifies duplicate files that differ only by case, which can cause build issues on case-sensitive systems
 */
const fs = require('fs');
const path = require('path');

// Map to store lowercase paths and their actual paths
const files = new Map();
const duplicates = [];

function checkDirectory(dir) {
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      // Skip node_modules and dist
      if (entry !== 'node_modules' && entry !== 'dist') {
        checkDirectory(fullPath);
      }
    } else {
      const lowercasePath = fullPath.toLowerCase();
      
      if (files.has(lowercasePath)) {
        // Found a duplicate by case
        duplicates.push({
          originalPath: files.get(lowercasePath),
          duplicatePath: fullPath
        });
      } else {
        files.set(lowercasePath, fullPath);
      }
    }
  }
}

// Start checking from current directory
const rootDir = process.cwd();
console.log(`Checking for case-sensitivity issues in: ${rootDir}`);
checkDirectory(rootDir);

if (duplicates.length === 0) {
  console.log('✅ No case-sensitivity issues found');
} else {
  console.log('❌ Found files that differ only by case:');
  duplicates.forEach(({ originalPath, duplicatePath }) => {
    console.log(`\n- Original: ${originalPath}`);
    console.log(`- Duplicate: ${duplicatePath}`);
  });
  console.log('\nThese files should be consolidated to avoid build issues on case-sensitive systems.');
}
