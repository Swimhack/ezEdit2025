const express = require('express');
const path = require('path');
const cors = require('cors');

// Load configuration and services
require('dotenv').config();
const secrets = require('../../config/secrets');
const ftpPool = require('../../services/ftp-connection-pool');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../../public')));

// Security headers
app.use((req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    });
    next();
});

// Import real FTP routes, sites routes, and auth routes
const ftpRoutes = require('../../api/ftp-routes');
const sitesRoutes = require('../../api/sites-routes');
const authRoutes = require('../../auth/login');

// Health check endpoint
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        services: {
            redis: ftpPool.getStats().redisConnected,
            ftp: true
        }
    };
    res.status(200).json(health);
});

// Mount API routes
app.use('/api/ftp', ftpRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/auth', authRoutes);

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`EzEdit.co server running on port ${PORT}`);
});

module.exports = app;