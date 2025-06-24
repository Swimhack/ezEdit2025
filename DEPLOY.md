# Deploying ezEdit to Digital Ocean

This guide explains how to deploy ezEdit to a Digital Ocean droplet with 16GB of memory for optimal performance and scalability.

## Prerequisites

1. A Digital Ocean account
2. Digital Ocean API key with write access
3. Node.js and npm installed locally
4. SSH key pair (will be generated automatically if not provided)

## Setup

1. **Update your API key**

   Open the `.env` file and replace `your-digital-ocean-api-key-here` with your actual Digital Ocean API key:

   ```
   DO_API_KEY=your-actual-digital-ocean-api-key
   ```

   You can generate an API key in your [Digital Ocean Account Settings](https://cloud.digitalocean.com/account/api/tokens).

2. **Install dependencies**

   ```
   npm install
   ```

## Deployment

Run the deployment script:

```
npm run deploy
```

This script will:

1. Create an SSH key pair for secure access
2. Create a new Digital Ocean droplet with the following specs:
   - 4 vCPUs
   - 16GB RAM
   - Ubuntu 20.04 LTS
   - Located in NYC1 region
3. Wait for the droplet to be active
4. Install all necessary dependencies (Nginx, PHP, Node.js)
5. Clone the ezEdit repository
6. Configure Nginx as a web server
7. Deploy the application

## Accessing Your Deployment

After successful deployment, the script will output:
- The IP address of your droplet
- SSH access information
- Next steps for securing your server

You can access your ezEdit instance by navigating to `http://YOUR_DROPLET_IP` in your browser.

## Customization

You can customize the deployment by editing the configuration in `deploy-do.js`:

- Change the droplet size
- Select a different region
- Modify the server configuration
- Add additional setup steps

## Production Recommendations

For a production environment, we recommend:

1. Setting up a domain name pointing to your droplet IP
2. Configuring SSL/TLS with Let's Encrypt
3. Setting up regular backups
4. Implementing a firewall
5. Creating a non-root user for daily operations

## Scaling

This deployment uses a 16GB droplet which should handle moderate traffic. For higher traffic:

1. Consider using Digital Ocean's load balancer
2. Set up a database cluster
3. Implement a CDN for static assets

## Troubleshooting

If you encounter issues during deployment:

1. Check the console output for specific error messages
2. Verify your Digital Ocean API key has sufficient permissions
3. Ensure your local network allows outbound SSH connections
4. Check if the droplet was created but the deployment failed

For additional help, refer to the [ezEdit documentation](https://github.com/Swimhack/ezEdit2025).
