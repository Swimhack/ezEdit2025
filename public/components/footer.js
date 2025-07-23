/**
 * EzEdit Standardized Footer Component
 * Provides consistent footer across all pages
 */

class EzEditFooter extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const year = new Date().getFullYear();
    
    this.innerHTML = `
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
                <a href="index.php#features">Features</a>
                <a href="/pricing.html">Pricing</a>
                <a href="docs/index.php">Documentation</a>
              </div>
              <div class="footer-links-column">
                <h4>Resources</h4>
                <a href="blog/index.php">Blog</a>
                <a href="docs/tutorials.php">Tutorials</a>
                <a href="docs/api.php">API</a>
              </div>
              <div class="footer-links-column">
                <h4>Company</h4>
                <a href="about.php">About</a>
                <a href="contact.php">Contact</a>
              </div>
              <div class="footer-links-column">
                <h4>Legal</h4>
                <a href="privacy.php">Privacy</a>
                <a href="terms.php">Terms</a>
              </div>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; ${year} ezEdit.co. All rights reserved.</p>
          </div>
        </div>
      </footer>
    `;
  }
}

// Define the custom element
customElements.define('ez-footer', EzEditFooter);
