# Remote File Editing & CMS Integration

This editor now supports viewing and editing files from multiple remote sources using natural language AI editing.

## Supported Connections

### 1. FTP/SFTP
- Connect to any FTP or SFTP server
- Browse directory structure
- Read and write files remotely
- Full file management capabilities

### 2. WordPress
- Connect via WordPress REST API
- Edit posts and pages
- Manage content with natural language instructions
- View and update metadata

### 3. Wix
- Connect via Wix REST API
- Edit pages and site content
- Manage collections and data items
- Update SEO settings

## Setup Instructions

### Environment Variables

Create a `.env.local` file with the following:

```env
# AI API Keys (for natural language editing)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### WordPress Setup

1. Generate an Application Password:
   - Go to WordPress Admin → Users → Profile
   - Scroll to "Application Passwords"
   - Create a new application password
   - Save it securely (shown only once)

2. In the editor:
   - Click "Connect to Remote Source"
   - Select "WordPress" tab
   - Enter your site URL (e.g., https://example.com)
   - Enter your WordPress username
   - Paste the application password

### Wix Setup

1. Get API Credentials:
   - Go to Wix Developer Console
   - Create or select your app
   - Generate an API key
   - Note your Site ID

2. In the editor:
   - Click "Connect to Remote Source"
   - Select "Wix" tab
   - Enter Site ID and API Key

### FTP/SFTP Setup

Simply enter your server credentials:
- Host (e.g., ftp.example.com)
- Port (21 for FTP, 22 for SFTP)
- Username
- Password

## Natural Language Editing

Once connected to WordPress or Wix, you can use natural language to edit content:

### Example Commands:
- "Change the title to 'New Product Launch'"
- "Add a paragraph about our company values"
- "Update the meta description for SEO"
- "Make the intro more engaging"
- "Fix any grammar mistakes"

### How It Works:
1. Select a post/page in the file explorer
2. Open it in the editor
3. Use the AI assistant to give editing instructions
4. The AI will understand context and make appropriate changes
5. Review and save changes back to WordPress/Wix

## File Structure

### WordPress
```
/posts/
  - Post 1
  - Post 2
/pages/
  - Home
  - About
```

### Wix
```
/pages/
  - Home Page
  - About Page
/collections/
  - Products
  - Blog Posts
```

### FTP/SFTP
Shows the actual directory structure on your server.

## API Routes

The following API endpoints are available:

- `/api/ftp` - FTP/SFTP operations
- `/api/wordpress` - WordPress content management
- `/api/wix` - Wix site management
- `/api/nl-edit` - Natural language content editing

## Security Notes

- All passwords and API keys are stored in memory only (not persisted)
- WordPress uses Application Passwords (not your main password)
- SFTP connections are encrypted
- Consider using environment variables for sensitive data in production

## Troubleshooting

### WordPress Connection Issues
- Ensure REST API is enabled (it is by default)
- Check that Application Passwords are enabled
- Verify your site URL includes the protocol (https://)
- Some hosts may block REST API - check with your provider

### Wix Connection Issues
- Verify API key has correct permissions
- Ensure Site ID is correct
- Check Wix API rate limits

### FTP/SFTP Connection Issues
- Verify firewall isn't blocking the connection
- Check port numbers (21 for FTP, 22 for SFTP)
- Confirm credentials are correct
- Some hosts require passive mode (enabled by default)

## Dependencies

The following packages were added:
- `basic-ftp` - FTP client
- `ssh2-sftp-client` - SFTP client
- `axios` - HTTP client
- `form-data` - Multipart form data
- `wpapi` - WordPress API wrapper (optional)
- `@wix/sdk` - Wix SDK

## Future Enhancements

Potential features to add:
- Shopify integration
- GitHub integration
- Direct database connections
- Multi-file operations
- Batch natural language edits
- Content preview before saving
- Version history with rollback
