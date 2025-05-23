import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listDir, readFile, writeFile, setFtpCredentials } from '../../lib/mcpFtp';
import type { Site } from '../../stores/sites';

// Mock the window.mcp.ftp object
const mockFtpServer = {
  set_credentials: vi.fn().mockResolvedValue({ success: true }),
  list_directory: vi.fn().mockResolvedValue({ 
    entries: [
      { name: 'file1.txt', type: 'file', size: 1024 },
      { name: 'folder1', type: 'directory' }
    ]
  }),
  read_file: vi.fn().mockResolvedValue('file content'),
  write_file: vi.fn().mockResolvedValue({ success: true }),
  delete_item: vi.fn().mockResolvedValue({ success: true }),
  rename_item: vi.fn().mockResolvedValue({ success: true }),
};

describe('MCP FTP Module', () => {
  // Setup mocks before each test
  beforeEach(() => {
    // Mock the window.mcp object
    vi.stubGlobal('window', {
      mcp: {
        ftp: mockFtpServer
      }
    });
  });

  // Clean up after each test
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set FTP credentials correctly', async () => {
    const mockSite: Site = {
      id: '1',
      name: 'Test Site',
      host: 'ftp.example.com',
      user: 'username',
      pass: 'password',
      port: 21,
      secure: false,
      passive: true,
      type: 'ftp',
      createdAt: new Date().toISOString()
    };

    await setFtpCredentials(mockSite);
    
    expect(mockFtpServer.set_credentials).toHaveBeenCalledWith({
      host: 'ftp.example.com',
      user: 'username',
      password: 'password',
      port: 21,
      secure: false,
      passive: true
    });
  });

  it('should list directory contents', async () => {
    const result = await listDir('/some/path');
    
    expect(mockFtpServer.list_directory).toHaveBeenCalledWith({ path: '/some/path' });
    expect(result).toEqual([
      { name: 'file1.txt', type: 'file', size: 1024 },
      { name: 'folder1', type: 'directory' }
    ]);
  });

  it('should read file contents', async () => {
    const result = await readFile('/some/path/file.txt');
    
    expect(mockFtpServer.read_file).toHaveBeenCalledWith({ path: '/some/path/file.txt' });
    expect(result).toBe('file content');
  });

  it('should write file contents', async () => {
    await writeFile('/some/path/file.txt', 'new content');
    
    expect(mockFtpServer.write_file).toHaveBeenCalledWith({ 
      path: '/some/path/file.txt',
      content: 'new content'
    });
  });

  it('should handle errors gracefully', async () => {
    // Mock a failure for this test
    mockFtpServer.read_file.mockRejectedValueOnce(new Error('Connection failed'));
    
    await expect(readFile('/path/to/file.txt')).rejects.toThrow('Connection failed');
  });
});
