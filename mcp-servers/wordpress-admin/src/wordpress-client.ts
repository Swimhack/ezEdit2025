import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

export interface WordPressConfig {
  url: string;
  username: string;
  password: string;
}

export interface Post {
  id?: number;
  title: string;
  content: string;
  status?: 'publish' | 'draft' | 'pending' | 'private';
  author?: number;
  excerpt?: string;
  featured_media?: number;
  categories?: number[];
  tags?: number[];
}

export interface Page {
  id?: number;
  title: string;
  content: string;
  status?: 'publish' | 'draft' | 'pending' | 'private';
  author?: number;
  parent?: number;
  menu_order?: number;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  roles?: string[];
  description?: string;
}

export interface Media {
  id?: number;
  title?: string;
  caption?: string;
  alt_text?: string;
  description?: string;
}

export interface Plugin {
  plugin: string;
  name: string;
  status: string;
  version: string;
}

export interface Theme {
  stylesheet: string;
  name: string;
  status: string;
  version: string;
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
  parent?: number;
  slug?: string;
}

export interface Tag {
  id?: number;
  name: string;
  description?: string;
  slug?: string;
}

export interface Comment {
  id?: number;
  post: number;
  author_name?: string;
  author_email?: string;
  content: string;
  status?: 'approve' | 'hold' | 'spam' | 'trash';
}

export class WordPressClient {
  private api: AxiosInstance;
  private config: WordPressConfig;

