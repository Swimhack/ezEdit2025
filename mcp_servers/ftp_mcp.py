#!/usr/bin/env python3
"""
FTP/SFTP MCP Server

This server provides tools to interact with FTP and SFTP servers for file transfer operations.
It supports reading, writing, listing, and deleting files on remote FTP/SFTP servers.

Features:
- Connect to FTP and SFTP servers
- Upload and download files
- List directory contents
- Delete files and directories
- Navigate directory structure
- Support for both FTP and SFTP protocols
"""

from typing import Optional, List, Dict, Any, Literal
from enum import Enum
from pathlib import Path
import io
import base64
import ftplib
import paramiko
from pydantic import BaseModel, Field, field_validator, ConfigDict
from mcp.server.fastmcp import FastMCP

# Initialize the MCP server
mcp = FastMCP("ftp_mcp")

# Constants
CHARACTER_LIMIT = 25000  # Maximum response size in characters
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB max file size for transfers

# Enums
class ProtocolType(str, Enum):
    """Supported file transfer protocols."""
    FTP = "ftp"
    SFTP = "sftp"

class ResponseFormat(str, Enum):
    """Output format for tool responses."""
    MARKDOWN = "markdown"
    JSON = "json"

# Active connections cache (simple in-memory cache)
_connections: Dict[str, Any] = {}

# ============================================================================
# Shared Utility Functions
# ============================================================================

def _get_connection_key(host: str, port: int, username: str, protocol: str) -> str:
    """Generate a unique key for connection caching."""
    return f"{protocol}://{username}@{host}:{port}"

def _normalize_path(path: str) -> str:
    """Normalize and validate a file path."""
    if not path:
        return "."
    # Remove trailing slashes except for root
    path = path.rstrip('/') or '/'
    # Normalize double slashes
    path = path.replace('//', '/')
    return path

def _ensure_directory_exists(ftp_or_sftp: Any, remote_path: str, protocol: ProtocolType) -> None:
    """Ensure parent directories exist before creating a file or directory."""
    import os
    parent_dir = os.path.dirname(remote_path)
    if not parent_dir or parent_dir == '/':
        return
    
    if protocol == ProtocolType.FTP:
        try:
            ftp_or_sftp.cwd(parent_dir)
        except:
            # Parent doesn't exist, try to create it recursively
            parts = parent_dir.strip('/').split('/')
            current_path = '/'
            for part in parts:
                if part:
                    current_path = os.path.join(current_path, part).replace('\\', '/')
                    try:
                        ftp_or_sftp.cwd(current_path)
                    except:
                        try:
                            ftp_or_sftp.mkd(current_path)
                            ftp_or_sftp.cwd(current_path)
                        except:
                            pass
    else:  # SFTP
        try:
            ftp_or_sftp.stat(parent_dir)
        except:
            # Parent doesn't exist, create it recursively
            parts = parent_dir.strip('/').split('/')
            current_path = '/'
            for part in parts:
                if part:
                    current_path = os.path.join(current_path, part).replace('\\', '/')
                    try:
                        ftp_or_sftp.stat(current_path)
                    except:
                        try:
                            ftp_or_sftp.mkdir(current_path)
                        except:
                            pass

