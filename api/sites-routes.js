/**
 * Sites API Routes
 * Handles CRUD operations for user sites
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyJWT } = require('../auth/middleware');

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Apply JWT authentication middleware to all routes
router.use(verifyJWT);

/**
 * GET /api/sites - Get all sites for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: sites, error } = await supabase
            .from('sites')
            .select('id, name, host, port, username, root_path, created_at, updated_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching sites:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch sites'
            });
        }

        res.json({
            success: true,
            data: {
                sites: sites || []
            }
        });
    } catch (error) {
        console.error('Sites fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/sites - Create a new site
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, host, port = 21, username, password, passive = true, root_path = '/' } = req.body;

        // Validate required fields
        if (!name || !host || !username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, host, username, password'
            });
        }

        const { data: site, error } = await supabase
            .from('sites')
            .insert([{
                user_id: userId,
                name,
                host,
                port: parseInt(port),
                username,
                password, // Will be encrypted by database trigger
                passive,
                root_path
            }])
            .select('id, name, host, port, username, root_path, created_at, updated_at')
            .single();

        if (error) {
            console.error('Error creating site:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to create site'
            });
        }

        res.status(201).json({
            success: true,
            data: {
                site
            }
        });
    } catch (error) {
        console.error('Site creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/sites/:id - Get a specific site
 */
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const siteId = req.params.id;

        const { data: site, error } = await supabase
            .from('sites')
            .select('id, name, host, port, username, root_path, created_at, updated_at')
            .eq('id', siteId)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Site not found'
                });
            }
            console.error('Error fetching site:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch site'
            });
        }

        res.json({
            success: true,
            data: {
                site
            }
        });
    } catch (error) {
        console.error('Site fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * PUT /api/sites/:id - Update a site
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const siteId = req.params.id;
        const { name, host, port, username, password, passive, root_path } = req.body;

        // Build update object (only include provided fields)
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (host !== undefined) updateData.host = host;
        if (port !== undefined) updateData.port = parseInt(port);
        if (username !== undefined) updateData.username = username;
        if (password !== undefined) updateData.password = password; // Will be encrypted by trigger
        if (passive !== undefined) updateData.passive = passive;
        if (root_path !== undefined) updateData.root_path = root_path;

        const { data: site, error } = await supabase
            .from('sites')
            .update(updateData)
            .eq('id', siteId)
            .eq('user_id', userId)
            .select('id, name, host, port, username, root_path, created_at, updated_at')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Site not found'
                });
            }
            console.error('Error updating site:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update site'
            });
        }

        res.json({
            success: true,
            data: {
                site
            }
        });
    } catch (error) {
        console.error('Site update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * DELETE /api/sites/:id - Delete a site
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const siteId = req.params.id;

        const { error } = await supabase
            .from('sites')
            .delete()
            .eq('id', siteId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting site:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to delete site'
            });
        }

        res.json({
            success: true,
            message: 'Site deleted successfully'
        });
    } catch (error) {
        console.error('Site deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;