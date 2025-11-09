# WordPress Admin MCP Server

A comprehensive Model Context Protocol (MCP) server for WordPress administration. This server enables Claude to manage all aspects of a WordPress site through the WordPress REST API.

## Features

This MCP server provides complete WordPress admin functionality:

### Content Management
- **Posts**: Create, read, update, delete, and list posts
- **Pages**: Full page management capabilities
- **Media**: Upload, manage, and delete media files
- **Categories**: Organize content with categories
- **Tags**: Tag management and assignment
- **Comments**: Moderate and manage comments

### User Management
- **Users**: Create, update, delete, and list users
- **Roles**: Manage user roles and permissions

### Site Configuration
- **Plugins**: List, activate, deactivate, and delete plugins
- **Themes**: List, activate, and manage themes
- **Settings**: Get and update WordPress site settings
- **Menus**: View and manage navigation menus

### Advanced Features
- **Post Types**: List and inspect custom post types
- **Taxonomies**: List and inspect custom taxonomies
- Support for all WordPress REST API parameters (pagination, search, filtering)

## Prerequisites

- Node.js 18 or higher
- WordPress 5.5+ with REST API enabled
- WordPress user account with appropriate admin permissions
- Application password or basic authentication enabled

## Installation

1. Navigate to the MCP server directory:
```bash
cd mcp-servers/wordpress-admin
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

## Configuration

### WordPress Setup

1. **Enable REST API** (usually enabled by default in WordPress 5.0+)

2. **Create Application Password**:
   - Go to WordPress Admin → Users → Profile
   - Scroll to "Application Passwords"
   - Enter a name (e.g., "Claude MCP")
   - Click "Add New Application Password"
   - Copy the generated password (it will only be shown once)

3. **Set Environment Variables**:

Create a `.env` file or set these environment variables:

```bash
WORDPRESS_URL=https://your-wordpress-site.com
WORDPRESS_USERNAME=your-admin-username
WORDPRESS_PASSWORD=your-application-password
```

**Important**: Use the Application Password, not your regular WordPress password!

### Claude Desktop Configuration

Add this server to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "wordpress-admin": {
      "command": "node",
      "args": ["/path/to/ezEdit2025/mcp-servers/wordpress-admin/dist/index.js"],
      "env": {
        "WORDPRESS_URL": "https://your-wordpress-site.com",
        "WORDPRESS_USERNAME": "your-admin-username",
        "WORDPRESS_PASSWORD": "your-application-password"
      }
    }
  }
}
```

### For Claude Code (ezEdit Integration)

If you're using this with Claude Code in ezEdit, add to your MCP configuration:

```json
{
  "wordpress": {
    "command": "node",
    "args": ["./mcp-servers/wordpress-admin/dist/index.js"],
    "env": {
      "WORDPRESS_URL": "https://your-wordpress-site.com",
      "WORDPRESS_USERNAME": "your-admin-username",
      "WORDPRESS_PASSWORD": "your-application-password"
    }
  }
}
```

## Usage

Once configured, you can use natural language to manage your WordPress site through Claude:

### Example Commands

**Content Management:**
- "List all published posts on my WordPress site"
- "Create a new draft post titled 'Hello World' with some content"
- "Update post ID 123 to change the title"
- "Delete post ID 456"
- "Show me all pages on the site"

**User Management:**
- "List all users on my WordPress site"
- "Create a new editor account with username 'john' and email 'john@example.com'"
- "Update user ID 5 to change their role to administrator"

**Media:**
- "List all media files"
- "Update media ID 789 to add alt text"
- "Delete media file ID 101"

**Categories & Tags:**
- "List all categories"
- "Create a new category called 'Technology'"
- "List all tags"
- "Create a tag called 'AI'"

**Plugins & Themes:**
- "List all installed plugins"
- "Activate the Akismet plugin"
- "List all themes"
- "Activate the Twenty Twenty-One theme"

**Settings:**
- "Show me the current site settings"
- "Update the site title to 'My Awesome Blog'"
- "Change the posts per page setting to 20"