def _format_file_size(size_bytes: int) -> str:
    """Convert bytes to human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

def _format_permissions(mode: int) -> str:
    """Convert numeric permissions to rwx format."""
    import stat
    perms = []
    # Permissions are in octal: rwxrwxrwx (user, group, other)
    # Each set of 3 bits represents read, write, execute
    for shift in [6, 3, 0]:  # User, Group, Other
        if mode & (stat.S_IRUSR >> shift):
            perms.append('r')
        else:
            perms.append('-')
        if mode & (stat.S_IWUSR >> shift):
            perms.append('w')
        else:
            perms.append('-')
        if mode & (stat.S_IXUSR >> shift):
            perms.append('x')
        else:
            perms.append('-')
    return ''.join(perms)

def _handle_error(e: Exception) -> str:
    """Consistent error formatting across all tools."""
    if isinstance(e, ftplib.error_perm):
        return f"Error: FTP permission denied - {str(e)}"
    elif isinstance(e, ftplib.error_temp):
        return f"Error: FTP temporary error - {str(e)}"
    elif isinstance(e, paramiko.AuthenticationException):
        return "Error: SFTP authentication failed. Check username and password."
    elif isinstance(e, paramiko.SSHException):
        return f"Error: SFTP connection error - {str(e)}"
    elif isinstance(e, FileNotFoundError):
        return f"Error: File or directory not found - {str(e)}"
    elif isinstance(e, PermissionError):
        return f"Error: Permission denied - {str(e)}"
    elif isinstance(e, TimeoutError):
        return "Error: Connection timeout. Please try again."
    return f"Error: {type(e).__name__} - {str(e)}"

# ============================================================================
# FTP Connection Management
# ============================================================================

def _connect_ftp(host: str, port: int, username: str, password: str, timeout: int = 30) -> ftplib.FTP:
    """Create and return an FTP connection."""
    conn_key = _get_connection_key(host, port, username, "ftp")

    # Check if connection exists and is alive
    if conn_key in _connections:
        try:
            _connections[conn_key].voidcmd("NOOP")
            return _connections[conn_key]
        except:
            del _connections[conn_key]

    # Create new connection
    ftp = ftplib.FTP()
    ftp.connect(host, port, timeout=timeout)
    ftp.login(username, password)
    _connections[conn_key] = ftp
    return ftp

# ============================================================================
# SFTP Connection Management
# ============================================================================

def _connect_sftp(host: str, port: int, username: str, password: Optional[str] = None, 
                  key_file: Optional[str] = None, timeout: int = 30) -> paramiko.SFTPClient:
    """Create and return an SFTP connection."""
    conn_key = _get_connection_key(host, port, username, "sftp")
    
    # Check if connection exists and is alive
    if conn_key in _connections:
        try:
            sftp_client = _connections[conn_key]
            sftp_client.listdir('.')  # Test connection
            return sftp_client
        except:
            try:
                # Close both SFTP client and underlying transport
                sftp_client.close()
                if hasattr(sftp_client, 'get_channel') and sftp_client.get_channel():
                    sftp_client.get_channel().get_transport().close()
            except:
                pass
            del _connections[conn_key]
    
    # Create new connection
    transport = paramiko.Transport((host, port))
    transport.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    transport.connect(timeout=timeout, username=username)
    
    if key_file:
        try:
            # Try RSA key first
            key = paramiko.RSAKey.from_private_key_file(key_file)
            transport.auth_publickey(username, key)
        except:
            try:
                # Try DSA key
                key = paramiko.DSSKey.from_private_key_file(key_file)
                transport.auth_publickey(username, key)
            except:
                try:
                    # Try ECDSA key
                    key = paramiko.ECDSAKey.from_private_key_file(key_file)
                    transport.auth_publickey(username, key)
                except:
                    # Try Ed25519 key
                    key = paramiko.Ed25519Key.from_private_key_file(key_file)
                    transport.auth_publickey(username, key)
    elif password:
        transport.auth_password(username, password)
    else:
        raise ValueError("Either password or key_file must be provided")
    
    sftp = paramiko.SFTPClient.from_transport(transport)
    _connections[conn_key] = sftp
    return sftp

# ============================================================================
# Pydantic Models for Input Validation
# ============================================================================

class ConnectionInput(BaseModel):
    """Input model for establishing FTP/SFTP connection."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )

    protocol: ProtocolType = Field(..., description="Protocol to use: 'ftp' or 'sftp'")
    host: str = Field(..., description="FTP/SFTP server hostname or IP address (e.g., 'ftp.example.com', '192.168.1.100')", min_length=1, max_length=255)
    port: int = Field(default=21, description="Server port (default: 21 for FTP, 22 for SFTP)", ge=1, le=65535)
    username: str = Field(..., description="Username for authentication", min_length=1, max_length=100)
    password: Optional[str] = Field(default=None, description="Password for authentication (required for FTP, optional for SFTP with key)", max_length=200)
    key_file: Optional[str] = Field(default=None, description="Path to SSH private key file for SFTP (alternative to password)", max_length=500)
    timeout: int = Field(default=30, description="Connection timeout in seconds", ge=5, le=300)

    @field_validator('port')
    @classmethod
    def validate_port(cls, v: int, info) -> int:
        protocol = info.data.get('protocol')
        if protocol == ProtocolType.FTP and v == 21:
            return v
        elif protocol == ProtocolType.SFTP and v == 22:
            return v
        return v

