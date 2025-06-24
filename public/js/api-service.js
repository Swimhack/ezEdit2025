/**
 * EzEdit API Service
 * Handles API calls for FTP operations, file management, and AI assistance
 */

class ApiService {
  constructor() {
    this.baseUrl = '/api.php';
    this.currentConnection = null;
  }

  /**
   * Connect to FTP server
   * @param {Object} credentials - FTP credentials
   * @param {string} credentials.host - FTP host
   * @param {string} credentials.port - FTP port
   * @param {string} credentials.username - FTP username
   * @param {string} credentials.password - FTP password
   * @param {boolean} credentials.passive - Use passive mode
   * @returns {Promise} - Promise resolving to connection result
   */
  async connectFtp(credentials) {
    try {
      const response = await this.apiCall('connect', 'POST', credentials);
      
      if (response.status === 'ok') {
        this.currentConnection = {
          ...credentials,
          sessionId: response.sessionId
        };
      }
      
      return response;
    } catch (error) {
      console.error('FTP connection error:', error);
      throw error;
    }
  }

  /**
   * List directory contents
   * @param {string} path - Directory path
   * @returns {Promise} - Promise resolving to directory listing
   */
  async listDirectory(path) {
    try {
      if (!this.currentConnection) {
        throw new Error('No active FTP connection');
      }
      
      return await this.apiCall('list', 'GET', { path });
    } catch (error) {
      console.error('List directory error:', error);
      throw error;
    }
  }

  /**
   * Download file from FTP
   * @param {string} path - File path
   * @returns {Promise} - Promise resolving to file content
   */
  async downloadFile(path) {
    try {
      if (!this.currentConnection) {
        throw new Error('No active FTP connection');
      }
      
      return await this.apiCall('download', 'GET', { path });
    } catch (error) {
      console.error('Download file error:', error);
      throw error;
    }
  }

