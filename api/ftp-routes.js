/**
 * Real FTP API Routes
 * Replaces demo functionality with actual FTP operations
 */

const express = require('express');
const router = express.Router();
const ftpPool = require('../services/ftp-connection-pool');
const auth = require('../config/auth');

/**
 * Authentication middleware for FTP routes
 */
const requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const auth = require('../config/auth');
        const authManager = auth.getAuth();
        
        const userData = authManager.verifyJWT(token);
        if (!userData) {
            return res.status(401).json({
                success: false,
                error: 'Invalid authentication token'
            });
        }
        
        req.user = userData;
        
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid authentication token'
        });
    }
};

/**
 * Connect to FTP server
 * POST /api/ftp/connect
 */
router.post('/connect', requireAuth, async (req, res) => {
    try {
        const { host, username, password, port = 21, secure = false } = req.body;
        
        // Validate required fields
        if (!host || !username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Host, username, and password are required'
            });
        }
        
        const config = {
            host,
            username,
            password,
            port: parseInt(port),
            secure: Boolean(secure),
            timeout: 30000
        };
        
        // Create FTP connection
        const connectionId = await ftpPool.createConnection(req.user.user_id || req.user.id, config);
        
        res.json({
            success: true,
            data: {
                connectionId,
                message: 'Successfully connected to FTP server'
            }
        });
        
    } catch (error) {
        console.error('FTP connect error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to connect to FTP server'
        });
    }
});

/**
 * List directory contents
 * POST /api/ftp/list
 */
router.post('/list', requireAuth, async (req, res) => {
    try {
        const { connectionId, path = '/' } = req.body;
        
        if (!connectionId) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID is required'
            });
        }
        
        // Get FTP connection
        const connection = await ftpPool.getConnection(connectionId, req.user.user_id || req.user.id);
        const ftpClient = connection.client;
        
        // List directory contents
        const files = await ftpClient.list(path);
        
        // Format file list
        const formattedFiles = files.map(file => ({
            name: file.name,
            type: file.type === 1 ? 'file' : 'directory',
            size: file.size,
            modifiedAt: file.modifiedAt,
            permissions: file.permissions
        }));
        
        res.json({
            success: true,
            data: {
                path,
                files: formattedFiles
            }
        });
        
    } catch (error) {
        console.error('FTP list error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to list directory contents'
        });
    }
});

/**
 * Download/read file content
 * POST /api/ftp/get
 */
router.post('/get', requireAuth, async (req, res) => {
    try {
        const { connectionId, path } = req.body;
        
        if (!connectionId || !path) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID and file path are required'
            });
        }
        
        // Get FTP connection
        const connection = await ftpPool.getConnection(connectionId, req.user.user_id || req.user.id);
        const ftpClient = connection.client;
        
        // Download file content
        const readable = await ftpClient.downloadTo(null, path);
        let content = '';
        
        // Read stream content
        for await (const chunk of readable) {
            content += chunk.toString();
        }
        
        res.json({
            success: true,
            data: {
                path,
                content,
                size: Buffer.byteLength(content, 'utf8')
            }
        });
        
    } catch (error) {
        console.error('FTP get error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to download file'
        });
    }
});

/**
 * Save/upload file content
 * POST /api/ftp/save
 */
router.post('/save', requireAuth, async (req, res) => {
    try {
        const { connectionId, path, content } = req.body;
        
        if (!connectionId || !path || content === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID, file path, and content are required'
            });
        }
        
        // Get FTP connection
        const connection = await ftpPool.getConnection(connectionId, req.user.user_id || req.user.id);
        const ftpClient = connection.client;
        
        // Upload file content
        const buffer = Buffer.from(content, 'utf8');
        await ftpClient.uploadFrom(buffer, path);
        
        res.json({
            success: true,
            data: {
                path,
                size: buffer.length,
                message: 'File saved successfully'
            }
        });
        
    } catch (error) {
        console.error('FTP save error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to save file'
        });
    }
});

/**
 * Create directory
 * POST /api/ftp/mkdir
 */
router.post('/mkdir', requireAuth, async (req, res) => {
    try {
        const { connectionId, path } = req.body;
        
        if (!connectionId || !path) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID and directory path are required'
            });
        }
        
        // Get FTP connection
        const connection = await ftpPool.getConnection(connectionId, req.user.user_id || req.user.id);
        const ftpClient = connection.client;
        
        // Create directory
        await ftpClient.ensureDir(path);
        
        res.json({
            success: true,
            data: {
                path,
                message: 'Directory created successfully'
            }
        });
        
    } catch (error) {
        console.error('FTP mkdir error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create directory'
        });
    }
});

/**
 * Delete file or directory
 * POST /api/ftp/delete
 */
router.post('/delete', requireAuth, async (req, res) => {
    try {
        const { connectionId, path, type = 'file' } = req.body;
        
        if (!connectionId || !path) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID and path are required'
            });
        }
        
        // Get FTP connection
        const connection = await ftpPool.getConnection(connectionId, req.user.user_id || req.user.id);
        const ftpClient = connection.client;
        
        // Delete file or directory
        if (type === 'directory') {
            await ftpClient.removeDir(path);
        } else {
            await ftpClient.remove(path);
        }
        
        res.json({
            success: true,
            data: {
                path,
                type,
                message: `${type === 'directory' ? 'Directory' : 'File'} deleted successfully`
            }
        });
        
    } catch (error) {
        console.error('FTP delete error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete item'
        });
    }
});

