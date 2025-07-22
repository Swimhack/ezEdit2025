<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Settings - EzEdit</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="dashboard-page">
  <ez-header></ez-header>

  <main>
    <div class="container">
      <div class="flex items-center gap-3 mb-4">
        <a href="/dashboard.php" class="btn btn-outline">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Back to Dashboard
        </a>
        <h2>Site Settings</h2>
      </div>

      <div class="card" id="site-settings-card">
        <div class="card-header">
          <h3 class="card-title">FTP Connection Settings</h3>
        </div>
        <div class="card-body">
          <form id="site-settings-form" class="form-grid">
            <div class="form-group">
              <label for="site-name" class="form-label">Site Name</label>
              <input type="text" id="site-name" class="form-input" required>
            </div>
            
            <div class="form-group">
              <label for="ftp-host" class="form-label">FTP Host</label>
              <input type="text" id="ftp-host" class="form-input" placeholder="ftp.example.com" required>
            </div>
            
            <div class="form-group">
              <label for="ftp-port" class="form-label">Port</label>
              <input type="number" id="ftp-port" class="form-input" value="21" min="1" max="65535">
            </div>
            
            <div class="form-group">
              <label for="ftp-username" class="form-label">Username</label>
              <input type="text" id="ftp-username" class="form-input" required>
            </div>
            
            <div class="form-group">
              <label for="ftp-password" class="form-label">Password</label>
              <div class="password-field">
                <input type="password" id="ftp-password" class="form-input" required>
                <button type="button" class="btn-icon toggle-password" aria-label="Toggle password visibility">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
            </div>
            
            <div class="form-group">
              <label for="root-path" class="form-label">Root Path</label>
              <input type="text" id="root-path" class="form-input" placeholder="/public_html" value="/">
            </div>
            
            <div class="form-group">
              <label for="ftp-passive" class="form-label">Connection Mode</label>
              <div class="toggle-wrapper">
                <input type="checkbox" id="ftp-passive" checked>
                <label for="ftp-passive" class="toggle">Passive Mode</label>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-outline" id="test-connection">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><wifi></wifi></svg>
                Test Connection
              </button>
              <button type="submit" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="card mt-4">
        <div class="card-header">
          <h3 class="card-title">Site Actions</h3>
        </div>
        <div class="card-body">
          <div class="flex gap-3">
            <button class="btn btn-outline" id="backup-site">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download Backup
            </button>
            <button class="btn btn-outline text-error" id="delete-site">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Delete Site
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Delete Confirmation Modal -->
  <div class="modal" id="delete-modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Delete Site</h2>
        <button class="modal-close" id="close-delete-modal">×</button>
      </div>
      <div class="modal-body">
        <div class="error-container">
          <h4>⚠️ This action cannot be undone</h4>
          <p>Are you sure you want to delete this site? This will remove all stored credentials and settings.</p>
          <p><strong>Type "DELETE" to confirm:</strong></p>
          <input type="text" id="delete-confirmation" class="form-input" placeholder="Type DELETE">
        </div>
        <div class="form-actions mt-3">
          <button class="btn btn-outline" id="cancel-delete">Cancel</button>
          <button class="btn btn-primary" id="confirm-delete" disabled>Delete Site</button>
        </div>
      </div>
    </div>
  </div>

  <ez-footer></ez-footer>

  <!-- Scripts -->
  <script src="js/config.js"></script>
  <script src="js/php-auth-service.js"></script>
  <script src="js/ui-components.js"></script>
  <script src="components/header.js"></script>
  <script src="components/footer.js"></script>
  <script src="js/site-settings.js" defer></script>
</body>
</html>