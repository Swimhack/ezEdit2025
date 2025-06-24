# Deploying ezEdit to Digital Ocean

This guide walks you through deploying ezEdit to a Digital Ocean droplet with 16GB of memory for optimal performance and scalability.

## Step 1: Prepare Your Code

Before deploying, make sure your ezEdit code is ready:

1. Ensure all files are committed to your GitHub repository (Swimhack/ezEdit2025)
2. Make sure your `.env` file contains all necessary API keys but is excluded from Git (.gitignore)

## Step 2: Create a Digital Ocean Account

If you don't already have one:

1. Go to [Digital Ocean](https://www.digitalocean.com/)
2. Sign up for an account
3. Add a payment method

## Step 3: Create a Droplet

1. Log in to your Digital Ocean account
2. Click on "Create" and select "Droplets"
3. Choose the following settings:
   - **Distribution**: Ubuntu 20.04 LTS
   - **Plan**: Regular with SSD
   - **CPU options**: Select the 16GB / 4 vCPUs option ($80/month)
   - **Datacenter Region**: Choose the region closest to your users (e.g., NYC1)
   - **VPC Network**: Leave as default
   - **Authentication**: SSH keys (recommended) or Password
   - **Hostname**: ezedit-production (or your preferred name)
   - **Backups**: Enable if desired (additional cost)
   - **Monitoring**: Enable (no additional cost)
   - **IPv6**: Enable (no additional cost)

4. Click "Create Droplet"

## Step 4: Connect to Your Droplet

Once your droplet is created:

1. Note the IP address of your droplet
2. Connect via SSH:
   - On Windows: Use PuTTY or Windows Terminal
   - On Mac/Linux: Use Terminal

```bash
ssh root@your-droplet-ip
```

## Step 5: Install Dependencies

Run these commands on your droplet:

```bash
# Update package lists
apt update

# Install required packages
apt install -y nginx git nodejs npm php7.4-fpm php7.4-cli php7.4-curl php7.4-json php7.4-common

# Install PM2 for process management
npm install -g pm2
```

## Step 6: Clone the Repository

```bash
# Clone the ezEdit repository
git clone https://github.com/Swimhack/ezEdit2025.git /var/www/ezedit

# Set proper permissions
chown -R www-data:www-data /var/www/ezedit
```

## Step 7: Configure Nginx

Create a new Nginx configuration file:

```bash
nano /etc/nginx/sites-available/ezedit
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or use the IP address

    root /var/www/ezedit/public;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

Enable the site and restart Nginx:

```bash
ln -s /etc/nginx/sites-available/ezedit /etc/nginx/sites-enabled/
systemctl restart nginx
```

## Step 8: Set Up Environment Variables

Create a `.env` file in your project directory:

```bash
nano /var/www/ezedit/.env
```

Add your environment variables:

```
GITHUB_TOKEN=your-github-token
DO_API_KEY=your-digital-ocean-api-key
STRIPE_PRICE_ONE_TIME_SITE=price_oneTimeSite_$500
STRIPE_PRICE_SUB_PRO=price_subPro_$100
```

## Step 9: Start the Application

If your application has a server component:

```bash
cd /var/www/ezedit
npm install
pm2 start server.js --name ezedit
pm2 save
pm2 startup
```

## Step 10: Secure Your Server

For production use, you should:

1. **Set up a firewall**:
   ```bash
   ufw allow 22
   ufw allow 80
   ufw allow 443
   ufw enable
   ```

2. **Set up SSL with Let's Encrypt**:
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

3. **Create a non-root user**:
   ```bash
   adduser ezedit-admin
   usermod -aG sudo ezedit-admin
   ```

4. **Configure SSH for the new user**:
   ```bash
   mkdir -p /home/ezedit-admin/.ssh
   cp ~/.ssh/authorized_keys /home/ezedit-admin/.ssh/
   chown -R ezedit-admin:ezedit-admin /home/ezedit-admin/.ssh
   chmod 700 /home/ezedit-admin/.ssh
   chmod 600 /home/ezedit-admin/.ssh/authorized_keys
   ```

## Step 11: Set Up Monitoring

Digital Ocean provides basic monitoring, but you can enhance it:

1. Go to your droplet in the Digital Ocean dashboard
2. Click on "Monitoring"
3. Set up alert policies for CPU, memory, and disk usage

## Step 12: Set Up Backups

1. In the Digital Ocean dashboard, go to your droplet
2. Enable backups (additional cost)
3. Or set up a custom backup solution:
   ```bash
   apt install -y rsync
   # Create a backup script and schedule it with cron
   ```

## Scaling Options

With a 16GB droplet, you should be able to handle moderate traffic. For further scaling:

1. **Vertical Scaling**: Upgrade to a larger droplet size
2. **Horizontal Scaling**: 
   - Set up a load balancer
   - Create multiple droplets
   - Use a managed database

3. **CDN Integration**:
   - Use Digital Ocean Spaces with CDN
   - Or integrate with Cloudflare

## Troubleshooting

If you encounter issues:

1. Check Nginx logs: `tail -f /var/log/nginx/error.log`
2. Check application logs: `pm2 logs ezedit`
3. Verify permissions: `ls -la /var/www/ezedit`
4. Test Nginx configuration: `nginx -t`

## Accessing Your Application

Once deployed, you can access your ezEdit instance at:

```
http://your-droplet-ip/
```

Or if you've set up a domain and SSL:

```
https://your-domain.com/
```

---

For additional help, refer to the [ezEdit documentation](https://github.com/Swimhack/ezEdit2025) or [Digital Ocean's documentation](https://docs.digitalocean.com/).
