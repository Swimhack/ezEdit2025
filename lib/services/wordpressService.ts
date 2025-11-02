import axios, { AxiosInstance } from 'axios';
import type { WordPressConnection, WordPressPost, WordPressPage, WordPressMedia } from '@/types/cms';
import type { FileNode } from '@/types';

export class WordPressService {
  private client: AxiosInstance | null = null;
  private connection: WordPressConnection | null = null;

  async connect(config: WordPressConnection): Promise<void> {
    this.connection = config;
    
    // Create base64 encoded credentials for Basic Auth
    const credentials = Buffer.from(
      `${config.username}:${config.applicationPassword}`
    ).toString('base64');

    this.client = axios.create({
      baseURL: `${config.siteUrl}/wp-json/wp/v2`,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async disconnect(): Promise<void> {
    this.client = null;
    this.connection = null;
  }

  // ==================== Content Management ====================

  async getPosts(params?: {
    status?: string;
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<WordPressPost[]> {
    if (!this.client) throw new Error('Not connected to WordPress');
    const response = await this.client.get('/posts', { params });
    return response.data;
  }

  async getPost(id: number): Promise<WordPressPost> {
    if (!this.client) throw new Error('Not connected to WordPress');
    const response = await this.client.get(`/posts/${id}`);
    return response.data;
  }

  async updatePost(id: number, data: Partial<WordPressPost>): Promise<WordPressPost> {
    if (!this.client) throw new Error('Not connected to WordPress');
    const response = await this.client.post(`/posts/${id}`, data);
    return response.data;
  }

  async createPost(data: Partial<WordPressPost>): Promise<WordPressPost> {
    if (!this.client) throw new Error('Not connected to WordPress');
    const response = await this.client.post('/posts', data);
    return response.data;
  }

  async deletePost(id: number): Promise<void> {
    if (!this.client) throw new Error('Not connected to WordPress');
    await this.client.delete(`/posts/${id}`);
  }

  async getPages(params?: {
    status?: string;
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<WordPressPage[]> {
    if (!this.client) throw new Error('Not connected to WordPress');
    const response = await this.client.get('/pages', { params });
    return response.data;
  }

  async getPage(id: number): Promise<WordPressPage> {
    if (!this.client) throw new Error('Not connected to WordPress');
    const response = await this.client.get(`/pages/${id}`);
    return response.data;
  }

  async updatePage(id: number, data: Partial<WordPressPage>): Promise<WordPressPage> {
    if (!this.client) throw new Error('Not connected to WordPress');
    const response = await this.client.post(`/pages/${id}`, data);
    return response.data;
  }

  async createPage(data: Partial<WordPressPage>): Promise<WordPressPage> {
    if (!this.client) throw new Error('Not connected to WordPress');
    const response = await this.client.post('/pages', data);
    return response.data;
  }

  async deletePage(id: number): Promise<void> {
    if (!this.client) throw new Error('Not connected to WordPress');
    await this.client.delete(`/pages/${id}`);
  }

  // ==================== Media Management ====================

  async getMedia(params?: {
    per_page?: number;
    page?: number;
    search?: string;
  }): Promise<WordPressMedia[]> {
    if (!this.client) throw new Error('Not connected to WordPress');
    const response = await this.client.get('/media', { params });
    return response.data;
  }

  async uploadMedia(file: Buffer, filename: string, mimeType: string): Promise<WordPressMedia> {
    if (!this.client) throw new Error('Not connected to WordPress');
    
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', file, { filename, contentType: mimeType });

    const response = await this.client.post('/media', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    return response.data;
  }

  // ==================== File Tree Navigation ====================

  async getFileTree(): Promise<FileNode[]> {
    if (!this.connection) throw new Error('Not connected to WordPress');

    const [posts, pages] = await Promise.all([
      this.getPosts({ per_page: 100 }),
      this.getPages({ per_page: 100 }),
    ]);

    const fileTree: FileNode[] = [
      {
        id: 'posts',
        name: 'Posts',
        path: '/posts',
        type: 'directory' as const,
        children: posts.map((post) => ({
          id: `post-${post.id}`,
          name: post.title.rendered || `Post ${post.id}`,
          path: `/posts/${post.id}`,
          type: 'file' as const,
          modifiedAt: new Date(post.modified),
        })),
      },
      {
        id: 'pages',
        name: 'Pages',
        path: '/pages',
        type: 'directory' as const,
        children: pages.map((page) => ({
          id: `page-${page.id}`,
          name: page.title.rendered || `Page ${page.id}`,
          path: `/pages/${page.id}`,
          type: 'file' as const,
          modifiedAt: new Date(page.modified),
        })),
      },
    ];

    return fileTree;
  }

  async getFileContent(path: string): Promise<string> {
    if (!this.connection) throw new Error('Not connected to WordPress');

    const [, type, idStr] = path.split('/');
    const id = parseInt(idStr, 10);

    if (type === 'posts') {
      const post = await this.getPost(id);
      return JSON.stringify({
        title: post.title.rendered,
        content: post.content.rendered,
        status: post.status,
        slug: post.slug,
      }, null, 2);
    }

    if (type === 'pages') {
      const page = await this.getPage(id);
      return JSON.stringify({
        title: page.title.rendered,
        content: page.content.rendered,
        status: page.status,
        slug: page.slug,
      }, null, 2);
    }

    throw new Error('Invalid WordPress path');
  }

  async updateFileContent(path: string, content: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected to WordPress');

    const [, type, idStr] = path.split('/');
    const id = parseInt(idStr, 10);
    const data = JSON.parse(content);

    if (type === 'posts') {
      await this.updatePost(id, {
        title: { rendered: data.title },
        content: { rendered: data.content },
        status: data.status,
        slug: data.slug,
      } as any);
    } else if (type === 'pages') {
      await this.updatePage(id, {
        title: { rendered: data.title },
        content: { rendered: data.content },
        status: data.status,
        slug: data.slug,
      } as any);
    }
  }

  isConnected(): boolean {
    return !!this.client;
  }
}

// Singleton instance
export const wordpressService = new WordPressService();
