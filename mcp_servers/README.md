# FTP/SFTP MCP Server for EzEdit

This directory contains the FTP/SFTP MCP (Model Context Protocol) server that provides Claude Code with direct FTP/SFTP capabilities when working on the ezedit project.

## What is MCP?

MCP (Model Context Protocol) is a standard for connecting AI assistants like Claude to external tools and data sources. This FTP MCP server allows Claude to directly interact with FTP and SFTP servers during development.

## Installation

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configuration is already set up** in `.claude/settings.local.json`

3. **Restart Claude Code** to load the MCP server

## Available Tools

Once configured, Claude Code will have access to these FTP/SFTP tools:

### 1. `ftp_list_directory`
List files and directories on an FTP/SFTP server
- Supports both FTP and SFTP protocols
- Returns detailed file information (size, permissions, modified date)
- Output in Markdown or JSON format

### 2. `ftp_upload_file`
Upload files to an FTP/SFTP server
- 10MB file size limit
- Binary transfer support
- Connection pooling and reuse

### 3. `ftp_download_file`
Download files from an FTP/SFTP server
- 10MB file size limit
- Binary transfer support
- Automatic file size validation

### 4. `ftp_delete_file`
Delete files or directories on an FTP/SFTP server
- WARNING: Destructive operation
- Supports both files and directories
- Proper error handling for permissions

### 5. `ftp_create_directory`
Create directories on an FTP/SFTP server
- Automatically creates parent directories if needed
- Proper error handling
- Idempotent operation

### 6. `ftp_read_file`
Read file contents from an FTP/SFTP server
- Returns file content as text (no download needed)
- Supports configurable encoding (default: utf-8)
- 25KB size limit for safety
- Useful for viewing config files, logs, etc.

## Usage Examples

When working with Claude Code on ezedit, you can ask:

- "List all files in the /public_html directory on the FTP server at ftp.example.com"
- "Upload the index.html file to /public_html/ on the FTP server"
- "Download the config.php file from /wp-includes/ directory"
- "Create a new directory called 'backups' in /public_html/"
- "Read the contents of /etc/config.ini on the FTP server"

Claude will use the appropriate FTP MCP tool to perform these operations.

## Security Notes

- **Credentials**: Never commit FTP credentials to git
- **Connection Pooling**: Connections are reused and cached in memory
- **Timeouts**: 30-second default timeout for all operations
- **File Size Limits**: 10MB maximum to prevent memory issues

## Troubleshooting

### MCP Server Not Loading
1. Check that Python is installed and in PATH
2. Verify all dependencies are installed: `pip install -r requirements.txt`
3. Check Claude Code logs for MCP server errors
4. Restart Claude Code completely

### Connection Errors
- Verify FTP/SFTP server hostname and port
- Check username and password
- For SFTP, ensure SSH key file path is correct
- Check firewall settings allow FTP/SFTP connections

### Performance Issues
- Connection pooling reuses connections for better performance
- Keepalive commands prevent connection timeouts
- Consider network latency for remote servers

## Integration with EzEdit

This MCP server complements the existing FTP functionality in ezedit:
- **Application Level**: TypeScript code uses `basic-ftp` library
- **Development Level**: Claude Code uses this Python MCP server
- **Best of Both**: Application code and AI assistant both have FTP access

## Technical Details

- **Framework**: FastMCP (Model Context Protocol)
- **FTP Library**: Python's built-in `ftplib`
- **SFTP Library**: `paramiko` for SSH/SFTP
- **Validation**: Pydantic models for input validation
- **Error Handling**: Comprehensive error messages and retry logic
