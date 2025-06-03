import React, { useState, useEffect } from 'react';
import { sftpClientService, SftpCredentials, SftpFile } from '../../services/sftpClient.service';
import { llmService, LlmRequest } from '../../services/llm.service';

/**
 * Integration Tester Component
 * 
 * Tests both SFTP and LLM functionality in a single interface
 */
const IntegrationTester: React.FC = () => {
  // SFTP state
  const [sftpCredentials, setSftpCredentials] = useState<SftpCredentials>({
    host: '',
    port: 22,
    username: '',
    password: '',
    rootPath: '/'
  });
  const [files, setFiles] = useState<SftpFile[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [fileContent, setFileContent] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  // LLM state
  const [llmRequest, setLlmRequest] = useState<LlmRequest>({
    prompt: '',
    model: 'gpt-4o',
    temperature: 0.7
  });
  const [llmResponse, setLlmResponse] = useState<string>('');
  const [llmConfigured, setLlmConfigured] = useState<boolean>(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sftp' | 'llm' | 'combined'>('sftp');

  // Check LLM configuration on mount
  useEffect(() => {
    const checkLlmStatus = async () => {
      try {
        const status = await llmService.checkStatus();
        setLlmConfigured(status.configured);
        if (!status.configured) {
          console.warn('OpenAI integration not configured:', status.message);
        }
      } catch (err) {
        console.error('Failed to check LLM status:', err);
      }
    };
    
    checkLlmStatus();
  }, []);

  // Handle SFTP input changes
  const handleSftpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSftpCredentials(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value, 10) || 22 : value
    }));
  };

  // Handle LLM input changes
  const handleLlmInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLlmRequest(prev => ({
      ...prev,
      [name]: name === 'temperature' ? parseFloat(value) || 0.7 : value
    }));
  };

  // Test SFTP connection
  const testSftpConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await sftpClientService.testConnection(sftpCredentials);
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

  // List SFTP files
  const listFiles = async (path: string = '/') => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await sftpClientService.listFiles(sftpCredentials, path);
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
    if (file.type === 'd') { // Directory
      // Navigate to directory
      const newPath = currentPath === '/' 
        ? `/${file.name}` 
        : `${currentPath}/${file.name}`;
      listFiles(newPath);
    } else { // File
      // Load file content
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      try {
        const filePath = file.path;
        const result = await sftpClientService.readFile(sftpCredentials, filePath);
        
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

  // Save file content
  const saveFile = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await sftpClientService.writeFile(sftpCredentials, selectedFile, editContent);
      
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

  // Navigate to parent directory
  const navigateUp = () => {
    if (currentPath === '/') return;
    
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    listFiles(parentPath || '/');
  };

  // Send prompt to LLM
  const sendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!llmConfigured) {
      setError('OpenAI API is not configured. Please set OPENAI_API_KEY in your environment.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setLlmResponse('');
    
    try {
      const result = await llmService.sendPrompt(llmRequest);
      
      if (result.success && result.response) {
        setLlmResponse(result.response);
        setSuccess('Successfully received response from LLM');
      } else {
        setError(result.message || 'Failed to get response from LLM');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Send file content to LLM
  const analyzeFileWithLlm = async () => {
    if (!selectedFile || !fileContent || !llmConfigured) {
      setError('Please select a file and ensure OpenAI API is configured');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setActiveTab('combined');
    
    try {
      const prompt = `Analyze the following code/text file and provide a summary:\n\n${fileContent}`;
      
      const result = await llmService.sendPrompt({
        ...llmRequest,
        prompt
      });
      
      if (result.success && result.response) {
        setLlmResponse(result.response);
        setSuccess('Successfully analyzed file with LLM');
      } else {
        setError(result.message || 'Failed to analyze file with LLM');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">EzEdit Integration Tester</h1>
      
      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button 
          className={`py-2 px-4 ${activeTab === 'sftp' ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('sftp')}
        >
          SFTP Testing
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'llm' ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('llm')}
        >
          LLM Testing
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'combined' ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('combined')}
        >
          Combined Features
        </button>
      </div>
      
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
      
      {isLoading && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
          <p>Loading...</p>
        </div>
      )}
      
      {/* SFTP Testing UI */}
      {activeTab === 'sftp' && (
        <div>
          <form onSubmit={testSftpConnection} className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-xl font-semibold mb-2">SFTP Connection</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                <input
                  type="text"
                  name="host"
                  value={sftpCredentials.host}
                  onChange={handleSftpInputChange}
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
                  value={sftpCredentials.port}
                  onChange={handleSftpInputChange}
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
                  value={sftpCredentials.username}
                  onChange={handleSftpInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={sftpCredentials.password}
                  onChange={handleSftpInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Root Path (optional)</label>
                <input
                  type="text"
                  name="rootPath"
                  value={sftpCredentials.rootPath}
                  onChange={handleSftpInputChange}
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
                Test Connection
              </button>
              
              <button 
                type="button" 
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                disabled={isLoading || !sftpCredentials.host || !sftpCredentials.username || !sftpCredentials.password}
                onClick={() => listFiles('/')}
              >
                List Files
              </button>
            </div>
          </form>
          
          {/* File browser */}
          {files.length > 0 && (
            <div className="bg-white p-4 rounded shadow mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">Files in {currentPath}</h2>
                <button 
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={navigateUp}
                  disabled={currentPath === '/'}
                >
                  Parent Directory
                </button>
              </div>
              
              <div className="border rounded overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {files.map((file, index) => (
                      <tr key={index} className={file.type === 'd' ? 'bg-blue-50' : ''}>
                        <td 
                          className="px-6 py-4 whitespace-nowrap cursor-pointer hover:text-blue-600"
                          onClick={() => handleFileClick(file)}
                        >
                          {file.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {file.type === 'd' ? 'Directory' : file.type === 'l' ? 'Symlink' : 'File'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {file.type === 'd' ? '-' : formatFileSize(file.size)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* File editor */}
          {selectedFile && (
            <div className="bg-white p-4 rounded shadow mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">Editing {selectedFile}</h2>
                <div className="flex gap-2">
                  <button 
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    onClick={saveFile}
                    disabled={isLoading}
                  >
                    Save Changes
                  </button>
                  <button 
                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    onClick={analyzeFileWithLlm}
                    disabled={isLoading || !llmConfigured}
                  >
                    Analyze with LLM
                  </button>
                </div>
              </div>
              
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-64 p-2 font-mono text-sm border rounded"
              />
            </div>
          )}
        </div>
      )}
      
      {/* LLM Testing UI */}
      {activeTab === 'llm' && (
        <div>
          <form onSubmit={sendPrompt} className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-xl font-semibold mb-2">LLM Prompt</h2>
            
            {!llmConfigured && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                <p>OpenAI API is not configured. Please set OPENAI_API_KEY in your environment.</p>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                name="model"
                value={llmRequest.model}
                onChange={handleLlmInputChange}
                className="w-full p-2 border rounded"
                disabled={!llmConfigured}
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (0-1)</label>
              <input
                type="number"
                name="temperature"
                value={llmRequest.temperature}
                onChange={handleLlmInputChange}
                className="w-full p-2 border rounded"
                min="0"
                max="1"
                step="0.1"
                disabled={!llmConfigured}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt (optional)</label>
              <input
                type="text"
                name="systemPrompt"
                value={llmRequest.systemPrompt || ''}
                onChange={handleLlmInputChange}
                className="w-full p-2 border rounded"
                placeholder="You are a helpful assistant..."
                disabled={!llmConfigured}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
              <textarea
                name="prompt"
                value={llmRequest.prompt}
                onChange={handleLlmInputChange}
                className="w-full h-32 p-2 border rounded"
                placeholder="Enter your prompt here..."
                required
                disabled={!llmConfigured}
              />
            </div>
            
            <button 
              type="submit" 
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              disabled={isLoading || !llmConfigured || !llmRequest.prompt}
            >
              Send Prompt
            </button>
          </form>
          
          {/* LLM Response */}
          {llmResponse && (
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold mb-2">LLM Response</h2>
              <div className="border rounded p-4 whitespace-pre-wrap bg-gray-50 font-mono text-sm">
                {llmResponse}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Combined Features UI */}
      {activeTab === 'combined' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="bg-white p-4 rounded shadow mb-4">
              <h2 className="text-xl font-semibold mb-2">Selected File</h2>
              {selectedFile ? (
                <div>
                  <p className="mb-2 font-medium">{selectedFile}</p>
                  <div className="border rounded p-2 bg-gray-50 font-mono text-xs h-64 overflow-auto">
                    {fileContent}
                  </div>
                </div>
              ) : (
                <p>No file selected. Please select a file from the SFTP tab.</p>
              )}
            </div>
          </div>
          
          <div>
            <div className="bg-white p-4 rounded shadow mb-4">
              <h2 className="text-xl font-semibold mb-2">LLM Analysis</h2>
              {llmResponse ? (
                <div className="border rounded p-2 bg-gray-50 font-mono text-xs h-64 overflow-auto whitespace-pre-wrap">
                  {llmResponse}
                </div>
              ) : (
                <p>No LLM analysis yet. Click "Analyze with LLM" on a selected file.</p>
              )}
            </div>
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

export default IntegrationTester;
