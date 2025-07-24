# 🚀 Deploy EzEdit.co to DigitalOcean App Platform

## **Quick Deploy Steps**

### **Option 1: Deploy via GitHub (Recommended)**

1. **Push to GitHub Repository**
   ```bash
   # Initialize git repository if not already done
   git init
   git add .
   git commit -m "Initial commit with updated pricing"
   git remote add origin https://github.com/YOUR_USERNAME/ezedit.co.git
   git push -u origin main
   ```

2. **Create App Platform App**
   - Go to: https://cloud.digitalocean.com/apps
   - Click "Create App"
   - Select "GitHub" as source
   - Connect your GitHub account
   - Select your `ezedit.co` repository
   - Select `main` branch
   - Click "Next"

3. **Configure App Settings**
   - **App Name**: `ezedit-app`
   - **Region**: New York (NYC3)
   - **Plan**: Basic ($5/month)
   - **Environment**: Production

4. **Review & Deploy**
   - Review configuration
   - Click "Create Resources"
   - Wait for deployment (5-10 minutes)

### **Option 2: Deploy via doctl CLI**

```bash
# Install doctl if not already installed
# https://docs.digitalocean.com/reference/doctl/how-to/install/

# Authenticate
doctl auth init

# Create app from spec
doctl apps create --spec .do/app.yaml

# Get app ID and monitor deployment
doctl apps list
doctl apps get YOUR_APP_ID
```

### **Option 3: Manual App Platform Setup**

1. Go to: https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Choose "Upload your source code"
4. Upload a ZIP of your project files
5. Configure settings:
   - **Service Type**: Web Service
   - **Environment**: PHP 8.1
   - **Run Command**: `heroku-php-apache2 public/`
   - **HTTP Port**: 8080
   - **Instance Size**: Basic XXS ($5/month)

## **App Configuration Files Created**

✅ **`.do/app.yaml`** - App Platform configuration
✅ **`composer.json`** - PHP dependencies  
✅ **`Procfile`** - Process configuration
✅ **`public/.htaccess`** - Apache rewrite rules
✅ **`nginx.conf`** - Nginx configuration (if needed)

## **Environment Variables (Optional)**

Set these in App Platform console if needed:

- `APP_ENV=production`
- `APP_NAME=EzEdit.co`
- `PHP_VERSION=8.1`

## **Custom Domain Setup**

After deployment:

1. Go to your App settings
2. Click "Domains" tab
3. Add custom domain: `ezedit.co`
4. Add www alias: `www.ezedit.co`
5. Update DNS records:
   ```
   A     @      <app-platform-ip>
   CNAME www    <app-url>
   ```

## **Features Deployed**

Your App Platform deployment includes:

✅ **Updated Pricing Structure**:
- Free: $0/forever
- Single Site: $20/month  
- Unlimited: $100/month
- Guarantee: "No setup fees | Cancel anytime | 30-day money back"

✅ **Full Application**:
- Professional landing page
- User authentication system
- Dashboard with FTP integration
- Monaco code editor
- AI assistant integration
- Responsive design

✅ **Production Ready**:
- Security headers
- GZIP compression
- Static file caching
- SSL/TLS encryption
- Auto-scaling capability

## **Post-Deployment Steps**

1. **Test the deployment**:
   - Visit your app URL
   - Test pricing page: `your-app-url.ondigitalocean.app/#pricing`
   - Test login flow
   - Test dashboard functionality

2. **Monitor the app**:
   - Check App Platform metrics
   - Review deployment logs
   - Set up alerts if needed

3. **Optional upgrades**:
   - Add managed database for user data
   - Set up Redis for sessions
   - Configure CDN for static assets

## **App Platform Benefits**

- 🚀 **Auto-deployment** from GitHub
- 🔄 **Auto-scaling** based on traffic
- 🛡️ **Built-in SSL** certificate management
- 📊 **Monitoring & logs** included
- 💰 **Cost-effective** starting at $5/month
- 🌐 **Global CDN** for static assets

## **Troubleshooting**

**Build Fails**: Check that all files are committed to Git
**404 Errors**: Verify `.htaccess` is in `public/` directory  
**PHP Errors**: Check App Platform logs in console
**Domain Issues**: Verify DNS propagation (up to 48 hours)

---

**Ready to deploy!** Choose your preferred method above and your EzEdit.co app will be live with the updated pricing structure.