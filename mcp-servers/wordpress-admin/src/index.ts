#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { WordPressClient, WordPressConfig } from './wordpress-client.js';

// WordPress configuration from environment variables
const WORDPRESS_URL = process.env.WORDPRESS_URL || '';
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME || '';
const WORDPRESS_PASSWORD = process.env.WORDPRESS_PASSWORD || '';

if (!WORDPRESS_URL || !WORDPRESS_USERNAME || !WORDPRESS_PASSWORD) {
  console.error('Error: WordPress credentials not configured');
  console.error('Please set WORDPRESS_URL, WORDPRESS_USERNAME, and WORDPRESS_PASSWORD environment variables');
  process.exit(1);
}

const config: WordPressConfig = {
  url: WORDPRESS_URL,
  username: WORDPRESS_USERNAME,
  password: WORDPRESS_PASSWORD,
};

const wpClient = new WordPressClient(config);

// Define all available tools
const tools: Tool[] = [
  // ==================== POSTS ====================
  {
    name: 'wordpress_list_posts',
    description: 'List all posts from WordPress site. Supports pagination, search, and filtering by status.',
    inputSchema: {
      type: 'object',
      properties: {
        per_page: { type: 'number', description: 'Number of posts per page (default: 10)' },
        page: { type: 'number', description: 'Page number (default: 1)' },
        search: { type: 'string', description: 'Search query' },
        status: { type: 'string', description: 'Post status (publish, draft, pending, private)', enum: ['publish', 'draft', 'pending', 'private'] },
      },
    },
  },
  {
    name: 'wordpress_get_post',
    description: 'Get a specific post by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Post ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_create_post',
    description: 'Create a new post',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Post title' },
        content: { type: 'string', description: 'Post content (HTML)' },
        status: { type: 'string', description: 'Post status', enum: ['publish', 'draft', 'pending', 'private'], default: 'draft' },
        excerpt: { type: 'string', description: 'Post excerpt' },
        categories: { type: 'array', items: { type: 'number' }, description: 'Category IDs' },
        tags: { type: 'array', items: { type: 'number' }, description: 'Tag IDs' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'wordpress_update_post',
    description: 'Update an existing post',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Post ID' },
        title: { type: 'string', description: 'Post title' },
        content: { type: 'string', description: 'Post content (HTML)' },
        status: { type: 'string', description: 'Post status', enum: ['publish', 'draft', 'pending', 'private'] },
        excerpt: { type: 'string', description: 'Post excerpt' },
        categories: { type: 'array', items: { type: 'number' }, description: 'Category IDs' },
        tags: { type: 'array', items: { type: 'number' }, description: 'Tag IDs' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_delete_post',
    description: 'Delete a post (move to trash or permanently delete)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Post ID' },
        force: { type: 'boolean', description: 'Permanently delete (true) or move to trash (false)', default: false },
      },
      required: ['id'],
    },
  },

  // ==================== PAGES ====================
  {
    name: 'wordpress_list_pages',
    description: 'List all pages from WordPress site',
    inputSchema: {
      type: 'object',
      properties: {
        per_page: { type: 'number', description: 'Number of pages per page (default: 10)' },
        page: { type: 'number', description: 'Page number (default: 1)' },
        search: { type: 'string', description: 'Search query' },
        status: { type: 'string', description: 'Page status', enum: ['publish', 'draft', 'pending', 'private'] },
      },
    },
  },
  {
    name: 'wordpress_get_page',
    description: 'Get a specific page by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Page ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_create_page',
    description: 'Create a new page',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Page title' },
        content: { type: 'string', description: 'Page content (HTML)' },
        status: { type: 'string', description: 'Page status', enum: ['publish', 'draft', 'pending', 'private'], default: 'draft' },
        parent: { type: 'number', description: 'Parent page ID' },
        menu_order: { type: 'number', description: 'Menu order' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'wordpress_update_page',
    description: 'Update an existing page',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Page ID' },
        title: { type: 'string', description: 'Page title' },
        content: { type: 'string', description: 'Page content (HTML)' },
        status: { type: 'string', description: 'Page status', enum: ['publish', 'draft', 'pending', 'private'] },
        parent: { type: 'number', description: 'Parent page ID' },
        menu_order: { type: 'number', description: 'Menu order' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_delete_page',
    description: 'Delete a page',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Page ID' },
        force: { type: 'boolean', description: 'Permanently delete (true) or move to trash (false)', default: false },
      },
      required: ['id'],
    },
  },

  // ==================== USERS ====================
  {
    name: 'wordpress_list_users',
    description: 'List all users from WordPress site',
    inputSchema: {
      type: 'object',
      properties: {
        per_page: { type: 'number', description: 'Number of users per page (default: 10)' },
        page: { type: 'number', description: 'Page number (default: 1)' },
        search: { type: 'string', description: 'Search query' },
        roles: { type: 'string', description: 'Filter by role (administrator, editor, author, contributor, subscriber)' },
      },
    },
  },
  {
    name: 'wordpress_get_user',
    description: 'Get a specific user by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'User ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_create_user',
    description: 'Create a new user',
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Username (cannot be changed later)' },
        email: { type: 'string', description: 'Email address' },
        password: { type: 'string', description: 'Password' },
        first_name: { type: 'string', description: 'First name' },
        last_name: { type: 'string', description: 'Last name' },
        roles: { type: 'array', items: { type: 'string' }, description: 'User roles' },
        description: { type: 'string', description: 'User bio' },
      },
      required: ['username', 'email', 'password'],
    },
  },
  {
    name: 'wordpress_update_user',
    description: 'Update an existing user',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'User ID' },
        email: { type: 'string', description: 'Email address' },
        password: { type: 'string', description: 'New password' },
        first_name: { type: 'string', description: 'First name' },
        last_name: { type: 'string', description: 'Last name' },
        roles: { type: 'array', items: { type: 'string' }, description: 'User roles' },
        description: { type: 'string', description: 'User bio' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_delete_user',
    description: 'Delete a user',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'User ID' },
        reassign: { type: 'number', description: 'Reassign posts to this user ID' },
      },
      required: ['id'],
    },
  },

  // ==================== MEDIA ====================
  {
    name: 'wordpress_list_media',
    description: 'List all media files from WordPress site',
    inputSchema: {
      type: 'object',
      properties: {
        per_page: { type: 'number', description: 'Number of items per page (default: 10)' },
        page: { type: 'number', description: 'Page number (default: 1)' },
        search: { type: 'string', description: 'Search query' },
      },
    },
  },
  {
    name: 'wordpress_get_media',
    description: 'Get a specific media file by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Media ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_update_media',
    description: 'Update media metadata (title, caption, alt text, description)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Media ID' },
        title: { type: 'string', description: 'Media title' },
        caption: { type: 'string', description: 'Media caption' },
        alt_text: { type: 'string', description: 'Alt text for images' },
        description: { type: 'string', description: 'Media description' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_delete_media',
    description: 'Delete a media file',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Media ID' },
        force: { type: 'boolean', description: 'Permanently delete (true) or move to trash (false)', default: true },
      },
      required: ['id'],
    },
  },

  // ==================== CATEGORIES ====================
  {
    name: 'wordpress_list_categories',
    description: 'List all categories',
    inputSchema: {
      type: 'object',
      properties: {
        per_page: { type: 'number', description: 'Number of categories per page (default: 10)' },
        page: { type: 'number', description: 'Page number (default: 1)' },
        search: { type: 'string', description: 'Search query' },
      },
    },
  },
  {
    name: 'wordpress_get_category',
    description: 'Get a specific category by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Category ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_create_category',
    description: 'Create a new category',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Category name' },
        description: { type: 'string', description: 'Category description' },
        parent: { type: 'number', description: 'Parent category ID' },
        slug: { type: 'string', description: 'Category slug' },
      },
      required: ['name'],
    },
  },
  {
    name: 'wordpress_update_category',
    description: 'Update an existing category',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Category ID' },
        name: { type: 'string', description: 'Category name' },
        description: { type: 'string', description: 'Category description' },
        parent: { type: 'number', description: 'Parent category ID' },
        slug: { type: 'string', description: 'Category slug' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_delete_category',
    description: 'Delete a category',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Category ID' },
        force: { type: 'boolean', description: 'Permanently delete', default: false },
      },
      required: ['id'],
    },
  },

  // ==================== TAGS ====================
  {
    name: 'wordpress_list_tags',
    description: 'List all tags',
    inputSchema: {
      type: 'object',
      properties: {
        per_page: { type: 'number', description: 'Number of tags per page (default: 10)' },
        page: { type: 'number', description: 'Page number (default: 1)' },
        search: { type: 'string', description: 'Search query' },
      },
    },
  },
  {
    name: 'wordpress_get_tag',
    description: 'Get a specific tag by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Tag ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_create_tag',
    description: 'Create a new tag',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Tag name' },
        description: { type: 'string', description: 'Tag description' },
        slug: { type: 'string', description: 'Tag slug' },
      },
      required: ['name'],
    },
  },
  {
    name: 'wordpress_update_tag',
    description: 'Update an existing tag',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Tag ID' },
        name: { type: 'string', description: 'Tag name' },
        description: { type: 'string', description: 'Tag description' },
        slug: { type: 'string', description: 'Tag slug' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_delete_tag',
    description: 'Delete a tag',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Tag ID' },
        force: { type: 'boolean', description: 'Permanently delete', default: false },
      },
      required: ['id'],
    },
  },

  // ==================== COMMENTS ====================
  {
    name: 'wordpress_list_comments',
    description: 'List all comments',
    inputSchema: {
      type: 'object',
      properties: {
        per_page: { type: 'number', description: 'Number of comments per page (default: 10)' },
        page: { type: 'number', description: 'Page number (default: 1)' },
        post: { type: 'number', description: 'Filter by post ID' },
        status: { type: 'string', description: 'Comment status', enum: ['approve', 'hold', 'spam', 'trash'] },
      },
    },
  },
  {
    name: 'wordpress_get_comment',
    description: 'Get a specific comment by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Comment ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_create_comment',
    description: 'Create a new comment',
    inputSchema: {
      type: 'object',
      properties: {
        post: { type: 'number', description: 'Post ID' },
        author_name: { type: 'string', description: 'Comment author name' },
        author_email: { type: 'string', description: 'Comment author email' },
        content: { type: 'string', description: 'Comment content' },
        status: { type: 'string', description: 'Comment status', enum: ['approve', 'hold', 'spam', 'trash'], default: 'approve' },
      },
      required: ['post', 'content'],
    },
  },
  {
    name: 'wordpress_update_comment',
    description: 'Update an existing comment',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Comment ID' },
        author_name: { type: 'string', description: 'Comment author name' },
        author_email: { type: 'string', description: 'Comment author email' },
        content: { type: 'string', description: 'Comment content' },
        status: { type: 'string', description: 'Comment status', enum: ['approve', 'hold', 'spam', 'trash'] },
      },
      required: ['id'],
    },
  },
  {
    name: 'wordpress_delete_comment',
    description: 'Delete a comment',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Comment ID' },
        force: { type: 'boolean', description: 'Permanently delete', default: false },
      },
      required: ['id'],
    },
  },

  // ==================== PLUGINS ====================
  {
    name: 'wordpress_list_plugins',
    description: 'List all installed plugins (requires WordPress 5.5+)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'wordpress_get_plugin',
    description: 'Get information about a specific plugin',
    inputSchema: {
      type: 'object',
      properties: {
        plugin: { type: 'string', description: 'Plugin slug (e.g., "akismet/akismet")' },
      },
      required: ['plugin'],
    },
  },
  {
    name: 'wordpress_activate_plugin',
    description: 'Activate a plugin',
    inputSchema: {
      type: 'object',
      properties: {
        plugin: { type: 'string', description: 'Plugin slug (e.g., "akismet/akismet")' },
      },
      required: ['plugin'],
    },
  },
  {
    name: 'wordpress_deactivate_plugin',
    description: 'Deactivate a plugin',
    inputSchema: {
      type: 'object',
      properties: {
        plugin: { type: 'string', description: 'Plugin slug (e.g., "akismet/akismet")' },
      },
      required: ['plugin'],
    },
  },
  {
    name: 'wordpress_delete_plugin',
    description: 'Delete a plugin (must be deactivated first)',
    inputSchema: {
      type: 'object',
      properties: {
        plugin: { type: 'string', description: 'Plugin slug (e.g., "akismet/akismet")' },
      },
      required: ['plugin'],
    },
  },

  // ==================== THEMES ====================
  {
    name: 'wordpress_list_themes',
    description: 'List all installed themes (requires WordPress 5.5+)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'wordpress_get_theme',
    description: 'Get information about a specific theme',
    inputSchema: {
      type: 'object',
      properties: {
        stylesheet: { type: 'string', description: 'Theme stylesheet name (e.g., "twentytwentyone")' },
      },
      required: ['stylesheet'],
    },
  },
  {
    name: 'wordpress_activate_theme',
    description: 'Activate a theme',
    inputSchema: {
      type: 'object',
      properties: {
        stylesheet: { type: 'string', description: 'Theme stylesheet name (e.g., "twentytwentyone")' },
      },
      required: ['stylesheet'],
    },
  },

  // ==================== SETTINGS ====================
  {
    name: 'wordpress_get_settings',
    description: 'Get WordPress site settings',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'wordpress_update_settings',
    description: 'Update WordPress site settings',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Site title' },
        description: { type: 'string', description: 'Site tagline' },
        url: { type: 'string', description: 'Site URL' },
        email: { type: 'string', description: 'Admin email' },
        timezone: { type: 'string', description: 'Timezone string' },
        date_format: { type: 'string', description: 'Date format' },
        time_format: { type: 'string', description: 'Time format' },
        start_of_week: { type: 'number', description: 'Start of week (0-6)' },
        language: { type: 'string', description: 'Site language' },
        use_smilies: { type: 'boolean', description: 'Convert emoticons to graphics' },
        default_category: { type: 'number', description: 'Default post category ID' },
        default_post_format: { type: 'string', description: 'Default post format' },
        posts_per_page: { type: 'number', description: 'Blog pages show at most' },
      },
    },
  },

  // ==================== MENUS ====================
  {
    name: 'wordpress_list_menus',
    description: 'List all navigation menus (requires WP REST API Menus plugin)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'wordpress_get_menu',
    description: 'Get a specific menu by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Menu ID' },
      },
      required: ['id'],
    },
  },

  // ==================== POST TYPES & TAXONOMIES ====================
  {
    name: 'wordpress_list_post_types',
    description: 'List all registered post types',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'wordpress_get_post_type',
    description: 'Get information about a specific post type',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Post type slug (e.g., "post", "page")' },
      },
      required: ['type'],
    },
  },
  {
    name: 'wordpress_list_taxonomies',
    description: 'List all registered taxonomies',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'wordpress_get_taxonomy',
    description: 'Get information about a specific taxonomy',
    inputSchema: {
      type: 'object',
      properties: {
        taxonomy: { type: 'string', description: 'Taxonomy slug (e.g., "category", "post_tag")' },
      },
      required: ['taxonomy'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'wordpress-admin',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const safeArgs = args || {};

  try {
    let result: any;

    switch (name) {
      // ==================== POSTS ====================
      case 'wordpress_list_posts':
        result = await wpClient.listPosts(safeArgs as any);
        break;
      case 'wordpress_get_post':
        result = await wpClient.getPost(safeArgs.id as number);
        break;
      case 'wordpress_create_post':
        result = await wpClient.createPost(safeArgs as any);
        break;
      case 'wordpress_update_post':
        result = await wpClient.updatePost(safeArgs.id as number, safeArgs as any);
        break;
      case 'wordpress_delete_post':
        result = await wpClient.deletePost(safeArgs.id as number, safeArgs.force as boolean);
        break;

      // ==================== PAGES ====================
      case 'wordpress_list_pages':
        result = await wpClient.listPages(safeArgs as any);
        break;
      case 'wordpress_get_page':
        result = await wpClient.getPage(safeArgs.id as number);
        break;
      case 'wordpress_create_page':
        result = await wpClient.createPage(safeArgs as any);
        break;
      case 'wordpress_update_page':
        result = await wpClient.updatePage(safeArgs.id as number, safeArgs as any);
        break;
      case 'wordpress_delete_page':
        result = await wpClient.deletePage(safeArgs.id as number, safeArgs.force as boolean);
        break;

      // ==================== USERS ====================
      case 'wordpress_list_users':
        result = await wpClient.listUsers(safeArgs as any);
        break;
      case 'wordpress_get_user':
        result = await wpClient.getUser(safeArgs.id as number);
        break;
      case 'wordpress_create_user':
        result = await wpClient.createUser(safeArgs as any);
        break;
      case 'wordpress_update_user':
        result = await wpClient.updateUser(safeArgs.id as number, safeArgs as any);
        break;
      case 'wordpress_delete_user':
        result = await wpClient.deleteUser(safeArgs.id as number, safeArgs.reassign as number);
        break;

      // ==================== MEDIA ====================
      case 'wordpress_list_media':
        result = await wpClient.listMedia(safeArgs as any);
        break;
      case 'wordpress_get_media':
        result = await wpClient.getMedia(safeArgs.id as number);
        break;
      case 'wordpress_update_media':
        result = await wpClient.updateMedia(safeArgs.id as number, safeArgs as any);
        break;
      case 'wordpress_delete_media':
        result = await wpClient.deleteMedia(safeArgs.id as number, safeArgs.force as boolean);
        break;

      // ==================== CATEGORIES ====================
      case 'wordpress_list_categories':
        result = await wpClient.listCategories(safeArgs as any);
        break;
      case 'wordpress_get_category':
        result = await wpClient.getCategory(safeArgs.id as number);
        break;
      case 'wordpress_create_category':
        result = await wpClient.createCategory(safeArgs as any);
        break;
      case 'wordpress_update_category':
        result = await wpClient.updateCategory(safeArgs.id as number, safeArgs as any);
        break;
      case 'wordpress_delete_category':
        result = await wpClient.deleteCategory(safeArgs.id as number, safeArgs.force as boolean);
        break;

      // ==================== TAGS ====================
      case 'wordpress_list_tags':
        result = await wpClient.listTags(safeArgs as any);
        break;
      case 'wordpress_get_tag':
        result = await wpClient.getTag(safeArgs.id as number);
        break;
      case 'wordpress_create_tag':
        result = await wpClient.createTag(safeArgs as any);
        break;
      case 'wordpress_update_tag':
        result = await wpClient.updateTag(safeArgs.id as number, safeArgs as any);
        break;
      case 'wordpress_delete_tag':
        result = await wpClient.deleteTag(safeArgs.id as number, safeArgs.force as boolean);
        break;

      // ==================== COMMENTS ====================
      case 'wordpress_list_comments':
        result = await wpClient.listComments(safeArgs as any);
        break;
      case 'wordpress_get_comment':
        result = await wpClient.getComment(safeArgs.id as number);
        break;
      case 'wordpress_create_comment':
        result = await wpClient.createComment(safeArgs as any);
        break;
      case 'wordpress_update_comment':
        result = await wpClient.updateComment(safeArgs.id as number, safeArgs as any);
        break;
      case 'wordpress_delete_comment':
        result = await wpClient.deleteComment(safeArgs.id as number, safeArgs.force as boolean);
        break;

      // ==================== PLUGINS ====================
      case 'wordpress_list_plugins':
        result = await wpClient.listPlugins();
        break;
      case 'wordpress_get_plugin':
        result = await wpClient.getPlugin(safeArgs.plugin as string);
        break;
      case 'wordpress_activate_plugin':
        result = await wpClient.activatePlugin(safeArgs.plugin as string);
        break;
      case 'wordpress_deactivate_plugin':
        result = await wpClient.deactivatePlugin(safeArgs.plugin as string);
        break;
      case 'wordpress_delete_plugin':
        result = await wpClient.deletePlugin(safeArgs.plugin as string);
        break;

      // ==================== THEMES ====================
      case 'wordpress_list_themes':
        result = await wpClient.listThemes();
        break;
      case 'wordpress_get_theme':
        result = await wpClient.getTheme(safeArgs.stylesheet as string);
        break;
      case 'wordpress_activate_theme':
        result = await wpClient.activateTheme(safeArgs.stylesheet as string);
        break;

      // ==================== SETTINGS ====================
      case 'wordpress_get_settings':
        result = await wpClient.getSettings();
        break;
      case 'wordpress_update_settings':
        result = await wpClient.updateSettings(safeArgs as any);
        break;

      // ==================== MENUS ====================
      case 'wordpress_list_menus':
        result = await wpClient.listMenus();
        break;
      case 'wordpress_get_menu':
        result = await wpClient.getMenu(safeArgs.id as number);
        break;

      // ==================== POST TYPES & TAXONOMIES ====================
      case 'wordpress_list_post_types':
        result = await wpClient.listPostTypes();
        break;
      case 'wordpress_get_post_type':
        result = await wpClient.getPostType(safeArgs.type as string);
        break;
      case 'wordpress_list_taxonomies':
        result = await wpClient.listTaxonomies();
        break;
      case 'wordpress_get_taxonomy':
        result = await wpClient.getTaxonomy(safeArgs.taxonomy as string);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}\n${error.response?.data ? JSON.stringify(error.response.data, null, 2) : ''}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('WordPress Admin MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
