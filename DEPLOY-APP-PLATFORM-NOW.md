# 🚀 Deploy EzEdit to DigitalOcean App Platform

Your deployment package is ready! Here's how to deploy it in under 5 minutes:

## Quick Deploy (Recommended)

### 1. Go to DigitalOcean Apps
- Open: https://cloud.digitalocean.com/apps
- Click **"Create App"**

### 2. Upload Your Code
- Choose **"Upload your code"**
- Upload file: `ezedit-app-deploy.tar.gz` (55KB) - **Ready in your current directory**
- Click **"Next"**

### 3. Configure App
```
App Name: ezedit
Region: New York (NYC)
Environment: PHP
Branch: main (default)
```

### 4. Configure Service
```
Service Name: web
HTTP Port: 8080
Instance Size: Basic ($5/month)
Instance Count: 1

Build Command: (leave empty)
Run Command: php -S 0.0.0.0:8080 -t .
```

### 5. Environment Variables (Optional)
```
APP_ENV = production
PHP_VERSION = 8.2
```

### 6. Deploy!
- Click **"Create Resources"**
- Wait 3-5 minutes for deployment

## Your App Features
✅ Monaco Editor with syntax highlighting  
✅ FTP/SFTP connection manager  
✅ Multi-tab file editing  
✅ AI-powered code assistant  
✅ Professional dark theme  
✅ Mobile responsive design  
✅ Real-time file synchronization  

## After Deployment
Your app will be available at:
`https://ezedit-[random].ondigitalocean.app`

### Test Endpoints:
- Homepage: `/`
- Editor: `/editor.php`
- Dashboard: `/dashboard.php`
- Login: `/auth/login.php`
- Health: `/health.php`

## App Platform Benefits
- 🔒 Automatic HTTPS/SSL
- 🌍 Global CDN
- 📈 Auto-scaling
- 📊 Built-in monitoring
- 🔄 Automatic deployments
- ⚡ Fast cold starts

## Cost
- **Basic Plan**: $5/month
- **Professional**: $12/month (for higher traffic)
- **Free Tier**: Available for testing

## Alternative: doctl CLI

If you prefer command line:

```bash
# Re-authenticate (get token from: https://cloud.digitalocean.com/account/api/tokens)
./doctl auth init

# Deploy
./doctl apps create --spec simple-app-spec.yaml

# Check status
./doctl apps list
```

---

**Your deployment package `ezedit-app-deploy.tar.gz` is ready to upload!**

Just drag and drop it into the DigitalOcean Apps interface.