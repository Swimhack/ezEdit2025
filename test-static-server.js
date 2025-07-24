#!/usr/bin/env node
/**
 * Simple static server for testing EzEdit.co HTML files without PHP
 * This serves static HTML versions of the PHP files for testing
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.php': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function createStaticVersions() {
    console.log('Creating static versions of PHP files...');
    
    const phpFiles = [
        'index.php',
        'auth/login.php',
        'auth/register.php',
        'dashboard.php',
        'editor.php'
    ];
    
    phpFiles.forEach(phpFile => {
        const phpPath = path.join(PUBLIC_DIR, phpFile);
        const htmlPath = path.join(PUBLIC_DIR, phpFile.replace('.php', '.html'));
        
        if (fs.existsSync(phpPath)) {
            try {
                let content = fs.readFileSync(phpPath, 'utf8');
                
                // Remove PHP tags and basic PHP logic
                content = content.replace(/<\?php[\s\S]*?\?>/g, '');
                
                // Replace PHP file references with HTML
                content = content.replace(/\.php/g, '.html');
                
                // Remove PHP session logic comments
                content = content.replace(/\/\*[\s\S]*?\*\//g, '');
                
                fs.writeFileSync(htmlPath, content);
                console.log(`Created: ${htmlPath}`);
            } catch (error) {
                console.error(`Error processing ${phpFile}:`, error.message);
            }
        }
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    // Handle root path
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Convert .php requests to .html
    if (pathname.endsWith('.php')) {
        pathname = pathname.replace('.php', '.html');
    }
    
    const filePath = path.join(PUBLIC_DIR, pathname);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 - File Not Found');
            console.log(`404: ${pathname}`);
            return;
        }
        
        // Serve the file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 - Internal Server Error');
                console.error(`Error serving ${pathname}:`, err.message);
                return;
            }
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
            console.log(`Served: ${pathname}`);
        });
    });
});

// Create static versions and start server
createStaticVersions();

server.listen(PORT, () => {
    console.log(`\n🚀 Test server running at http://localhost:${PORT}`);
    console.log('\nAvailable pages:');
    console.log('- http://localhost:3000/ (Landing page)');
    console.log('- http://localhost:3000/auth/login.html');
    console.log('- http://localhost:3000/auth/register.html');
    console.log('- http://localhost:3000/dashboard.html');
    console.log('- http://localhost:3000/editor.html');
    console.log('\nPress Ctrl+C to stop the server');
});

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Server stopped');
    process.exit(0);
});