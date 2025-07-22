// File Manager - Handle file upload/download operations
class FileManager {
  constructor() {
    this.currentPath = '/';
    this.connectionId = null;
    this.uploadQueue = [];
    this.isUploading = false;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDropZone();
  }

  setupEventListeners() {
    // File upload input
    const uploadInput = document.getElementById('file-upload');
    if (uploadInput) {
      uploadInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    // Upload button
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => this.triggerFileSelect());
    }

    // Download buttons (delegated event listening)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.download-file-btn')) {
        const filePath = e.target.dataset.filePath;
        this.downloadFile(filePath);
      }
    });

    // Batch upload button
    const batchUploadBtn = document.getElementById('batch-upload-btn');
    if (batchUploadBtn) {
      batchUploadBtn.addEventListener('click', () => this.processBatchUpload());
    }
  }

  setupDropZone() {
    const dropZone = document.getElementById('file-drop-zone');
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, this.preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
    });

    dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  triggerFileSelect() {
    const uploadInput = document.getElementById('file-upload');
    if (uploadInput) {
      uploadInput.click();
    }
  }

  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    this.addFilesToQueue(files);
  }

  handleDrop(e) {
    const dt = e.dataTransfer;
    const files = Array.from(dt.files);
    this.addFilesToQueue(files);
  }

  addFilesToQueue(files) {
    files.forEach(file => {
      if (this.validateFile(file)) {
        this.uploadQueue.push({
          file,
          path: this.currentPath + file.name,
          status: 'queued',
          progress: 0,
          id: this.generateId()
        });
      }
    });

    this.updateQueueDisplay();
    
    if (!this.isUploading) {
      this.processBatchUpload();
    }
  }

  validateFile(file) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'text/html', 'text/css', 'text/javascript', 'application/javascript',
      'text/plain', 'application/json', 'text/xml', 'application/xml',
      'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
      'application/pdf', 'application/zip'
    ];

    if (file.size > maxSize) {
      window.ezEdit.ui.showToast(`File ${file.name} is too large (max 50MB)`, 'error');
      return false;
    }

    if (!allowedTypes.includes(file.type) && !this.isTextFile(file.name)) {
      window.ezEdit.ui.showToast(`File type not supported: ${file.type}`, 'warning');
      return false;
    }

    return true;
  }

  isTextFile(filename) {
    const textExtensions = ['.txt', '.md', '.php', '.js', '.css', '.html', '.htm', '.json', '.xml', '.py', '.rb', '.go', '.rs'];
    return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  async processBatchUpload() {
    if (this.isUploading || this.uploadQueue.length === 0) return;

    this.isUploading = true;
    this.updateUploadButton(true);

    for (const upload of this.uploadQueue.filter(u => u.status === 'queued')) {
      await this.uploadFile(upload);
    }

    this.isUploading = false;
    this.updateUploadButton(false);
    
    // Clear completed uploads after 3 seconds
    setTimeout(() => {
      this.uploadQueue = this.uploadQueue.filter(u => u.status !== 'completed');
      this.updateQueueDisplay();
    }, 3000);
  }

  async uploadFile(upload) {
    try {
      upload.status = 'uploading';
      this.updateQueueDisplay();

      const authToken = window.ezEdit.authService.getToken();
      const formData = new FormData();
      formData.append('file', upload.file);
      formData.append('path', upload.path);
      formData.append('connectionId', this.connectionId);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          upload.progress = Math.round((e.loaded / e.total) * 100);
          this.updateQueueDisplay();
        }
      });

      const response = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        
        xhr.open('POST', '/api/ftp/upload');
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        xhr.send(formData);
      });

      if (response.success) {
        upload.status = 'completed';
        upload.progress = 100;
        window.ezEdit.ui.showToast(`${upload.file.name} uploaded successfully`, 'success');
      } else {
        throw new Error(response.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      upload.status = 'failed';
      upload.error = error.message;
      window.ezEdit.ui.showToast(`Failed to upload ${upload.file.name}: ${error.message}`, 'error');
    }

    this.updateQueueDisplay();
  }

  async downloadFile(filePath) {
    try {
      const authToken = window.ezEdit.authService.getToken();
      
      const response = await fetch('/api/ftp/download', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connectionId: this.connectionId,
          path: filePath
        })
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Get filename from path
      const filename = filePath.split('/').pop();
      
      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      window.ezEdit.ui.showToast(`${filename} downloaded successfully`, 'success');

    } catch (error) {
      console.error('Download error:', error);
      window.ezEdit.ui.showToast(`Failed to download file: ${error.message}`, 'error');
    }
  }

  updateQueueDisplay() {
    const queueContainer = document.getElementById('upload-queue');
    if (!queueContainer) return;

    if (this.uploadQueue.length === 0) {
      queueContainer.innerHTML = '<p class="text-muted">No files queued</p>';
      return;
    }

    const queueHtml = this.uploadQueue.map(upload => `
      <div class="upload-item ${upload.status}" data-id="${upload.id}">
        <div class="upload-info">
          <span class="file-name">${upload.file.name}</span>
          <span class="file-size">${this.formatFileSize(upload.file.size)}</span>
        </div>
        <div class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${upload.progress}%"></div>
          </div>
          <span class="progress-text">${upload.progress}%</span>
        </div>
        <div class="upload-status">
          ${this.getStatusIcon(upload.status)}
          <span>${upload.status}</span>
          ${upload.error ? `<span class="error-text">${upload.error}</span>` : ''}
        </div>
        ${upload.status === 'queued' || upload.status === 'failed' ? 
          `<button class="btn-icon remove-upload" data-id="${upload.id}">×</button>` : ''}
      </div>
    `).join('');

    queueContainer.innerHTML = queueHtml;

    // Add remove handlers
    queueContainer.querySelectorAll('.remove-upload').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uploadId = e.target.dataset.id;
        this.removeFromQueue(uploadId);
      });
    });
  }

  removeFromQueue(uploadId) {
    this.uploadQueue = this.uploadQueue.filter(upload => upload.id !== uploadId);
    this.updateQueueDisplay();
  }

  updateUploadButton(uploading) {
    const uploadBtn = document.getElementById('batch-upload-btn');
    if (!uploadBtn) return;

    if (uploading) {
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = `
        <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12l2 2 4-4"></path></svg>
        Uploading...
      `;
    } else {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        Upload Files
      `;
    }
  }

  getStatusIcon(status) {
    const icons = {
      queued: '⏳',
      uploading: '⬆️',
      completed: '✅',
      failed: '❌'
    };
    return icons[status] || '❓';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  setConnectionId(connectionId) {
    this.connectionId = connectionId;
  }

  setCurrentPath(path) {
    this.currentPath = path.endsWith('/') ? path : path + '/';
  }
}

// Export for use in other modules
window.FileManager = FileManager;