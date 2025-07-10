# EzEdit.co API Endpoints Documentation

## Overview

This document provides complete reference for all API endpoints in the EzEdit.co application, including request/response formats, authentication requirements, and example usage.

## Base URLs

- **Production:** `https://api.ezedit.co`
- **Development:** `http://localhost:8080`
- **Static Assets:** `https://ezedit.co`

## Authentication

### Bearer Token Authentication
Most endpoints require Bearer token authentication:
```http
Authorization: Bearer {jwt_token}
```

### Session Authentication
FTP operations use PHP session authentication via cookies.

## Data Flow Architecture

```
Frontend (JS) → API Gateway (Nginx) → PHP Backend → External Services
     ↓              ↓                    ↓             ↓
Supabase Auth → Session Management → FTP Servers → AI Services
```

---

## Authentication Endpoints

### POST /api/auth/login
Authenticate user with email/password.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "securepassword123"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "user@example.com",
            "full_name": "John Doe",
            "subscription_status": "pro",
            "subscription_ends_at": "2025-12-31T23:59:59Z"
        },
        "session": {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "expires_at": "2025-01-10T14:30:00Z"
        }
    }
}
```

**Error Response:**
```json
{
    "success": false,
    "error": {
        "code": "INVALID_CREDENTIALS",
        "message": "Email or password is incorrect"
    }
}
```

### POST /api/auth/register
Register new user account.

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
    "email": "newuser@example.com",
    "password": "securepassword123",
    "full_name": "Jane Smith"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "email": "newuser@example.com",
            "full_name": "Jane Smith",
            "subscription_status": "free_trial",
            "trial_ends_at": "2025-01-17T23:59:59Z"
        },
        "message": "Please check your email to verify your account"
    }
}
```

### POST /api/auth/logout
Logout current user session.

**Request:**
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response:**
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request:**
```http
POST /api/auth/refresh
Content-Type: application/json

{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires_at": "2025-01-10T15:30:00Z"
    }
}
```

### GET /api/auth/me
Get current user profile.

**Request:**
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "user@example.com",
            "full_name": "John Doe",
            "avatar_url": "https://gravatar.com/avatar/...",
            "subscription_status": "pro",
            "subscription_ends_at": "2025-12-31T23:59:59Z",
            "created_at": "2024-01-01T00:00:00Z",
            "last_login_at": "2025-01-10T12:00:00Z"
        }
    }
}
```

---

## FTP Management Endpoints

### POST /ftp/ftp-handler.php?action=connect
Establish FTP connection.

**Request:**
```http
POST /ftp/ftp-handler.php?action=connect
Content-Type: application/x-www-form-urlencoded
Cookie: PHPSESSID={session_id}

host=ftp.example.com&username=ftpuser&password=ftppass&port=21&passive=true
```

**Response:**
```json
{
    "success": true,
    "data": {
        "connection_id": "ftp_65a1b2c3d4e5f6",
        "server_info": {
            "host": "ftp.example.com",
            "port": 21,
            "system_type": "UNIX Type: L8",
            "features": ["MLST", "SIZE", "MDTM"]
        }
    }
}
```

**Error Response:**
```json
{
    "success": false,
    "error": {
        "code": "CONNECTION_FAILED",
        "message": "Could not connect to FTP server",
        "details": "Connection timed out after 30 seconds"
    }
}
```

### GET /ftp/ftp-handler.php?action=list
List directory contents.

**Request:**
```http
GET /ftp/ftp-handler.php?action=list&connection_id=ftp_65a1b2c3d4e5f6&path=/public_html
Cookie: PHPSESSID={session_id}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "path": "/public_html",
        "items": [
            {
                "name": "index.html",
                "type": "file",
                "size": 2048,
                "permissions": "644",
                "modified": "2025-01-10T10:30:00Z",
                "is_readable": true,
                "is_writable": true
            },
            {
                "name": "css",
                "type": "directory",
                "permissions": "755",
                "modified": "2025-01-09T15:20:00Z",
                "is_readable": true,
                "is_writable": true
            }
        ],
        "total_items": 2,
        "parent_path": "/"
    }
}
```

### GET /ftp/ftp-handler.php?action=get
Download file content.

**Request:**
```http
GET /ftp/ftp-handler.php?action=get&connection_id=ftp_65a1b2c3d4e5f6&path=/public_html/index.html
Cookie: PHPSESSID={session_id}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "content": "<!DOCTYPE html>\n<html>\n<head>\n    <title>Welcome</title>\n</head>\n<body>\n    <h1>Hello World</h1>\n</body>\n</html>",
        "encoding": "utf-8",
        "size": 128,
        "modified": "2025-01-10T10:30:00Z",
        "mime_type": "text/html"
    }
}
```

### POST /ftp/ftp-handler.php?action=put
Upload/save file content.

**Request:**
```http
POST /ftp/ftp-handler.php?action=put
Content-Type: application/x-www-form-urlencoded
Cookie: PHPSESSID={session_id}

