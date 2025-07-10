/**
 * Redis-based FTP Connection Pool
 * Replaces PHP session storage with scalable Redis solution
 */

const Redis = require('redis');
const crypto = require('crypto');
const { Client } = require('basic-ftp');
const secrets = require('../config/secrets');

class FTPConnectionPool {
    constructor() {
        this.redis = null;
        this.connections = new Map(); // Local cache
        this.connectionTimeout = 5 * 60 * 1000; // 5 minutes
        this.maxConnections = 100; // Per instance
        
        this.initializeRedis();
        this.startCleanupTimer();
    }

    /**
     * Initialize Redis connection
     */
    async initializeRedis() {
        try {
            const redisConfig = secrets.getRedisConfig();
            this.redis = Redis.createClient(redisConfig);
            
            this.redis.on('error', (err) => {
                console.error('Redis connection error:', err);
            });
            
            this.redis.on('connect', () => {
                console.log('Connected to Redis for FTP connection pooling');
            });
            
            await this.redis.connect();
        } catch (error) {
            console.error('Failed to initialize Redis:', error);
            // Fall back to in-memory storage if Redis is not available
            console.warn('Using in-memory FTP connection storage (not scalable)');
        }
    }

    /**
     * Create a new FTP connection
     * 
     * @param {string} userId - User ID for connection ownership
     * @param {Object} config - FTP connection configuration
     * @returns {Promise<string>} Connection ID
     */
    async createConnection(userId, config) {
        try {
            // Validate configuration
            this.validateConfig(config);
            
            // Create connection ID
            const connectionId = this.generateConnectionId(userId);
            
            // Test FTP connection
            const ftpClient = new Client();
            ftpClient.ftp.timeout = config.timeout || 30000;
            ftpClient.ftp.verbose = process.env.NODE_ENV === 'development';
            
            await ftpClient.access({
                host: config.host,
                port: config.port || 21,
                user: config.username,
                password: config.password,
                secure: config.secure || false,
                secureOptions: config.secureOptions || {}
            });
            
            // Store connection info in Redis
            const connectionData = {
                userId,
                config: this.encryptConfig(config),
                createdAt: Date.now(),
                lastUsed: Date.now(),
                status: 'connected'
            };
            
            if (this.redis) {
                await this.redis.setEx(
                    `ftp:connection:${connectionId}`,
                    this.connectionTimeout / 1000,
                    JSON.stringify(connectionData)
                );
            }
            
            // Store in local cache
            this.connections.set(connectionId, {
                client: ftpClient,
                data: connectionData
            });
            
            console.log(`FTP connection created: ${connectionId} for user ${userId}`);
            return connectionId;
            
        } catch (error) {
            console.error('Failed to create FTP connection:', error);
            throw new Error('Failed to connect to FTP server: ' + error.message);
        }
    }

    /**
     * Get an existing FTP connection
     * 
     * @param {string} connectionId - Connection ID
     * @param {string} userId - User ID for ownership verification
     * @returns {Promise<Object>} FTP client and connection data
     */
    async getConnection(connectionId, userId) {
        try {
            // Check local cache first
            let connection = this.connections.get(connectionId);
            
            if (!connection) {
                // Try to restore from Redis
                if (this.redis) {
                    const data = await this.redis.get(`ftp:connection:${connectionId}`);
                    if (data) {
                        const connectionData = JSON.parse(data);
                        
                        // Verify ownership
                        if (connectionData.userId !== userId) {
                            throw new Error('Connection not found or access denied');
                        }
                        
                        // Recreate FTP client
                        const config = this.decryptConfig(connectionData.config);
                        const ftpClient = new Client();
                        ftpClient.ftp.timeout = config.timeout || 30000;
                        
                        await ftpClient.access({
                            host: config.host,
                            port: config.port || 21,
                            user: config.username,
                            password: config.password,
                            secure: config.secure || false
                        });
                        
                        connection = {
                            client: ftpClient,
                            data: connectionData
                        };
                        
                        this.connections.set(connectionId, connection);
                    }
                }
            }
            
            if (!connection) {
                throw new Error('Connection not found or expired');
            }
            
            // Verify ownership
            if (connection.data.userId !== userId) {
                throw new Error('Connection not found or access denied');
            }
            
            // Update last used timestamp
            connection.data.lastUsed = Date.now();
            
            if (this.redis) {
                await this.redis.setEx(
                    `ftp:connection:${connectionId}`,
                    this.connectionTimeout / 1000,
                    JSON.stringify(connection.data)
                );
            }
            
            return connection;
            
        } catch (error) {
            console.error('Failed to get FTP connection:', error);
            throw error;
        }
    }

