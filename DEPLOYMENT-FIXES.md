# EzEdit.co MVP Deployment Fixes

## Critical Issues Identified by Playwright Testing

### ❌ Missing Files on Production Server (159.65.224.175)

**Status**: These files exist locally but are not deployed to `/var/www/html/`

1. **Missing Core Pages**:
   ```bash
   # Deploy these files to production:
   signup.html → /var/www/html/signup.html
   pricing.html → /var/www/html/pricing.html  
   billing.html → /var/www/html/billing.html
   ```

2. **Missing API Files**:
   ```bash
   # Deploy PHP backend:
   public/ftp/ftp-handler.php → /var/www/html/public/ftp/ftp-handler.php
   api/stripe-routes.js → /var/www/html/api/stripe-routes.js
   ```

3. **Missing JavaScript**:
   ```bash
   # Deploy missing JS files:
   public/js/config.js → /var/www/html/js/config.js
   public/js/file-manager.js → /var/www/html/js/file-manager.js
   public/js/site-settings.js → /var/www/html/js/site-settings.js
   ```

## ✅ Files Successfully Deployed
- index.html (landing page)
- login-real.html (authentication)
- dashboard-real.html (site management)
- editor-real.html (code editor)

## 🔧 Quick Fix Commands

### Method 1: SCP with Password
```bash
sshpass -p 'MattKaylaS2two' scp -r signup.html pricing.html billing.html root@159.65.224.175:/var/www/html/
sshpass -p 'MattKaylaS2two' scp -r public/ root@159.65.224.175:/var/www/html/
sshpass -p 'MattKaylaS2two' scp -r api/ root@159.65.224.175:/var/www/html/
```

### Method 2: Direct Server Commands
```bash
ssh root@159.65.224.175
cd /var/www/html
# Copy files from local development folder
```

### Method 3: Git Deployment
```bash
# On server:
cd /var/www/html
git pull origin feat/ftp-mvp
```

## 🛡️ Security Headers (Add to Nginx)

```nginx
# Add to /etc/nginx/sites-available/default
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' *.supabase.co *.stripe.com *.googleapis.com *.anthropic.com;" always;
add_header X-XSS-Protection "1; mode=block" always;
```

## 📊 Test Results Summary

### ✅ Working (13/30 tests passed):
- Landing page loads correctly
- Login authentication with Supabase works
- Dashboard and editor interfaces are accessible
- Core HTML/CSS structure is sound

### ❌ Broken (17 critical issues):
- Signup page: 404 error (blocks new users)
- Pricing page: 404 error (blocks subscriptions)
- Billing page: 404 error (no billing management)
- API endpoints: 404 errors (FTP operations fail)
- Missing JavaScript modules (file management broken)

### ⚠️ Security Issues (5):
- Missing security headers
- Exposed API credentials in client code
- No CSP policy
- Missing HTTPS redirects

## 🎯 Priority Fix Order

1. **CRITICAL**: Deploy signup.html, pricing.html, billing.html
2. **HIGH**: Deploy API files (ftp-handler.php, stripe-routes.js)
3. **HIGH**: Deploy missing JavaScript files
4. **MEDIUM**: Add security headers
5. **LOW**: Optimize performance and SEO

## 🚀 Post-Deployment Verification

After deploying missing files, run:
```bash
npx playwright test --config=playwright.config.js
```

Expected results:
- Signup flow: User can create account ✅
- Login flow: User can authenticate ✅  
- Dashboard: User can manage FTP sites ✅
- Editor: User can edit files ✅
- Pricing: User can subscribe ✅
- Billing: User can manage subscription ✅

## 📈 Business Impact

**Before fixes**: 0% conversion (users can't complete signup)
**After fixes**: Expected 10-15% trial-to-paid conversion

**Revenue Impact**:
- Unblocks $50/month Pro subscriptions
- Enables $497 lifetime purchases
- Allows for business scaling

## 🔍 Monitoring

Add these monitoring endpoints:
```javascript
// Health check
GET /api/health

// Metrics
GET /api/metrics/usage
GET /api/metrics/subscriptions
```

---
**Status**: Ready for deployment
**Updated**: January 2025
**Next Action**: Deploy missing files to production server