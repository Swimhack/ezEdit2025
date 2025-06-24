/**
 * ezEdit Digital Ocean Deployment Script
 * This script deploys the ezEdit application to a Digital Ocean droplet
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

// Configuration
const config = {
  // Digital Ocean API configuration
  digitalOcean: {
    apiKey: process.env.DO_API_KEY || 'your-api-key', // Replace with your actual API key or use .env
    apiUrl: 'api.digitalocean.com',
    apiVersion: 'v2'
  },
  
  // Droplet configuration
  droplet: {
    name: 'ezedit-app',
    region: 'nyc1', // New York 1
    size: 's-4vcpu-16gb', // 4 vCPUs, 16GB RAM
    image: 'ubuntu-20-04-x64', // Ubuntu 20.04 LTS
    backups: false,
    ipv6: true,
    monitoring: true,
    tags: ['ezedit', 'production']
  },
  
  // Application configuration
  app: {
    repoUrl: 'https://github.com/Swimhack/ezEdit2025.git',
    branch: 'main',
    projectPath: path.resolve(__dirname),
    envFile: path.resolve(__dirname, '.env')
  }
};

/**
 * Make a request to the Digital Ocean API
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request data
 * @returns {Promise<object>} - Response data
 */
function doApiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.digitalOcean.apiUrl,
      path: `/${config.digitalOcean.apiVersion}/${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.digitalOcean.apiKey}`
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(parsedData)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Create a new SSH key
 * @returns {Promise<object>} - SSH key data
 */
async function createSshKey() {
  console.log('Creating SSH key...');
  
  // Generate SSH key
  const sshKeyName = `ezedit-deploy-${Date.now()}`;
  const sshKeyPath = path.resolve(__dirname, '.ssh');
  
  if (!fs.existsSync(sshKeyPath)) {
    fs.mkdirSync(sshKeyPath);
  }
  
  const keyPath = path.join(sshKeyPath, sshKeyName);
  execSync(`ssh-keygen -t rsa -b 4096 -C "ezedit-deploy" -f ${keyPath} -N ""`);
  
  // Read public key
  const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf8');
  
  // Add SSH key to Digital Ocean
  const response = await doApiRequest('POST', 'account/keys', {
    name: sshKeyName,
    public_key: publicKey
  });
  
  console.log(`SSH key created with ID: ${response.ssh_key.id}`);
  
  return {
    id: response.ssh_key.id,
    name: sshKeyName,
    path: keyPath
  };
}

/**
 * Create a new droplet
 * @param {number} sshKeyId - SSH key ID
 * @returns {Promise<object>} - Droplet data
 */
async function createDroplet(sshKeyId) {
  console.log('Creating droplet...');
  
  const dropletConfig = {
    ...config.droplet,
    ssh_keys: [sshKeyId]
  };
  
  const response = await doApiRequest('POST', 'droplets', dropletConfig);
  
  console.log(`Droplet created with ID: ${response.droplet.id}`);
  
  return response.droplet;
}

/**
 * Wait for droplet to be active
 * @param {number} dropletId - Droplet ID
 * @returns {Promise<object>} - Droplet data
 */
