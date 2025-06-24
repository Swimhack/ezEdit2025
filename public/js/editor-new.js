/**
 * EzEdit Editor JavaScript
 * Handles Monaco editor integration, file operations, and FTP functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const fileExplorer = document.getElementById('file-explorer');
  const fileTree = document.getElementById('file-tree');
  const monacoContainer = document.getElementById('monaco-editor');
  const aiSidebar = document.getElementById('ai-sidebar');
  const previewPanel = document.getElementById('preview-panel');
  const toggleAiBtn = document.getElementById('toggle-ai');
  const closeAiBtn = document.getElementById('close-ai');
  const togglePreviewBtn = document.getElementById('toggle-preview');
  const closePreviewBtn = document.getElementById('close-preview');
  const saveFileBtn = document.getElementById('save-file');
  const refreshPreviewBtn = document.getElementById('refresh-preview');
  const previewIframe = document.getElementById('preview-iframe');
  const aiPromptInput = document.getElementById('ai-prompt');
  const sendPromptBtn = document.getElementById('send-prompt');
  const aiMessages = document.getElementById('ai-messages');
  const upgradeModal = document.getElementById('upgrade-modal');
  const closeUpgradeModalBtn = document.getElementById('close-upgrade-modal');
  const saveSuccessModal = document.getElementById('save-success-modal');
  const closeSaveModalBtn = document.getElementById('close-save-modal');
  const closeSuccessBtn = document.getElementById('close-success-btn');
  const upgradeBtn = document.getElementById('upgrade-btn');
  
  // State
  let editor = null;
  let originalModel = null;
  let modifiedModel = null;
  let currentFile = {
    path: '/index.html',
    content: '',
    originalContent: ''
  };
  let userPlan = 'free-trial'; // 'free-trial' or 'pro'
  
  // Initialize the editor
  function initEditor() {
    // Set user email in header
    const userEmailElements = document.querySelectorAll('.user-email');
    const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
    userEmailElements.forEach(el => {
      el.textContent = userEmail;
    });
    
    // Load Monaco editor
    loadMonacoEditor();
    
    // Set up event listeners
    setupEventListeners();
    
    // Connect to FTP and load file tree
    connectToFtp();
  }
  
  // Load Monaco editor
  function loadMonacoEditor() {
    // Configure Monaco loader
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
    
    require(['vs/editor/editor.main'], function() {
      // Create original model (left side - original file)
      originalModel = monaco.editor.createModel('', 'html');
      
      // Create modified model (right side - editable)
      modifiedModel = monaco.editor.createModel('', 'html');
      
      // Create diff editor
      editor = monaco.editor.createDiffEditor(monacoContainer, {
        automaticLayout: true,
        originalEditable: false,
        renderSideBySide: true,
        theme: isDarkTheme() ? 'vs-dark' : 'vs',
        fontSize: 14,
        tabSize: 2,
        insertSpaces: true,
        minimap: {
          enabled: false
        }
      });
      
      // Set models
      editor.setModel({
        original: originalModel,
        modified: modifiedModel
      });
      
      // Add change listener
      modifiedModel.onDidChangeContent(() => {
        // Enable save button if content changed
        if (modifiedModel.getValue() !== originalModel.getValue()) {
          saveFileBtn.classList.add('active');
        } else {
          saveFileBtn.classList.remove('active');
        }
      });
    });
  }
  
  // Connect to FTP server
  async function connectToFtp() {
    try {
      const result = await window.ezEdit.ftpService.connect();
      if (result.success) {
        // Load file tree
        loadFileTree();
      } else {
        console.error('Failed to connect to FTP server:', result.error);
        // Show error toast
        window.ezEdit.ui.showToast('Failed to connect to FTP server', 'error');
      }
    } catch (error) {
      console.error('FTP connection error:', error);
      window.ezEdit.ui.showToast('FTP connection error', 'error');
    }
  }
  
  // Load file tree from FTP
  async function loadFileTree() {
    try {
      const result = await window.ezEdit.ftpService.listDirectory('/');
      if (result.success) {
        // Clear existing tree
        fileTree.innerHTML = '';
        
        // Build tree from result
        result.items.forEach(item => {
          const li = document.createElement('li');
          li.className = `tree-item ${item.type}`;
          li.dataset.path = `${result.path === '/' ? '' : result.path}/${item.name}`;
          li.dataset.type = item.type;
          
          const icon = document.createElement('span');
          icon.className = `icon ${item.type}-icon`;
          li.appendChild(icon);
          
          const name = document.createElement('span');
          name.className = 'name';
          name.textContent = item.name;
          li.appendChild(name);
          
          fileTree.appendChild(li);
        });
        
        // Setup file tree listeners
        setupFileTreeListeners();
        
        // Load default file
        if (result.items.length > 0) {
          const defaultFile = result.items.find(item => item.type === 'file') || result.items[0];
          loadFileContent(`${result.path === '/' ? '' : result.path}/${defaultFile.name}`);
        }
      } else {
        console.error('Failed to load file tree:', result.error);
        window.ezEdit.ui.showToast('Failed to load file tree', 'error');
      }
    } catch (error) {
      console.error('File tree loading error:', error);
      window.ezEdit.ui.showToast('File tree loading error', 'error');
    }
  }

  // Set up event listeners
  function setupEventListeners() {
    // Toggle AI sidebar
    toggleAiBtn.addEventListener('click', () => {
      aiSidebar.classList.toggle('open');
      // Close preview if AI is opened
      if (aiSidebar.classList.contains('open')) {
        previewPanel.classList.remove('open');
      }
    });
    
    // Close AI sidebar
    closeAiBtn.addEventListener('click', () => {
      aiSidebar.classList.remove('open');
    });
    
    // Toggle preview panel
    togglePreviewBtn.addEventListener('click', () => {
      previewPanel.classList.toggle('open');
      // Close AI if preview is opened
      if (previewPanel.classList.contains('open')) {
        aiSidebar.classList.remove('open');
      }
      // Update preview
      updatePreview();
    });
    
    // Close preview panel
    closePreviewBtn.addEventListener('click', () => {
      previewPanel.classList.remove('open');
    });
    
    // Save file
    saveFileBtn.addEventListener('click', () => {
      saveFile();
    });
    
    // Refresh preview
    refreshPreviewBtn.addEventListener('click', () => {
      updatePreview();
    });
    
    // Send AI prompt
    sendPromptBtn.addEventListener('click', () => {
      sendAiPrompt();
    });
    
    // AI prompt input - send on Enter
    aiPromptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAiPrompt();
      }
    });
    
    // Close upgrade modal
    closeUpgradeModalBtn.addEventListener('click', () => {
      upgradeModal.classList.remove('open');
    });
    
    // Close save success modal
    closeSaveModalBtn.addEventListener('click', () => {
      saveSuccessModal.classList.remove('open');
    });
    
    // Close success button
    closeSuccessBtn.addEventListener('click', () => {
      saveSuccessModal.classList.remove('open');
    });
    
    // Upgrade button
    upgradeBtn.addEventListener('click', () => {
      // In a real app, this would redirect to a payment page
      window.ezEdit.ui.showToast('Redirecting to payment page...', 'info');
      upgradeModal.classList.remove('open');
    });
    
    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
  }
  
  // Setup file tree listeners
  function setupFileTreeListeners() {
    const treeItems = fileTree.querySelectorAll('.tree-item');
    
    treeItems.forEach(item => {
      item.addEventListener('click', () => {
        // If folder, toggle expand/collapse
        if (item.classList.contains('folder')) {
          item.classList.toggle('expanded');
        } else {
          // If file, load content
          const filePath = item.dataset.path;
          loadFileContent(filePath);
          
          // Mark as selected
          treeItems.forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
        }
      });
    });
  }
  
  // Get file path from tree item
  function getFilePath(treeItem) {
    // Get path from data attribute
    return treeItem.dataset.path;
  }
  
  // Load file content
  async function loadFileContent(filePath) {
    try {
      // Show loading indicator
      monacoContainer.classList.add('loading');
      
      // Get file content from FTP
      const result = await window.ezEdit.ftpService.getFile(filePath);
      
      if (result.success) {
        // Update current file
        currentFile.path = filePath;
        currentFile.originalContent = result.content;
        currentFile.content = result.content;
        
        // Update file path display
        const filePathDisplay = document.querySelector('.file-path span');
        if (filePathDisplay) {
          filePathDisplay.textContent = filePath;
        }
        
        // Update editor models
        if (originalModel && modifiedModel) {
          originalModel.setValue(result.content);
          modifiedModel.setValue(result.content);
          
          // Update language
          monaco.editor.setModelLanguage(originalModel, getLanguageFromPath(filePath));
          monaco.editor.setModelLanguage(modifiedModel, getLanguageFromPath(filePath));
        }
        
        // Update preview
        updatePreview();
        
        // Reset save button
        saveFileBtn.classList.remove('active');
      } else {
        console.error('Failed to load file:', result.error);
        window.ezEdit.ui.showToast('Failed to load file: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('File loading error:', error);
      window.ezEdit.ui.showToast('File loading error', 'error');
    } finally {
      // Hide loading indicator
      monacoContainer.classList.remove('loading');
    }
  }
  
  // Get language from file path
  function getLanguageFromPath(path) {
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.js')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.md')) return 'markdown';
    if (path.endsWith('.php')) return 'php';
    return 'plaintext';
  }
  
  // Update preview
  function updatePreview() {
    if (!previewIframe) return;
    
    // Get current content
    const content = modifiedModel ? modifiedModel.getValue() : '';
    
    // Write to iframe
    const doc = previewIframe.contentDocument || previewIframe.contentWindow.document;
    doc.open();
    doc.write(content);
    doc.close();
  }
  
  // Save file
  async function saveFile() {
    // Check if user is on free trial
    if (userPlan === 'free-trial') {
      // Show upgrade modal
      upgradeModal.classList.add('open');
      return;
    }
    
    try {
      // Show saving indicator
      saveFileBtn.classList.add('saving');
      saveFileBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
        Saving...
      `;
      
      // Get content from modified model
      const content = modifiedModel.getValue();
      
      // Save to FTP
      const result = await window.ezEdit.ftpService.saveFile(currentFile.path, content);
      
      if (result.success) {
        // Update current file content
        currentFile.originalContent = content;
        originalModel.setValue(content);
        
        // Reset save button
        saveFileBtn.classList.remove('active');
        
        // Show success modal
        saveSuccessModal.classList.add('open');
        
        // Update preview
        updatePreview();
      } else {
        console.error('Failed to save file:', result.error);
        window.ezEdit.ui.showToast('Failed to save file: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('File saving error:', error);
      window.ezEdit.ui.showToast('File saving error', 'error');
    } finally {
      // Reset save button UI
      saveFileBtn.classList.remove('saving');
      saveFileBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        Save
      `;
    }
  }
  
  // Send AI prompt
  function sendAiPrompt() {
    const prompt = aiPromptInput.value.trim();
    if (!prompt) return;
    
    // Add user message
    addAiMessage('user', prompt);
    
    // Clear input
    aiPromptInput.value = '';
    
    // Show thinking indicator
    addAiThinkingIndicator();
    
    // In a real app, we would send to the OpenAI API
    // For demo, we'll simulate a response
    setTimeout(() => {
      // Remove thinking indicator
      const thinkingIndicator = aiMessages.querySelector('.ai-thinking');
      if (thinkingIndicator) {
        thinkingIndicator.remove();
      }
      
      // Generate response based on prompt
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
      
      // Add AI response
      addAiMessage('ai', response);
      
      // Scroll to bottom
      aiMessages.scrollTop = aiMessages.scrollHeight;
    }, 2000);
  }
  
  // Add AI message
  function addAiMessage(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'ai-message';
    
    if (type === 'user') {
      messageDiv.innerHTML = `
        <div class="ai-avatar user-avatar">U</div>
        <div class="ai-content user-content">
          <p>${content}</p>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="ai-avatar">K</div>
        <div class="ai-content">
          <p>${content.replace(/\n/g, '</p><p>')}</p>
        </div>
      `;
    }
    
    aiMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }
  
  // Add AI thinking indicator
  function addAiThinkingIndicator() {
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'ai-message ai-thinking';
    thinkingDiv.innerHTML = `
      <div class="ai-avatar">K</div>
      <div class="ai-content">
        <div class="thinking-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    aiMessages.appendChild(thinkingDiv);
    
    // Scroll to bottom
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }
  
  // Toggle theme (light/dark)
  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    
    // Update editor theme
    if (editor) {
      monaco.editor.setTheme(isDarkTheme() ? 'vs-dark' : 'vs');
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkTheme', isDarkTheme());
  }
  
  // Check if dark theme is active
  function isDarkTheme() {
    return document.body.classList.contains('dark-mode');
  }
  
  // Check for saved theme preference
  function loadThemePreference() {
    const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
    if (isDarkTheme) {
      document.body.classList.add('dark-mode');
    }
  }
  
  // Initialize
  loadThemePreference();
  initEditor();
});
