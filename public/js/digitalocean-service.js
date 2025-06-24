/**
 * EzEdit DigitalOcean Service
 * Handles integration with DigitalOcean for deployment and hosting
 */

class DigitalOceanService {
  constructor() {
    this.apiBaseUrl = 'https://api.digitalocean.com/v2';
    this.token = null;
    this.droplets = [];
    this.spaces = [];
    this.apps = [];
    
    // Load token from memory service if available
    this.initializeFromMemory();
  }

  /**
   * Initialize from memory service
   */
  initializeFromMemory() {
    if (window.ezEdit && window.ezEdit.memory) {
      const doConfig = window.ezEdit.memory.getApiKey('digitalocean');
      if (doConfig && doConfig.token) {
        this.token = doConfig.token;
        console.log('DigitalOcean token loaded from memory service');
      }
    }
  }

  /**
   * Set API token
   * @param {string} token - DigitalOcean API token
   */
  setToken(token) {
    this.token = token;
    
    // Save token to memory service
    if (window.ezEdit && window.ezEdit.memory) {
      window.ezEdit.memory.setApiKey('digitalocean', { token });
    }
  }

  /**
   * Check if token is valid
   * @returns {Promise<boolean>} - Promise resolving to token validity
   */
  async isTokenValid() {
    if (!this.token) return false;
    
    try {
      // Try to fetch account info to validate token
      const response = await this.apiCall('/account');
      return response && response.account;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Get account info
   * @returns {Promise<Object>} - Promise resolving to account info
   */
  async getAccountInfo() {
    return await this.apiCall('/account');
  }

  /**
   * Get droplet by ID
   * @param {string} id - Droplet ID
   * @returns {Promise<Object>} - Promise resolving to droplet
   */
  async getDroplet(id) {
    return await this.apiCall(`/droplets/${id}`);
  }

  /**
   * Get default setup script for droplet creation
   * This script will automatically set up the server with all required dependencies
   * and deploy the ezEdit application
   * @returns {string} - Setup script
   */
  getDefaultSetupScript() {
    return `#!/bin/bash
# Update system packages
apt-get update
apt-get upgrade -y

# Install required packages
apt-get install -y nginx git nodejs npm php7.4-fpm php7.4-cli php7.4-curl php7.4-json php7.4-common unzip

# Install PM2 for process management
npm install -g pm2

# Clone the ezEdit repository
git clone https://github.com/Swimhack/ezEdit2025.git /var/www/ezedit

# Set proper permissions
chown -R www-data:www-data /var/www/ezedit

# Configure Nginx
cat > /etc/nginx/sites-available/ezedit << 'EOL'
server {
    listen 80;
    server_name _;

    root /var/www/ezedit/public;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    }

    location ~ /\\.ht {
        deny all;
    }
}
EOL

# Enable the site and restart Nginx
ln -sf /etc/nginx/sites-available/ezedit /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# Set up environment variables
cat > /var/www/ezedit/.env << 'EOL'
GITHUB_TOKEN=${GITHUB_TOKEN}
DO_API_KEY=${DO_API_KEY}
STRIPE_PRICE_ONE_TIME_SITE=price_oneTimeSite_$500
STRIPE_PRICE_SUB_PRO=price_subPro_$100
EOL

# Set up basic firewall
ufw allow 22
ufw allow 80
ufw allow 443
echo "y" | ufw enable

# Print success message
echo "ezEdit has been successfully deployed!"
echo "You can access it at http://$(curl -s ifconfig.me)/"
`;
  }

  /**
   * Get droplets
   * @returns {Promise<Array>} - Promise resolving to droplets array
   */
  async getDroplets() {
    const response = await this.apiCall('/droplets');
    this.droplets = response.droplets || [];
    return this.droplets;
  }

  /**
   * Get spaces (S3-compatible storage)
   * @returns {Promise<Array>} - Promise resolving to spaces array
   */
  async getSpaces() {
    const response = await this.apiCall('/spaces');
    this.spaces = response.spaces || [];
    return this.spaces;
  }

  /**
   * Get App Platform apps
   * @returns {Promise<Array>} - Promise resolving to apps array
   */
  async getApps() {
    const response = await this.apiCall('/apps');
    this.apps = response.apps || [];
    return this.apps;
  }

  /**
   * Create new App Platform app
   * @param {Object} appSpec - App specification
   * @returns {Promise<Object>} - Promise resolving to created app
   */
  async createApp(appSpec) {
    return await this.apiCall('/apps', 'POST', appSpec);
  }

  /**
   * Deploy ezEdit to App Platform
   * @param {Object} options - Deployment options
   * @param {string} options.name - App name
   * @param {string} options.region - Region (nyc1, sfo2, etc.)
   * @param {string} options.githubRepo - GitHub repo URL
   * @param {string} options.branch - GitHub branch
   * @returns {Promise<Object>} - Promise resolving to deployment result
   */
  async deployEzEdit(options) {
    const appSpec = {
      name: options.name || 'ezedit-app',
      region: options.region || 'nyc1',
      services: [
        {
          name: 'ezedit-web',
          github: {
            repo: options.githubRepo,
            branch: options.branch || 'main',
            deploy_on_push: true
          },
          build_command: 'npm ci && npm run build',
          run_command: 'npm start',
          http_port: 8080,
          instance_size_slug: 'basic-xs',
          instance_count: 1,
          routes: [
            {
              path: '/'
            }
          ],
          envs: [
            {
              key: 'NODE_ENV',
              value: 'production',
              scope: 'RUN_TIME'
            }
          ]
        }
      ],
      databases: [
        {
          name: 'ezedit-db',
          engine: 'PG',
          version: '14',
          production: true,
          cluster_name: 'ezedit-db-cluster',
          db_name: 'ezedit',
          db_user: 'ezedit'
        }
      ]
    };
    
    return await this.createApp(appSpec);
  }

  /**
   * Create a new droplet
   * @param {Object} options - Droplet options
   * @returns {Promise<Object>} - Promise resolving to created droplet
   */
  async createDroplet(options) {
    const dropletOptions = {
      name: options.name || 'ezedit-droplet',
      region: options.region || 'nyc1',
      size: options.size || 's-1vcpu-1gb', // Using the cheapest droplet size ($5/mo)
      image: options.image || 'ubuntu-20-04-x64',
      ssh_keys: options.sshKeys || [],
      backups: options.backups || false,
      ipv6: options.ipv6 || true,
      monitoring: options.monitoring || true,
      tags: options.tags || ['ezedit']
    };
    
    // Add user_data for automatic deployment if not provided
    if (!options.userData) {
      dropletOptions.user_data = this.getDefaultSetupScript();
    } else {
      dropletOptions.user_data = options.userData;
    }
    
    return await this.apiCall('/droplets', 'POST', { droplet: dropletOptions });
  }

  /**
   * Create new Space (S3-compatible storage)
   * @param {Object} options - Space options
   * @param {string} options.name - Space name
   * @param {string} options.region - Region (nyc3, sfo2, etc.)
   * @returns {Promise<Object>} - Promise resolving to created space
   */
  async createSpace(options) {
    const spaceSpec = {
      name: options.name,
      region: options.region
    };
    
    return await this.apiCall('/spaces', 'POST', spaceSpec);
  }

  /**
   * Upload file to Space
   * @param {string} spaceName - Space name
   * @param {string} filePath - File path in space
   * @param {File|Blob|string} fileContent - File content
   * @returns {Promise<Object>} - Promise resolving to upload result
   */
  async uploadToSpace(spaceName, filePath, fileContent) {
    // In a real implementation, we would use the S3 SDK
    // For this demo, we'll simulate a successful upload
    return await this.simulateApiCall({
      status: 'ok',
      message: `File uploaded to ${spaceName}/${filePath}`,
      url: `https://${spaceName}.nyc3.digitaloceanspaces.com/${filePath}`
    });
  }

  /**
   * Make API call to DigitalOcean
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<Object>} - Promise resolving to API response
   */
  async apiCall(endpoint, method = 'GET', data = null) {
    // Check if we're in development mode or production
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.EzEditConfig?.environment === 'development';
    
    // In development mode, use simulated API calls
    if (isDev) {
      console.log('Using simulated DigitalOcean API call for:', endpoint);
      return await this.simulateApiCall(endpoint, method, data);
    }
    
    // In production, make real API calls
    if (!this.token) {
      throw new Error('DigitalOcean API token not set');
    }
    
    const url = `${this.apiBaseUrl}${endpoint}`;
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      };
      
      const options = {
        method: method,
        headers: headers,
        body: data ? JSON.stringify(data) : undefined
      };
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DigitalOcean API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('DigitalOcean API call failed:', error);
      throw error;
    }
  }

