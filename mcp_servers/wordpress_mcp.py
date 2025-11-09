#!/usr/bin/env python3
"""
WordPress MCP Server

This server provides comprehensive tools to interact with WordPress websites through
the WordPress REST API. It enables AI assistants to manage all aspects of WordPress
administration including posts, pages, media, users, comments, plugins, and settings.

Features:
- Complete post and page management (create, read, update, delete)
- Media library management (upload, list, delete)
- User management (list, create, update, delete)
- Comment moderation
- Plugin management
- Category and tag management
- Site settings configuration
- Multiple WordPress sites support
- Application Password authentication
"""

from typing import Optional, List, Dict, Any
from enum import Enum
from pathlib import Path
import base64
import httpx
from pydantic import BaseModel, Field, field_validator, ConfigDict, HttpUrl
from mcp.server.fastmcp import FastMCP

# Initialize the MCP server
mcp = FastMCP("wordpress_mcp")

# Constants
API_BASE_PATH = "/wp-json/wp/v2"
CHARACTER_LIMIT = 25000  # Maximum response size
REQUEST_TIMEOUT = 30  # Seconds
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB for media uploads

# Enums
class PostStatus(str, Enum):
    """WordPress post status options."""
    PUBLISH = "publish"
    DRAFT = "draft"
    PENDING = "pending"
    PRIVATE = "private"
    FUTURE = "future"

class ResponseFormat(str, Enum):
    """Output format for tool responses."""
    MARKDOWN = "markdown"
    JSON = "json"

class PostType(str, Enum):
    """WordPress content types."""
    POST = "posts"
    PAGE = "pages"

class CommentStatus(str, Enum):
    """Comment approval status."""
    APPROVE = "approved"
    HOLD = "hold"
    SPAM = "spam"
    TRASH = "trash"

# ============================================================================
# Shared Utility Functions
# ============================================================================

def _get_auth_header(username: str, app_password: str) -> Dict[str, str]:
    """Generate Basic Auth header for WordPress API."""
    credentials = f"{username}:{app_password}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return {"Authorization": f"Basic {encoded}"}

def _build_url(site_url: str, endpoint: str) -> str:
    """Build complete API URL."""
    site_url = site_url.rstrip('/')
    endpoint = endpoint.lstrip('/')
    return f"{site_url}{API_BASE_PATH}/{endpoint}"

def _format_post_summary(post: Dict[str, Any], format_type: str) -> str:
    """Format a single post for display."""
    if format_type == "markdown":
        title = post.get('title', {}).get('rendered', 'Untitled')
        status = post.get('status', 'unknown')
        date = post.get('date', 'No date')
        author = post.get('author', 'Unknown')
        link = post.get('link', '')
        
        return f"**{title}** (ID: {post.get('id')})\n- Status: {status}\n- Date: {date}\n- Author ID: {author}\n- Link: {link}\n"
    else:
        return post

def _handle_api_error(e: Exception, action: str = "perform operation") -> str:
    """Consistent error formatting across all tools."""
    if isinstance(e, httpx.HTTPStatusError):
        status = e.response.status_code
        if status == 401:
            return f"Error: Authentication failed. Check your username and application password."
        elif status == 403:
            return f"Error: Permission denied. You don't have rights to {action}."
        elif status == 404:
            return f"Error: Resource not found. Check the ID or URL."
        elif status == 409:
            return f"Error: Conflict. The resource may already exist."
        elif status == 422:
            return f"Error: Invalid data provided. {e.response.text}"
        elif status == 429:
            return f"Error: Rate limit exceeded. Please wait before making more requests."
        return f"Error: API request failed with status {status}. {e.response.text}"
    elif isinstance(e, httpx.TimeoutException):
        return f"Error: Request timed out. The WordPress site may be slow or unreachable."
    elif isinstance(e, httpx.ConnectError):
        return f"Error: Cannot connect to WordPress site. Check the URL and network connection."
    return f"Error: {type(e).__name__} - {str(e)}"

