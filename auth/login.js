/**
 * JWT Authentication Login API
 * Handles user login and token generation
 */

const express = require('express');
const router = express.Router();

// Load auth system
require('dotenv').config();
const auth = require('../config/auth');

/**
 * Login endpoint
 * POST /auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }
        
        const authManager = auth.getAuth();
        const result = await authManager.authenticateUser(email, password);
        
        if (!result) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        
        res.json({
            success: true,
            token: result.token,
            user: {
                id: result.user.id,
                email: result.user.email,
                role: result.user.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
});

/**
 * Token verification endpoint
 * POST /auth/verify
 */
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token is required'
            });
        }
        
        const authManager = auth.getAuth();
        const userData = authManager.verifyJWT(token);
        
        if (!userData) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }
        
        res.json({
            success: true,
            data: {
                user: {
                    id: userData.user_id,
                    email: userData.email,
                    role: userData.role
                }
            }
        });
        
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Token verification failed'
        });
    }
});

/**
 * Demo login for testing (remove in production)
 * POST /auth/demo-login
 */
router.post('/demo-login', async (req, res) => {
    try {
        // Generate demo token for testing
        const authManager = auth.getAuth();
        const token = authManager.generateJWT({
            user_id: 'demo-user-123',
            email: 'demo@ezedit.co',
            role: 'user'
        });
        
        res.json({
            success: true,
            token,
            user: {
                id: 'demo-user-123',
                email: 'demo@ezedit.co',
                role: 'user'
            }
        });
        
    } catch (error) {
        console.error('Demo login error:', error);
        res.status(500).json({
            success: false,
            error: 'Demo login failed'
        });
    }
});

/**
 * Registration endpoint
 * POST /auth/register
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, metadata } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }
        
        const authManager = auth.getAuth();
        const result = await authManager.registerUser(email, password, metadata);
        
        if (!result || result.error) {
            return res.status(400).json({
                success: false,
                error: result.error || 'Registration failed'
            });
        }
        
        res.json({
            success: true,
            token: result.token,
            user: {
                id: result.user.id,
                email: result.user.email,
                role: result.user.role
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed'
        });
    }
});

module.exports = router;