class ListDirectoryInput(BaseModel):
    """Input model for listing directory contents."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )

    protocol: ProtocolType = Field(..., description="Protocol: 'ftp' or 'sftp'")
    host: str = Field(..., description="Server hostname or IP address", min_length=1, max_length=255)
    port: int = Field(default=21, description="Server port", ge=1, le=65535)
    username: str = Field(..., description="Username", min_length=1, max_length=100)
    password: Optional[str] = Field(default=None, description="Password")
    key_file: Optional[str] = Field(default=None, description="SSH private key file path for SFTP")
    remote_path: str = Field(default=".", description="Directory path to list (default: current directory, e.g., '/home/user', './documents')")
    response_format: ResponseFormat = Field(default=ResponseFormat.MARKDOWN, description="Output format: 'markdown' or 'json'")

class UploadFileInput(BaseModel):
    """Input model for uploading files."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )

    protocol: ProtocolType = Field(..., description="Protocol: 'ftp' or 'sftp'")
    host: str = Field(..., description="Server hostname or IP address", min_length=1, max_length=255)
    port: int = Field(default=21, description="Server port", ge=1, le=65535)
    username: str = Field(..., description="Username", min_length=1, max_length=100)
    password: Optional[str] = Field(default=None, description="Password")
    key_file: Optional[str] = Field(default=None, description="SSH private key file path for SFTP")
    local_path: str = Field(..., description="Local file path to upload (e.g., '/home/user/document.pdf', './report.txt')", min_length=1, max_length=1000)
    remote_path: str = Field(..., description="Remote destination path (e.g., '/uploads/document.pdf', './files/report.txt')", min_length=1, max_length=1000)

class DownloadFileInput(BaseModel):
    """Input model for downloading files."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )

    protocol: ProtocolType = Field(..., description="Protocol: 'ftp' or 'sftp'")
    host: str = Field(..., description="Server hostname or IP address", min_length=1, max_length=255)
    port: int = Field(default=21, description="Server port", ge=1, le=65535)
    username: str = Field(..., description="Username", min_length=1, max_length=100)
    password: Optional[str] = Field(default=None, description="Password")
    key_file: Optional[str] = Field(default=None, description="SSH private key file path for SFTP")
    remote_path: str = Field(..., description="Remote file path to download (e.g., '/data/file.txt', './documents/report.pdf')", min_length=1, max_length=1000)
    local_path: str = Field(..., description="Local destination path (e.g., '/home/user/downloads/file.txt', './file.txt')", min_length=1, max_length=1000)

class DeleteFileInput(BaseModel):
    """Input model for deleting files or directories."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )

    protocol: ProtocolType = Field(..., description="Protocol: 'ftp' or 'sftp'")
    host: str = Field(..., description="Server hostname or IP address", min_length=1, max_length=255)
    port: int = Field(default=21, description="Server port", ge=1, le=65535)
    username: str = Field(..., description="Username", min_length=1, max_length=100)
    password: Optional[str] = Field(default=None, description="Password")
    key_file: Optional[str] = Field(default=None, description="SSH private key file path for SFTP")
    remote_path: str = Field(..., description="Remote file or directory path to delete (e.g., '/tmp/oldfile.txt', './backup/')", min_length=1, max_length=1000)
    is_directory: bool = Field(default=False, description="Set to true if deleting a directory")

class CreateDirectoryInput(BaseModel):
    """Input model for creating directories."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )
    
    protocol: ProtocolType = Field(..., description="Protocol: 'ftp' or 'sftp'")
    host: str = Field(..., description="Server hostname or IP address", min_length=1, max_length=255)
    port: int = Field(default=21, description="Server port", ge=1, le=65535)
    username: str = Field(..., description="Username", min_length=1, max_length=100)
    password: Optional[str] = Field(default=None, description="Password")
    key_file: Optional[str] = Field(default=None, description="SSH private key file path for SFTP")
    remote_path: str = Field(..., description="Directory path to create (e.g., '/data/new_folder', './projects/project1')", min_length=1, max_length=1000)

class ReadFileInput(BaseModel):
    """Input model for reading file contents."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )
    
    protocol: ProtocolType = Field(..., description="Protocol: 'ftp' or 'sftp'")
    host: str = Field(..., description="Server hostname or IP address", min_length=1, max_length=255)
    port: int = Field(default=21, description="Server port", ge=1, le=65535)
    username: str = Field(..., description="Username", min_length=1, max_length=100)
    password: Optional[str] = Field(default=None, description="Password")
    key_file: Optional[str] = Field(default=None, description="SSH private key file path for SFTP")
    remote_path: str = Field(..., description="Remote file path to read (e.g., '/data/file.txt', './documents/report.txt')", min_length=1, max_length=1000)
    encoding: str = Field(default="utf-8", description="File encoding (default: utf-8)")
    max_size: int = Field(default=CHARACTER_LIMIT, description="Maximum file size to read in bytes", ge=1, le=CHARACTER_LIMIT)

