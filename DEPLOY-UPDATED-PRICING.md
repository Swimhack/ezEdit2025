# 🚀 Deploy Updated Pricing to EzEdit.co

## **Manual Deployment Commands**

Copy and paste these commands into your DigitalOcean console at:
https://cloud.digitalocean.com/droplets/509389318

### **Step 1: Backup Current Site**
```bash
cd /var/www/html && mkdir -p /backup/pricing-update-$(date +%Y%m%d_%H%M%S) && cp index.php /backup/pricing-update-$(date +%Y%m%d_%H%M%S)/
```

### **Step 2: Update Pricing Section**
```bash
cat > /tmp/update_pricing.php << 'EOF'
<?php
$file = '/var/www/html/index.php';
$content = file_get_contents($file);

// Replace the pricing section with updated content
$old_pricing = '/<section id="pricing".*?<\/section>/s';

$new_pricing = '<section id="pricing" class="pricing-section">
        <div class="container">
            <div class="section-header">
                <h2>Simple, Transparent Pricing</h2>
                <p>No setup fees | Cancel anytime | 30-day money back</p>
            </div>
            
            <div class="pricing-grid">
                <div class="pricing-card">
                    <div class="pricing-header">
                        <h3>Free</h3>
                        <div class="price">
                            <span class="currency">$</span>
                            <span class="amount">0</span>
                            <span class="period">/forever</span>
                        </div>
                        <p class="pricing-subtitle">Perfect for browsing and exploring ezEdit</p>
                    </div>
                    <ul class="pricing-features">
                        <li>Browse all features</li>
                        <li>View documentation</li>
                        <li>Community support</li>
                        <li>No file uploads</li>
                        <li>Read-only access</li>
                        <li>Standard security</li>
                    </ul>
                    <a href="auth/register.php" class="btn-secondary btn-full">Get started</a>
                </div>
                
                <div class="pricing-card featured">
                    <div class="pricing-badge">Most Popular</div>
                    <div class="pricing-header">
                        <h3>Single Site</h3>
                        <div class="price">
                            <span class="currency">$</span>
                            <span class="amount">20</span>
                            <span class="period">/per month</span>
                        </div>
                        <p class="pricing-subtitle">Perfect for individual developers</p>
                    </div>
                    <ul class="pricing-features">
                        <li>1 active website</li>
                        <li>Full file editing access</li>
                        <li>Unlimited file uploads</li>
                        <li>Priority support</li>
                        <li>Advanced file management</li>
                        <li>Secure FTP/SFTP connections</li>
                        <li>Advanced security features</li>
                        <li>Monaco code editor</li>
                        <li>Real-time file sync</li>
                    </ul>
                    <a href="auth/register.php" class="btn-primary btn-full">Start free trial</a>
                </div>
                
                <div class="pricing-card">
                    <div class="pricing-header">
                        <h3>Unlimited</h3>
                        <div class="price">
                            <span class="currency">$</span>
                            <span class="amount">100</span>
                            <span class="period">/per month</span>
                        </div>
                        <p class="pricing-subtitle">For agencies and power users</p>
                    </div>
                    <ul class="pricing-features">
                        <li>Unlimited websites</li>
                        <li>Everything in Single Site</li>
                        <li>Unlimited storage</li>
                        <li>Multiple FTP connections</li>
                        <li>Enhanced security</li>
                        <li>Dedicated support</li>
                        <li>Priority feature requests</li>
                        <li>Advanced file operations</li>
                        <li>Bulk file management</li>
                        <li>Extended file history</li>
                        <li>Custom integrations</li>
                    </ul>
                    <a href="auth/register.php" class="btn-primary btn-full">Start free trial</a>
                </div>
            </div>
        </div>
    </section>';

$updated_content = preg_replace($old_pricing, $new_pricing, $content);

if ($updated_content && $updated_content !== $content) {
    file_put_contents($file, $updated_content);
    echo "✅ Pricing section updated successfully!\n";
} else {
    echo "❌ Failed to update pricing section\n";
}
?>
EOF

php /tmp/update_pricing.php
```

### **Step 3: Add CSS for Pricing Subtitles**
```bash
sed -i '/.pricing-features li:before/a\
        .pricing-subtitle { color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem; }' /var/www/html/index.php
```

### **Step 4: Set Permissions and Reload**
```bash
chown www-data:www-data /var/www/html/index.php && chmod 644 /var/www/html/index.php && systemctl reload nginx && rm /tmp/update_pricing.php
```

### **Step 5: Test the Deployment**
```bash
echo "🧪 Testing deployment..."
if curl -s http://159.65.224.175/index.php | grep -q "No setup fees"; then
    echo "✅ Pricing update deployed successfully!"
    echo "🌐 View updated pricing at: http://159.65.224.175/index.php#pricing"
else
    echo "⚠️  Could not verify pricing update"
fi
```

## **✅ What's Updated**

After running these commands, your site will have:

- ✅ **Free Plan**: $0/forever with browse-only features
- ✅ **Single Site Plan**: $20/month for individual developers  
- ✅ **Unlimited Plan**: $100/month for agencies
- ✅ **Guarantee Text**: "No setup fees | Cancel anytime | 30-day money back"
- ✅ **Feature Lists**: Updated with the new feature descriptions
- ✅ **Call-to-Action**: Both plans have "Start free trial" buttons

## **🎯 Test URLs**

- **Homepage with New Pricing**: http://159.65.224.175/index.php#pricing
- **Full Homepage**: http://159.65.224.175/index.php

**Your updated pricing structure is now ready to deploy!** 🚀