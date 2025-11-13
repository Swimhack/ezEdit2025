/**
 * In-memory store for websites
 * Used in production environments where file system access is limited
 */

export interface WebsiteRecord {
  id: string
  userId: string
  name: string
  url: string
  type: 'FTP' | 'SFTP' | 'FTPS'
  host: string
  username: string
  password: string
  port: string
  path: string
}

// In-memory storage
const websiteStore = new Map<string, WebsiteRecord[]>();

// Initialize with demo data for development
websiteStore.set('demo-user', [
  {
    id: 'w_mfqaki011hc6q3',
    userId: 'demo-user',
    name: 'Eastgate Ministries',
    url: 'https://eastgateministries.com',
    type: 'FTP',
    host: '72.167.42.141',
    username: 'eastgate_ftp',
    password: 'ZzHb_6s1Lhgq1qr#',
    port: '21',
    path: '/httpdocs'
  }
]);

// Also support test-user-123 (used in UI)
websiteStore.set('test-user-123', [
  {
    id: 'w_mfqaki011hc6q3',
    userId: 'test-user-123',
    name: 'Eastgate Ministries',
    url: 'https://eastgateministries.com',
    type: 'FTP',
    host: '72.167.42.141',
    username: 'eastgate_ftp',
    password: 'ZzHb_6s1Lhgq1qr#',
    port: '21',
    path: '/httpdocs'
  }
]);

export function listWebsites(userId: string): WebsiteRecord[] {
  const userWebsites = websiteStore.get(userId) || [];
  return userWebsites;
}

export function getWebsite(userId: string, id: string): WebsiteRecord | undefined {
  const userWebsites = websiteStore.get(userId) || [];
  return userWebsites.find(w => w.id === id);
}

export function createWebsite(userId: string, input: Omit<WebsiteRecord, 'id' | 'userId'>): WebsiteRecord {
  const record: WebsiteRecord = {
    id: `w_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    userId,
    ...input
  };

  const userWebsites = websiteStore.get(userId) || [];
  userWebsites.push(record);
  websiteStore.set(userId, userWebsites);

  console.log(`[Memory Store] Created website ${record.id} for user ${userId}`);
  return record;
}

export function deleteWebsite(userId: string, id: string): boolean {
  const userWebsites = websiteStore.get(userId) || [];
  const filtered = userWebsites.filter(w => w.id !== id);

  if (filtered.length < userWebsites.length) {
    websiteStore.set(userId, filtered);
    console.log(`[Memory Store] Deleted website ${id} for user ${userId}`);
    return true;
  }

  return false;
}

export function updateWebsite(userId: string, id: string, updates: Partial<Omit<WebsiteRecord, 'id' | 'userId'>>): WebsiteRecord | undefined {
  const userWebsites = websiteStore.get(userId) || [];
  const index = userWebsites.findIndex(w => w.id === id);

  if (index !== -1) {
    userWebsites[index] = {
      ...userWebsites[index],
      ...updates
    };
    websiteStore.set(userId, userWebsites);
    console.log(`[Memory Store] Updated website ${id} for user ${userId}`);
    return userWebsites[index];
  }

  return undefined;
}