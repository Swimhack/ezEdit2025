# ezEdit - Full-Stack PHP Web/FTP Editor

ezEdit is an AI-powered web/FTP editor that allows non-technical users to open legacy sites over FTP, live-edit code with a Monaco-style split editor, preview changes instantly, and save to the server.

## Project Structure

The application follows an MVC architecture with the following structure:

```
ezedit.co/
├── app/                     # PHP backend application
│   ├── Controllers/         # MVC Controllers
│   │   ├── AuthController.php      # Authentication & plans
│   │   ├── EditorController.php    # Code editing operations
│   │   ├── FileExplorerController.php  # File operations
│   │   └── FtpController.php       # FTP operations
│   └── api.php              # API router
├── public/                  # Public-facing files
│   ├── css/                 # Stylesheets
│   ├── js/                  # JavaScript files
│   ├── ftp/                 # Legacy FTP handlers
│   └── index.html           # Main entry point
├── server.php               # Main PHP router
└── .env                     # Environment variables
```

## Core Features

1. **Secure FTP Connector**
   - UI flow for adding sites (host, port, user, password, passive mode)
   - API endpoints for FTP operations: connect, list, download, upload
   - Encrypted credential storage with Supabase RLS

2. **File Explorer**
   - Collapsible tree view with lazy-loaded directories
   - Breadcrumb navigation
   - File operations: rename, delete, new file, new folder

3. **Split Code Editor**
   - Monaco diff/merge view (original | edit)
   - Chat-assist side panel ("Klein" agent) for AI-powered code suggestions
   - Apply/Discard buttons to manage AI-suggested changes

4. **Preview Pane**
   - Inline iframe that refreshes on save
   - Development server auto-serves content for preview

5. **Plans & Gating**
   - 7-day free trial (view & preview only, no saves)
   - "Pro" plan ($50/mo): unlimited sites, save & publish capabilities
   - Stripe integration for payment processing

6. **On-boarding Wizard**
   - Step 1: Signup
   - Step 2: Email verification
   - Step 3: First site setup wizard
   - Progress bar and documentation links

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user-plan` - Get user plan information
- `POST /api/auth/upgrade-pro` - Upgrade to Pro plan

### FTP Operations
- `POST /api/ftp/connect` - Connect to FTP server
- `POST /api/ftp/list` - List directory contents
- `POST /api/ftp/download` - Download file from FTP
- `POST /api/ftp/upload` - Upload file to FTP

### File Explorer
- `POST /api/files/create-file` - Create a new file
- `POST /api/files/create-directory` - Create a new directory
- `POST /api/files/rename` - Rename file or directory
- `POST /api/files/delete-file` - Delete a file
- `POST /api/files/delete-directory` - Delete a directory
- `POST /api/files/info` - Get file information

### Editor
- `POST /api/editor/get-file` - Get file content for editing
- `POST /api/editor/save-file` - Save file content
- `POST /api/editor/generate-diff` - Generate diff between original and modified content
- `POST /api/editor/apply-patch` - Apply AI-suggested patch to content

## Running the Application

1. Clone the repository
2. Configure your web server to point to the project directory
3. Copy `.env.example` to `.env` and configure your environment variables
4. Access the application through your web browser

## Development

To run the application in development mode:

```bash
php -S localhost:8000 server.php
```

This will start the PHP development server and serve the application at http://localhost:8000.

## Testing

To test the FTP connection functionality, you can use the demo FTP server:
- Host: ftp.test.rebex.net
- Username: demo
- Password: password
- Port: 21
- Passive Mode: Yes

## License

Proprietary - All rights reserved

latest logs ( acquired by lovable agent chat history) as of 7/9/2025 show (
Lovable
Worked for 56s
Just now

Let me examine the specific errors from the logs and console to understand what's happening with the file browsing issue.

Let me examine the specific errors from the logs and console to understand what's happening with the file browsing issue.

Supabase
retrieved logs
Let me also check for any database errors related to FTP operations:

Let me also check for any database errors related to FTP operations:

Supabase
retrieved logs
Now let me check the user's FTP sites to see if any are configured:

Now let me check the user's FTP sites to see if any are configured:

Supabase
read from database
Let me check the FTP store state to see what's happening with the active site:

Let me check the FTP store state to see what's happening with the active site:

Read
src/store/ftpStore.ts
Now let me check the specific error patterns from the console logs more closely. Looking at the console logs you provided, I can see several key error patterns:

Primary Error Analysis
1. "Failed to send a request to the Edge Function"

This error appears consistently across multiple attempts
The error originates from ftpService.ts in the makeRequest method
Stack trace shows: Error: Failed to send a request to the Edge Function
2. Edge Function Never Receives Requests

The analytics query shows zero activity for the ftp-operations edge function
This confirms the requests are failing at the transport layer before reaching the edge function
3. Active Site Detection Issues

Console shows: "🚀 Active site detected: StricklandAi.com ID: 7ae8cfc8-8d1e-43e2-a753-109634eac05b"
But then shows: "❌ No active site available for file listing"
This suggests a race condition or state management issue
4. Session Management

Multiple session checks are happening: "📝 Session check: { hasSession: true, hasAccessToken: true }"
This indicates authentication is working correctly
5. FTP Ping Failures

"⚠️ FTP Ping: https://caf17cdc-1be4-4e21-af7e-fe24c63f8b7a.supabase.co/functions/v1/ftp-operations failed"
Error: "TypeError: Failed to fetch"
Root Cause Analysis
The core issue is transport layer failure. The errors indicate:

Network-level fetch failures - "Failed to fetch" suggests either:

CORS issues
Network connectivity problems
Incorrect endpoint URLs
Project URL mismatch - The ping URL shows caf17cdc-1be4-4e21-af7e-fe24c63f8b7a.supabase.co but this might not match the actual project configuration

Race conditions - The active site is detected but then reported as unavailable, suggesting timing issues in state management

Specific Error Messages Summary
Primary: "Failed to send a request to the Edge Function"
Secondary: "Failed to fetch" (network level)
State: "No active site available for file listing"
Transport: Zero edge function activity in logs
The issue is fundamentally that no requests are reaching the edge function at all - they're failing at the browser/network level before even getting to Supabase's infrastructure.)

