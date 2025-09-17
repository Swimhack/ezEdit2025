/**
 * FTP Configuration and Best Practices for Legacy Systems
 *
 * Legacy FTP systems have several limitations when used with modern web stacks:
 * 1. Stateful connections that timeout after inactivity (usually 300-900 seconds)
 * 2. Limited concurrent connections per IP (typically 3-10)
 * 3. No built-in connection pooling or multiplexing
 * 4. Passive vs Active mode complications with firewalls/NAT
 * 5. Control and data channels that can desync
 *
 * This configuration implements best practices to handle these limitations.
 */

export interface FTPConfig {
  // Connection settings
  connectionTimeout: number      // Timeout for initial connection (ms)
  dataTimeout: number           // Timeout for data transfers (ms)
  keepaliveInterval: number     // Interval for NOOP keepalive commands (ms)
  maxRetries: number           // Maximum reconnection attempts
  retryDelay: number          // Delay between retry attempts (ms)

  // Transfer settings
  pasvTimeout: number         // Timeout for PASV response (ms)
  dataChannelTimeout: number  // Timeout for data channel establishment (ms)

  // Pool settings
  maxConnectionsPerHost: number  // Maximum concurrent connections to same host
  connectionIdleTimeout: number  // Time before closing idle connections (ms)

  // Debug settings
  verbose: boolean            // Enable verbose FTP logging
  logCommands: boolean       // Log all FTP commands
}

// Default configuration optimized for legacy FTP servers
export const DEFAULT_FTP_CONFIG: FTPConfig = {
  // Connection settings
  connectionTimeout: 10000,      // 10 seconds for initial connection
  dataTimeout: 30000,           // 30 seconds for data transfers
  keepaliveInterval: 30000,     // Send NOOP every 30 seconds (aggressive for legacy servers)
  maxRetries: 3,               // Try 3 times before giving up
  retryDelay: 2000,           // Wait 2 seconds between retries

  // Transfer settings - conservative for legacy systems
  pasvTimeout: 5000,          // 5 seconds for PASV response
  dataChannelTimeout: 10000,  // 10 seconds to establish data channel

  // Pool settings - respect legacy server limits
  maxConnectionsPerHost: 3,   // Most legacy servers limit to 3-5 connections
  connectionIdleTimeout: 240000, // Close idle connections after 4 minutes

  // Debug settings
  verbose: process.env.NODE_ENV === 'development',
  logCommands: process.env.NODE_ENV === 'development'
}

// Configuration presets for known legacy FTP servers
export const FTP_PRESETS = {
  // Very old servers (ProFTPD 1.2, vsftpd 1.x)
  legacy: {
    ...DEFAULT_FTP_CONFIG,
    keepaliveInterval: 20000,    // More aggressive keepalive
    connectionTimeout: 15000,    // More time for slow servers
    maxConnectionsPerHost: 2,    // Very conservative connection limit
  },

  // Windows IIS FTP (6.0-8.5)
  iis: {
    ...DEFAULT_FTP_CONFIG,
    keepaliveInterval: 45000,    // IIS has longer default timeout
    dataTimeout: 60000,         // IIS can be slow with large directories
    pasvTimeout: 10000,         // IIS PASV can be slow
  },

  // Shared hosting (cPanel/Plesk)
  shared: {
    ...DEFAULT_FTP_CONFIG,
    maxConnectionsPerHost: 2,    // Shared hosts are very restrictive
    connectionTimeout: 20000,    // Shared hosts can be slow
    keepaliveInterval: 25000,    // Aggressive keepalive for busy servers
  },

  // Modern but configured conservatively
  modern: {
    ...DEFAULT_FTP_CONFIG,
    keepaliveInterval: 60000,    // Less aggressive for stable servers
    maxConnectionsPerHost: 5,    // Can handle more connections
    dataTimeout: 60000,         // Can handle larger transfers
  }
}

/**
 * Get FTP configuration based on server type or custom settings
 */
export function getFTPConfig(serverType?: keyof typeof FTP_PRESETS): FTPConfig {
  if (serverType && FTP_PRESETS[serverType]) {
    return FTP_PRESETS[serverType]
  }

  // Check environment variables for custom settings
  const customConfig: Partial<FTPConfig> = {}

  if (process.env.FTP_CONNECTION_TIMEOUT) {
    customConfig.connectionTimeout = parseInt(process.env.FTP_CONNECTION_TIMEOUT, 10)
  }

  if (process.env.FTP_KEEPALIVE_INTERVAL) {
    customConfig.keepaliveInterval = parseInt(process.env.FTP_KEEPALIVE_INTERVAL, 10)
  }

  if (process.env.FTP_MAX_CONNECTIONS) {
    customConfig.maxConnectionsPerHost = parseInt(process.env.FTP_MAX_CONNECTIONS, 10)
  }

  return { ...DEFAULT_FTP_CONFIG, ...customConfig }
}

/**
 * Common FTP error patterns and their solutions
 */
export const FTP_ERROR_SOLUTIONS = {
  'ECONNRESET': {
    reason: 'Server forcefully closed the connection',
    solutions: [
      'Enable passive mode (PASV)',
      'Reduce keepalive interval',
      'Check firewall/NAT settings',
      'Verify server timeout settings'
    ]
  },
  'ETIMEDOUT': {
    reason: 'Connection timed out',
    solutions: [
      'Increase connection timeout',
      'Check network connectivity',
      'Verify server is accessible',
      'Try different port'
    ]
  },
  'ECONNREFUSED': {
    reason: 'Server refused connection',
    solutions: [
      'Verify server is running',
      'Check port number',
      'Verify firewall allows FTP',
      'Check server connection limit'
    ]
  },
  '421': {
    reason: 'Too many connections from this IP',
    solutions: [
      'Reduce concurrent connections',
      'Wait before reconnecting',
      'Close unused connections',
      'Contact hosting provider'
    ]
  },
  '530': {
    reason: 'Authentication failed',
    solutions: [
      'Verify username/password',
      'Check account status',
      'Verify FTP access is enabled',
      'Try different authentication method'
    ]
  },
  'None of the available transfer strategies work': {
    reason: 'Data channel negotiation failed',
    solutions: [
      'Switch between PASV/PORT mode',
      'Check firewall data port range',
      'Verify server passive mode settings',
      'Try explicit FTP over TLS (FTPS)'
    ]
  }
}