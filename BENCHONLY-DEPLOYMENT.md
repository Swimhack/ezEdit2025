# 🚀 EzEdit.co Deployment to benchonly.com/membership

## DEPLOYMENT TARGET

**New URL:** https://benchonly.com/membership/  
**Server:** Microsoft-IIS/10.0 (Windows)  
**Status:** Directory exists and accessible

## FILES TO DEPLOY

Upload these 5 files to `/membership/` directory on benchonly.com:

### 1. index.html (16KB)
**Purpose:** Main landing page with fixed navigation  
**Upload to:** `https://benchonly.com/membership/index.html`

### 2. pricing.html (28KB)  
**Purpose:** Revenue page with Stripe integration  
**Upload to:** `https://benchonly.com/membership/pricing.html`

### 3. signup.html (24KB)
**Purpose:** User registration with Supabase  
**Upload to:** `https://benchonly.com/membership/signup.html`

### 4. billing.html (36KB)
**Purpose:** Account management and billing  
**Upload to:** `https://benchonly.com/membership/billing.html`

### 5. checkout-demo.html (12KB)
**Purpose:** Demo checkout flow  
**Upload to:** `https://benchonly.com/membership/checkout-demo.html`

**Total Size:** 116KB

## DEPLOYMENT METHODS

### Method 1: FTP Upload
```
Host: benchonly.com
Directory: /membership/
Files: deployment-package/*.html
```

### Method 2: File Manager (Plesk/cPanel)
1. Login to hosting control panel
2. Navigate to File Manager
3. Go to /membership/ directory  
4. Upload all 5 HTML files
5. Set permissions to 644

### Method 3: Web Upload
If available, use web-based file upload interface

## POST-DEPLOYMENT TESTING

After upload, test these URLs:

```bash
# Core pages
curl -I https://benchonly.com/membership/
curl -I https://benchonly.com/membership/pricing.html
curl -I https://benchonly.com/membership/signup.html
curl -I https://benchonly.com/membership/billing.html
curl -I https://benchonly.com/membership/checkout-demo.html

# Expected: HTTP/2 200 for all
```

## NAVIGATION VERIFICATION

Test these navigation flows:
1. **Homepage** → Pricing → Signup
2. **Login link** → `/login-real.html` (may need creation)
3. **Demo link** → `/editor-real.html` (may need creation)
4. **Dashboard link** → `/dashboard-real.html` (may need creation)

## URL STRUCTURE AFTER DEPLOYMENT

```
https://benchonly.com/membership/           # Landing page
https://benchonly.com/membership/pricing.html    # Pricing plans
https://benchonly.com/membership/signup.html     # User registration  
https://benchonly.com/membership/billing.html    # Account management
https://benchonly.com/membership/checkout-demo.html  # Demo checkout
```

## VALIDATION SCRIPT UPDATE

Updated verification for new domain:

```bash
# Test benchonly.com deployment
BASE_URL="https://benchonly.com/membership"
curl -I $BASE_URL/
curl -I $BASE_URL/pricing.html
curl -I $BASE_URL/signup.html
curl -I $BASE_URL/billing.html
```

## COMPLETION CRITERIA

✅ **Deployment Complete When:**
- All 5 files uploaded successfully
- All URLs return HTTP 200 status
- Navigation links work correctly
- Stripe/Supabase integrations functional
- Complete user journey verified

**Ready for deployment to benchonly.com/membership/**