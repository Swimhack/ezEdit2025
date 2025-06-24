/**
 * EzEdit Monaco Editor Integration
 * Handles loading Monaco editor, file editing, and diff view
 */

window.ezEdit = window.ezEdit || {};

window.ezEdit.monacoEditor = (function() {
  // Private variables
  const ftpService = window.ezEdit.ftpService;
  const memoryService = new MemoryService();
  
  // Editor instances
  let originalEditor = null;
  let modifiedEditor = null;
  let diffEditor = null;
  
  // Current file state
  let currentFile = {
    path: null,
    name: null,
    originalContent: '',
    modifiedContent: '',
    language: 'plaintext',
    isDirty: false
  };
  
  // User preferences
  const defaultPreferences = {
    theme: 'vs',
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'on',
    minimap: true,
    lineNumbers: true
  };
  
  let editorPreferences = { ...defaultPreferences };
  
  /**
   * Initialize Monaco editor
   * @param {string} containerId - ID of the container element
   */
  async function initialize(containerId = 'monaco-editor') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Editor container not found');
      return;
    }
    
    // Load user preferences
    loadPreferences();
    
    // Create loading indicator
    container.innerHTML = '<div class="loading-indicator">Loading editor...</div>';
    
    try {
      // Load Monaco from CDN if not already loaded
      if (!window.monaco) {
        await loadMonaco();
      }
      
      // Create diff editor
      diffEditor = monaco.editor.createDiffEditor(container, {
        theme: editorPreferences.theme,
        fontSize: editorPreferences.fontSize,
        tabSize: editorPreferences.tabSize,
        wordWrap: editorPreferences.wordWrap,
        minimap: { enabled: editorPreferences.minimap },
        lineNumbers: editorPreferences.lineNumbers ? 'on' : 'off',
        automaticLayout: true,
        renderSideBySide: true,
        readOnly: false
      });
      
      // Get original and modified editors
      originalEditor = diffEditor.getOriginalEditor();
      modifiedEditor = diffEditor.getModifiedEditor();
      
      // Set up event listeners
      setupEventListeners();
      
      // Create empty models
      setEditorContent('', '');
      
      // Check for last opened file
      const editorState = memoryService.getEditorState();
      if (editorState && editorState.lastOpenedFile) {
        openFile(editorState.lastOpenedFile);
      }
      
      // Show success message
      showNotification('Editor loaded successfully', 'success');
    } catch (error) {
      console.error('Error initializing editor:', error);
      container.innerHTML = `<div class="error-message">Error loading editor: ${error.message}</div>`;
      showNotification('Error loading editor', 'error');
    }
  }
  
  /**
   * Load Monaco editor from CDN
   * @returns {Promise} - Promise that resolves when Monaco is loaded
   */
  function loadMonaco() {
    return new Promise((resolve, reject) => {
      // Check if Monaco is already loaded
      if (window.monaco) {
        resolve();
        return;
      }
      
      // Load Monaco
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs/loader.min.js';
      script.onload = () => {
        require.config({
          paths: {
            'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs'
          }
        });
        
        require(['vs/editor/editor.main'], () => {
          resolve();
        });
      };
      script.onerror = () => {
        reject(new Error('Failed to load Monaco editor'));
      };
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Listen for file selection events
    document.addEventListener('fileSelected', (e) => {
      openFile(e.detail.path);
    });
    
    // Listen for save button clicks
    const saveButton = document.getElementById('save-file');
    if (saveButton) {
      saveButton.addEventListener('click', saveFile);
    }
    
    // Listen for editor content changes
    modifiedEditor.onDidChangeModelContent(() => {
      if (currentFile.path) {
        currentFile.modifiedContent = modifiedEditor.getValue();
        currentFile.isDirty = currentFile.originalContent !== currentFile.modifiedContent;
        updateSaveButton();
      }
    });
    
    // Listen for preview toggle
    const previewToggle = document.getElementById('toggle-preview');
    if (previewToggle) {
      previewToggle.addEventListener('click', togglePreview);
    }
    
    // Listen for AI assistant toggle
    const aiToggle = document.getElementById('toggle-ai');
    if (aiToggle) {
      aiToggle.addEventListener('click', toggleAIAssistant);
    }
    
    // Add keyboard shortcut for save (Ctrl+S)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    });
  }
  
  /**
   * Open a file in the editor
   * @param {string} path - File path to open
   */
  async function openFile(path) {
    if (!path) return;
    
    try {
      // Show loading indicator
      showNotification('Loading file...', 'info');
      
      // Get file content from FTP service
      const result = await ftpService.downloadFile(path);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to open file');
      }
      
      // Get file name and extension
      const fileName = path.split('/').pop();
      const fileExtension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
      
      // Determine language based on file extension
      const language = getLanguageFromExtension(fileExtension);
      
      // Update current file
      currentFile = {
        path,
        name: fileName,
        originalContent: result.content,
        modifiedContent: result.content,
        language,
        isDirty: false
      };
      
      // Set editor content
      setEditorContent(currentFile.originalContent, currentFile.modifiedContent, language);
      
      // Update file path display
      updateFilePath(path);
      
      // Save last opened file
      memoryService.setEditorState({ lastOpenedFile: path });
      
      // Update save button
      updateSaveButton();
      
      // Show success message
      showNotification(`File ${fileName} opened successfully`, 'success');
      
      // Update preview if it's visible
      updatePreview();
    } catch (error) {
      console.error('Error opening file:', error);
      showNotification(`Error opening file: ${error.message}`, 'error');
    }
  }
  
  /**
   * Set editor content
   * @param {string} originalContent - Original content
   * @param {string} modifiedContent - Modified content
   * @param {string} language - Language mode
   */
  function setEditorContent(originalContent, modifiedContent, language = 'plaintext') {
    // Create models
    const originalModel = monaco.editor.createModel(originalContent, language);
    const modifiedModel = monaco.editor.createModel(modifiedContent, language);
    
    // Set models
    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel
    });
  }
  
  /**
   * Save the current file
   */
  async function saveFile() {
    if (!currentFile.path || !currentFile.isDirty) return;
    
    // Check if user has Pro plan
    const userProfile = await checkUserPlan();
    if (userProfile.plan !== 'pro') {
      showUpgradeModal();
      return;
    }
    
    try {
      // Show loading indicator
      showNotification('Saving file...', 'info');
      
      // Get current content
      const content = modifiedEditor.getValue();
      
      // Save file using FTP service
      const result = await ftpService.uploadFile(currentFile.path, content);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save file');
      }
      
      // Update current file
      currentFile.originalContent = content;
      currentFile.modifiedContent = content;
      currentFile.isDirty = false;
      
      // Update editor content
      setEditorContent(currentFile.originalContent, currentFile.modifiedContent, currentFile.language);
      
      // Update save button
      updateSaveButton();
      
      // Show success message
      showNotification(`File ${currentFile.name} saved successfully`, 'success');
      
      // Update preview if it's visible
      updatePreview();
    } catch (error) {
      console.error('Error saving file:', error);
      showNotification(`Error saving file: ${error.message}`, 'error');
    }
  }
  
  /**
   * Check user plan
   * @returns {Object} - User profile
   */
  async function checkUserPlan() {
    try {
      const supabaseService = new SupabaseService(memoryService);
      const profile = await supabaseService.getUserProfile();
      return profile || { plan: 'free-trial' };
    } catch (error) {
      console.error('Error checking user plan:', error);
      return { plan: 'free-trial' };
    }
  }
  
  /**
   * Show upgrade modal
   */
  function showUpgradeModal() {
    // Create modal HTML
    const modalHTML = `
      <div class="modal" id="upgrade-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Upgrade Required</h3>
            <button class="close-modal" aria-label="Close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="upgrade-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
              <p>You need a Pro plan to save changes to FTP sites.</p>
              <p>Free trial users can view and edit files, but cannot save changes.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" id="close-upgrade-modal">Continue in View Mode</button>
            <a href="/pricing.html" class="btn btn-primary">Upgrade to Pro</a>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get modal element
    const modal = document.getElementById('upgrade-modal');
    
    // Show modal
    modal.classList.add('show');
    
    // Add event listeners
    const closeButtons = modal.querySelectorAll('.close-modal, #close-upgrade-modal');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
          modal.remove();
        }, 300);
      });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        setTimeout(() => {
          modal.remove();
        }, 300);
      }
    });
  }
  
  /**
   * Update file path display
   * @param {string} path - File path
   */
  function updateFilePath(path) {
    const filePathElement = document.querySelector('.file-path');
    if (filePathElement) {
      filePathElement.textContent = path;
    }
  }
  
  /**
   * Update save button state
   */
  function updateSaveButton() {
    const saveButton = document.getElementById('save-file');
    if (saveButton) {
      if (currentFile.isDirty) {
        saveButton.classList.add('btn-accent');
        saveButton.classList.remove('btn-outline');
      } else {
        saveButton.classList.remove('btn-accent');
        saveButton.classList.add('btn-outline');
      }
    }
  }
  
  /**
   * Toggle preview pane
   */
  function togglePreview() {
    const previewPane = document.getElementById('preview-pane');
    const editorContainer = document.querySelector('.editor-container');
    
    if (!previewPane) {
      // Create preview pane
      const previewHTML = `
        <div id="preview-pane" class="preview-pane">
          <div class="preview-header">
            <h3>Preview</h3>
            <div class="preview-actions">
              <button class="btn-icon" id="refresh-preview" title="Refresh Preview">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              </button>
              <button class="btn-icon" id="close-preview" title="Close Preview">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
          <div class="preview-content">
            <iframe id="preview-iframe" sandbox="allow-same-origin allow-scripts"></iframe>
          </div>
        </div>
      `;
      
      // Add preview pane to DOM
      editorContainer.insertAdjacentHTML('beforeend', previewHTML);
      
      // Add event listeners
      document.getElementById('refresh-preview').addEventListener('click', updatePreview);
      document.getElementById('close-preview').addEventListener('click', togglePreview);
      
      // Update layout
      editorContainer.classList.add('with-preview');
      
      // Update preview content
      updatePreview();
    } else {
      // Remove preview pane
      previewPane.remove();
      
      // Update layout
      editorContainer.classList.remove('with-preview');
    }
    
    // Trigger layout update for Monaco
    setTimeout(() => {
      if (diffEditor) {
        diffEditor.layout();
      }
    }, 300);
  }
  
  /**
   * Update preview content
   */
  function updatePreview() {
    const previewIframe = document.getElementById('preview-iframe');
    if (!previewIframe) return;
    
    // Only preview HTML files
    if (currentFile.path && currentFile.path.endsWith('.html')) {
      const content = modifiedEditor.getValue();
      
      // Create blob URL
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Set iframe src
      previewIframe.src = url;
      
      // Clean up blob URL when iframe loads
      previewIframe.onload = () => {
        URL.revokeObjectURL(url);
      };
    } else {
      // Show message for non-HTML files
      previewIframe.srcdoc = `
        <html>
          <body style="font-family: sans-serif; padding: 20px; color: #666;">
            <h3>Preview not available</h3>
            <p>Preview is only available for HTML files.</p>
          </body>
        </html>
      `;
    }
  }
  
  /**
   * Toggle AI assistant sidebar
   */
  function toggleAIAssistant() {
    const aiSidebar = document.getElementById('ai-sidebar');
    const editorMain = document.querySelector('.editor-main');
    
    if (aiSidebar) {
      aiSidebar.classList.toggle('expanded');
      editorMain.classList.toggle('with-ai');
      
      // Initialize AI assistant if expanded
      if (aiSidebar.classList.contains('expanded')) {
        if (window.ezEdit.aiAssistant) {
          window.ezEdit.aiAssistant.initialize();
        }
      }
      
      // Trigger layout update for Monaco
      setTimeout(() => {
        if (diffEditor) {
          diffEditor.layout();
        }
      }, 300);
    }
  }
  
  /**
   * Get language from file extension
   * @param {string} extension - File extension
   * @returns {string} - Language mode
   */
  function getLanguageFromExtension(extension) {
    const languageMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'json': 'json',
      'md': 'markdown',
      'php': 'php',
      'py': 'python',
      'rb': 'ruby',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'sql': 'sql',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sh': 'shell',
      'bash': 'shell',
      'txt': 'plaintext'
    };
    
    return languageMap[extension] || 'plaintext';
  }
  
  /**
   * Load user preferences
   */
  function loadPreferences() {
    const preferences = memoryService.getPreference('editorPreferences');
    if (preferences) {
      editorPreferences = { ...defaultPreferences, ...preferences };
    }
  }
  
  /**
   * Save user preferences
   */
  function savePreferences() {
    memoryService.setPreference('editorPreferences', editorPreferences);
  }
  
  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info)
   */
  function showNotification(message, type = 'info') {
    // Create custom event
    const event = new CustomEvent('showNotification', {
      detail: {
        message,
        type
      }
    });
    
    // Dispatch event
    document.dispatchEvent(event);
  }
  
  /**
   * Apply AI suggestion to editor
   * @param {string} suggestion - AI suggestion
   */
  function applyAISuggestion(suggestion) {
    if (!modifiedEditor || !currentFile.path) return;
    
    // Get current position
    const position = modifiedEditor.getPosition();
    
    // Insert suggestion at current position
    modifiedEditor.executeEdits('ai-suggestion', [{
      range: new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      ),
      text: suggestion
    }]);
    
    // Focus editor
    modifiedEditor.focus();
  }
  
  // Public API
  return {
    initialize,
    openFile,
    saveFile,
    getCurrentFile: () => currentFile,
    applyAISuggestion
  };
})();
