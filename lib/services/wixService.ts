import axios, { AxiosInstance } from 'axios';
import type { WixConnection, WixPage, WixCollection, WixDataItem } from '@/types/cms';
import type { FileNode } from '@/types';

export class WixService {
  private client: AxiosInstance | null = null;
  private connection: WixConnection | null = null;

  async connect(config: WixConnection): Promise<void> {
    this.connection = config;

    this.client = axios.create({
      baseURL: 'https://www.wixapis.com',
      headers: {
        'Authorization': config.apiKey,
        'Content-Type': 'application/json',
        'wix-site-id': config.siteId,
      },
    });
  }

  async disconnect(): Promise<void> {
    this.client = null;
    this.connection = null;
  }

  // ==================== Pages Management ====================

  async getPages(): Promise<WixPage[]> {
    if (!this.client) throw new Error('Not connected to Wix');
    
    try {
      const response = await this.client.get('/v1/pages');
      return response.data.pages || [];
    } catch (error) {
      console.error('Error fetching Wix pages:', error);
      return [];
    }
  }

  async getPage(pageId: string): Promise<WixPage> {
    if (!this.client) throw new Error('Not connected to Wix');
    const response = await this.client.get(`/v1/pages/${pageId}`);
    return response.data;
  }

  async updatePage(pageId: string, data: Partial<WixPage>): Promise<WixPage> {
    if (!this.client) throw new Error('Not connected to Wix');
    const response = await this.client.patch(`/v1/pages/${pageId}`, data);
    return response.data;
  }

  // ==================== Collections (Database) Management ====================

  async getCollections(): Promise<WixCollection[]> {
    if (!this.client) throw new Error('Not connected to Wix');
    
    try {
      const response = await this.client.get('/wix-data/v2/collections');
      return response.data.collections || [];
    } catch (error) {
      console.error('Error fetching Wix collections:', error);
      return [];
    }
  }

  async getCollectionItems(collectionId: string): Promise<WixDataItem[]> {
    if (!this.client) throw new Error('Not connected to Wix');
    
    const response = await this.client.post('/wix-data/v2/items/query', {
      dataCollectionId: collectionId,
    });
    
    return response.data.items || [];
  }

  async getCollectionItem(collectionId: string, itemId: string): Promise<WixDataItem> {
    if (!this.client) throw new Error('Not connected to Wix');
    
    const response = await this.client.get(`/wix-data/v2/items/${itemId}`, {
      params: { dataCollectionId: collectionId },
    });
    
    return response.data;
  }

  async updateCollectionItem(
    collectionId: string,
    itemId: string,
    data: Partial<WixDataItem>
  ): Promise<WixDataItem> {
    if (!this.client) throw new Error('Not connected to Wix');
    
    const response = await this.client.patch('/wix-data/v2/items', {
      dataCollectionId: collectionId,
      item: {
        _id: itemId,
        ...data,
      },
    });
    
    return response.data.item;
  }

  async createCollectionItem(collectionId: string, data: Partial<WixDataItem>): Promise<WixDataItem> {
    if (!this.client) throw new Error('Not connected to Wix');
    
    const response = await this.client.post('/wix-data/v2/items', {
      dataCollectionId: collectionId,
      item: data,
    });
    
    return response.data.item;
  }

  async deleteCollectionItem(collectionId: string, itemId: string): Promise<void> {
    if (!this.client) throw new Error('Not connected to Wix');
    
    await this.client.delete(`/wix-data/v2/items/${itemId}`, {
      params: { dataCollectionId: collectionId },
    });
  }

  // ==================== File Tree Navigation ====================

  async getFileTree(): Promise<FileNode[]> {
    if (!this.connection) throw new Error('Not connected to Wix');

    const [pages, collections] = await Promise.all([
      this.getPages(),
      this.getCollections(),
    ]);

    const fileTree: FileNode[] = [
      {
        id: 'pages',
        name: 'Pages',
        path: '/pages',
        type: 'directory' as const,
        children: pages.map((page) => ({
          id: `page-${page.id}`,
          name: page.title || page.url,
          path: `/pages/${page.id}`,
          type: 'file' as const,
          modifiedAt: new Date(page.lastModified),
        })),
      },
      {
        id: 'collections',
        name: 'Collections',
        path: '/collections',
        type: 'directory' as const,
        children: collections.map((collection) => ({
          id: `collection-${collection.id}`,
          name: collection.displayName,
          path: `/collections/${collection.id}`,
          type: 'directory' as const,
        })),
      },
    ];

    return fileTree;
  }

  async getFileContent(path: string): Promise<string> {
    if (!this.connection) throw new Error('Not connected to Wix');

    const parts = path.split('/').filter(Boolean);
    const [type, id, itemId] = parts;

    if (type === 'pages') {
      const page = await this.getPage(id);
      return JSON.stringify({
        title: page.title,
        url: page.url,
        description: page.description,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
      }, null, 2);
    }

    if (type === 'collections' && itemId) {
      const item = await this.getCollectionItem(id, itemId);
      return JSON.stringify(item, null, 2);
    }

    if (type === 'collections') {
      const items = await this.getCollectionItems(id);
      return JSON.stringify(items, null, 2);
    }

    throw new Error('Invalid Wix path');
  }

  async updateFileContent(path: string, content: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected to Wix');

    const parts = path.split('/').filter(Boolean);
    const [type, id, itemId] = parts;
    const data = JSON.parse(content);

    if (type === 'pages') {
      await this.updatePage(id, data);
    } else if (type === 'collections' && itemId) {
      await this.updateCollectionItem(id, itemId, data);
    }
  }

  async expandFolder(path: string): Promise<FileNode[]> {
    if (!this.connection) throw new Error('Not connected to Wix');

    const parts = path.split('/').filter(Boolean);
    const [type, id] = parts;

    if (type === 'collections' && id) {
      const items = await this.getCollectionItems(id);
      return items.map((item) => ({
        id: `collection-${id}-item-${item._id}`,
        name: item.title || item.name || item._id,
        path: `/collections/${id}/${item._id}`,
        type: 'file' as const,
      }));
    }

    return [];
  }

  isConnected(): boolean {
    return !!this.client;
  }
}

// Singleton instance
export const wixService = new WixService();