    /**
     * Close and remove an FTP connection
     * 
     * @param {string} connectionId - Connection ID
     * @param {string} userId - User ID for ownership verification
     */
    async closeConnection(connectionId, userId) {
        try {
            const connection = this.connections.get(connectionId);
            
            if (connection) {
                // Verify ownership
                if (connection.data.userId !== userId) {
                    throw new Error('Connection not found or access denied');
                }
                
                // Close FTP client
                if (connection.client) {
                    connection.client.close();
                }
                
                // Remove from local cache
                this.connections.delete(connectionId);
            }
            
            // Remove from Redis
            if (this.redis) {
                await this.redis.del(`ftp:connection:${connectionId}`);
            }
            
            console.log(`FTP connection closed: ${connectionId}`);
            
        } catch (error) {
            console.error('Failed to close FTP connection:', error);
            throw error;
        }
    }

    /**
     * List user's active connections
     * 
     * @param {string} userId - User ID
     * @returns {Promise<Array>} List of connection IDs
     */
    async getUserConnections(userId) {
        const userConnections = [];
        
        if (this.redis) {
            const keys = await this.redis.keys('ftp:connection:*');
            
            for (const key of keys) {
                const data = await this.redis.get(key);
                if (data) {
                    const connectionData = JSON.parse(data);
                    if (connectionData.userId === userId) {
                        userConnections.push({
                            id: key.replace('ftp:connection:', ''),
                            createdAt: connectionData.createdAt,
                            lastUsed: connectionData.lastUsed,
                            status: connectionData.status
                        });
                    }
                }
            }
        } else {
            // Fallback to local cache
            for (const [connectionId, connection] of this.connections) {
                if (connection.data.userId === userId) {
                    userConnections.push({
                        id: connectionId,
                        createdAt: connection.data.createdAt,
                        lastUsed: connection.data.lastUsed,
                        status: connection.data.status
                    });
                }
            }
        }
        
        return userConnections;
    }

    /**
     * Clean up expired connections
     */
    async cleanupExpiredConnections() {
        const now = Date.now();
        const expiredConnections = [];
        
        // Check local cache
        for (const [connectionId, connection] of this.connections) {
            if (now - connection.data.lastUsed > this.connectionTimeout) {
                expiredConnections.push(connectionId);
            }
        }
        
        // Close expired connections
        for (const connectionId of expiredConnections) {
            try {
                const connection = this.connections.get(connectionId);
                if (connection?.client) {
                    connection.client.close();
                }
                this.connections.delete(connectionId);
                
                if (this.redis) {
                    await this.redis.del(`ftp:connection:${connectionId}`);
                }
                
                console.log(`Cleaned up expired FTP connection: ${connectionId}`);
            } catch (error) {
                console.error('Error cleaning up connection:', error);
            }
        }
    }

    /**
     * Start cleanup timer
     */
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupExpiredConnections();
        }, 60000); // Clean up every minute
    }

    /**
     * Generate unique connection ID
     * 
     * @param {string} userId - User ID
     * @returns {string} Connection ID
     */
    generateConnectionId(userId) {
        const timestamp = Date.now();
        const random = crypto.randomBytes(8).toString('hex');
        return `${userId}_${timestamp}_${random}`;
    }

    /**
     * Validate FTP configuration
     * 
     * @param {Object} config - FTP configuration
     */
    validateConfig(config) {
        if (!config.host) {
            throw new Error('FTP host is required');
        }
        
        if (!config.username) {
            throw new Error('FTP username is required');
        }
        
        if (!config.password) {
            throw new Error('FTP password is required');
        }
        
        if (config.port && (config.port < 1 || config.port > 65535)) {
            throw new Error('Invalid FTP port number');
        }
    }

    /**
     * Encrypt FTP configuration for storage
     * 
     * @param {Object} config - FTP configuration
     * @returns {string} Encrypted configuration
     */
    encryptConfig(config) {
        // Remove sensitive data from config before encryption
        const sensitiveConfig = {
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            secure: config.secure
        };
        
        // Use the secrets manager for encryption
        return secrets.encrypt(JSON.stringify(sensitiveConfig));
    }

    /**
     * Decrypt FTP configuration
     * 
     * @param {string} encryptedConfig - Encrypted configuration
     * @returns {Object} Decrypted configuration
     */
    decryptConfig(encryptedConfig) {
        const decrypted = secrets.decrypt(encryptedConfig);
        return JSON.parse(decrypted);
    }

    /**
     * Get connection statistics
     * 
     * @returns {Object} Connection statistics
     */
    getStats() {
        return {
            activeConnections: this.connections.size,
            maxConnections: this.maxConnections,
            redisConnected: !!this.redis,
            connectionTimeout: this.connectionTimeout
        };
    }
}

// Export singleton instance
module.exports = new FTPConnectionPool();