  /**
   * Upload file to FTP
   * @param {string} path - File path
   * @param {string} content - File content
   * @returns {Promise} - Promise resolving to upload result
   */
  async uploadFile(path, content) {
    try {
      if (!this.currentConnection) {
        throw new Error('No active FTP connection');
      }
      
      return await this.apiCall('save', 'POST', { path, content });
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  /**
   * Create new directory
   * @param {string} path - Directory path
   * @returns {Promise} - Promise resolving to creation result
   */
  async createDirectory(path) {
    try {
      if (!this.currentConnection) {
        throw new Error('No active FTP connection');
      }
      
      return await this.apiCall('mkdir', 'POST', { path });
    } catch (error) {
      console.error('Create directory error:', error);
      throw error;
    }
  }

  /**
   * Delete file or directory
   * @param {string} path - Path to delete
   * @param {boolean} isDirectory - Whether path is a directory
   * @returns {Promise} - Promise resolving to deletion result
   */
  async delete(path, isDirectory) {
    try {
      if (!this.currentConnection) {
        throw new Error('No active FTP connection');
      }
      
      return await this.apiCall('delete', 'POST', { path, isDirectory });
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  /**
   * Rename file or directory
   * @param {string} oldPath - Old path
   * @param {string} newPath - New path
   * @returns {Promise} - Promise resolving to rename result
   */
  async rename(oldPath, newPath) {
    try {
      if (!this.currentConnection) {
        throw new Error('No active FTP connection');
      }
      
      return await this.apiCall('rename', 'POST', { oldPath, newPath });
    } catch (error) {
      console.error('Rename error:', error);
      throw error;
    }
  }

  /**
   * Get AI assistance for code
   * @param {string} prompt - User prompt
   * @param {string} code - Current code
   * @param {string} language - Code language
   * @returns {Promise} - Promise resolving to AI response
   */
  async getAiAssistance(prompt, code, language) {
    try {
      return await this.apiCall('ai', 'POST', { prompt, code, language });
    } catch (error) {
      console.error('AI assistance error:', error);
      throw error;
    }
  }

  /**
   * Make API call
   * @param {string} action - API action
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise} - Promise resolving to API response
   */
  async apiCall(action, method, data) {
    try {
      // For demo purposes, we'll simulate API responses
      // In a real app, we would make actual API calls
      
      return await this.simulateApiCall(action, method, data);
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  /**
   * Simulate API call
   * @param {string} action - API action
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise} - Promise resolving to simulated API response
   */
  async simulateApiCall(action, method, data) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate different API responses based on action
    switch (action) {
      case 'connect':
        return this.simulateFtpConnect(data);
      case 'list':
        return this.simulateListDirectory(data.path);
      case 'download':
        return this.simulateDownloadFile(data.path);
      case 'save':
        return this.simulateUploadFile(data.path, data.content);
      case 'mkdir':
        return this.simulateCreateDirectory(data.path);
      case 'delete':
        return this.simulateDelete(data.path, data.isDirectory);
      case 'rename':
        return this.simulateRename(data.oldPath, data.newPath);
      case 'ai':
        return this.simulateAiAssistance(data.prompt, data.code, data.language);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Simulate FTP connect
   * @param {Object} credentials - FTP credentials
   * @returns {Object} - Simulated API response
   */
  simulateFtpConnect(credentials) {
    // 90% success rate for demo
    const success = Math.random() < 0.9;
    
    if (success) {
      return {
        status: 'ok',
        message: 'Connected successfully',
        sessionId: `ftp-session-${Date.now()}`
      };
    } else {
      throw new Error('Failed to connect to FTP server. Please check your credentials.');
    }
  }

  /**
   * Simulate list directory
   * @param {string} path - Directory path
   * @returns {Object} - Simulated API response
   */
  simulateListDirectory(path) {
    // Generate mock directory listing based on path
    const listing = [];
    
    // Root directory
    if (path === '/' || path === '/public_html') {
      listing.push(
        { name: 'index.html', type: 'file', size: 2048, modified: '2025-06-10T12:00:00Z' },
        { name: 'about.html', type: 'file', size: 1536, modified: '2025-06-09T15:30:00Z' },
        { name: 'contact.html', type: 'file', size: 1024, modified: '2025-06-08T09:45:00Z' },
        { name: 'css', type: 'directory', modified: '2025-06-07T14:20:00Z' },
        { name: 'js', type: 'directory', modified: '2025-06-06T11:10:00Z' },
        { name: 'images', type: 'directory', modified: '2025-06-05T16:40:00Z' }
      );
    } 
    // CSS directory
    else if (path === '/css' || path === '/public_html/css') {
      listing.push(
        { name: 'style.css', type: 'file', size: 4096, modified: '2025-06-07T14:20:00Z' },
        { name: 'responsive.css', type: 'file', size: 2560, modified: '2025-06-07T14:15:00Z' }
      );
    }
    // JS directory
    else if (path === '/js' || path === '/public_html/js') {
      listing.push(
        { name: 'main.js', type: 'file', size: 3072, modified: '2025-06-06T11:10:00Z' },
        { name: 'utils.js', type: 'file', size: 1792, modified: '2025-06-06T11:05:00Z' }
      );
    }
    // Images directory
    else if (path === '/images' || path === '/public_html/images') {
      listing.push(
        { name: 'logo.png', type: 'file', size: 10240, modified: '2025-06-05T16:40:00Z' },
        { name: 'banner.jpg', type: 'file', size: 51200, modified: '2025-06-05T16:35:00Z' },
        { name: 'icons', type: 'directory', modified: '2025-06-05T16:30:00Z' }
      );
    }
    // Icons directory
    else if (path === '/images/icons' || path === '/public_html/images/icons') {
      listing.push(
        { name: 'facebook.svg', type: 'file', size: 512, modified: '2025-06-05T16:30:00Z' },
        { name: 'twitter.svg', type: 'file', size: 512, modified: '2025-06-05T16:25:00Z' },
        { name: 'instagram.svg', type: 'file', size: 512, modified: '2025-06-05T16:20:00Z' }
      );
    }
    
    return {
      status: 'ok',
      path: path,
      listing: listing
    };
  }

  /**
   * Simulate download file
   * @param {string} path - File path
   * @returns {Object} - Simulated API response
   */
  simulateDownloadFile(path) {
    // Generate mock file content based on path
    let content = '';
    
    if (path.endsWith('.html')) {
      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Example Page</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header>
    <h1>Welcome to Example.com</h1>
    <nav>
      <ul>
        <li><a href="index.html">Home</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <section>
      <h2>${path.includes('about') ? 'About Us' : path.includes('contact') ? 'Contact Us' : 'Welcome'}</h2>
      <p>This is an example website being edited with EzEdit.</p>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2025 Example.com</p>
  </footer>
  
  <script src="js/main.js"></script>
</body>
</html>`;
    } else if (path.endsWith('.css')) {
      content = `body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 0;
  color: #333;
}

header {
  background-color: #2563eb;
  color: white;
  padding: 1rem;
}

nav ul {
  display: flex;
  list-style: none;
  padding: 0;
}

nav li {
  margin-right: 1rem;
}

nav a {
  color: white;
  text-decoration: none;
}

main {
  padding: 2rem;
}

footer {
  background-color: #f3f4f6;
  padding: 1rem;
  text-align: center;
}`;
    } else if (path.endsWith('.js')) {
      content = `document.addEventListener('DOMContentLoaded', () => {
  console.log('Document loaded');
  
  // Example function
  function greet(name) {
    return \`Hello, \${name}!\`;
  }
  
  // Event listeners
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      console.log('Button clicked');
    });
  });
});`;
    }
    
    return {
      status: 'ok',
      path: path,
      content: content,
      modified: new Date().toISOString()
    };
  }

  /**
   * Simulate upload file
   * @param {string} path - File path
   * @param {string} content - File content
   * @returns {Object} - Simulated API response
   */
  simulateUploadFile(path, content) {
    // 95% success rate for demo
    const success = Math.random() < 0.95;
    
    if (success) {
      return {
        status: 'ok',
        message: 'File saved successfully',
        path: path
      };
    } else {
      throw new Error('Failed to save file. Please try again.');
    }
  }

  /**
   * Simulate create directory
   * @param {string} path - Directory path
   * @returns {Object} - Simulated API response
   */
  simulateCreateDirectory(path) {
    // 95% success rate for demo
    const success = Math.random() < 0.95;
    
    if (success) {
      return {
        status: 'ok',
        message: 'Directory created successfully',
        path: path
      };
    } else {
      throw new Error('Failed to create directory. Please try again.');
    }
  }

  /**
   * Simulate delete
   * @param {string} path - Path to delete
   * @param {boolean} isDirectory - Whether path is a directory
   * @returns {Object} - Simulated API response
   */
  simulateDelete(path, isDirectory) {
    // 95% success rate for demo
    const success = Math.random() < 0.95;
    
    if (success) {
      return {
        status: 'ok',
        message: `${isDirectory ? 'Directory' : 'File'} deleted successfully`,
        path: path
      };
    } else {
      throw new Error(`Failed to delete ${isDirectory ? 'directory' : 'file'}. Please try again.`);
    }
  }

  /**
   * Simulate rename
   * @param {string} oldPath - Old path
   * @param {string} newPath - New path
   * @returns {Object} - Simulated API response
   */
  simulateRename(oldPath, newPath) {
    // 95% success rate for demo
    const success = Math.random() < 0.95;
    
    if (success) {
      return {
        status: 'ok',
        message: 'Renamed successfully',
        oldPath: oldPath,
        newPath: newPath
      };
    } else {
      throw new Error('Failed to rename. Please try again.');
    }
  }

  /**
   * Simulate AI assistance
   * @param {string} prompt - User prompt
   * @param {string} code - Current code
   * @param {string} language - Code language
   * @returns {Object} - Simulated API response
   */
  simulateAiAssistance(prompt, code, language) {
    // Generate mock AI response based on prompt
    let response = '';
    
    if (prompt.toLowerCase().includes('help')) {
      response = "I can help you with coding tasks. Just tell me what you need assistance with!";
    } else if (prompt.toLowerCase().includes('explain')) {
      response = "This code creates a basic HTML structure with header, main content, and footer sections. The CSS styles define the layout and appearance of these elements.";
    } else if (prompt.toLowerCase().includes('improve')) {
      response = "Here are some suggestions to improve your code:\n\n1. Add semantic HTML5 elements like `<article>`, `<section>`, and `<nav>`\n2. Improve accessibility with ARIA attributes\n3. Consider adding responsive design with media queries\n4. Optimize your CSS with variables for consistent colors and spacing";
    } else if (prompt.toLowerCase().includes('bug') || prompt.toLowerCase().includes('fix')) {
      response = "I noticed a potential issue in your code. The navigation links might not have proper contrast for accessibility. Consider making the text darker or adding a background to improve readability.";
    } else {
      response = "I've analyzed your code and it looks good overall. If you have specific questions or need help with a particular aspect, feel free to ask!";
    }
    
    return {
      status: 'ok',
      response: response
    };
  }
}

// Export the ApiService class
window.ApiService = ApiService;
