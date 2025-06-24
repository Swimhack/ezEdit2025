/**
 * EzEdit File Explorer
 * Handles file tree navigation, file operations, and integration with FTP service
 */

window.ezEdit = window.ezEdit || {};

window.ezEdit.fileExplorer = (function() {
  // Private variables
  const ftpService = window.ezEdit.ftpService;
  const memoryService = new MemoryService();
  
  // DOM elements
  let fileTree;
  let breadcrumb;
  let currentPath = '/';
  let expandedFolders = [];
  
  // File operations
  let selectedFile = null;
  let clipboard = {
    action: null, // 'copy' or 'cut'
    path: null
  };
  
  /**
   * Initialize the file explorer
   * @param {string} containerId - ID of the container element
   * @param {string} breadcrumbId - ID of the breadcrumb element
   */
  function initialize(containerId = 'file-tree', breadcrumbId = 'file-explorer-breadcrumb') {
    fileTree = document.getElementById(containerId);
    breadcrumb = document.getElementById(breadcrumbId);
    
    if (!fileTree) {
      console.error('File tree container not found');
      return;
    }
    
    // Load expanded folders from memory
    const editorState = memoryService.getEditorState();
    if (editorState && editorState.expandedFolders) {
      expandedFolders = editorState.expandedFolders;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial load of root directory
    loadDirectory(currentPath);
  }
  
  /**
   * Set up event listeners for file explorer
   */
  function setupEventListeners() {
    // Delegate click events on file tree
    fileTree.addEventListener('click', handleFileTreeClick);
    
    // New file button
    const newFileBtn = document.getElementById('new-file');
    if (newFileBtn) {
      newFileBtn.addEventListener('click', () => createNewFile(currentPath));
    }
    
    // New folder button
    const newFolderBtn = document.getElementById('new-folder');
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', () => createNewFolder(currentPath));
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-files');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => loadDirectory(currentPath));
    }
    
    // Context menu for right-click
    fileTree.addEventListener('contextmenu', handleContextMenu);
    
    // Close context menu when clicking elsewhere
    document.addEventListener('click', () => {
      const contextMenu = document.querySelector('.context-menu');
      if (contextMenu) {
        contextMenu.remove();
      }
    });
  }
  
  /**
   * Handle click events on the file tree
   * @param {Event} e - Click event
   */
  function handleFileTreeClick(e) {
    const target = e.target.closest('.tree-item-header');
    if (!target) return;
    
    const treeItem = target.closest('.tree-item');
    if (!treeItem) return;
    
    // Handle folder clicks
    if (treeItem.classList.contains('folder')) {
      toggleFolder(treeItem);
    } 
    // Handle file clicks
    else if (treeItem.classList.contains('file')) {
      selectFile(treeItem);
    }
  }
  
  /**
   * Toggle folder expansion
   * @param {HTMLElement} folderElement - Folder element to toggle
   */
  function toggleFolder(folderElement) {
    const isExpanded = folderElement.classList.contains('expanded');
    const folderPath = folderElement.dataset.path;
    
    if (isExpanded) {
      // Collapse folder
      folderElement.classList.remove('expanded');
      
      // Remove from expanded folders list
      const index = expandedFolders.indexOf(folderPath);
      if (index !== -1) {
        expandedFolders.splice(index, 1);
      }
    } else {
      // Expand folder
      folderElement.classList.add('expanded');
      
      // Add to expanded folders list
      if (!expandedFolders.includes(folderPath)) {
        expandedFolders.push(folderPath);
      }
      
      // Load folder contents if not already loaded
      const childList = folderElement.querySelector('ul');
      if (!childList || childList.children.length === 0) {
        loadDirectory(folderPath, folderElement);
      }
    }
    
    // Save expanded folders state
    memoryService.setEditorState({ expandedFolders });
  }
  
  /**
   * Select a file
   * @param {HTMLElement} fileElement - File element to select
   */
  function selectFile(fileElement) {
    // Remove active class from previously selected file
    const activeFile = fileTree.querySelector('.file.active');
    if (activeFile) {
      activeFile.classList.remove('active');
    }
    
    // Add active class to selected file
    fileElement.classList.add('active');
    
    // Store selected file path
    selectedFile = fileElement.dataset.path;
    
    // Trigger file open event
    const event = new CustomEvent('fileSelected', {
      detail: {
        path: selectedFile,
        name: fileElement.querySelector('span').textContent
      }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Load directory contents
   * @param {string} path - Directory path to load
   * @param {HTMLElement} parentElement - Parent element to append children to
   */
  async function loadDirectory(path, parentElement = null) {
    try {
      // Show loading indicator
      if (parentElement) {
        const loadingEl = document.createElement('li');
        loadingEl.className = 'tree-item loading';
        loadingEl.innerHTML = '<div class="tree-item-header"><span>Loading...</span></div>';
        parentElement.querySelector('ul') || parentElement.appendChild(document.createElement('ul'));
        parentElement.querySelector('ul').appendChild(loadingEl);
      } else {
        fileTree.innerHTML = '<div class="loading-indicator">Loading files...</div>';
      }
      
      // Update current path if this is a top-level load
      if (!parentElement) {
        currentPath = path;
        updateBreadcrumb(path);
      }
      
      // Get directory listing from FTP service
      const result = await ftpService.listDirectory(path);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load directory');
      }
      
      // Sort items: directories first, then files, both alphabetically
      const sortedItems = result.items.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
      
      // Create HTML for directory listing
      const html = createDirectoryHTML(sortedItems, path);
      
      // Update DOM
      if (parentElement) {
        // Remove loading indicator
        const loadingEl = parentElement.querySelector('.loading');
        if (loadingEl) loadingEl.remove();
        
        // Create ul if it doesn't exist
        let ul = parentElement.querySelector('ul');
        if (!ul) {
          ul = document.createElement('ul');
          parentElement.appendChild(ul);
        }
        
        // Add items
        ul.innerHTML = html;
      } else {
        // Replace entire tree
        fileTree.innerHTML = `<ul class="tree-root">${html}</ul>`;
      }
      
      // Restore expanded state for folders
      if (expandedFolders.length > 0) {
        const folders = fileTree.querySelectorAll('.tree-item.folder');
        folders.forEach(folder => {
          const folderPath = folder.dataset.path;
          if (expandedFolders.includes(folderPath)) {
            folder.classList.add('expanded');
            // Lazy load contents if needed
            if (!folder.querySelector('ul') || folder.querySelector('ul').children.length === 0) {
              loadDirectory(folderPath, folder);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading directory:', error);
      
      // Show error message
      const errorMessage = `<div class="error-message">Error loading files: ${error.message}</div>`;
      
      if (parentElement) {
        // Remove loading indicator
        const loadingEl = parentElement.querySelector('.loading');
        if (loadingEl) loadingEl.remove();
        
        // Create ul if it doesn't exist
        let ul = parentElement.querySelector('ul');
        if (!ul) {
          ul = document.createElement('ul');
          parentElement.appendChild(ul);
        }
        
        // Add error message
        ul.innerHTML = errorMessage;
      } else {
        // Replace entire tree
        fileTree.innerHTML = errorMessage;
      }
    }
  }
  
  /**
   * Create HTML for directory listing
   * @param {Array} items - Directory items
   * @param {string} parentPath - Parent directory path
   * @returns {string} - HTML string
   */
  function createDirectoryHTML(items, parentPath) {
    return items.map(item => {
      const itemPath = `${parentPath}/${item.name}`.replace(/\/+/g, '/');
      const isDirectory = item.type === 'directory';
      const itemClass = isDirectory ? 'tree-item folder' : 'tree-item file';
      const icon = isDirectory ? 
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' : 
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
      
      return `
        <li class="${itemClass}" data-path="${itemPath}" data-name="${item.name}">
          <div class="tree-item-header">
            ${icon}
            <span>${item.name}</span>
          </div>
          ${isDirectory ? '<ul></ul>' : ''}
        </li>
      `;
    }).join('');
  }
  
  /**
   * Update breadcrumb navigation
   * @param {string} path - Current path
   */
  function updateBreadcrumb(path) {
    if (!breadcrumb) return;
    
    // Split path into segments
    const segments = path.split('/').filter(segment => segment);
    
    // Create HTML for breadcrumb
    let html = '<span class="breadcrumb-item" data-path="/">Root</span>';
    let currentPath = '';
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      html += `<span class="breadcrumb-separator">/</span>
               <span class="breadcrumb-item" data-path="${currentPath}">${segment}</span>`;
    });
    
    // Update DOM
    breadcrumb.innerHTML = html;
    
    // Add click event listeners to breadcrumb items
    const breadcrumbItems = breadcrumb.querySelectorAll('.breadcrumb-item');
    breadcrumbItems.forEach(item => {
      item.addEventListener('click', () => {
        loadDirectory(item.dataset.path);
      });
    });
  }
  
  /**
   * Handle context menu for file/folder operations
   * @param {Event} e - Context menu event
   */
  function handleContextMenu(e) {
    e.preventDefault();
    
    // Get clicked item
    const target = e.target.closest('.tree-item');
    if (!target) return;
    
    // Remove existing context menu
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    // Get item details
    const itemPath = target.dataset.path;
    const itemName = target.dataset.name;
    const isDirectory = target.classList.contains('folder');
    
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.style.left = `${e.pageX}px`;
    
    // Add menu items based on item type
    if (isDirectory) {
      contextMenu.innerHTML = `
        <div class="context-menu-item" data-action="open" data-path="${itemPath}">Open</div>
        <div class="context-menu-item" data-action="new-file" data-path="${itemPath}">New File</div>
        <div class="context-menu-item" data-action="new-folder" data-path="${itemPath}">New Folder</div>
        <div class="context-menu-item" data-action="rename" data-path="${itemPath}">Rename</div>
        <div class="context-menu-item" data-action="delete" data-path="${itemPath}">Delete</div>
      `;
    } else {
      contextMenu.innerHTML = `
        <div class="context-menu-item" data-action="open" data-path="${itemPath}">Open</div>
        <div class="context-menu-item" data-action="rename" data-path="${itemPath}">Rename</div>
        <div class="context-menu-item" data-action="delete" data-path="${itemPath}">Delete</div>
      `;
    }
    
    // Add to DOM
    document.body.appendChild(contextMenu);
    
    // Add event listeners to menu items
    const menuItems = contextMenu.querySelectorAll('.context-menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        const path = item.dataset.path;
        
        // Handle actions
        switch (action) {
          case 'open':
            if (isDirectory) {
              loadDirectory(path);
            } else {
              selectFile(target);
            }
            break;
          case 'new-file':
            createNewFile(path);
            break;
          case 'new-folder':
            createNewFolder(path);
            break;
          case 'rename':
            renameItem(path, isDirectory);
            break;
          case 'delete':
            deleteItem(path, isDirectory);
            break;
        }
        
        // Remove context menu
        contextMenu.remove();
      });
    });
    
    // Close context menu when clicking elsewhere
    document.addEventListener('click', () => {
      contextMenu.remove();
    }, { once: true });
  }
  
  /**
   * Create a new file
   * @param {string} parentPath - Parent directory path
   */
  async function createNewFile(parentPath) {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;
    
    const filePath = `${parentPath}/${fileName}`.replace(/\/+/g, '/');
    
    try {
      // Create empty file
      const result = await ftpService.uploadFile(filePath, '');
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create file');
      }
      
      // Reload directory
      loadDirectory(parentPath);
      
      // Show success message
      showNotification(`File ${fileName} created successfully`, 'success');
    } catch (error) {
      console.error('Error creating file:', error);
      showNotification(`Error creating file: ${error.message}`, 'error');
    }
  }
  
  /**
   * Create a new folder
   * @param {string} parentPath - Parent directory path
   */
  async function createNewFolder(parentPath) {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    
    const folderPath = `${parentPath}/${folderName}`.replace(/\/+/g, '/');
    
    try {
      // Create directory
      const result = await ftpService.createDirectory(folderPath);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create folder');
      }
      
      // Reload directory
      loadDirectory(parentPath);
      
      // Show success message
      showNotification(`Folder ${folderName} created successfully`, 'success');
    } catch (error) {
      console.error('Error creating folder:', error);
      showNotification(`Error creating folder: ${error.message}`, 'error');
    }
  }
  
  /**
   * Rename a file or folder
   * @param {string} path - Path to rename
   * @param {boolean} isDirectory - Whether the path is a directory
   */
  async function renameItem(path, isDirectory) {
    const name = path.split('/').pop();
    const parentPath = path.substring(0, path.lastIndexOf('/'));
    
    const newName = prompt(`Rename ${isDirectory ? 'folder' : 'file'}:`, name);
    if (!newName || newName === name) return;
    
    const newPath = `${parentPath}/${newName}`.replace(/\/+/g, '/');
    
    try {
      // Rename item
      const result = await ftpService.renameItem(path, newPath);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to rename item');
      }
      
      // Reload directory
      loadDirectory(parentPath);
      
      // Show success message
      showNotification(`${isDirectory ? 'Folder' : 'File'} renamed successfully`, 'success');
    } catch (error) {
      console.error('Error renaming item:', error);
      showNotification(`Error renaming item: ${error.message}`, 'error');
    }
  }
  
  /**
   * Delete a file or folder
   * @param {string} path - Path to delete
   * @param {boolean} isDirectory - Whether the path is a directory
   */
  async function deleteItem(path, isDirectory) {
    const name = path.split('/').pop();
    const parentPath = path.substring(0, path.lastIndexOf('/'));
    
    const confirmed = confirm(`Are you sure you want to delete ${isDirectory ? 'folder' : 'file'} "${name}"?`);
    if (!confirmed) return;
    
    try {
      // Delete item
      const result = await ftpService.deleteItem(path, isDirectory);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete item');
      }
      
      // Reload directory
      loadDirectory(parentPath);
      
      // Show success message
      showNotification(`${isDirectory ? 'Folder' : 'File'} deleted successfully`, 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      showNotification(`Error deleting item: ${error.message}`, 'error');
    }
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
  
  // Public API
  return {
    initialize,
    loadDirectory,
    getCurrentPath: () => currentPath,
    getSelectedFile: () => selectedFile
  };
})();