**Comments:**
- "List all pending comments"
- "Approve comment ID 42"
- "Delete spam comments"

## Available Tools

The server provides 50+ tools for WordPress management:

### Posts (5 tools)
- `wordpress_list_posts`
- `wordpress_get_post`
- `wordpress_create_post`
- `wordpress_update_post`
- `wordpress_delete_post`

### Pages (5 tools)
- `wordpress_list_pages`
- `wordpress_get_page`
- `wordpress_create_page`
- `wordpress_update_page`
- `wordpress_delete_page`

### Users (5 tools)
- `wordpress_list_users`
- `wordpress_get_user`
- `wordpress_create_user`
- `wordpress_update_user`
- `wordpress_delete_user`

### Media (4 tools)
- `wordpress_list_media`
- `wordpress_get_media`
- `wordpress_update_media`
- `wordpress_delete_media`

### Categories (5 tools)
- `wordpress_list_categories`
- `wordpress_get_category`
- `wordpress_create_category`
- `wordpress_update_category`
- `wordpress_delete_category`

### Tags (5 tools)
- `wordpress_list_tags`
- `wordpress_get_tag`
- `wordpress_create_tag`
- `wordpress_update_tag`
- `wordpress_delete_tag`

### Comments (5 tools)
- `wordpress_list_comments`
- `wordpress_get_comment`
- `wordpress_create_comment`
- `wordpress_update_comment`
- `wordpress_delete_comment`

### Plugins (5 tools)
- `wordpress_list_plugins`
- `wordpress_get_plugin`
- `wordpress_activate_plugin`
- `wordpress_deactivate_plugin`
- `wordpress_delete_plugin`

### Themes (3 tools)
- `wordpress_list_themes`
- `wordpress_get_theme`
- `wordpress_activate_theme`

### Settings (2 tools)
- `wordpress_get_settings`
- `wordpress_update_settings`

### Menus (2 tools)
- `wordpress_list_menus`
- `wordpress_get_menu`

### Post Types & Taxonomies (4 tools)
- `wordpress_list_post_types`
- `wordpress_get_post_type`
- `wordpress_list_taxonomies`
- `wordpress_get_taxonomy`

## Security Considerations

1. **Use Application Passwords**: Never use your main WordPress password. Always create application-specific passwords.

2. **HTTPS Only**: Always use HTTPS for your WordPress site to encrypt credentials in transit.

3. **Permissions**: The MCP server will have the same permissions as the WordPress user account. Use an account with appropriate admin rights.

4. **Environment Variables**: Store credentials in environment variables or secure configuration files, never in code.

5. **Network Access**: Ensure your WordPress site's REST API is accessible from where Claude is running.

## Troubleshooting

### "WordPress credentials not configured" Error
- Ensure `WORDPRESS_URL`, `WORDPRESS_USERNAME`, and `WORDPRESS_PASSWORD` environment variables are set.

### Authentication Errors
- Verify you're using an Application Password, not your regular password
- Check that the username is correct
- Ensure the user has admin privileges

### "Plugin management requires WordPress 5.5+" Error
- Upgrade WordPress to 5.5 or later
- Some plugin/theme operations may require additional permissions

### "Menu management requires WP REST API Menus plugin" Error
- Install the "WP REST API Menus" plugin for menu management functionality

### REST API Not Available
- Check that WordPress REST API is enabled (default in WP 4.7+)
- Verify your site's permalink structure is not set to "Plain"
- Check for security plugins that might block REST API access

## Development

### Building
```bash
npm run build
```

### Watch Mode
```bash
npm run watch
```

### Running Directly
```bash
npm start
```

## WordPress REST API Reference

This MCP server uses the WordPress REST API v2. For more information:
- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [REST API Reference](https://developer.wordpress.org/rest-api/reference/)

## License

MIT

## Support

For issues, questions, or contributions, please visit the ezEdit repository.

## Version History

### 1.0.0 (2025)
- Initial release
- Full WordPress admin functionality
- Support for posts, pages, users, media, categories, tags, comments
- Plugin and theme management
- Settings and menu access
- Post types and taxonomies
