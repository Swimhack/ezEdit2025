/**
 * Node.js Authentication Manager for EzEdit
 * Handles JWT tokens and user authentication
 */

const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt'); // Optional, for future password hashing

class AuthManager {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only';
    this.sessionTimeout = 3600; // 1 hour
    
    if (this.jwtSecret === 'fallback-secret-key-for-development-only') {
      console.warn('⚠️  Using fallback JWT secret. Set JWT_SECRET environment variable for production.');
    }
  }

  /**
   * Generate a secure JWT token
   */
  generateJWT(payload, expiry = 3600) {
    const tokenPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiry,
      iss: 'ezedit.co'
    };

    return jwt.sign(tokenPayload, this.jwtSecret, { algorithm: 'HS256' });
  }

  /**
   * Verify and decode JWT token
   */
  verifyJWT(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return null;
    }
  }

  /**
   * Authenticate user with credentials
   */
  async authenticateUser(email, password) {
    try {
      // For demo purposes, accept specific credentials
      const demoUsers = [
        {
          id: 'demo-user-123',
          email: 'demo@ezedit.co',
          password: 'demo123', // In production, this would be hashed
          role: 'user'
        },
        {
          id: 'admin-user-456',
          email: 'admin@ezedit.co',
          password: 'admin123',
          role: 'admin'
        }
      ];

      // Find user by email
      const user = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return null;
      }

      // For demo purposes, do simple password check
      // In production, use bcrypt.compare with hashed passwords
      if (user.password !== password) {
        return null;
      }

      // Generate JWT token
      const token = this.generateJWT({
        user_id: user.id,
        id: user.id,
        email: user.email,
        role: user.role
      });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  /**
   * Register a new user
   */
  async registerUser(email, password, metadata = {}) {
    try {
      // For demo purposes, generate a new user
      const userId = 'user-' + Math.random().toString(36).substr(2, 9);
      
      // In production, you would:
      // 1. Hash the password with bcrypt
      // 2. Save to database
      // 3. Handle email verification
      
      const user = {
        id: userId,
        email: email.toLowerCase(),
        role: 'user',
        ...metadata
      };

      // Generate JWT token
      const token = this.generateJWT({
        user_id: user.id,
        id: user.id,
        email: user.email,
        role: user.role
      });

      return {
        success: true,
        token,
        user
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  /**
   * Check if user is authenticated from request
   */
  checkAuthentication(headers) {
    const authHeader = headers['authorization'] || headers['Authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    return this.verifyJWT(token);
  }

  /**
   * Check if user has admin privileges
   */
  isAdmin(userData) {
    return userData && userData.role === 'admin';
  }

  /**
   * Require admin authentication
   */
  requireAdmin(headers) {
    const userData = this.checkAuthentication(headers);
    
    if (!userData) {
      throw new Error('Authentication required');
    }
    
    if (!this.isAdmin(userData)) {
      throw new Error('Admin privileges required');
    }
    
    return userData;
  }

  /**
   * Hash password using bcrypt (placeholder for future implementation)
   */
  async hashPassword(password) {
    // TODO: Implement with bcrypt when bcrypt is added as dependency
    return password; // For demo purposes only
  }

  /**
   * Verify password against hash (placeholder for future implementation)
   */
  async verifyPassword(password, hash) {
    // TODO: Implement with bcrypt when bcrypt is added as dependency
    return password === hash; // For demo purposes only
  }
}

/**
 * Global auth instance
 */
let authInstance = null;

function getAuth() {
  if (!authInstance) {
    authInstance = new AuthManager();
  }
  return authInstance;
}

/**
 * Helper function to require authentication
 */
function requireAuth(req, res, next) {
  try {
    const auth = getAuth();
    const userData = auth.checkAuthentication(req.headers);
    
    if (!userData) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    req.user = userData;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid authentication'
    });
  }
}

/**
 * Helper function to require admin authentication
 */
function requireAdmin(req, res, next) {
  try {
    const auth = getAuth();
    const userData = auth.requireAdmin(req.headers);
    req.user = userData;
    next();
  } catch (error) {
    const status = error.message.includes('Authentication') ? 401 : 403;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  AuthManager,
  getAuth,
  requireAuth,
  requireAdmin
};