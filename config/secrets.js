/**
 * Secure Environment Configuration
 * Validates and manages application secrets safely
 */

const crypto = require('crypto');

class SecretsManager {
    constructor() {
        this.requiredSecrets = [
            'JWT_SECRET',
            'ENCRYPTION_KEY',
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY'
        ];
        
        this.validateEnvironment();
    }

    /**
     * Validate that all required environment variables are present
     */
    validateEnvironment() {
        const missing = this.requiredSecrets.filter(secret => !process.env[secret]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        // Validate JWT secret length
        if (process.env.JWT_SECRET.length < 32) {
            throw new Error('JWT_SECRET must be at least 32 characters long');
        }

        // Validate encryption key length
        if (process.env.ENCRYPTION_KEY.length < 32) {
            throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
        }
    }

    /**
     * Get a secret with validation
     */
    getSecret(name) {
        const value = process.env[name];
        if (!value) {
            throw new Error(`Secret ${name} is not configured`);
        }
        return value;
    }

    /**
     * Generate a secure random key
     */
    generateSecureKey(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Encrypt sensitive data using AES-256-GCM
     */
    encrypt(text) {
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(this.getSecret('ENCRYPTION_KEY'), 'hex');
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipherGCM(algorithm, key, iv);
        cipher.setAAD(Buffer.from('ezedit', 'utf8'));
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    /**
     * Decrypt sensitive data using AES-256-GCM
     */
    decrypt(encryptedData) {
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(this.getSecret('ENCRYPTION_KEY'), 'hex');
        
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const decipher = crypto.createDecipherGCM(algorithm, key, iv);
        decipher.setAAD(Buffer.from('ezedit', 'utf8'));
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    /**
     * Get database configuration
     */
    getDatabaseConfig() {
        return {
            url: this.getSecret('SUPABASE_URL'),
            anonKey: this.getSecret('SUPABASE_ANON_KEY'),
            serviceKey: process.env.SUPABASE_SERVICE_KEY // Optional for admin operations
        };
    }

    /**
     * Get Redis configuration
     */
    getRedisConfig() {
        return {
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3
        };
    }

    /**
     * Get AI service configuration
     */
    getAIConfig() {
        return {
            openai: {
                apiKey: process.env.OPENAI_API_KEY,
                enabled: !!process.env.OPENAI_API_KEY
            },
            claude: {
                apiKey: process.env.CLAUDE_API_KEY,
                enabled: !!process.env.CLAUDE_API_KEY
            }
        };
    }

    /**
     * Get application configuration
     */
    getAppConfig() {
        return {
            env: process.env.NODE_ENV || 'development',
            port: parseInt(process.env.PORT) || 3000,
            domain: process.env.DOMAIN || 'localhost:3000',
            jwtSecret: this.getSecret('JWT_SECRET'),
            sessionSecret: process.env.SESSION_SECRET || this.generateSecureKey(),
            isDevelopment: process.env.NODE_ENV === 'development',
            isProduction: process.env.NODE_ENV === 'production'
        };
    }
}

// Export singleton instance
module.exports = new SecretsManager();