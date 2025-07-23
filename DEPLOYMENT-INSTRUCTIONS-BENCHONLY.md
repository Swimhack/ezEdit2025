# 📋 DEPLOYMENT INSTRUCTIONS - benchonly.com/membership

## CURRENT STATUS (VERIFIED)

**Target:** https://benchonly.com/membership/  
**Current Deployment:** 0% complete (baseline established)  
**Server:** Microsoft-IIS/10.0 (Windows/Plesk)

## REQUIRED ACTIONS

### Step 1: Upload Files
Upload these 5 files from `deployment-package/` to `/membership/` directory:

```
deployment-package/index.html → /membership/index.html
deployment-package/pricing.html → /membership/pricing.html  
deployment-package/signup.html → /membership/signup.html
deployment-package/billing.html → /membership/billing.html
deployment-package/checkout-demo.html → /membership/checkout-demo.html
```

### Step 2: Set Permissions
Ensure files have proper permissions (644 or readable by web server)

### Step 3: Verify Deployment
Run verification script:
```bash
./verify-benchonly-deployment.sh
```

**Expected Result:** 100% success rate (3/3 tests passing)

## DEPLOYMENT METHODS

### Option A: File Manager (Recommended)
1. Login to hosting control panel (Plesk)
2. Navigate to File Manager
3. Go to `/membership/` directory
4. Upload all 5 files from `deployment-package/`
5. Verify file permissions

### Option B: FTP Upload
```
Host: benchonly.com
Directory: /membership/
Upload: All files from deployment-package/
```

### Option C: SFTP/SCP
```bash
# If SSH access available
scp deployment-package/* user@benchonly.com:/path/to/membership/
```

## VALIDATION URLS

After deployment, these should work:
- https://benchonly.com/membership/ (Homepage)
- https://benchonly.com/membership/pricing.html (Pricing)
- https://benchonly.com/membership/signup.html (Signup)
- https://benchonly.com/membership/billing.html (Billing)
- https://benchonly.com/membership/checkout-demo.html (Demo)

## SUCCESS CRITERIA

✅ **Deployment Complete When:**
- All files return HTTP 200 status
- Homepage shows EzEdit.co content
- Pricing page has Stripe integration
- Signup page has Supabase integration
- Navigation links work correctly
- Verification script shows 100% success

**Files ready in deployment-package/ folder - upload to complete deployment.**