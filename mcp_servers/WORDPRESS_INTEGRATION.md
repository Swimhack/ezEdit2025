# WordPress MCP Integration with EzEdit FTP Connections

## Overview

The WordPress MCP server integrates seamlessly with ezedit's FTP connection system, allowing you to manage WordPress sites through both file operations (FTP) and content management (WordPress REST API).

## How It Works

When ezedit detects a WordPress site (via platform detection), you have access to:

1. **FTP MCP Tools** - For file system operations
   - Edit wp-config.php
   - Manage themes and plugins
   - Upload/download files
   - Modify PHP files

2. **WordPress MCP Tools** - For content management
   - Create/edit posts and pages
   - Manage media library
   - Moderate comments
   - Manage categories and tags

## Setup

### 1. Install Dependencies

```bash
cd ezedit/mcp_servers
pip install -r requirements.txt
```

This installs:
- `mcp` - MCP framework
- `httpx` - HTTP client for WordPress API
- `paramiko` - SFTP support
- `pydantic` - Data validation

### 2. Configure WordPress Application Password

WordPress MCP requires an Application Password:

1. Log into WordPress Admin
2. Go to **Users → Profile**
3. Scroll to **Application Passwords** section
4. Enter a name (e.g., "EzEdit MCP")
5. Click **Add New Application Password**
6. Copy the generated password (you won't see it again!)

### 3. Restart Claude Code

After installing dependencies and configuring WordPress, restart Claude Code to load both MCP servers.

## Usage Examples

### Combined FTP + WordPress Workflow

**Example 1: Edit Theme File and Update Post**

```
1. Use FTP MCP to read theme file:
   "Read /wp-content/themes/mytheme/style.css via FTP"

2. Edit the file content

3. Use FTP MCP to upload:
   "Upload the edited style.css to /wp-content/themes/mytheme/"

4. Use WordPress MCP to create a post about the update:
   "Create a WordPress post titled 'Theme Update' with content about the CSS changes"
```

**Example 2: Upload Media and Use in Post**

```
1. Use FTP MCP to upload image:
   "Upload image.jpg to /wp-content/uploads/2024/01/ via FTP"

2. Use WordPress MCP to add to media library:
   "Upload image.jpg to WordPress media library"

3. Use WordPress MCP to create post with featured image:
   "Create a WordPress post with featured_media set to the uploaded image ID"
```

**Example 3: Backup WordPress Files**

```
1. Use FTP MCP to list WordPress files:
   "List all files in /wp-content/plugins/ via FTP"

2. Use FTP MCP to download:
   "Download wp-config.php from / via FTP"

3. Use WordPress MCP to export content:
   "List all WordPress posts and pages"
```

## WordPress MCP Tools Reference

### Content Management

- **wordpress_list_posts** - List posts/pages with filters
- **wordpress_create_post** - Create new posts or pages
- **wordpress_update_post** - Update existing content
- **wordpress_delete_post** - Delete or trash content

### Media Management

- **wordpress_list_media** - Browse media library
- **wordpress_upload_media** - Upload files to media library

### User Management

- **wordpress_list_users** - List WordPress users

### Comment Management

- **wordpress_list_comments** - List comments with filters
- **wordpress_moderate_comment** - Approve, hold, spam, or trash comments

### Taxonomy Management

- **wordpress_list_categories** - List categories
- **wordpress_create_category** - Create new categories
- **wordpress_list_tags** - List tags
- **wordpress_create_tag** - Create new tags

## Integration Points

### Platform Detection

EzEdit automatically detects WordPress sites using:
- File structure detection (wp-config.php, wp-content/)
- HTTP header analysis
- HTML content analysis
- WhatCMS API integration

When WordPress is detected, both FTP and WordPress MCP tools become available.

### Connection Management

WordPress sites in ezedit can have:
- **FTP Connection** - For file operations
- **WordPress API Credentials** - For content management

Both can be used together for complete site management.

## Best Practices

1. **Use FTP for Files**: Theme/plugin files, wp-config.php, uploads
2. **Use WordPress API for Content**: Posts, pages, media metadata, comments
3. **Combine When Needed**: Upload media via FTP, then register in WordPress
4. **Backup First**: Always backup before making changes
5. **Test Changes**: Test in staging before production

## Troubleshooting

### WordPress API Not Working

- Verify Application Password is correct
- Check WordPress REST API is enabled
- Ensure user has proper permissions
- Verify site URL is correct (include https://)

### FTP + WordPress Mismatch

- Ensure FTP path matches WordPress installation
- Check wp-config.php location matches FTP root
- Verify file permissions allow WordPress to read files

### Authentication Errors

- Application Password must be used (not regular password)
- Username must match WordPress username exactly
- Check Application Password hasn't been revoked

## Security Notes

- **Application Passwords**: More secure than regular passwords
- **FTP Credentials**: Never commit to git
- **WordPress Credentials**: Store securely, use environment variables
- **Permissions**: Use least privilege principle

## Example Workflows

### Complete WordPress Site Setup

1. Detect WordPress via platform detection
2. Connect via FTP to verify file structure
3. Use WordPress MCP to verify API access
4. Create initial content via WordPress API
5. Customize theme files via FTP
6. Upload media via WordPress API
7. Publish content via WordPress API

### Content Migration

1. List all posts via WordPress MCP
2. Export content via WordPress API
3. Backup files via FTP MCP
4. Modify content as needed
5. Re-import via WordPress API
6. Verify via FTP file checks

## Next Steps

- Review WordPress REST API documentation
- Set up Application Passwords for your sites
- Test both FTP and WordPress MCP tools
- Integrate into your development workflow