  /**
   * Simulate API call
   * @param {string|Object} endpoint - API endpoint or simulated response
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<Object>} - Promise resolving to simulated API response
   */
  async simulateApiCall(endpoint, method = 'GET', data = null) {
    // If endpoint is an object, return it directly (used for simulated responses)
    if (typeof endpoint === 'object') {
      await new Promise(resolve => setTimeout(resolve, 800));
      return endpoint;
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate different API responses based on endpoint
    switch (endpoint) {
      case '/account':
        return {
          account: {
            droplet_limit: 25,
            floating_ip_limit: 5,
            email: 'user@example.com',
            uuid: 'abc123',
            email_verified: true,
            status: 'active',
            status_message: ''
          }
        };
      
      case '/droplets':
        if (method === 'POST') {
          // Simulate droplet creation
          const newDroplet = {
            id: Date.now(),
            name: data.name,
            region: {
              slug: data.region,
              name: this.getRegionName(data.region),
              sizes: [data.size]
            },
            size: {
              slug: data.size
            },
            image: {
              id: typeof data.image === 'number' ? data.image : null,
              name: typeof data.image === 'string' ? data.image : 'Ubuntu 20.04',
              distribution: 'Ubuntu'
            },
            status: 'new',
            networks: {
              v4: [],
              v6: []
            },
            created_at: new Date().toISOString()
          };
          
          this.droplets.push(newDroplet);
          
          return {
            droplet: newDroplet
          };
        } else {
          // Simulate droplet listing
          return {
            droplets: this.droplets.length > 0 ? this.droplets : [
              {
                id: 123456,
                name: 'ezedit-web-1',
                region: {
                  slug: 'nyc1',
                  name: 'New York 1',
                  sizes: ['s-1vcpu-1gb']
                },
                size: {
                  slug: 's-1vcpu-1gb'
                },
                image: {
                  id: 53893572,
                  name: 'Ubuntu 20.04',
                  distribution: 'Ubuntu'
                },
                status: 'active',
                networks: {
                  v4: [
                    {
                      ip_address: '192.168.1.100',
                      netmask: '255.255.255.0',
                      gateway: '192.168.1.1',
                      type: 'private'
                    },
                    {
                      ip_address: '104.131.186.241',
                      netmask: '255.255.240.0',
                      gateway: '104.131.176.1',
                      type: 'public'
                    }
                  ],
                  v6: []
                },
                created_at: '2025-06-10T12:00:00Z'
              }
            ]
          };
        }
      
      case '/spaces':
        if (method === 'POST') {
          // Simulate space creation
          const newSpace = {
            name: data.name,
            region: {
              slug: data.region,
              name: this.getRegionName(data.region)
            },
            endpoint: `${data.name}.${data.region}.digitaloceanspaces.com`,
            created_at: new Date().toISOString()
          };
          
          this.spaces.push(newSpace);
          
          return {
            space: newSpace
          };
        } else {
          // Simulate space listing
          return {
            spaces: this.spaces.length > 0 ? this.spaces : [
              {
                name: 'ezedit-assets',
                region: {
                  slug: 'nyc3',
                  name: 'New York 3'
                },
                endpoint: 'ezedit-assets.nyc3.digitaloceanspaces.com',
                created_at: '2025-06-10T12:00:00Z'
              }
            ]
          };
        }
      
      case '/apps':
        if (method === 'POST') {
          // Simulate app creation
          const newApp = {
            id: `app-${Date.now()}`,
            name: data.name,
            owner_uuid: 'abc123',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            spec: data,
            default_ingress: `https://${data.name}.ondigitalocean.app`,
            live_url: `https://${data.name}.ondigitalocean.app`,
            region: {
              slug: data.region,
              name: this.getRegionName(data.region)
            },
            tier_slug: 'basic',
            active_deployment: {
              id: `deployment-${Date.now()}`,
              spec: data,
              cause: 'initial',
              progress: {
                steps: [
                  {
                    name: 'Initialize',
                    status: 'success',
                    started_at: new Date().toISOString(),
                    ended_at: new Date().toISOString()
                  },
                  {
                    name: 'Build',
                    status: 'in-progress',
                    started_at: new Date().toISOString()
                  }
                ]
              }
            }
          };
          
          this.apps.push(newApp);
          
          return {
            app: newApp
          };
        } else {
          // Simulate app listing
          return {
            apps: this.apps.length > 0 ? this.apps : [
              {
                id: 'app-123456',
                name: 'ezedit-app',
                owner_uuid: 'abc123',
                created_at: '2025-06-10T12:00:00Z',
                updated_at: '2025-06-10T12:00:00Z',
                default_ingress: 'https://ezedit-app.ondigitalocean.app',
                live_url: 'https://ezedit-app.ondigitalocean.app',
                region: {
                  slug: 'nyc1',
                  name: 'New York 1'
                },
                tier_slug: 'basic'
              }
            ]
          };
        }
      
      default:
        return {
          message: 'Simulated API response',
          endpoint,
          method,
          data
        };
    }
  }

  /**
   * Get region name from slug
   * @param {string} slug - Region slug
   * @returns {string} - Region name
   */
  getRegionName(slug) {
    const regions = {
      'nyc1': 'New York 1',
      'nyc3': 'New York 3',
      'sfo2': 'San Francisco 2',
      'sfo3': 'San Francisco 3',
      'ams3': 'Amsterdam 3',
      'sgp1': 'Singapore 1',
      'lon1': 'London 1',
      'fra1': 'Frankfurt 1',
      'tor1': 'Toronto 1',
      'blr1': 'Bangalore 1'
    };
    
    return regions[slug] || slug;
  }
}

// Export the DigitalOceanService class
window.DigitalOceanService = DigitalOceanService;