connection_id=ftp_65a1b2c3d4e5f6&path=/public_html/index.html&content=<!DOCTYPE html>...&encoding=utf-8
```

**Response:**
```json
{
    "success": true,
    "data": {
        "bytes_written": 150,
        "modified": "2025-01-10T14:45:00Z",
        "backup_created": true,
        "backup_path": "/backups/index.html.2025-01-10-14-45-00"
    }
}
```

### POST /ftp/ftp-handler.php?action=mkdir
Create directory.

**Request:**
```http
POST /ftp/ftp-handler.php?action=mkdir
Content-Type: application/x-www-form-urlencoded
Cookie: PHPSESSID={session_id}

connection_id=ftp_65a1b2c3d4e5f6&path=/public_html/new_folder&permissions=755
```

**Response:**
```json
{
    "success": true,
    "data": {
        "path": "/public_html/new_folder",
        "permissions": "755",
        "created": "2025-01-10T14:50:00Z"
    }
}
```

### POST /ftp/ftp-handler.php?action=delete
Delete file or directory.

**Request:**
```http
POST /ftp/ftp-handler.php?action=delete
Content-Type: application/x-www-form-urlencoded
Cookie: PHPSESSID={session_id}

connection_id=ftp_65a1b2c3d4e5f6&path=/public_html/old_file.txt&type=file
```

**Response:**
```json
{
    "success": true,
    "data": {
        "deleted_path": "/public_html/old_file.txt",
        "backup_created": true,
        "backup_path": "/backups/old_file.txt.2025-01-10-14-55-00"
    }
}
```

### POST /ftp/ftp-handler.php?action=rename
Rename/move file or directory.

**Request:**
```http
POST /ftp/ftp-handler.php?action=rename
Content-Type: application/x-www-form-urlencoded
Cookie: PHPSESSID={session_id}

connection_id=ftp_65a1b2c3d4e5f6&old_path=/public_html/old_name.html&new_path=/public_html/new_name.html
```

**Response:**
```json
{
    "success": true,
    "data": {
        "old_path": "/public_html/old_name.html",
        "new_path": "/public_html/new_name.html",
        "renamed_at": "2025-01-10T15:00:00Z"
    }
}
```

### GET /ftp/ftp-handler.php?action=status
Check FTP connection status.

**Request:**
```http
GET /ftp/ftp-handler.php?action=status&connection_id=ftp_65a1b2c3d4e5f6
Cookie: PHPSESSID={session_id}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "connection_id": "ftp_65a1b2c3d4e5f6",
        "is_connected": true,
        "last_activity": "2025-01-10T14:58:00Z",
        "current_directory": "/public_html",
        "server_info": {
            "host": "ftp.example.com",
            "port": 21,
            "system_type": "UNIX Type: L8"
        }
    }
}
```

### POST /ftp/ftp-handler.php?action=disconnect
Close FTP connection.

**Request:**
```http
POST /ftp/ftp-handler.php?action=disconnect
Content-Type: application/x-www-form-urlencoded
Cookie: PHPSESSID={session_id}

connection_id=ftp_65a1b2c3d4e5f6
```

**Response:**
```json
{
    "success": true,
    "data": {
        "message": "Connection closed successfully",
        "disconnected_at": "2025-01-10T15:05:00Z"
    }
}
```

---

## AI Assistant Endpoints

### POST /api/ai/complete
Get AI completion/response.

**Request:**
```http
POST /api/ai/complete
Authorization: Bearer {token}
Content-Type: application/json

{
    "prompt": "Explain this JavaScript function",
    "context": {
        "code": "function calculateTotal(items) {\n    return items.reduce((sum, item) => sum + item.price, 0);\n}",
        "file_path": "/public_html/js/cart.js",
        "language": "javascript"
    },
    "model": "claude-3-sonnet",
    "max_tokens": 500
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "completion": "This JavaScript function calculates the total price of items in a shopping cart. It uses the `reduce()` method to iterate through an array of items and sum up their `price` properties. The function takes an array of items as input and returns the total sum as a number.",
        "tokens_used": 45,
        "model": "claude-3-sonnet",
        "conversation_id": "conv_65a1b2c3d4e5f7"
    }
}
```

### POST /api/ai/generate
Generate code from description.

**Request:**
```http
POST /api/ai/generate
Authorization: Bearer {token}
Content-Type: application/json

