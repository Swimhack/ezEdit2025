import React, { useState } from 'react';
import { sftpService, SftpCredentials, SftpFile } from '../../services/sftp.service';

/**
 * SFTP Connection Tester Component
 * 
 * A React component that allows testing SFTP connections and operations
 */
const SftpTester: React.FC = () => {
  // Form state
  const [credentials, setCredentials] = useState<SftpCredentials>({
    host: '',
    port: 22,
    username: '',
    password: '',
    rootPath: '/'
  });

  // Results state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [files, setFiles] = useState<SftpFile[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value, 10) || 22 : value
    }));
  };

  // Test SFTP connection
  const testConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setFiles([]);
    setFileContent(null);
    
    try {
      const result = await sftpService.testConnection(credentials);
      if (result.success) {
        setSuccess(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // List files in current directory
  const listFiles = async (path: string = '/') => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setFiles([]);
    setFileContent(null);
    setSelectedFile(null);
    
    try {
      const result = await sftpService.listFiles(credentials, path);
      if (result.success) {
        setFiles(result.files);
        setCurrentPath(result.path);
        setSuccess(`Successfully listed files in ${result.path}`);
      } else {
        setError(result.message || 'Failed to list files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file click
  const handleFileClick = async (file: SftpFile) => {
    if (file.isDirectory) {
      // Navigate to directory
      const newPath = currentPath === '/' 
        ? `/${file.name}` 
        : `${currentPath}/${file.name}`;
      listFiles(newPath);
    } else {
      // Load file content
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      setFileContent(null);
      
      try {
        const filePath = currentPath === '/' 
          ? `/${file.name}` 
          : `${currentPath}/${file.name}`;
        
        const result = await sftpService.readFile(credentials, filePath);
        if (result.success) {
          setFileContent(result.content);
          setEditContent(result.content);
          setSelectedFile(filePath);
          setSuccess(`Successfully loaded file ${filePath}`);
        } else {
          setError(result.message || 'Failed to read file');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Save edited file content
  const saveFile = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await sftpService.writeFile(credentials, selectedFile, editContent);
      if (result.success) {
        setSuccess(`Successfully saved file ${result.path}`);
        setFileContent(editContent);
      } else {
        setError(result.message || 'Failed to save file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new directory
  const createDirectory = async () => {
    const dirName = prompt('Enter new directory name:');
    if (!dirName) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const dirPath = currentPath === '/' 
        ? `/${dirName}` 
        : `${currentPath}/${dirName}`;
      
      const result = await sftpService.createDirectory(credentials, dirPath);
      if (result.success) {
        setSuccess(`Successfully created directory ${result.path}`);
        // Refresh current directory
        listFiles(currentPath);
      } else {
        setError(result.message || 'Failed to create directory');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete file
  const deleteFile = async (file: SftpFile) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const path = currentPath === '/' 
        ? `/${file.name}` 
        : `${currentPath}/${file.name}`;
      
      if (file.isDirectory) {
        const result = await sftpService.deleteDirectory(credentials, path);
        if (result.success) {
          setSuccess(`Successfully deleted directory ${result.path}`);
        } else {
          setError(result.message || 'Failed to delete directory');
        }
      } else {
        const result = await sftpService.deleteFile(credentials, path);
        if (result.success) {
          setSuccess(`Successfully deleted file ${result.path}`);
        } else {
          setError(result.message || 'Failed to delete file');
        }
      }
      
      // Refresh current directory
      listFiles(currentPath);
      
      // Clear file content if deleted file was selected
      if (selectedFile === path) {
        setFileContent(null);
        setSelectedFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to parent directory
  const navigateUp = () => {
    if (currentPath === '/') return;
    
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    listFiles(parentPath || '/');
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">SFTP Connection Tester</h1>
      
      {/* Connection form */}
      <form onSubmit={testConnection} className="bg-white p-4 rounded shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
            <input
              type="text"
              name="host"
              value={credentials.host}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="e.g., sftp.example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
            <input
              type="number"
              name="port"
              value={credentials.port}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              min="1"
              max="65535"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Root Path (optional)</label>
            <input
              type="text"
              name="rootPath"
              value={credentials.rootPath}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="/"
            />
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button 
            type="button" 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            disabled={isLoading || !credentials.host || !credentials.username || !credentials.password}
            onClick={() => listFiles('/')}
          >
            List Files
          </button>
        </div>
      </form>
      
      {/* Status messages */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p>{success}</p>
        </div>
      )}
      
      {/* File browser */}
      {files.length > 0 && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Files in {currentPath}</h2>
            <div className="flex gap-2">
              <button 
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={navigateUp}
                disabled={currentPath === '/'}
              >
                Parent Directory
              </button>
              <button 
                className="px-3 py-1 bg-green-200 rounded hover:bg-green-300"
                onClick={createDirectory}
              >
                New Folder
              </button>
            </div>
          </div>
          
          <div className="border rounded overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file, index) => (
                  <tr key={index} className={file.isDirectory ? 'bg-blue-50' : ''}>
                    <td 
                      className="px-6 py-4 whitespace-nowrap cursor-pointer hover:text-blue-600"
                      onClick={() => handleFileClick(file)}
                    >
                      {file.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {file.isDirectory ? 'Directory' : file.isSymbolicLink ? 'Symlink' : 'File'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {file.isDirectory ? '-' : formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        onClick={() => deleteFile(file)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* File editor */}
      {fileContent !== null && selectedFile && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Editing {selectedFile}</h2>
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="w-full h-64 p-2 font-mono text-sm border rounded"
          />
          <div className="mt-2">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={saveFile}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default SftpTester;