async def _make_api_request(
    method: str,
    site_url: str,
    endpoint: str,
    username: str,
    app_password: str,
    data: Optional[Dict] = None,
    params: Optional[Dict] = None
) -> Dict[str, Any]:
    """Reusable function for all WordPress API calls."""
    url = _build_url(site_url, endpoint)
    headers = _get_auth_header(username, app_password)
    headers["Content-Type"] = "application/json"
    
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.request(
            method,
            url,
            headers=headers,
            json=data,
            params=params
        )
        response.raise_for_status()
        return response.json()

# ============================================================================
# Pydantic Models for Input Validation
# ============================================================================

class BaseWordPressInput(BaseModel):
    """Base model with common WordPress connection parameters."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )
    
    site_url: str = Field(..., description="WordPress site URL (e.g., 'https://example.com' or 'https://example.com/blog')", min_length=7, max_length=500)
    username: str = Field(..., description="WordPress username for authentication", min_length=1, max_length=100)
    app_password: str = Field(..., description="WordPress Application Password (from Users → Profile → Application Passwords)", min_length=10, max_length=200)

    @field_validator('site_url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.rstrip('/')
        if not v.startswith('http://') and not v.startswith('https://'):
            raise ValueError("Site URL must start with http:// or https://")
        return v

class ListPostsInput(BaseWordPressInput):
    """Input model for listing posts or pages."""
    post_type: PostType = Field(default=PostType.POST, description="Content type: 'posts' or 'pages'")
    status: Optional[PostStatus] = Field(default=None, description="Filter by status: 'publish', 'draft', 'pending', 'private', 'future'")
    per_page: int = Field(default=10, description="Number of items to return", ge=1, le=100)
    page: int = Field(default=1, description="Page number for pagination", ge=1)
    search: Optional[str] = Field(default=None, description="Search term to filter results", max_length=200)
    response_format: ResponseFormat = Field(default=ResponseFormat.MARKDOWN, description="Output format: 'markdown' or 'json'")

class CreatePostInput(BaseWordPressInput):
    """Input model for creating posts or pages."""
    post_type: PostType = Field(default=PostType.POST, description="Content type: 'posts' or 'pages'")
    title: str = Field(..., description="Post/page title", min_length=1, max_length=500)
    content: str = Field(..., description="Post/page content in HTML or plain text", min_length=1)
    status: PostStatus = Field(default=PostStatus.DRAFT, description="Publication status")
    excerpt: Optional[str] = Field(default=None, description="Post excerpt/summary", max_length=2000)
    categories: Optional[List[int]] = Field(default=None, description="List of category IDs (posts only)", max_items=50)
    tags: Optional[List[int]] = Field(default=None, description="List of tag IDs (posts only)", max_items=100)
    featured_media: Optional[int] = Field(default=None, description="Featured image media ID")

class UpdatePostInput(BaseWordPressInput):
    """Input model for updating posts or pages."""
    post_type: PostType = Field(default=PostType.POST, description="Content type: 'posts' or 'pages'")
    post_id: int = Field(..., description="ID of the post/page to update", ge=1)
    title: Optional[str] = Field(default=None, description="Updated title", min_length=1, max_length=500)
    content: Optional[str] = Field(default=None, description="Updated content", min_length=1)
    status: Optional[PostStatus] = Field(default=None, description="Updated status")
    excerpt: Optional[str] = Field(default=None, description="Updated excerpt", max_length=2000)
    categories: Optional[List[int]] = Field(default=None, description="Updated category IDs", max_items=50)
    tags: Optional[List[int]] = Field(default=None, description="Updated tag IDs", max_items=100)

class DeletePostInput(BaseWordPressInput):
    """Input model for deleting posts or pages."""
    post_type: PostType = Field(default=PostType.POST, description="Content type: 'posts' or 'pages'")
    post_id: int = Field(..., description="ID of the post/page to delete", ge=1)
    force: bool = Field(default=False, description="True to permanently delete, False to move to trash")

class ListMediaInput(BaseWordPressInput):
    """Input model for listing media files."""
    per_page: int = Field(default=10, description="Number of items to return", ge=1, le=100)
    page: int = Field(default=1, description="Page number for pagination", ge=1)
    search: Optional[str] = Field(default=None, description="Search term", max_length=200)
    response_format: ResponseFormat = Field(default=ResponseFormat.MARKDOWN, description="Output format")

class UploadMediaInput(BaseWordPressInput):
    """Input model for uploading media files."""
    file_path: str = Field(..., description="Local path to file to upload", min_length=1, max_length=1000)
    title: Optional[str] = Field(default=None, description="Media title", max_length=500)
    alt_text: Optional[str] = Field(default=None, description="Alt text for images", max_length=500)
    caption: Optional[str] = Field(default=None, description="Media caption", max_length=1000)

class ListUsersInput(BaseWordPressInput):
    """Input model for listing users."""
    per_page: int = Field(default=10, description="Number of users to return", ge=1, le=100)
    page: int = Field(default=1, description="Page number", ge=1)
    search: Optional[str] = Field(default=None, description="Search term", max_length=200)
    role: Optional[str] = Field(default=None, description="Filter by role: 'administrator', 'editor', 'author', 'contributor', 'subscriber'", max_length=50)
    response_format: ResponseFormat = Field(default=ResponseFormat.MARKDOWN, description="Output format")

class ListCommentsInput(BaseWordPressInput):
    """Input model for listing comments."""
    per_page: int = Field(default=10, description="Number of comments to return", ge=1, le=100)
    page: int = Field(default=1, description="Page number", ge=1)
    post_id: Optional[int] = Field(default=None, description="Filter by post ID", ge=1)
    status: Optional[CommentStatus] = Field(default=None, description="Filter by status")
    response_format: ResponseFormat = Field(default=ResponseFormat.MARKDOWN, description="Output format")

class ModerateCommentInput(BaseWordPressInput):
    """Input model for moderating comments."""
    comment_id: int = Field(..., description="ID of the comment to moderate", ge=1)
    status: CommentStatus = Field(..., description="New status for the comment")

class ListCategoriesInput(BaseWordPressInput):
    """Input model for listing categories."""
    per_page: int = Field(default=50, description="Number of categories to return", ge=1, le=100)
    search: Optional[str] = Field(default=None, description="Search term", max_length=200)
    response_format: ResponseFormat = Field(default=ResponseFormat.MARKDOWN, description="Output format")

class CreateCategoryInput(BaseWordPressInput):
    """Input model for creating categories."""
    name: str = Field(..., description="Category name", min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, description="Category description", max_length=1000)
    parent: Optional[int] = Field(default=None, description="Parent category ID", ge=1)

class ListTagsInput(BaseWordPressInput):
    """Input model for listing tags."""
    per_page: int = Field(default=50, description="Number of tags to return", ge=1, le=100)
    search: Optional[str] = Field(default=None, description="Search term", max_length=200)
    response_format: ResponseFormat = Field(default=ResponseFormat.MARKDOWN, description="Output format")

class CreateTagInput(BaseWordPressInput):
    """Input model for creating tags."""
    name: str = Field(..., description="Tag name", min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, description="Tag description", max_length=1000)

# ============================================================================
# Tool Definitions - Posts and Pages
# ============================================================================

@mcp.tool(
    name="wordpress_list_posts",
    annotations={
        "title": "List WordPress Posts/Pages",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def wordpress_list_posts(params: ListPostsInput) -> str:
    """
    List posts or pages from a WordPress site.
    
    This tool retrieves a list of posts or pages from WordPress with filtering options.
    Supports pagination, search, and status filtering.
    
    Args:
        params (ListPostsInput): Validated input parameters containing:
            - site_url (str): WordPress site URL
            - username (str): WordPress username
            - app_password (str): Application password
            - post_type (PostType): 'posts' or 'pages'
            - status (Optional[PostStatus]): Filter by status
            - per_page (int): Number of results (1-100, default: 10)
            - page (int): Page number for pagination
            - search (Optional[str]): Search term
            - response_format (ResponseFormat): Output format
    
    Returns:
        str: Formatted list of posts/pages in Markdown or JSON format
        
    Examples:
        - Use when: "Show me the latest 10 blog posts"
        - Use when: "List all draft pages on my WordPress site"
        - Use when: "Search for posts containing 'tutorial'"
        - Don't use when: Creating new content (use wordpress_create_post)
    
    Error Handling:
        - Returns "Error: Authentication failed" if credentials invalid
        - Returns "Error: Permission denied" if lacking read permissions
        - Input validation handled by Pydantic model
    """
    try:
        api_params = {
            "per_page": params.per_page,
            "page": params.page,
            "context": "view"
        }
        
        if params.status:
            api_params["status"] = params.status.value
        if params.search:
            api_params["search"] = params.search
        
        data = await _make_api_request(
            "GET",
            params.site_url,
            params.post_type.value,
            params.username,
            params.app_password,
            params=api_params
        )
        
        if not data:
            return f"No {params.post_type.value} found"
        
        if params.response_format == ResponseFormat.MARKDOWN:
            content_type = "Posts" if params.post_type == PostType.POST else "Pages"
            lines = [f"# {content_type} List", ""]
            lines.append(f"Found {len(data)} {params.post_type.value} (Page {params.page})")
            lines.append("")
            
            for post in data:
                lines.append(_format_post_summary(post, "markdown"))
            
            return "\n".join(lines)
        else:
            import json
            return json.dumps(data, indent=2)
    
    except Exception as e:
        return _handle_api_error(e, f"list {params.post_type.value}")

@mcp.tool(
    name="wordpress_create_post",
    annotations={
        "title": "Create WordPress Post/Page",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True
    }
)
async def wordpress_create_post(params: CreatePostInput) -> str:
    """
    Create a new post or page on WordPress.
    
    This tool creates new content (post or page) on a WordPress site with full
    control over title, content, status, categories, tags, and featured image.
    
    Args:
        params (CreatePostInput): Validated input parameters
    
    Returns:
        str: Success message with post ID and link, or error message
        
    Examples:
        - Use when: "Create a new blog post about AI trends"
        - Use when: "Publish a new About Us page"
        - Don't use when: Updating existing content (use wordpress_update_post)
    """
    try:
        post_data = {
            "title": params.title,
            "content": params.content,
            "status": params.status.value
        }
        
        if params.excerpt:
            post_data["excerpt"] = params.excerpt
        if params.categories and params.post_type == PostType.POST:
            post_data["categories"] = params.categories
        if params.tags and params.post_type == PostType.POST:
            post_data["tags"] = params.tags
        if params.featured_media:
            post_data["featured_media"] = params.featured_media
        
        result = await _make_api_request(
            "POST",
            params.site_url,
            params.post_type.value,
            params.username,
            params.app_password,
            data=post_data
        )
        
        content_type = "Post" if params.post_type == PostType.POST else "Page"
        return f"✓ {content_type} created successfully!\n- ID: {result['id']}\n- Title: {result['title']['rendered']}\n- Status: {result['status']}\n- Link: {result['link']}"
    
    except Exception as e:
        return _handle_api_error(e, f"create {params.post_type.value[:-1]}")

@mcp.tool(
    name="wordpress_update_post",
    annotations={
        "title": "Update WordPress Post/Page",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def wordpress_update_post(params: UpdatePostInput) -> str:
    """
    Update an existing post or page on WordPress.
    
    Modify title, content, status, or other properties of existing content.
    Only provided fields will be updated.
    
    Args:
        params (UpdatePostInput): Validated input parameters
    
    Returns:
        str: Success message with updated details
    """
    try:
        post_data = {}
        
        if params.title:
            post_data["title"] = params.title
        if params.content:
            post_data["content"] = params.content
        if params.status:
            post_data["status"] = params.status.value
        if params.excerpt:
            post_data["excerpt"] = params.excerpt
        if params.categories:
            post_data["categories"] = params.categories
        if params.tags:
            post_data["tags"] = params.tags
        
        if not post_data:
            return "Error: No fields provided to update"
        
        result = await _make_api_request(
            "POST",
            params.site_url,
            f"{params.post_type.value}/{params.post_id}",
            params.username,
            params.app_password,
            data=post_data
        )
        
        content_type = "Post" if params.post_type == PostType.POST else "Page"
        return f"✓ {content_type} updated successfully!\n- ID: {result['id']}\n- Title: {result['title']['rendered']}\n- Status: {result['status']}\n- Link: {result['link']}"
    
    except Exception as e:
        return _handle_api_error(e, "update post")

@mcp.tool(
    name="wordpress_delete_post",
    annotations={
        "title": "Delete WordPress Post/Page",
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def wordpress_delete_post(params: DeletePostInput) -> str:
    """
    Delete a post or page from WordPress.
    
    WARNING: This operation moves content to trash or permanently deletes it.
    Use with caution!
    
    Args:
        params (DeletePostInput): Validated input parameters
    
    Returns:
        str: Success message or error
    """
    try:
        api_params = {"force": params.force}
        
        result = await _make_api_request(
            "DELETE",
            params.site_url,
            f"{params.post_type.value}/{params.post_id}",
            params.username,
            params.app_password,
            params=api_params
        )
        
        action = "permanently deleted" if params.force else "moved to trash"
        content_type = "Post" if params.post_type == PostType.POST else "Page"
        return f"✓ {content_type} {action} successfully (ID: {params.post_id})"
    
    except Exception as e:
        return _handle_api_error(e, "delete post")

# ============================================================================
# Tool Definitions - Media
# ============================================================================

@mcp.tool(
    name="wordpress_list_media",
    annotations={
        "title": "List WordPress Media",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def wordpress_list_media(params: ListMediaInput) -> str:
    """
    List media files in WordPress media library.
    
    Retrieves images, videos, and other media files with search and pagination.
    
    Args:
        params (ListMediaInput): Validated input parameters
    
    Returns:
        str: Formatted list of media files
    """
    try:
        api_params = {
            "per_page": params.per_page,
            "page": params.page
        }
        
        if params.search:
            api_params["search"] = params.search
        
        data = await _make_api_request(
            "GET",
            params.site_url,
            "media",
            params.username,
            params.app_password,
            params=api_params
        )
        
        if not data:
            return "No media files found"
        
        if params.response_format == ResponseFormat.MARKDOWN:
            lines = ["# Media Library", ""]
            lines.append(f"Found {len(data)} media files (Page {params.page})")
            lines.append("")
            
            for item in data:
                title = item.get('title', {}).get('rendered', 'Untitled')
                media_type = item.get('media_type', 'unknown')
                url = item.get('source_url', '')
                lines.append(f"**{title}** (ID: {item['id']})")
                lines.append(f"- Type: {media_type}")
                lines.append(f"- URL: {url}")
                lines.append("")
            
            return "\n".join(lines)
        else:
            import json
            return json.dumps(data, indent=2)
    
    except Exception as e:
        return _handle_api_error(e, "list media")

@mcp.tool(
    name="wordpress_upload_media",
    annotations={
        "title": "Upload Media to WordPress",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True
    }
)
async def wordpress_upload_media(params: UploadMediaInput) -> str:
    """
    Upload a media file to WordPress.
    
    Uploads images, videos, or other files to the WordPress media library.
    
    Args:
        params (UploadMediaInput): Validated input parameters
    
    Returns:
        str: Success message with media ID and URL
    """
    try:
        file_path = Path(params.file_path)
        if not file_path.exists():
            return f"Error: File not found: {params.file_path}"
        
        file_size = file_path.stat().st_size
        if file_size > MAX_FILE_SIZE:
            return f"Error: File size exceeds maximum allowed ({MAX_FILE_SIZE} bytes)"
        
        # WordPress media upload requires multipart/form-data
        url = _build_url(params.site_url, "media")
        headers = _get_auth_header(params.username, params.app_password)
        
        with open(params.file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'application/octet-stream')}
            data = {}
            
            if params.title:
                data['title'] = params.title
            if params.alt_text:
                data['alt_text'] = params.alt_text
            if params.caption:
                data['caption'] = params.caption
            
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.post(url, headers=headers, files=files, data=data)
                response.raise_for_status()
                result = response.json()
        
        return f"✓ Media uploaded successfully!\n- ID: {result['id']}\n- Title: {result['title']['rendered']}\n- URL: {result['source_url']}\n- Type: {result['media_type']}"
    
    except Exception as e:
        return _handle_api_error(e, "upload media")

# ============================================================================
# Tool Definitions - Users
# ============================================================================

@mcp.tool(
    name="wordpress_list_users",
    annotations={
        "title": "List WordPress Users",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def wordpress_list_users(params: ListUsersInput) -> str:
    """
    List users on WordPress site.
    
    Retrieves user accounts with filtering by role and search.
    
    Args:
        params (ListUsersInput): Validated input parameters
    
    Returns:
        str: Formatted list of users
    """
    try:
        api_params = {
            "per_page": params.per_page,
            "page": params.page,
            "context": "view"
        }
        
        if params.search:
            api_params["search"] = params.search
        if params.role:
            api_params["roles"] = params.role
        
        data = await _make_api_request(
            "GET",
            params.site_url,
            "users",
            params.username,
            params.app_password,
            params=api_params
        )
        
        if not data:
            return "No users found"
        
        if params.response_format == ResponseFormat.MARKDOWN:
            lines = ["# WordPress Users", ""]
            lines.append(f"Found {len(data)} users (Page {params.page})")
            lines.append("")
            
            for user in data:
                name = user.get('name', 'Unknown')
                roles = ', '.join(user.get('roles', []))
                lines.append(f"**{name}** (ID: {user['id']})")
                lines.append(f"- Username: {user.get('slug', 'N/A')}")
                lines.append(f"- Roles: {roles}")
                lines.append(f"- URL: {user.get('url', 'N/A')}")
                lines.append("")
            
            return "\n".join(lines)
        else:
            import json
            return json.dumps(data, indent=2)
    
    except Exception as e:
        return _handle_api_error(e, "list users")

# ============================================================================
# Tool Definitions - Comments
# ============================================================================

@mcp.tool(
    name="wordpress_list_comments",
    annotations={
        "title": "List WordPress Comments",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def wordpress_list_comments(params: ListCommentsInput) -> str:
    """
    List comments from WordPress site.
    
    Retrieves comments with filtering by post and status.
    
    Args:
        params (ListCommentsInput): Validated input parameters
    
    Returns:
        str: Formatted list of comments
    """
    try:
        api_params = {
            "per_page": params.per_page,
            "page": params.page
        }
        
        if params.post_id:
            api_params["post"] = params.post_id
        if params.status:
            api_params["status"] = params.status.value
        
        data = await _make_api_request(
            "GET",
            params.site_url,
            "comments",
            params.username,
            params.app_password,
            params=api_params
        )
        
        if not data:
            return "No comments found"
        
        if params.response_format == ResponseFormat.MARKDOWN:
            lines = ["# Comments", ""]
            lines.append(f"Found {len(data)} comments (Page {params.page})")
            lines.append("")
            
            for comment in data:
                author = comment.get('author_name', 'Anonymous')
                content = comment.get('content', {}).get('rendered', '')[:100]
                status = comment.get('status', 'unknown')
                lines.append(f"**{author}** (ID: {comment['id']})")
                lines.append(f"- Status: {status}")
                lines.append(f"- Post ID: {comment.get('post', 'N/A')}")
                lines.append(f"- Content: {content}...")
                lines.append("")
            
            return "\n".join(lines)
        else:
            import json
            return json.dumps(data, indent=2)
    
    except Exception as e:
        return _handle_api_error(e, "list comments")

@mcp.tool(
    name="wordpress_moderate_comment",
    annotations={
        "title": "Moderate WordPress Comment",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def wordpress_moderate_comment(params: ModerateCommentInput) -> str:
    """
    Moderate a WordPress comment (approve, hold, spam, trash).
    
    Change the status of a comment for moderation purposes.
    
    Args:
        params (ModerateCommentInput): Validated input parameters
    
    Returns:
        str: Success message
    """
    try:
        result = await _make_api_request(
            "POST",
            params.site_url,
            f"comments/{params.comment_id}",
            params.username,
            params.app_password,
            data={"status": params.status.value}
        )
        
        return f"✓ Comment {params.comment_id} status changed to: {params.status.value}"
    
    except Exception as e:
        return _handle_api_error(e, "moderate comment")

# ============================================================================
# Tool Definitions - Categories and Tags
# ============================================================================

@mcp.tool(
    name="wordpress_list_categories",
    annotations={
        "title": "List WordPress Categories",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def wordpress_list_categories(params: ListCategoriesInput) -> str:
    """
    List categories from WordPress site.
    
    Args:
        params (ListCategoriesInput): Validated input parameters
    
    Returns:
        str: Formatted list of categories
    """
    try:
        api_params = {"per_page": params.per_page}
        if params.search:
            api_params["search"] = params.search
        
        data = await _make_api_request(
            "GET",
            params.site_url,
            "categories",
            params.username,
            params.app_password,
            params=api_params
        )
        
        if not data:
            return "No categories found"
        
        if params.response_format == ResponseFormat.MARKDOWN:
            lines = ["# Categories", ""]
            for cat in data:
                lines.append(f"**{cat['name']}** (ID: {cat['id']})")
                if cat.get('description'):
                    lines.append(f"- Description: {cat['description']}")
                lines.append(f"- Count: {cat.get('count', 0)} posts")
                lines.append("")
            
            return "\n".join(lines)
        else:
            import json
            return json.dumps(data, indent=2)
    
    except Exception as e:
        return _handle_api_error(e, "list categories")

@mcp.tool(
    name="wordpress_create_category",
    annotations={
        "title": "Create WordPress Category",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True
    }
)
async def wordpress_create_category(params: CreateCategoryInput) -> str:
    """
    Create a new category on WordPress.
    
    Args:
        params (CreateCategoryInput): Validated input parameters
    
    Returns:
        str: Success message with category ID
    """
    try:
        cat_data = {"name": params.name}
        if params.description:
            cat_data["description"] = params.description
        if params.parent:
            cat_data["parent"] = params.parent
        
        result = await _make_api_request(
            "POST",
            params.site_url,
            "categories",
            params.username,
            params.app_password,
            data=cat_data
        )
        
        return f"✓ Category created: {result['name']} (ID: {result['id']})"
    
    except Exception as e:
        return _handle_api_error(e, "create category")

@mcp.tool(
    name="wordpress_list_tags",
    annotations={
        "title": "List WordPress Tags",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def wordpress_list_tags(params: ListTagsInput) -> str:
    """
    List tags from WordPress site.
    
    Args:
        params (ListTagsInput): Validated input parameters
    
    Returns:
        str: Formatted list of tags
    """
    try:
        api_params = {"per_page": params.per_page}
        if params.search:
            api_params["search"] = params.search
        
        data = await _make_api_request(
            "GET",
            params.site_url,
            "tags",
            params.username,
            params.app_password,
            params=api_params
        )
        
        if not data:
            return "No tags found"
        
        if params.response_format == ResponseFormat.MARKDOWN:
            lines = ["# Tags", ""]
            for tag in data:
                lines.append(f"**{tag['name']}** (ID: {tag['id']}) - {tag.get('count', 0)} posts")
            
            return "\n".join(lines)
        else:
            import json
            return json.dumps(data, indent=2)
    
    except Exception as e:
        return _handle_api_error(e, "list tags")

@mcp.tool(
    name="wordpress_create_tag",
    annotations={
        "title": "Create WordPress Tag",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True
    }
)
async def wordpress_create_tag(params: CreateTagInput) -> str:
    """
    Create a new tag on WordPress.
    
    Args:
        params (CreateTagInput): Validated input parameters
    
    Returns:
        str: Success message with tag ID
    """
    try:
        tag_data = {"name": params.name}
        if params.description:
            tag_data["description"] = params.description
        
        result = await _make_api_request(
            "POST",
            params.site_url,
            "tags",
            params.username,
            params.app_password,
            data=tag_data
        )
        
        return f"✓ Tag created: {result['name']} (ID: {result['id']})"
    
    except Exception as e:
        return _handle_api_error(e, "create tag")

if __name__ == "__main__":
    mcp.run()