async function waitForDroplet(dropletId) {
  console.log('Waiting for droplet to be active...');
  
  let droplet;
  let attempts = 0;
  const maxAttempts = 30; // 5 minutes (10 seconds per attempt)
  
  while (attempts < maxAttempts) {
    const response = await doApiRequest('GET', `droplets/${dropletId}`);
    droplet = response.droplet;
    
    if (droplet.status === 'active') {
      console.log('Droplet is active!');
      break;
    }
    
    console.log(`Droplet status: ${droplet.status}. Waiting 10 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 10000));
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Timeout waiting for droplet to be active');
  }
  
  return droplet;
}

/**
 * Get droplet IP address
 * @param {object} droplet - Droplet data
 * @returns {string} - IP address
 */
function getDropletIp(droplet) {
  const ipv4Networks = droplet.networks.v4;
  const publicNetwork = ipv4Networks.find(network => network.type === 'public');
  
  if (!publicNetwork) {
    throw new Error('No public IP address found for droplet');
  }
  
  return publicNetwork.ip_address;
}

/**
 * Deploy application to droplet
 * @param {string} ip - Droplet IP address
 * @param {string} sshKeyPath - SSH key path
 */
async function deployApplication(ip, sshKeyPath) {
  console.log(`Deploying application to ${ip}...`);
  
  // Wait for SSH to be available
  let sshReady = false;
  let attempts = 0;
  const maxAttempts = 12; // 2 minutes (10 seconds per attempt)
  
  while (!sshReady && attempts < maxAttempts) {
    try {
      execSync(`ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i ${sshKeyPath} root@${ip} echo "SSH connection successful"`, { stdio: 'ignore' });
      sshReady = true;
    } catch (error) {
      console.log('SSH not ready yet. Waiting 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }
  }
  
  if (!sshReady) {
    throw new Error('Timeout waiting for SSH to be available');
  }
  
  // Install dependencies
  console.log('Installing dependencies...');
  execSync(`ssh -o StrictHostKeyChecking=no -i ${sshKeyPath} root@${ip} "apt-get update && apt-get install -y nginx git nodejs npm"`, { stdio: 'inherit' });
  
  // Clone repository
  console.log('Cloning repository...');
  execSync(`ssh -o StrictHostKeyChecking=no -i ${sshKeyPath} root@${ip} "git clone ${config.app.repoUrl} /var/www/ezedit"`, { stdio: 'inherit' });
  
  // Copy .env file if it exists
  if (fs.existsSync(config.app.envFile)) {
    console.log('Copying .env file...');
    execSync(`scp -o StrictHostKeyChecking=no -i ${sshKeyPath} ${config.app.envFile} root@${ip}:/var/www/ezedit/.env`, { stdio: 'inherit' });
  }
  
  // Configure Nginx
  console.log('Configuring Nginx...');
  const nginxConfig = `
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
`;
  
  // Write Nginx config to a temporary file
  const tempNginxConfig = path.resolve(__dirname, 'nginx-ezedit.conf');
  fs.writeFileSync(tempNginxConfig, nginxConfig);
  
  // Copy Nginx config to server
  execSync(`scp -o StrictHostKeyChecking=no -i ${sshKeyPath} ${tempNginxConfig} root@${ip}:/etc/nginx/sites-available/ezedit`, { stdio: 'inherit' });
  
  // Enable site and restart Nginx
  execSync(`ssh -o StrictHostKeyChecking=no -i ${sshKeyPath} root@${ip} "ln -sf /etc/nginx/sites-available/ezedit /etc/nginx/sites-enabled/ && systemctl restart nginx"`, { stdio: 'inherit' });
  
  // Install PHP if needed
  console.log('Installing PHP...');
  execSync(`ssh -o StrictHostKeyChecking=no -i ${sshKeyPath} root@${ip} "apt-get install -y php7.4-fpm php7.4-cli php7.4-curl php7.4-json php7.4-common"`, { stdio: 'inherit' });
  
  // Clean up temporary files
  fs.unlinkSync(tempNginxConfig);
  
  console.log('Application deployed successfully!');
}

/**
 * Main deployment function
 */
async function deploy() {
  try {
    console.log('Starting ezEdit deployment to Digital Ocean...');
    
    // Create SSH key
    const sshKey = await createSshKey();
    
    // Create droplet
    const droplet = await createDroplet(sshKey.id);
    
    // Wait for droplet to be active
    const activeDroplet = await waitForDroplet(droplet.id);
    
    // Get droplet IP
    const ip = getDropletIp(activeDroplet);
    console.log(`Droplet IP: ${ip}`);
    
    // Deploy application
    await deployApplication(ip, sshKey.path);
    
    console.log(`
=======================================================
ezEdit has been successfully deployed to Digital Ocean!
=======================================================

Access your application at: http://${ip}/

Droplet Information:
- Name: ${config.droplet.name}
- ID: ${activeDroplet.id}
- Region: ${activeDroplet.region.name}
- Size: ${activeDroplet.size.slug} (4 vCPUs, 16GB RAM)
- IP Address: ${ip}

SSH Access:
- User: root
- Key: ${sshKey.path}
- Command: ssh -i ${sshKey.path} root@${ip}

Remember to secure your server by:
1. Setting up a firewall
2. Configuring SSL/TLS with Let's Encrypt
3. Creating a non-root user for daily operations
4. Disabling root SSH access

For production use, consider setting up:
- Domain name pointing to this IP
- SSL/TLS certificate
- Regular backups
    `);
    
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

// Start deployment
deploy();
