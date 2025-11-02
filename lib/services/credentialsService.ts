// Simple encryption for local storage (client-side only)
// For production, consider server-side encryption with proper key management

const STORAGE_KEY = 'ezedit_saved_connections';
const CIPHER_KEY = 'ezedit-secure-2025'; // In production, use environment variable

// Simple XOR cipher for basic obfuscation
function encrypt(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length));
  }
  return btoa(result); // Base64 encode
}

function decrypt(encrypted: string): string {
  try {
    const decoded = atob(encrypted);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length));
    }
    return result;
  } catch {
    return '';
  }
}

export interface SavedConnection {
  id: string;
  name: string;
  type: 'ftp' | 'sftp' | 'wordpress' | 'wix';
  data: any; // Encrypted connection data
  lastUsed: string;
}

export class CredentialsService {
  private static instance: CredentialsService;

  private constructor() {}

  static getInstance(): CredentialsService {
    if (!CredentialsService.instance) {
      CredentialsService.instance = new CredentialsService();
    }
    return CredentialsService.instance;
  }

  // Save a connection
  saveConnection(connection: any): void {
    if (typeof window === 'undefined') return;

    const connections = this.getSavedConnections();
    
    const savedConnection: SavedConnection = {
      id: connection.id,
      name: connection.name,
      type: connection.type,
      data: encrypt(JSON.stringify(connection)),
      lastUsed: new Date().toISOString(),
    };

    // Remove existing connection with same ID
    const filtered = connections.filter(c => c.id !== connection.id);
    filtered.push(savedConnection);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  // Get all saved connections (metadata only)
  getSavedConnections(): SavedConnection[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const connections = JSON.parse(stored);
      // Filter out corrupted connections missing required fields
      return connections.filter((c: any) => c.id && c.name && c.type && c.data);
    } catch {
      return [];
    }
  }

  // Get a specific connection with decrypted data
  getConnection(id: string): any | null {
    const connections = this.getSavedConnections();
    const saved = connections.find(c => c.id === id);
    
    if (!saved) return null;

    try {
      const decrypted = decrypt(saved.data);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  // Delete a saved connection
  deleteConnection(id: string): void {
    if (typeof window === 'undefined') return;

    const connections = this.getSavedConnections();
    const filtered = connections.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  // Update last used timestamp
  updateLastUsed(id: string): void {
    if (typeof window === 'undefined') return;

    const connections = this.getSavedConnections();
    const connection = connections.find(c => c.id === id);
    
    if (connection) {
      connection.lastUsed = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
    }
  }

  // Export connections to file
  exportConnections(): string {
    const connections = this.getSavedConnections();
    return JSON.stringify(connections, null, 2);
  }

  // Import connections from file
  importConnections(jsonData: string): number {
    try {
      const imported: SavedConnection[] = JSON.parse(jsonData);
      const existing = this.getSavedConnections();
      
      // Merge imported with existing, preferring newer ones
      const merged = [...existing];
      
      imported.forEach(conn => {
        const existingIndex = merged.findIndex(c => c.id === conn.id);
        if (existingIndex >= 0) {
          // Replace if imported is newer
          if (new Date(conn.lastUsed) > new Date(merged[existingIndex].lastUsed)) {
            merged[existingIndex] = conn;
          }
        } else {
          merged.push(conn);
        }
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return imported.length;
    } catch (error) {
      throw new Error('Invalid connection file format');
    }
  }

  // Clear all saved connections
  clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const credentialsService = CredentialsService.getInstance();
