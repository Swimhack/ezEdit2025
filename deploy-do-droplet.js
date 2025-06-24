/**
 * ezEdit Digital Ocean Deployment Script
 * 
 * This script deploys ezEdit to a Digital Ocean droplet with 16GB memory
 * using the stored Digital Ocean API token.
 */

// Load environment variables
require('dotenv').config();

// Configuration
const config = {
  droplet: {
    name: 'ezedit-production',
    region: 'nyc1',
    size: 's-4vcpu-16gb', // 4 vCPUs, 16GB RAM
    image: 'ubuntu-20-04-x64',
    backups: false,
    ipv6: true,
    monitoring: true,
    tags: ['ezedit', 'production']
  },
  
  // Deployment configuration
  deployment: {
    setupScript: `#!/bin/bash
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
STRIPE_PRICE_ONE_TIME_SITE=${STRIPE_PRICE_ONE_TIME_SITE}
STRIPE_PRICE_SUB_PRO=${STRIPE_PRICE_SUB_PRO}
EOL

# Set up basic firewall
ufw allow 22
ufw allow 80
ufw allow 443
echo "y" | ufw enable

# Print success message
echo "ezEdit has been successfully deployed!"
echo "You can access it at http://\$(curl -s ifconfig.me)/"
`
  }
};

// Digital Ocean API client
class DigitalOceanClient {
  constructor(token) {
    this.token = token;
    this.apiBaseUrl = 'https://api.digitalocean.com/v2';
  }

  /**
   * Make a request to the Digital Ocean API
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request data
   * @returns {Promise<object>} - Response data
   */
  async request(method, endpoint, data = null) {
    const url = `${this.apiBaseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(responseData)}`);
      }
      
      return responseData;
    } catch (error) {
      console.error(`Request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new droplet
   * @param {object} dropletConfig - Droplet configuration
   * @returns {Promise<object>} - Created droplet
   */
  async createDroplet(dropletConfig) {
    console.log('Creating droplet...');
    const response = await this.request('POST', '/droplets', dropletConfig);
    return response.droplet;
  }

  /**
   * Get droplet details
   * @param {number} dropletId - Droplet ID
   * @returns {Promise<object>} - Droplet details
   */
  async getDroplet(dropletId) {
    return await this.request('GET', `/droplets/${dropletId}`);
  }

  /**
   * Wait for droplet to be active
   * @param {number} dropletId - Droplet ID
   * @returns {Promise<object>} - Active droplet
   */
  async waitForDropletActive(dropletId) {
    console.log('Waiting for droplet to become active...');
    
    let isActive = false;
    let droplet;
    
    while (!isActive) {
      const response = await this.getDroplet(dropletId);
      droplet = response.droplet;
      
      if (droplet.status === 'active') {
        isActive = true;
        console.log('Droplet is now active!');
      } else {
        console.log(`Droplet status: ${droplet.status}. Waiting 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    return droplet;
  }
}

/**
 * Deploy ezEdit to Digital Ocean
 */
async function deployEzEdit() {
  try {
    // Get API token from environment variables
    const apiToken = process.env.DO_API_KEY;
    
    if (!apiToken) {
      throw new Error('Digital Ocean API token not found in .env file');
    }
    
    console.log('Starting ezEdit deployment to Digital Ocean...');
    
    // Initialize Digital Ocean client
    const doClient = new DigitalOceanClient(apiToken);
    
    // Create droplet
    const dropletConfig = {
      ...config.droplet,
      user_data: config.deployment.setupScript
    };
    
    const droplet = await doClient.createDroplet(dropletConfig);
    console.log(`Droplet created with ID: ${droplet.id}`);
    
    // Wait for droplet to be active
    const activeDroplet = await doClient.waitForDropletActive(droplet.id);
    
    // Get droplet IP
    const ipv4Networks = activeDroplet.networks.v4;
    const publicNetwork = ipv4Networks.find(network => network.type === 'public');
    
    if (!publicNetwork) {
      throw new Error('No public IP address found for droplet');
    }
    
    const ipAddress = publicNetwork.ip_address;
    
    console.log(`
=======================================================
ezEdit has been successfully deployed to Digital Ocean!
=======================================================

Access your application at: http://${ipAddress}/

Droplet Information:
- Name: ${activeDroplet.name}
- ID: ${activeDroplet.id}
- Region: ${activeDroplet.region.name}
- Size: ${activeDroplet.size.slug} (4 vCPUs, 16GB RAM)
- IP Address: ${ipAddress}

The deployment script is running on the server and will take a few minutes to complete.
You can check the status by SSH'ing into the server:

ssh root@${ipAddress}

and running:

tail -f /var/log/cloud-init-output.log

Remember to secure your server by:
1. Setting up a domain name pointing to this IP
2. Configuring SSL/TLS with Let's Encrypt
3. Creating a non-root user for daily operations
4. Disabling root SSH access
`);
    
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run the deployment
deployEzEdit();
