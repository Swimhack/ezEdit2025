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
