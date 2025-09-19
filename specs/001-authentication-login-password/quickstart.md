# Quickstart Guide: Authentication & Website Connection System

This guide walks through the complete user journey from registration to managing multiple website connections.

## Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Valid email address for verification
- Website credentials for platforms you want to connect (FTP, WordPress, Wix, Shopify, etc.)

## User Journey Walkthrough

### 1. User Registration & Email Verification

**Test Scenario**: New user creates account and verifies email

```bash
# Test registration endpoint
curl -X POST /api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!@#",
    "company": "Test Company",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Expected Response: 201 Created
{
  "success": true,
  "message": "Verification email sent",
  "userId": "uuid-here"
}
```

**Verification Steps**:
1. User receives verification email
2. Clicks verification link in email
3. Redirected to login page with confirmation message
4. Account status updated to verified in database

**Success Criteria**:
- ✅ Account created in `profiles` table
- ✅ Verification email sent
- ✅ User can log in after email verification
- ✅ Unverified users cannot access protected features

### 2. User Login & Session Management

**Test Scenario**: Verified user logs in successfully

```bash
# Test login endpoint
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!@#"
  }'

# Expected Response: 200 OK
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "company": "Test Company",
    "subscriptionTier": "free",
    "maxConnections": 5,
    "mfaEnabled": false
  },
  "sessionToken": "jwt-token-here",
  "expiresAt": "2025-01-16T10:30:00Z"
}
```

**Session Validation**:
```bash
# Use session token for authenticated requests
curl -X GET /api/connections \
  -H "Authorization: Bearer jwt-token-here"
```

**Success Criteria**:
- ✅ User authenticated with valid credentials
- ✅ JWT session token generated and returned
- ✅ Session stored in `auth_sessions` table
- ✅ Failed login attempts tracked and limited

### 3. Password Reset Flow

**Test Scenario**: User forgets password and resets it

```bash
# Request password reset
curl -X POST /api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'

# Expected Response: 200 OK (always for security)
{
  "success": true,
  "message": "If the email exists, a reset link has been sent"
}
```

**Reset Confirmation**:
```bash
# Confirm password reset with token from email
curl -X POST /api/auth/reset-password/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "newPassword": "NewSecurePass456!@#"
  }'

# Expected Response: 200 OK
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Success Criteria**:
- ✅ Reset email sent to valid email addresses
- ✅ Reset token has limited lifetime (1 hour)
- ✅ Old password invalidated after reset
- ✅ User can log in with new password

### 4. Website Connection Management

#### 4.1 Platform Discovery

**Test Scenario**: Detect platform type for a website

```bash
# Discover platform for a website
curl -X POST /api/platforms/discover \
  -H "Authorization: Bearer jwt-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example-wordpress-site.com",
    "deepScan": true
  }'

# Expected Response: 200 OK
{
  "success": true,
  "url": "https://example-wordpress-site.com",
  "detection": {
    "platform": "wordpress",
    "confidence": 0.95,
    "version": "6.4.2",
    "technologies": [
      {
        "name": "WordPress",
        "category": "CMS",
        "version": "6.4.2",
        "confidence": 0.95
      }
    ],
    "recommendedMethods": ["rest_api", "sftp"],
    "requirements": {
      "rest_api": {
        "endpoint": "/wp-json/wp/v2/",
        "authentication": ["basic", "jwt", "oauth"]
      },
      "sftp": {
        "port": 22,
        "authentication": ["password", "key"]
      }
    }
  }
}
```

#### 4.2 WordPress SFTP Connection

**Test Scenario**: Connect to WordPress site via SFTP

```bash
# Create WordPress SFTP connection
curl -X POST /api/connections \
  -H "Authorization: Bearer jwt-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My WordPress Site",
    "url": "https://example-wordpress-site.com",
    "platformType": "wordpress",
    "connectionMethod": "sftp",
    "credentials": {
      "username": "wp_user",
      "password": "secure_password",
      "port": 22
    },
    "connectionConfig": {
      "documentRoot": "/public_html",
      "wpPath": "/wp"
    }
  }'