/**
 * Rename file or directory
 * POST /api/ftp/rename
 */
router.post('/rename', requireAuth, async (req, res) => {
    try {
        const { connectionId, oldPath, newPath } = req.body;
        
        if (!connectionId || !oldPath || !newPath) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID, old path, and new path are required'
            });
        }
        
        // Get FTP connection
        const connection = await ftpPool.getConnection(connectionId, req.user.user_id || req.user.id);
        const ftpClient = connection.client;
        
        // Rename file or directory
        await ftpClient.rename(oldPath, newPath);
        
        res.json({
            success: true,
            data: {
                oldPath,
                newPath,
                message: 'Item renamed successfully'
            }
        });
        
    } catch (error) {
        console.error('FTP rename error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to rename item'
        });
    }
});

/**
 * Disconnect from FTP server
 * POST /api/ftp/disconnect
 */
router.post('/disconnect', requireAuth, async (req, res) => {
    try {
        const { connectionId } = req.body;
        
        if (!connectionId) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID is required'
            });
        }
        
        // Close FTP connection
        await ftpPool.closeConnection(connectionId, req.user.user_id || req.user.id);
        
        res.json({
            success: true,
            data: {
                message: 'Successfully disconnected from FTP server'
            }
        });
        
    } catch (error) {
        console.error('FTP disconnect error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to disconnect from FTP server'
        });
    }
});

/**
 * Get connection status and statistics
 * GET /api/ftp/status
 */
router.get('/status', requireAuth, async (req, res) => {
    try {
        const connections = await ftpPool.getUserConnections(req.user.user_id || req.user.id);
        const stats = ftpPool.getStats();
        
        res.json({
            success: true,
            data: {
                connections,
                stats
            }
        });
        
    } catch (error) {
        console.error('FTP status error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get connection status'
        });
    }
});

/**
 * Test FTP connection
 * POST /api/ftp/test-connection
 */
router.post('/test-connection', requireAuth, async (req, res) => {
    try {
        const { host, port = 21, username, password, passive_mode = true } = req.body;
        
        if (!host || !username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Host, username, and password are required'
            });
        }

        // Import FTP library for testing
        const Client = require('basic-ftp');
        const client = new Client();
        
        try {
            // Set timeout for connection test
            client.ftp.timeout = 10000; // 10 seconds
            
            // Attempt to connect
            await client.access({
                host,
                port: parseInt(port),
                user: username,
                password,
                secure: false
            });

            // Test basic operations
            const currentDir = await client.pwd();
            
            res.json({
                success: true,
                data: {
                    message: 'Connection successful',
                    host,
                    port: parseInt(port),
                    currentDirectory: currentDir,
                    connectionTime: new Date().toISOString()
                }
            });
            
        } catch (ftpError) {
            console.error('FTP connection test failed:', ftpError);
            res.status(400).json({
                success: false,
                error: 'Connection failed: ' + ftpError.message
            });
        } finally {
            try {
                client.close();
            } catch (closeError) {
                // Ignore close errors
            }
        }
        
    } catch (error) {
        console.error('FTP test error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
});

/**
 * Upload file
 * POST /api/ftp/upload
 */
router.post('/upload', requireAuth, async (req, res) => {
    try {
        const multer = require('multer');
        const upload = multer({ 
            storage: multer.memoryStorage(),
            limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
        });

        // Handle multipart form data
        upload.single('file')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    error: 'File upload error: ' + err.message
                });
            }

            const { connectionId, path } = req.body;
            const file = req.file;

            if (!connectionId || !path || !file) {
                return res.status(400).json({
                    success: false,
                    error: 'Connection ID, path, and file are required'
                });
            }

            try {
                // Get FTP connection
                const connection = await ftpPool.getConnection(connectionId, req.user.user_id || req.user.id);
                const ftpClient = connection.client;

                // Upload file buffer
                await ftpClient.uploadFrom(file.buffer, path);

                res.json({
                    success: true,
                    data: {
                        path,
                        filename: file.originalname,
                        size: file.size,
                        message: 'File uploaded successfully'
                    }
                });

            } catch (ftpError) {
                console.error('FTP upload error:', ftpError);
                res.status(500).json({
                    success: false,
                    error: 'Failed to upload file: ' + ftpError.message
                });
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
});

/**
 * Download file
 * POST /api/ftp/download
 */
router.post('/download', requireAuth, async (req, res) => {
    try {
        const { connectionId, path } = req.body;

        if (!connectionId || !path) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID and path are required'
            });
        }

        // Get FTP connection
        const connection = await ftpPool.getConnection(connectionId, req.user.user_id || req.user.id);
        const ftpClient = connection.client;

        // Create a stream to capture file data
        const chunks = [];
        const writeStream = {
            write: (chunk) => chunks.push(chunk),
            end: () => {},
            on: () => {},
            once: () => {},
            emit: () => {}
        };

        // Download file to memory
        await ftpClient.downloadTo(writeStream, path);

        // Combine chunks into buffer
        const fileBuffer = Buffer.concat(chunks);

        // Get filename from path
        const filename = path.split('/').pop();

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', fileBuffer.length);

        // Send file buffer
        res.send(fileBuffer);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download file: ' + error.message
        });
    }
});

module.exports = router;