// Debug build helper script for ezEdit
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 ezEdit Debug Build Helper');
console.log('==========================');

// Ensure clean dist directory
if (fs.existsSync('dist')) {
  console.log('Cleaning existing dist folder...');
  fs.rmSync('dist', { recursive: true, force: true });
}

// Create dist folder
fs.mkdirSync('dist', { recursive: true });

// Ensure public files are copied
console.log('Copying critical public files...');
if (fs.existsSync('public')) {
  const copyPublicFiles = (source, target) => {
    const files = fs.readdirSync(source);
    files.forEach(file => {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);
      
      if (fs.statSync(sourcePath).isDirectory()) {
        fs.mkdirSync(targetPath, { recursive: true });
        copyPublicFiles(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    });
  };
  
  copyPublicFiles('public', 'dist');
  console.log('Public files copied successfully');
}

// Ensure _redirects exists
if (!fs.existsSync('dist/_redirects')) {
  console.log('Creating _redirects file...');
  fs.writeFileSync('dist/_redirects', '/* /index.html 200\n');
}

// Run the actual build
console.log('Running Vite build...');
exec('tsc --skipLibCheck && vite build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Build error: ${error.message}`);
    console.error(stderr);
    process.exit(1);
  }
  
  console.log(stdout);
  
  // Verify index.html exists
  if (!fs.existsSync('dist/index.html')) {
    console.error('Build completed but index.html is missing!');
    
    // Create minimal fallback index.html
    console.log('Creating fallback index.html...');
    const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EzEdit (Debug Mode)</title>
  </head>
  <body>
    <div id="root">
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #0d6efd; margin-bottom: 16px;">EzEdit Debug Mode</h2>
          <p style="margin-bottom: 16px;">Application build issues detected. Check console for details.</p>
          <p style="margin-bottom: 16px; font-family: monospace; background: #f1f1f1; padding: 8px; text-align: left; overflow: auto;">
            Time: ${new Date().toISOString()}<br>
            Mode: ${process.env.NODE_ENV || 'development'}
          </p>
          <button onclick="window.location.reload()" style="background: #0d6efd; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
            Reload
          </button>
        </div>
      </div>
    </div>
    <script>
      console.log('🟢 EzEdit Debug Mode - Fallback index.html loaded');
    </script>
  </body>
</html>`;
    fs.writeFileSync('dist/index.html', fallbackHtml);
  }
  
  console.log('Build process completed');
});