{
    "description": "Create a PHP function to validate email addresses",
    "language": "php",
    "context": {
        "file_path": "/public_html/includes/validation.php",
        "existing_functions": ["validatePassword", "sanitizeInput"]
    }
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "code": "function validateEmail($email) {\n    // Remove whitespace\n    $email = trim($email);\n    \n    // Validate email format\n    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {\n        return false;\n    }\n    \n    // Check if domain exists\n    $domain = substr(strrchr($email, '@'), 1);\n    if (!checkdnsrr($domain, 'MX')) {\n        return false;\n    }\n    \n    return true;\n}",
        "explanation": "This function validates email addresses by first trimming whitespace, then using PHP's built-in filter_var() function to check the format, and finally verifying that the domain has MX records.",
        "tokens_used": 120,
        "suggestions": [
            "Add rate limiting for domain checks",
            "Consider caching DNS results",
            "Add custom error messages"
        ]
    }
}
```

### GET /api/ai/conversations
Get user's AI conversation history.

**Request:**
```http
GET /api/ai/conversations?limit=10&offset=0&file_path=/public_html/index.html
Authorization: Bearer {token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "conversations": [
            {
                "id": "conv_65a1b2c3d4e5f7",
                "file_path": "/public_html/index.html",
                "created_at": "2025-01-10T14:30:00Z",
                "updated_at": "2025-01-10T14:35:00Z",
                "total_tokens": 245,
                "message_count": 4,
                "last_message": "How can I improve the SEO of this page?"
            }
        ],
        "total": 1,
        "limit": 10,
        "offset": 0
    }
}
```

### GET /api/ai/conversations/{id}
Get specific conversation details.

**Request:**
```http
GET /api/ai/conversations/conv_65a1b2c3d4e5f7
Authorization: Bearer {token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "conversation": {
            "id": "conv_65a1b2c3d4e5f7",
            "file_path": "/public_html/index.html",
            "messages": [
                {
                    "role": "user",
                    "content": "Explain this HTML structure",
                    "timestamp": "2025-01-10T14:30:00Z"
                },
                {
                    "role": "assistant", 
                    "content": "This HTML document follows a standard structure...",
                    "timestamp": "2025-01-10T14:30:05Z",
                    "tokens_used": 67
                }
            ],
            "total_tokens": 245,
            "created_at": "2025-01-10T14:30:00Z"
        }
    }
}
```

---

## User Management Endpoints

### GET /api/user/profile
Get user profile information.

**Request:**
```http
GET /api/user/profile
Authorization: Bearer {token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "user@example.com",
            "full_name": "John Doe",
            "avatar_url": "https://gravatar.com/avatar/...",
            "subscription": {
                "status": "pro",
                "plan": "professional",
                "price": "$50/month",
                "ends_at": "2025-12-31T23:59:59Z",
                "auto_renew": true
            },
            "usage": {
                "ftp_connections": 3,
                "ai_tokens_used": 15420,
                "ai_tokens_limit": 100000,
                "files_edited": 127
            },
            "preferences": {
                "editor_theme": "vs-dark",
                "font_size": 14,
                "auto_save": true,
                "ai_assistance": true
            }
        }
    }
}
```

### PUT /api/user/profile
Update user profile.

**Request:**
```http
PUT /api/user/profile
Authorization: Bearer {token}
Content-Type: application/json