  constructor(config: WordPressConfig) {
    this.config = config;
    const baseURL = config.url.endsWith('/') ? config.url : `${config.url}/`;

    this.api = axios.create({
      baseURL: `${baseURL}wp-json/wp/v2/`,
      auth: {
        username: config.username,
        password: config.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ==================== POSTS ====================

  async listPosts(params?: {
    per_page?: number;
    page?: number;
    search?: string;
    status?: string;
  }) {
    const response = await this.api.get('posts', { params });
    return response.data;
  }

  async getPost(id: number) {
    const response = await this.api.get(`posts/${id}`);
    return response.data;
  }

  async createPost(post: Post) {
    const response = await this.api.post('posts', post);
    return response.data;
  }

  async updatePost(id: number, post: Partial<Post>) {
    const response = await this.api.put(`posts/${id}`, post);
    return response.data;
  }

  async deletePost(id: number, force: boolean = false) {
    const response = await this.api.delete(`posts/${id}`, {
      params: { force }
    });
    return response.data;
  }

  // ==================== PAGES ====================

  async listPages(params?: {
    per_page?: number;
    page?: number;
    search?: string;
    status?: string;
  }) {
    const response = await this.api.get('pages', { params });
    return response.data;
  }

  async getPage(id: number) {
    const response = await this.api.get(`pages/${id}`);
    return response.data;
  }

  async createPage(page: Page) {
    const response = await this.api.post('pages', page);
    return response.data;
  }

  async updatePage(id: number, page: Partial<Page>) {
    const response = await this.api.put(`pages/${id}`, page);
    return response.data;
  }

  async deletePage(id: number, force: boolean = false) {
    const response = await this.api.delete(`pages/${id}`, {
      params: { force }
    });
    return response.data;
  }

  // ==================== USERS ====================

  async listUsers(params?: {
    per_page?: number;
    page?: number;
    search?: string;
    roles?: string;
  }) {
    const response = await this.api.get('users', { params });
    return response.data;
  }

  async getUser(id: number) {
    const response = await this.api.get(`users/${id}`);
    return response.data;
  }

  async createUser(user: User) {
    const response = await this.api.post('users', user);
    return response.data;
  }

  async updateUser(id: number, user: Partial<User>) {
    const response = await this.api.put(`users/${id}`, user);
    return response.data;
  }

  async deleteUser(id: number, reassign?: number) {
    const response = await this.api.delete(`users/${id}`, {
      params: { force: true, reassign }
    });
    return response.data;
  }

  // ==================== MEDIA ====================

  async listMedia(params?: {
    per_page?: number;
    page?: number;
    search?: string;
  }) {
    const response = await this.api.get('media', { params });
    return response.data;
  }

  async getMedia(id: number) {
    const response = await this.api.get(`media/${id}`);
    return response.data;
  }

  async uploadMedia(file: Buffer, filename: string, mimeType: string) {
    const formData = new FormData();
    formData.append('file', file, {
      filename,
      contentType: mimeType,
    });

    const response = await axios.post(
      `${this.config.url}/wp-json/wp/v2/media`,
      formData,
      {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
        headers: {
          ...formData.getHeaders(),
        },
      }
    );
    return response.data;
  }

  async updateMedia(id: number, media: Partial<Media>) {
    const response = await this.api.put(`media/${id}`, media);
    return response.data;
  }

  async deleteMedia(id: number, force: boolean = true) {
    const response = await this.api.delete(`media/${id}`, {
      params: { force }
    });
    return response.data;
  }

  // ==================== CATEGORIES ====================

  async listCategories(params?: {
    per_page?: number;
    page?: number;
    search?: string;
  }) {
    const response = await this.api.get('categories', { params });
    return response.data;
  }

  async getCategory(id: number) {
    const response = await this.api.get(`categories/${id}`);
    return response.data;
  }

  async createCategory(category: Category) {
    const response = await this.api.post('categories', category);
    return response.data;
  }

  async updateCategory(id: number, category: Partial<Category>) {
    const response = await this.api.put(`categories/${id}`, category);
    return response.data;
  }

  async deleteCategory(id: number, force: boolean = false) {
    const response = await this.api.delete(`categories/${id}`, {
      params: { force }
    });
    return response.data;
  }

  // ==================== TAGS ====================

  async listTags(params?: {
    per_page?: number;
    page?: number;
    search?: string;
  }) {
    const response = await this.api.get('tags', { params });
    return response.data;
  }

  async getTag(id: number) {
    const response = await this.api.get(`tags/${id}`);
    return response.data;
  }

  async createTag(tag: Tag) {
    const response = await this.api.post('tags', tag);
    return response.data;
  }

  async updateTag(id: number, tag: Partial<Tag>) {
    const response = await this.api.put(`tags/${id}`, tag);
    return response.data;
  }

  async deleteTag(id: number, force: boolean = false) {
    const response = await this.api.delete(`tags/${id}`, {
      params: { force }
    });
    return response.data;
  }

  // ==================== COMMENTS ====================

  async listComments(params?: {
    per_page?: number;
    page?: number;
    post?: number;
    status?: string;
  }) {
    const response = await this.api.get('comments', { params });
    return response.data;
  }

  async getComment(id: number) {
    const response = await this.api.get(`comments/${id}`);
    return response.data;
  }

  async createComment(comment: Comment) {
    const response = await this.api.post('comments', comment);
    return response.data;
  }

  async updateComment(id: number, comment: Partial<Comment>) {
    const response = await this.api.put(`comments/${id}`, comment);
    return response.data;
  }

  async deleteComment(id: number, force: boolean = false) {
    const response = await this.api.delete(`comments/${id}`, {
      params: { force }
    });
    return response.data;
  }

  // ==================== PLUGINS ====================
  // Note: Plugin management requires authentication and may need additional plugins

  async listPlugins() {
    try {
      const response = await axios.get(
        `${this.config.url}/wp-json/wp/v2/plugins`,
        {
          auth: {
            username: this.config.username,
            password: this.config.password,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('Plugin management requires WordPress 5.5+ and proper authentication');
    }
  }

  async getPlugin(plugin: string) {
    const response = await axios.get(
      `${this.config.url}/wp-json/wp/v2/plugins/${plugin}`,
      {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      }
    );
    return response.data;
  }

  async activatePlugin(plugin: string) {
    const response = await axios.put(
      `${this.config.url}/wp-json/wp/v2/plugins/${plugin}`,
      { status: 'active' },
      {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      }
    );
    return response.data;
  }

  async deactivatePlugin(plugin: string) {
    const response = await axios.put(
      `${this.config.url}/wp-json/wp/v2/plugins/${plugin}`,
      { status: 'inactive' },
      {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      }
    );
    return response.data;
  }

  async deletePlugin(plugin: string) {
    const response = await axios.delete(
      `${this.config.url}/wp-json/wp/v2/plugins/${plugin}`,
      {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      }
    );
    return response.data;
  }

  // ==================== THEMES ====================

  async listThemes() {
    try {
      const response = await axios.get(
        `${this.config.url}/wp-json/wp/v2/themes`,
        {
          auth: {
            username: this.config.username,
            password: this.config.password,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('Theme management requires WordPress 5.5+ and proper authentication');
    }
  }

  async getTheme(stylesheet: string) {
    const response = await axios.get(
      `${this.config.url}/wp-json/wp/v2/themes/${stylesheet}`,
      {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      }
    );
    return response.data;
  }

  async activateTheme(stylesheet: string) {
    const response = await axios.put(
      `${this.config.url}/wp-json/wp/v2/themes/${stylesheet}`,
      { status: 'active' },
      {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      }
    );
    return response.data;
  }

  // ==================== SETTINGS ====================

  async getSettings() {
    try {
      const response = await axios.get(
        `${this.config.url}/wp-json/wp/v2/settings`,
        {
          auth: {
            username: this.config.username,
            password: this.config.password,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('Settings access requires proper authentication');
    }
  }

  async updateSettings(settings: Record<string, any>) {
    const response = await axios.post(
      `${this.config.url}/wp-json/wp/v2/settings`,
      settings,
      {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      }
    );
    return response.data;
  }

  // ==================== MENUS ====================
  // Note: Menu management may require additional plugins like WP REST API Menus

  async listMenus() {
    try {
      const response = await axios.get(
        `${this.config.url}/wp-json/wp-api-menus/v2/menus`,
        {
          auth: {
            username: this.config.username,
            password: this.config.password,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('Menu management requires WP REST API Menus plugin or similar');
    }
  }

  async getMenu(id: number) {
    const response = await axios.get(
      `${this.config.url}/wp-json/wp-api-menus/v2/menus/${id}`,
      {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      }
    );
    return response.data;
  }

  // ==================== CUSTOM POST TYPES ====================

  async listPostTypes() {
    const response = await this.api.get('types');
    return response.data;
  }

  async getPostType(type: string) {
    const response = await this.api.get(`types/${type}`);
    return response.data;
  }

  // ==================== TAXONOMIES ====================

  async listTaxonomies() {
    const response = await this.api.get('taxonomies');
    return response.data;
  }

  async getTaxonomy(taxonomy: string) {
    const response = await this.api.get(`taxonomies/${taxonomy}`);
    return response.data;
  }
}
