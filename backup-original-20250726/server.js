const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ezedit.co',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth API endpoints
app.post('/api/auth', (req, res) => {
  const { action, email, password } = req.body;
  
  switch (action) {
    case 'login':
      if (email === 'demo@ezedit.co' && password === 'demo123') {
        res.json({
          success: true,
          user: { id: 1, email, name: 'Demo User' },
          token: 'demo-token-' + Date.now()
        });
      } else {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      break;
      
    case 'register':
      res.json({
        success: true,
        message: 'Registration successful',
        user: { id: Math.floor(Math.random() * 1000), email, name: 'New User' }
      });
      break;
      
    case 'logout':
      res.json({ success: true, message: 'Logged out successfully' });
      break;
      
    default:
      res.status(400).json({ success: false, error: 'Invalid action' });
  }
});

// FTP API endpoints
app.post('/api/ftp', (req, res) => {
  const { action, host, username, password, path, content } = req.body;
  
  switch (action) {
    case 'connect':
      res.json({
        success: true,
        message: 'Connected to FTP server',
        connectionId: 'demo-connection-' + Date.now()
      });
      break;
      
    case 'list':
      res.json({
        success: true,
        files: [
          { name: 'index.html', type: 'file', size: 2048, modified: '2024-01-15T10:30:00Z' },
          { name: 'style.css', type: 'file', size: 1024, modified: '2024-01-14T15:45:00Z' },
          { name: 'script.js', type: 'file', size: 512, modified: '2024-01-13T09:20:00Z' },
          { name: 'images', type: 'directory', size: 0, modified: '2024-01-12T14:10:00Z' }
        ]
      });
      break;
      
    case 'read':
      res.json({
        success: true,
        content: '<!DOCTYPE html>\\n<html>\\n<head>\\n    <title>Sample File</title>\\n</head>\\n<body>\\n    <h1>Hello from EzEdit.co!</h1>\\n</body>\\n</html>',
        path: path || '/index.html'
      });
      break;
      
    case 'write':
      res.json({
        success: true,
        message: 'File saved successfully',
        path: path || '/index.html',
        size: (content || '').length
      });
      break;
      
    default:
      res.status(400).json({ success: false, error: 'Invalid FTP action' });
  }
});

// AI Assistant API
app.post('/api/ai-assistant', (req, res) => {
  const { message, code, language } = req.body;
  
  const responses = [
    "I can help you with that! Here's a suggestion for improving your code:",
    "This looks good! Consider adding error handling for better reliability.",
    "You might want to optimize this function for better performance.",
    "Here's a more efficient way to write this code:",
    "This code follows good practices. You could also add some comments for clarity."
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  setTimeout(() => {
    res.json({
      success: true,
      response: randomResponse,
      suggestions: [
        "Add input validation",
        "Implement error handling", 
        "Consider using modern ES6+ features",
        "Add unit tests for this function"
      ],
      language: language || 'javascript',
      timestamp: new Date().toISOString()
    });
  }, 1000);
});

// Handle PHP-style URLs with redirects
app.get('/health.php', (req, res) => res.redirect('/health'));
app.get('/dashboard.php', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/editor.php', (req, res) => res.sendFile(path.join(__dirname, 'public', 'editor.html')));

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`EzEdit.co server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${port}/health`);
});

module.exports = app;