/**
 * EzEdit.co Main Server
 * Express server with AI fallback system (Claude + Qwen 1.5)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static('.', {
    index: 'index.html',
    setHeaders: (res, path) => {
        // Set security headers
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // Cache control
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (path.includes('/js/') || path.includes('/css/')) {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
        }
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'ezedit-api',
        version: '1.0.0'
    });
});

// API Routes
try {
    // AI Routes (Claude + Qwen fallback)
    const aiRoutes = require('./api/ai-routes');
    app.use('/api/ai', aiRoutes);
    console.log('✅ AI routes loaded (Claude + Qwen fallback)');
} catch (error) {
    console.warn('⚠️  AI routes not loaded:', error.message);
}

try {
    // FTP Routes
    const ftpRoutes = require('./api/ftp-routes');
    app.use('/api/ftp', ftpRoutes);
    console.log('✅ FTP routes loaded');
} catch (error) {
    console.warn('⚠️  FTP routes not loaded:', error.message);
}

try {
    // Sites Management Routes
    const sitesRoutes = require('./api/sites-routes');
    app.use('/api/sites', sitesRoutes);
    console.log('✅ Sites routes loaded');
} catch (error) {
    console.warn('⚠️  Sites routes not loaded:', error.message);
}

try {
    // Stripe Payment Routes
    const stripeRoutes = require('./api/stripe-routes');
    app.use('/api/stripe', stripeRoutes);
    console.log('✅ Stripe routes loaded');
} catch (error) {
    console.warn('⚠️  Stripe routes not loaded:', error.message);
}

// Legacy PHP compatibility (for existing FTP handler)
app.post('/public/ftp/ftp-handler.php', (req, res) => {
    res.json({
        success: false,
        error: 'This endpoint has been migrated to /api/ftp/*. Please update your client.',
        migration: {
            'connect': '/api/ftp/connect',
            'list': '/api/ftp/list',
            'get': '/api/ftp/get',
            'put': '/api/ftp/put',
            'delete': '/api/ftp/delete'
        }
    });
});

// SPA routing - serve index.html for client-side routes
const clientRoutes = [
    '/dashboard',
    '/editor', 
    '/billing',
    '/settings'
];

clientRoutes.forEach(route => {
    app.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'EzEdit.co API',
        version: '1.0.0',
        endpoints: {
            ai: {
                'POST /api/ai/chat': 'Chat with AI assistant (Claude + Qwen fallback)',
                'GET /api/ai/health': 'Check AI services status',
                'GET /api/ai/usage/:userId': 'Get AI usage statistics'
            },
            ftp: {
                'POST /api/ftp/connect': 'Connect to FTP server',
                'POST /api/ftp/list': 'List files/directories',
                'POST /api/ftp/get': 'Download file content',
                'POST /api/ftp/put': 'Upload/save file',
                'POST /api/ftp/delete': 'Delete file/directory'
            },
            stripe: {
                'POST /api/stripe/create-checkout-session': 'Create Stripe checkout',
                'POST /api/stripe/create-portal-session': 'Create customer portal',
                'POST /api/stripe/webhook': 'Handle Stripe webhooks'
            }
        },
        features: {
            aiModels: ['claude-3.5-sonnet', 'qwen-1.5'],
            fallbackSystem: 'Automatic Claude → Qwen fallback',
            usageLimits: 'Trial: 10/day, Pro: unlimited'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// 404 handler
app.use('*', (req, res) => {
    // If it's an API request, return JSON
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'API endpoint not found',
            availableEndpoints: '/api'
        });
    }
    
    // For web requests, serve 404 page or index.html
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log('🚀 EzEdit.co Server Started');
    console.log(`   🌐 URL: http://localhost:${PORT}`);
    console.log(`   🧠 AI: Claude 3.5 Sonnet + Qwen 1.5 fallback`);
    console.log(`   💳 Payments: Stripe integration`);
    console.log(`   📁 FTP: Full file management`);
    console.log(`   ⚡ Ready for production!`);
});

module.exports = app;