{
    "full_name": "John Smith",
    "preferences": {
        "editor_theme": "vs-light",
        "font_size": 16,
        "auto_save": false
    }
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "message": "Profile updated successfully",
        "updated_fields": ["full_name", "preferences"]
    }
}
```

### GET /api/user/ftp-connections
Get saved FTP connections.

**Request:**
```http
GET /api/user/ftp-connections
Authorization: Bearer {token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "connections": [
            {
                "id": "550e8400-e29b-41d4-a716-446655440002",
                "name": "Main Website",
                "host": "ftp.example.com",
                "port": 21,
                "username": "webuser",
                "protocol": "ftp",
                "passive_mode": true,
                "created_at": "2024-12-01T00:00:00Z",
                "last_used_at": "2025-01-10T12:00:00Z"
            }
        ]
    }
}
```

### POST /api/user/ftp-connections
Save new FTP connection.

**Request:**
```http
POST /api/user/ftp-connections
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "Client Website",
    "host": "ftp.clientsite.com",
    "port": 21,
    "username": "clientuser",
    "password": "clientpass",
    "protocol": "ftp",
    "passive_mode": true
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "connection": {
            "id": "550e8400-e29b-41d4-a716-446655440003",
            "name": "Client Website",
            "host": "ftp.clientsite.com",
            "port": 21,
            "username": "clientuser",
            "protocol": "ftp",
            "passive_mode": true,
            "created_at": "2025-01-10T15:30:00Z"
        }
    }
}
```

---

## Subscription Management Endpoints

### GET /api/subscription/plans
Get available subscription plans.

**Request:**
```http
GET /api/subscription/plans
```

**Response:**
```json
{
    "success": true,
    "data": {
        "plans": [
            {
                "id": "free_trial",
                "name": "Free Trial",
                "price": 0,
                "duration": "7 days",
                "features": [
                    "Full feature access",
                    "1 FTP connection",
                    "100 AI requests/day",
                    "Preview only after trial"
                ],
                "limitations": [
                    "No saving after trial",
                    "Single connection only"
                ]
            },
            {
                "id": "pro",
                "name": "Professional",
                "price": 50,
                "currency": "USD",
                "interval": "month",
                "features": [
                    "Unlimited FTP connections",
                    "Unlimited AI requests",
                    "Team collaboration (5 users)",
                    "Priority support",
                    "Custom themes"
                ],
                "stripe_price_id": "price_1234567890"
            },
            {
                "id": "lifetime",
                "name": "Lifetime Access",
                "price": 500,
                "currency": "USD",
                "interval": "one_time",
                "features": [
                    "All Pro features",
                    "Single domain license",
                    "Lifetime updates",
                    "White-label option",
                    "API access"
                ],
                "stripe_price_id": "price_0987654321"
            }
        ]
    }
}
```

### POST /api/subscription/create-checkout
Create Stripe checkout session.

**Request:**
```http
POST /api/subscription/create-checkout
Authorization: Bearer {token}
Content-Type: application/json

{
    "plan_id": "pro",
    "success_url": "https://ezedit.co/success",
    "cancel_url": "https://ezedit.co/pricing"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "checkout_url": "https://checkout.stripe.com/pay/cs_test_...",
        "session_id": "cs_test_1234567890"
    }
}
```

---

## Health & Monitoring Endpoints

### GET /api/health
System health check.

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
    "success": true,
    "data": {
        "status": "healthy",
        "timestamp": "2025-01-10T15:45:00Z",
        "checks": {
            "database": "healthy",
            "ftp_extension": "healthy",
            "ai_services": "healthy",
            "disk_space": "healthy",
            "memory": "healthy"
        },
        "version": "1.0.0",
        "uptime": 86400
    }
}
```

### GET /api/status
Detailed system status.

**Request:**
```http
GET /api/status
```

**Response:**
```json
{
    "success": true,
    "data": {
        "server": {
            "php_version": "8.2.1",
            "memory_usage": "45MB / 256MB",
            "disk_usage": "2.1GB / 10GB",
            "load_average": [0.5, 0.3, 0.2]
        },
        "database": {
            "status": "connected",
            "connections": 5,
            "max_connections": 100,
            "response_time": "15ms"
        },
        "external_services": {
            "claude_api": "operational",
            "openai_api": "operational",
            "stripe_api": "operational"
        }
    }
}
```

---

## Error Codes Reference

### Authentication Errors (4000-4099)
- `4001` - Invalid credentials
- `4002` - Account not verified
- `4003` - Account suspended
- `4004` - Token expired
- `4005` - Invalid token format

### FTP Errors (4100-4199)
- `4101` - Connection failed
- `4102` - Authentication failed
- `4103` - Permission denied
- `4104` - File not found
- `4105` - Directory not found
- `4106` - Upload failed
- `4107` - Download failed
- `4108` - Invalid path

### AI Service Errors (4200-4299)
- `4201` - AI service unavailable
- `4202` - Token limit exceeded
- `4203` - Invalid prompt
- `4204` - Context too long
- `4205` - Rate limit exceeded

### Subscription Errors (4300-4399)
- `4301` - Subscription required
- `4302` - Plan not found
- `4303` - Payment failed
- `4304` - Subscription expired

### Server Errors (5000-5099)
- `5001` - Database connection failed
- `5002` - External service timeout
- `5003` - File system error
- `5004` - Configuration error

---

## Rate Limiting

### Default Limits
- **Authentication:** 5 requests per minute per IP
- **FTP Operations:** 100 requests per minute per user
- **AI Requests:** Varies by subscription plan
- **File Upload:** 10MB max file size, 50MB total per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641816000
X-RateLimit-Retry-After: 60
```

---

This API documentation is maintained and updated with each release. For the most current information, please refer to the online documentation at `https://docs.ezedit.co/api`.