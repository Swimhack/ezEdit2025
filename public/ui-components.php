<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ezEdit UI Components</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    .component-section {
      margin-bottom: 3rem;
      padding: 2rem;
      border: 1px solid var(--clr-border);
      border-radius: 0.5rem;
      background-color: var(--clr-surface);
    }
    
    .component-title {
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--clr-border);
    }
    
    .component-demo {
      margin-bottom: 1.5rem;
    }
    
    .component-code {
      background-color: #f8fafc;
      padding: 1rem;
      border-radius: 0.375rem;
      font-family: var(--font-mono);
      font-size: 0.875rem;
      overflow-x: auto;
    }
    
    .color-swatch {
      display: inline-block;
      width: 100px;
      height: 100px;
      margin-right: 1rem;
      margin-bottom: 1rem;
      border-radius: 0.5rem;
      position: relative;
    }
    
    .color-swatch-label {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: rgba(255, 255, 255, 0.8);
      padding: 0.25rem;
      font-size: 0.75rem;
      text-align: center;
      border-bottom-left-radius: 0.5rem;
      border-bottom-right-radius: 0.5rem;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="container">
      <div class="flex justify-between items-center">
        <h1 class="logo">
          <a href="/">
            <span class="logo-icon">Ez</span> <span class="logo-text">Edit.co</span>
          </a>
        </h1>
        <nav class="nav-main">
          <a href="/dashboard.html">Dashboard</a>
          <a href="/editor.html">Editor</a>
          <a href="/settings.html">Settings</a>
        </nav>
        <div class="user-menu">
          <span class="user-email text-sm text-muted">user@example.com</span>
          <button class="theme-toggle" aria-label="Toggle dark mode">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  <main>
    <div class="container">
      <h1>ezEdit UI Component Library</h1>
      <p class="mb-4">This page documents the standard UI components used throughout the ezEdit application to ensure consistency.</p>
      
      <!-- Color Palette -->
      <section class="component-section" id="colors">
        <h2 class="component-title">Color Palette</h2>
        <div class="component-demo">
          <div class="color-swatch" style="background-color: var(--clr-primary);">
            <div class="color-swatch-label">Primary<br>#2563eb</div>
          </div>
          <div class="color-swatch" style="background-color: var(--clr-primary-light);">
            <div class="color-swatch-label">Primary Light<br>#3b82f6</div>
          </div>
          <div class="color-swatch" style="background-color: var(--clr-primary-dark);">
            <div class="color-swatch-label">Primary Dark<br>#1d4ed8</div>
          </div>
          <div class="color-swatch" style="background-color: var(--clr-accent);">
            <div class="color-swatch-label">Accent<br>#14b8a6</div>
          </div>
          <div class="color-swatch" style="background-color: var(--clr-bg);">
            <div class="color-swatch-label">Background<br>#f3f4f6</div>
          </div>
          <div class="color-swatch" style="background-color: var(--clr-surface);">
            <div class="color-swatch-label">Surface<br>#ffffff</div>
          </div>
          <div class="color-swatch" style="background-color: var(--clr-text); color: white;">
            <div class="color-swatch-label" style="color: black;">Text<br>#111827</div>
          </div>
          <div class="color-swatch" style="background-color: var(--clr-text-sub);">
            <div class="color-swatch-label">Text Sub<br>#6b7280</div>
          </div>
        </div>
      </section>
      
      <!-- Typography -->
      <section class="component-section" id="typography">
        <h2 class="component-title">Typography</h2>
        <div class="component-demo">
          <h1>Heading 1 (2.25rem)</h1>
          <h2>Heading 2 (1.875rem)</h2>
          <h3>Heading 3 (1.5rem)</h3>
          <h4>Heading 4 (1.25rem)</h4>
          <h5>Heading 5 (1.125rem)</h5>
          <h6>Heading 6 (1rem)</h6>
          <p>Regular paragraph text (1rem). The quick brown fox jumps over the lazy dog.</p>
          <p class="text-sm">Small text (0.875rem). The quick brown fox jumps over the lazy dog.</p>
          <p class="text-lg">Large text (1.125rem). The quick brown fox jumps over the lazy dog.</p>
          <p class="text-xl">Extra large text (1.25rem). The quick brown fox jumps over the lazy dog.</p>
          <p class="font-bold">Bold text. The quick brown fox jumps over the lazy dog.</p>
          <p class="text-muted">Muted text. The quick brown fox jumps over the lazy dog.</p>
          <p><a href="#">Link text</a>. The quick brown fox jumps over the lazy dog.</p>
        </div>
      </section>
      
      <!-- Buttons -->
      <section class="component-section" id="buttons">
        <h2 class="component-title">Buttons</h2>
        <div class="component-demo">
          <button class="btn mb-2 mr-2">Primary Button</button>
          <button class="btn btn-accent mb-2 mr-2">Accent Button</button>
          <button class="btn-outline mb-2 mr-2">Outline Button</button>
          <button class="btn btn-lg mb-2 mr-2">Large Button</button>
          <button class="btn" disabled>Disabled Button</button>
        </div>
        <div class="component-code">
          <pre>&lt;button class="btn"&gt;Primary Button&lt;/button&gt;
&lt;button class="btn btn-accent"&gt;Accent Button&lt;/button&gt;
&lt;button class="btn-outline"&gt;Outline Button&lt;/button&gt;
&lt;button class="btn btn-lg"&gt;Large Button&lt;/button&gt;
&lt;button class="btn" disabled&gt;Disabled Button&lt;/button&gt;</pre>
        </div>
      </section>
      
      <!-- Cards -->
      <section class="component-section" id="cards">
        <h2 class="component-title">Cards</h2>
        <div class="component-demo">
          <div class="card">
            <h3>Card Title</h3>
            <p>This is a standard card component used throughout the application.</p>
            <button class="btn mt-2">Card Action</button>
          </div>
        </div>
        <div class="component-code">
          <pre>&lt;div class="card"&gt;
  &lt;h3&gt;Card Title&lt;/h3&gt;
  &lt;p&gt;This is a standard card component used throughout the application.&lt;/p&gt;
  &lt;button class="btn mt-2"&gt;Card Action&lt;/button&gt;
&lt;/div&gt;</pre>
        </div>
      </section>
      
      <!-- Form Elements -->
      <section class="component-section" id="forms">
        <h2 class="component-title">Form Elements</h2>
        <div class="component-demo">
          <div class="form-group mb-3">
            <label for="demo-input">Text Input</label>
            <input type="text" id="demo-input" placeholder="Enter text">
          </div>
          <div class="form-group mb-3">
            <label for="demo-email">Email Input</label>
            <input type="email" id="demo-email" placeholder="Enter email">
          </div>
          <div class="form-group mb-3">
            <label for="demo-password">Password Input</label>
            <div class="password-input-wrapper">
              <input type="password" id="demo-password" placeholder="Enter password">
              <button class="password-toggle" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
          </div>
          <div class="form-group mb-3">
            <label for="demo-select">Select</label>
            <select id="demo-select">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
          <div class="form-group mb-3">
            <label for="demo-textarea">Textarea</label>
            <textarea id="demo-textarea" rows="3" placeholder="Enter text"></textarea>
          </div>
          <div class="form-check mb-3">
            <input type="checkbox" id="demo-checkbox">
            <label for="demo-checkbox">Checkbox</label>
          </div>
        </div>
      </section>
      
      <!-- Status Indicators -->
      <section class="component-section" id="status">
        <h2 class="component-title">Status Indicators</h2>
        <div class="component-demo">
          <div class="status status-success mb-2">Success</div>
          <div class="status status-error mb-2">Error</div>
          <div class="status status-warning">Warning</div>
        </div>
        <div class="component-code">
          <pre>&lt;div class="status status-success"&gt;Success&lt;/div&gt;
&lt;div class="status status-error"&gt;Error&lt;/div&gt;
&lt;div class="status status-warning"&gt;Warning&lt;/div&gt;</pre>
        </div>
      </section>
      
      <!-- Grid System -->
      <section class="component-section" id="grid">
        <h2 class="component-title">Grid System</h2>
        <div class="component-demo">
          <div class="grid grid-cols-3 gap-4">
            <div class="p-3 bg-primary text-center" style="color: white;">Column 1</div>
            <div class="p-3 bg-primary text-center" style="color: white;">Column 2</div>
            <div class="p-3 bg-primary text-center" style="color: white;">Column 3</div>
          </div>
        </div>
        <div class="component-code">
          <pre>&lt;div class="grid grid-cols-3 gap-4"&gt;
  &lt;div&gt;Column 1&lt;/div&gt;
  &lt;div&gt;Column 2&lt;/div&gt;
  &lt;div&gt;Column 3&lt;/div&gt;
&lt;/div&gt;</pre>
        </div>
      </section>
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-logo">
          <span class="logo-icon">Ez</span> <span class="logo-text">Edit.co</span>
          <p class="footer-tagline">Edit legacy sites with ease</p>
        </div>
        <div class="footer-links">
          <div class="footer-links-column">
            <h4>Product</h4>
            <a href="/#features">Features</a>
            <a href="/pricing.html">Pricing</a>
            <a href="/docs/index.html">Documentation</a>
          </div>
          <div class="footer-links-column">
            <h4>Resources</h4>
            <a href="/blog/index.html">Blog</a>
            <a href="/docs/tutorials.html">Tutorials</a>
            <a href="/docs/api.html">API</a>
          </div>
          <div class="footer-links-column">
            <h4>Company</h4>
            <a href="/about.html">About</a>
            <a href="/contact.html">Contact</a>
          </div>
          <div class="footer-links-column">
            <h4>Legal</h4>
            <a href="/privacy.html">Privacy</a>
            <a href="/terms.html">Terms</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 ezEdit.co. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <script>
    // Toggle password visibility
    const passwordToggle = document.querySelector('.password-toggle');
    if (passwordToggle) {
      passwordToggle.addEventListener('click', function() {
        const passwordInput = document.getElementById('demo-password');
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
        } else {
          passwordInput.type = 'password';
          this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        }
      });
    }
  </script>
</body>
</html>