# Expected Response: 201 Created
{
  "success": true,
  "connection": {
    "id": "connection-uuid",
    "name": "My WordPress Site",
    "url": "https://example-wordpress-site.com",
    "platformType": "wordpress",
    "connectionMethod": "sftp",
    "status": "connecting",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

#### 4.3 Shopify OAuth Connection

**Test Scenario**: Connect to Shopify store via OAuth

```bash
# Initiate Shopify OAuth connection
curl -X POST /api/platforms/connect/shopify \
  -H "Authorization: Bearer jwt-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "connectionName": "My Shopify Store",
    "websiteUrl": "https://my-store.myshopify.com",
    "config": {
      "scopes": ["read_products", "write_products", "read_orders"]
    }
  }'

# Expected Response: 200 OK
{
  "type": "oauth",
  "authorizationUrl": "https://my-store.myshopify.com/admin/oauth/authorize?client_id=xxx&scope=read_products,write_products,read_orders&redirect_uri=xxx&state=csrf-token",
  "state": "csrf-protection-token",
  "connectionId": "temp-connection-uuid",
  "scopes": ["read_products", "write_products", "read_orders"]
}
```

**OAuth Callback Handling**:
```bash
# Process OAuth callback after user authorization
curl -X POST /api/platforms/oauth/callback/shopify \
  -H "Authorization: Bearer jwt-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "authorization-code-from-shopify",
    "state": "csrf-protection-token",
    "connectionId": "temp-connection-uuid"
  }'

# Expected Response: 200 OK
{
  "success": true,
  "connection": {
    "id": "final-connection-uuid",
    "name": "My Shopify Store",
    "url": "https://my-store.myshopify.com",
    "platformType": "shopify",
    "connectionMethod": "oauth",
    "status": "active",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### 5. File Management Operations

#### 5.1 List Files

**Test Scenario**: Browse files in connected website

```bash
# List files from WordPress SFTP connection
curl -X GET "/api/connections/connection-uuid/files?path=/wp-content/themes" \
  -H "Authorization: Bearer jwt-token-here"

# Expected Response: 200 OK
{
  "success": true,
  "path": "/wp-content/themes",
  "files": [
    {
      "name": "twentytwentyfour",
      "path": "/wp-content/themes/twentytwentyfour",
      "type": "directory",
      "modifiedAt": "2025-01-10T14:30:00Z",
      "permissions": "drwxr-xr-x"
    },
    {
      "name": "style.css",
      "path": "/wp-content/themes/custom/style.css",
      "type": "file",
      "size": 15420,
      "modifiedAt": "2025-01-15T09:15:00Z",
      "permissions": "-rw-r--r--",
      "mimeType": "text/css"
    }
  ]
}
```

#### 5.2 File Upload

**Test Scenario**: Upload file to connected website

```bash
# Upload file to WordPress site
curl -X POST /api/connections/connection-uuid/files \
  -H "Authorization: Bearer jwt-token-here" \
  -F "file=@local-file.jpg" \
  -F "path=/wp-content/uploads/2025/01/uploaded-file.jpg" \
  -F "overwrite=false"

# Expected Response: 201 Created
{
  "success": true,
  "file": {
    "name": "uploaded-file.jpg",
    "path": "/wp-content/uploads/2025/01/uploaded-file.jpg",
    "type": "file",
    "size": 245678,
    "modifiedAt": "2025-01-15T10:45:00Z",
    "mimeType": "image/jpeg"
  }
}
```

### 6. Connection Testing & Monitoring

**Test Scenario**: Test connection health

```bash
# Test WordPress SFTP connection
curl -X POST /api/connections/connection-uuid/test \
  -H "Authorization: Bearer jwt-token-here"

# Expected Response: 200 OK
{
  "success": true,
  "connected": true,
  "message": "SFTP connection successful",
  "responseTime": 145,
  "details": {
    "server": "sftp.example.com",
    "port": 22,
    "documentRoot": "/public_html",
    "diskSpace": {
      "total": "10GB",
      "used": "3.2GB",
      "free": "6.8GB"
    }
  }
}
```

### 7. Dashboard Overview

**Test Scenario**: User views dashboard with all connections

```bash
# Get all user connections
curl -X GET /api/connections \
  -H "Authorization: Bearer jwt-token-here"

# Expected Response: 200 OK
{
  "success": true,
  "connections": [
    {
      "id": "wp-connection-uuid",
      "name": "My WordPress Site",
      "url": "https://example-wordpress-site.com",
      "platformType": "wordpress",
      "connectionMethod": "sftp",
      "status": "active",
      "lastConnectedAt": "2025-01-15T10:45:00Z"
    },
    {
      "id": "shopify-connection-uuid",
      "name": "My Shopify Store",
      "url": "https://my-store.myshopify.com",
      "platformType": "shopify",
      "connectionMethod": "oauth",
      "status": "active",
      "lastConnectedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

## Multi-Factor Authentication (MFA) Setup

**Test Scenario**: User enables MFA for enhanced security

```bash
# Setup MFA
curl -X POST /api/auth/mfa/setup \
  -H "Authorization: Bearer jwt-token-here"

# Expected Response: 200 OK
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "backupCodes": [
    "12345678",
    "87654321",
    "11223344"
  ]
}
```

```bash
# Verify and enable MFA
curl -X POST /api/auth/mfa/verify \
  -H "Authorization: Bearer jwt-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'

# Expected Response: 200 OK
{
  "success": true,
  "message": "MFA enabled successfully"
}
```

## Error Handling Examples

### Rate Limiting
```bash
# When rate limit is exceeded
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 100,
    "remaining": 0,
    "resetAt": "2025-01-15T11:00:00Z"
  }
}
```

### Connection Failures
```bash
# When connection test fails
{
  "success": true,
  "connected": false,
  "message": "Connection failed: Authentication error",
  "responseTime": null,
  "details": {
    "error": "Invalid credentials",
    "code": "AUTH_FAILED",
    "suggestion": "Please verify your username and password"
  }
}
```

### Validation Errors
```bash
# When connection data is invalid
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "url",
    "message": "Invalid URL format",
    "value": "not-a-valid-url"
  }
}
```

## Success Validation Checklist

### Registration & Authentication
- [ ] User can register with valid email and strong password
- [ ] Verification email sent and account activated
- [ ] User can log in with verified credentials
- [ ] Session tokens work for authenticated requests
- [ ] Password reset flow completes successfully
- [ ] MFA setup and verification works correctly
- [ ] Failed login attempts are limited and tracked

### Website Connections
- [ ] Platform discovery detects WordPress, Wix, Shopify correctly
- [ ] SFTP connections can be established and tested
- [ ] OAuth flows complete for Wix and Shopify
- [ ] Connection limits enforced based on subscription tier
- [ ] Connection status updates appropriately
- [ ] Credentials stored securely (never in database)

### File Management
- [ ] File listing works for all connection types
- [ ] File upload succeeds with proper validation
- [ ] File download provides correct content
- [ ] File operations are logged for audit

### Security & Compliance
- [ ] All API endpoints require authentication
- [ ] Rate limiting prevents abuse
- [ ] Audit logs capture all important events
- [ ] Personal data can be exported (GDPR compliance)
- [ ] Account deletion removes all user data
- [ ] Row Level Security isolates user data

## Performance Benchmarks

- **Authentication**: Login response < 200ms
- **Connection Testing**: Platform connection test < 500ms
- **File Listing**: Directory listing < 1 second
- **Platform Discovery**: Website analysis < 3 seconds
- **File Upload**: 10MB file upload < 10 seconds

## Next Steps

After completing this quickstart:

1. **Advanced Features**: Explore bulk file operations, webhook integrations
2. **Team Management**: Add team members and permission controls
3. **API Integration**: Use the API for custom applications
4. **Monitoring**: Set up alerts for connection failures
5. **Automation**: Create automated workflows between platforms

This quickstart validates the complete user journey and ensures all core functionality works as specified in the feature requirements.