# ============================================================================
# Tool Definitions
# ============================================================================

@mcp.tool(
    name="ftp_list_directory",
    annotations={
        "title": "List FTP/SFTP Directory",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def ftp_list_directory(params: ListDirectoryInput) -> str:
    """
    List contents of a directory on an FTP or SFTP server.

    This tool connects to an FTP or SFTP server and retrieves a listing of files
    and directories at the specified path. It returns detailed information including
    file sizes, permissions, and modification times.

    Args:
        params (ListDirectoryInput): Validated input parameters containing:
            - protocol (ProtocolType): 'ftp' or 'sftp'
            - host (str): Server hostname or IP
            - port (int): Server port (default: 21 for FTP, 22 for SFTP)
            - username (str): Authentication username
            - password (Optional[str]): Authentication password
            - key_file (Optional[str]): SSH key file for SFTP
            - remote_path (str): Directory path to list
            - response_format (ResponseFormat): 'markdown' or 'json'

    Returns:
        str: Formatted directory listing in either Markdown or JSON format

        Markdown format shows a table with: Name, Type, Size, Permissions, Modified
        JSON format returns structured data with complete file attributes

    Examples:
        - Use when: "List all files in /home/user/documents on ftp.example.com"
        - Use when: "Show me what's in the uploads directory on the SFTP server"
        - Don't use when: You want to download files (use ftp_download_file)
        - Don't use when: You need to upload files (use ftp_upload_file)

    Error Handling:
        - Returns "Error: FTP permission denied" if lacking directory read permissions
        - Returns "Error: SFTP authentication failed" if credentials are invalid
        - Returns "Error: File or directory not found" if path doesn't exist
        - Input validation handled by Pydantic model
    """
    try:
        if params.protocol == ProtocolType.FTP:
            ftp = _connect_ftp(params.host, params.port, params.username, params.password or "")

            # List directory
            files = []
            ftp.cwd(params.remote_path)

            # Get detailed listing
            lines = []
            ftp.dir(lines.append)

            for line in lines:
                parts = line.split(None, 8)
                if len(parts) >= 9:
                    perms = parts[0]
                    size = parts[4] if parts[4].isdigit() else "0"
                    name = parts[8]
                    is_dir = perms.startswith('d')

                    files.append({
                        "name": name,
                        "type": "directory" if is_dir else "file",
                        "size": int(size),
                        "permissions": perms,
                        "modified": " ".join(parts[5:8])
                    })

        else:  # SFTP
            sftp = _connect_sftp(params.host, params.port, params.username, params.password, params.key_file)

            files = []
            for attr in sftp.listdir_attr(params.remote_path):
                import stat
                is_dir = stat.S_ISDIR(attr.st_mode) if attr.st_mode else False

                files.append({
                    "name": attr.filename,
                    "type": "directory" if is_dir else "file",
                    "size": attr.st_size or 0,
                    "permissions": _format_permissions(attr.st_mode) if attr.st_mode else "unknown",
                    "modified": str(attr.st_mtime) if attr.st_mtime else "unknown"
                })

        if not files:
            return f"Directory '{params.remote_path}' is empty"

        # Format response
        if params.response_format == ResponseFormat.MARKDOWN:
            lines = [f"# Directory Listing: {params.remote_path}", ""]
            lines.append(f"Found {len(files)} items")
            lines.append("")
            lines.append("| Name | Type | Size | Permissions | Modified |")
            lines.append("|------|------|------|-------------|----------|")

            for f in files:
                size_str = _format_file_size(f["size"]) if f["type"] == "file" else "-"
                lines.append(f"| {f['name']} | {f['type']} | {size_str} | {f['permissions']} | {f['modified']} |")

            return "\n".join(lines)

        else:  # JSON
            import json
            response = {
                "path": params.remote_path,
                "count": len(files),
                "items": files
            }
            return json.dumps(response, indent=2)

    except Exception as e:
        return _handle_error(e)

@mcp.tool(
    name="ftp_upload_file",
    annotations={
        "title": "Upload File via FTP/SFTP",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True
    }
)
async def ftp_upload_file(params: UploadFileInput) -> str:
    """
    Upload a file to an FTP or SFTP server.

    This tool reads a local file and uploads it to a remote FTP/SFTP server at the
    specified destination path. It supports both ASCII and binary transfer modes.

    Args:
        params (UploadFileInput): Validated input parameters containing:
            - protocol (ProtocolType): 'ftp' or 'sftp'
            - host (str): Server hostname or IP
            - port (int): Server port
            - username (str): Authentication username
            - password (Optional[str]): Authentication password
            - key_file (Optional[str]): SSH key file for SFTP
            - local_path (str): Local file path to upload
            - remote_path (str): Remote destination path

    Returns:
        str: Success message with file details or error message

    Examples:
        - Use when: "Upload report.pdf to /documents/ on the FTP server"
        - Use when: "Transfer backup.zip to the remote server at /backups/backup.zip"
        - Don't use when: You want to download files (use ftp_download_file)
        - Don't use when: The file doesn't exist locally

    Error Handling:
        - Returns "Error: File or directory not found" if local file doesn't exist
        - Returns "Error: FTP permission denied" if lacking write permissions
        - Returns "Error: SFTP authentication failed" if credentials invalid
        - File size checked against MAX_FILE_SIZE limit
    """
    try:
        # Check local file exists and size
        local_file = Path(params.local_path)
        if not local_file.exists():
            return f"Error: Local file not found: {params.local_path}"

        file_size = local_file.stat().st_size
        if file_size > MAX_FILE_SIZE:
            return f"Error: File size ({_format_file_size(file_size)}) exceeds maximum allowed size ({_format_file_size(MAX_FILE_SIZE)})"

        remote_path = _normalize_path(params.remote_path)

        if params.protocol == ProtocolType.FTP:
            ftp = _connect_ftp(params.host, params.port, params.username, params.password or "")
            
            # Ensure parent directory exists
            _ensure_directory_exists(ftp, remote_path, ProtocolType.FTP)

            with open(params.local_path, 'rb') as f:
                ftp.storbinary(f'STOR {remote_path}', f)

        else:  # SFTP
            sftp = _connect_sftp(params.host, params.port, params.username, params.password, params.key_file)
            
            # Ensure parent directory exists
            _ensure_directory_exists(sftp, remote_path, ProtocolType.SFTP)
            
            sftp.put(params.local_path, remote_path)
        
        return f"Successfully uploaded {local_file.name} ({_format_file_size(file_size)}) to {remote_path}"

    except Exception as e:
        return _handle_error(e)

@mcp.tool(
    name="ftp_download_file",
    annotations={
        "title": "Download File via FTP/SFTP",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True
    }
)
async def ftp_download_file(params: DownloadFileInput) -> str:
    """
    Download a file from an FTP or SFTP server.

    This tool retrieves a file from a remote FTP/SFTP server and saves it to
    a local path. It supports binary file transfers.

    Args:
        params (DownloadFileInput): Validated input parameters containing:
            - protocol (ProtocolType): 'ftp' or 'sftp'
            - host (str): Server hostname or IP
            - port (int): Server port
            - username (str): Authentication username
            - password (Optional[str]): Authentication password
            - key_file (Optional[str]): SSH key file for SFTP
            - remote_path (str): Remote file path to download
            - local_path (str): Local destination path

    Returns:
        str: Success message with file details or error message

    Examples:
        - Use when: "Download backup.sql from /backups/ on the FTP server"
        - Use when: "Get the latest report.pdf from /reports/ directory"
        - Don't use when: You want to upload files (use ftp_upload_file)
        - Don't use when: Remote file doesn't exist

    Error Handling:
        - Returns "Error: File or directory not found" if remote file doesn't exist
        - Returns "Error: FTP permission denied" if lacking read permissions
        - Returns "Error: Permission denied" if can't write to local path
        - File size checked against MAX_FILE_SIZE limit
    """
    try:
        if params.protocol == ProtocolType.FTP:
            ftp = _connect_ftp(params.host, params.port, params.username, params.password or "")

            # Get file size
            file_size = ftp.size(params.remote_path)
            if file_size and file_size > MAX_FILE_SIZE:
                return f"Error: Remote file size ({_format_file_size(file_size)}) exceeds maximum allowed size ({_format_file_size(MAX_FILE_SIZE)})"

            with open(params.local_path, 'wb') as f:
                ftp.retrbinary(f'RETR {params.remote_path}', f.write)

        else:  # SFTP
            sftp = _connect_sftp(params.host, params.port, params.username, params.password, params.key_file)

            # Get file size
            attr = sftp.stat(params.remote_path)
            if attr.st_size and attr.st_size > MAX_FILE_SIZE:
                return f"Error: Remote file size ({_format_file_size(attr.st_size)}) exceeds maximum allowed size ({_format_file_size(MAX_FILE_SIZE)})"

            sftp.get(params.remote_path, params.local_path)

        local_file = Path(params.local_path)
        file_size = local_file.stat().st_size

        return f"Successfully downloaded {local_file.name} ({_format_file_size(file_size)}) to {params.local_path}"

    except Exception as e:
        return _handle_error(e)

@mcp.tool(
    name="ftp_delete_file",
    annotations={
        "title": "Delete File/Directory via FTP/SFTP",
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def ftp_delete_file(params: DeleteFileInput) -> str:
    """
    Delete a file or directory on an FTP or SFTP server.

    This tool removes files or directories from a remote FTP/SFTP server.
    WARNING: This operation is destructive and cannot be undone.

    Args:
        params (DeleteFileInput): Validated input parameters containing:
            - protocol (ProtocolType): 'ftp' or 'sftp'
            - host (str): Server hostname or IP
            - port (int): Server port
            - username (str): Authentication username
            - password (Optional[str]): Authentication password
            - key_file (Optional[str]): SSH key file for SFTP
            - remote_path (str): Remote file or directory path to delete
            - is_directory (bool): True if deleting a directory

    Returns:
        str: Success message or error message

    Examples:
        - Use when: "Delete old_backup.zip from /backups/ directory"
        - Use when: "Remove the temporary folder /tmp/upload"
        - Don't use when: You're not certain the file should be deleted
        - Don't use when: You don't have proper permissions

    Error Handling:
        - Returns "Error: File or directory not found" if path doesn't exist
        - Returns "Error: FTP permission denied" if lacking delete permissions
        - Returns "Error: SFTP authentication failed" if credentials invalid
        - Directories must be empty before deletion (FTP) or use recursive (SFTP)
    """
    try:
        if params.protocol == ProtocolType.FTP:
            ftp = _connect_ftp(params.host, params.port, params.username, params.password or "")

            if params.is_directory:
                ftp.rmd(params.remote_path)
            else:
                ftp.delete(params.remote_path)

        else:  # SFTP
            sftp = _connect_sftp(params.host, params.port, params.username, params.password, params.key_file)

            if params.is_directory:
                # Remove directory (must be empty)
                sftp.rmdir(params.remote_path)
            else:
                sftp.remove(params.remote_path)

        item_type = "directory" if params.is_directory else "file"
        return f"Successfully deleted {item_type}: {params.remote_path}"

    except Exception as e:
        return _handle_error(e)

@mcp.tool(
    name="ftp_create_directory",
    annotations={
        "title": "Create Directory via FTP/SFTP",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def ftp_create_directory(params: CreateDirectoryInput) -> str:
    """
    Create a new directory on an FTP or SFTP server.

    This tool creates a new directory at the specified path on a remote FTP/SFTP server.
    Parent directories must already exist.

    Args:
        params (CreateDirectoryInput): Validated input parameters containing:
            - protocol (ProtocolType): 'ftp' or 'sftp'
            - host (str): Server hostname or IP
            - port (int): Server port
            - username (str): Authentication username
            - password (Optional[str]): Authentication password
            - key_file (Optional[str]): SSH key file for SFTP
            - remote_path (str): Directory path to create

    Returns:
        str: Success message or error message

    Examples:
        - Use when: "Create a new folder called 'uploads' in /home/user/"
        - Use when: "Make a directory /backups/2024/ on the server"
        - Don't use when: Parent directories don't exist (create them first)
        - Don't use when: Directory already exists

    Error Handling:
        - Returns "Error: FTP permission denied" if lacking write permissions
        - Returns "Error: File or directory not found" if parent doesn't exist
        - Returns error if directory already exists
        - Input validation handled by Pydantic model
    """
    try:
        remote_path = _normalize_path(params.remote_path)
        
        if params.protocol == ProtocolType.FTP:
            ftp = _connect_ftp(params.host, params.port, params.username, params.password or "")
            
            # Ensure parent directory exists
            _ensure_directory_exists(ftp, remote_path, ProtocolType.FTP)
            
            ftp.mkd(remote_path)
        
        else:  # SFTP
            sftp = _connect_sftp(params.host, params.port, params.username, params.password, params.key_file)
            
            # Ensure parent directory exists
            _ensure_directory_exists(sftp, remote_path, ProtocolType.SFTP)
            
            sftp.mkdir(remote_path)
        
        return f"Successfully created directory: {remote_path}"
    
    except Exception as e:
        return _handle_error(e)

@mcp.tool(
    name="ftp_read_file",
    annotations={
        "title": "Read File Content via FTP/SFTP",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def ftp_read_file(params: ReadFileInput) -> str:
    """
    Read the contents of a file from an FTP or SFTP server.
    
    This tool retrieves and returns the text content of a remote file. It's useful
    for viewing configuration files, logs, or any text-based files without downloading them.
    
    Args:
        params (ReadFileInput): Validated input parameters containing:
            - protocol (ProtocolType): 'ftp' or 'sftp'
            - host (str): Server hostname or IP
            - port (int): Server port
            - username (str): Authentication username
            - password (Optional[str]): Authentication password
            - key_file (Optional[str]): SSH key file for SFTP
            - remote_path (str): Remote file path to read
            - encoding (str): File encoding (default: utf-8)
            - max_size (int): Maximum file size to read (default: 25000 bytes)
    
    Returns:
        str: File contents as text, or error message
        
    Examples:
        - Use when: "Read the contents of /etc/config.ini on the FTP server"
        - Use when: "Show me what's in /var/log/app.log"
        - Don't use when: File is binary or larger than max_size
        - Don't use when: You want to download the file (use ftp_download_file)
    
    Error Handling:
        - Returns "Error: File or directory not found" if file doesn't exist
        - Returns "Error: File too large" if file exceeds max_size
        - Returns "Error: FTP permission denied" if lacking read permissions
        - Returns encoding errors if file can't be decoded
    """
    try:
        if params.protocol == ProtocolType.FTP:
            ftp = _connect_ftp(params.host, params.port, params.username, params.password or "")
            
            # Get file size first
            try:
                file_size = ftp.size(params.remote_path)
                if file_size and file_size > params.max_size:
                    return f"Error: File size ({_format_file_size(file_size)}) exceeds maximum allowed size ({_format_file_size(params.max_size)})"
            except:
                # Some FTP servers don't support SIZE command
                pass
            
            # Read file content
            content = io.BytesIO()
            ftp.retrbinary(f'RETR {params.remote_path}', content.write)
            file_data = content.getvalue()
            
            if len(file_data) > params.max_size:
                return f"Error: File size ({_format_file_size(len(file_data))}) exceeds maximum allowed size ({_format_file_size(params.max_size)})"
            
            # Decode content
            try:
                text_content = file_data.decode(params.encoding)
            except UnicodeDecodeError:
                return f"Error: Unable to decode file as {params.encoding}. File may be binary."
            
            return text_content
        
        else:  # SFTP
            sftp = _connect_sftp(params.host, params.port, params.username, params.password, params.key_file)
            
            # Get file size
            attr = sftp.stat(params.remote_path)
            if attr.st_size and attr.st_size > params.max_size:
                return f"Error: File size ({_format_file_size(attr.st_size)}) exceeds maximum allowed size ({_format_file_size(params.max_size)})"
            
            # Read file content
            with sftp.open(params.remote_path, 'r') as f:
                file_data = f.read(params.max_size)
            
            if len(file_data) > params.max_size:
                return f"Error: File size ({_format_file_size(len(file_data))}) exceeds maximum allowed size ({_format_file_size(params.max_size)})"
            
            # Decode content
            try:
                if isinstance(file_data, bytes):
                    text_content = file_data.decode(params.encoding)
                else:
                    text_content = file_data
            except UnicodeDecodeError:
                return f"Error: Unable to decode file as {params.encoding}. File may be binary."
            
            return text_content
    
    except Exception as e:
        return _handle_error(e)

if __name__ == "__main__":
    mcp.run()
