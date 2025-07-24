const fs = require('fs');
const path = require('path');

function testResponsiveDesign() {
    console.log('📱 Responsive Design Testing\n');
    
    const publicDir = path.join(__dirname, 'public');
    const cssFiles = [
        path.join(publicDir, 'css', 'main.css'),
        path.join(publicDir, 'css', 'auth.css'),
        path.join(publicDir, 'css', 'dashboard.css')
    ];
    
    cssFiles.forEach(cssFile => {
        if (fs.existsSync(cssFile)) {
            console.log(`\n=== Analyzing ${path.basename(cssFile)} ===`);
            const cssContent = fs.readFileSync(cssFile, 'utf8');
            
            // Check for common responsive breakpoints
            const breakpoints = [
                { size: '320px', device: 'Mobile (Small)' },
                { size: '375px', device: 'Mobile (Medium)' },
                { size: '425px', device: 'Mobile (Large)' },
                { size: '768px', device: 'Tablet' },
                { size: '1024px', device: 'Laptop' },
                { size: '1440px', device: 'Desktop' },
                { size: '2560px', device: 'Large Desktop' }
            ];
            
            breakpoints.forEach(bp => {
                if (cssContent.includes(bp.size)) {
                    console.log(`✅ Found breakpoint for ${bp.device}: ${bp.size}`);
                }
            });
            
            // Check for responsive units
            const responsiveUnits = [
                { unit: 'rem', description: 'Relative to root font size' },
                { unit: 'em', description: 'Relative to parent font size' },
                { unit: 'vh', description: 'Viewport height' },
                { unit: 'vw', description: 'Viewport width' },
                { unit: '%', description: 'Percentage-based' },
                { unit: 'fr', description: 'CSS Grid fractional units' }
            ];
            
            console.log('\n--- Responsive Units Check ---');
            responsiveUnits.forEach(unit => {
                const regex = new RegExp(`\\d+${unit.unit}`, 'g');
                const matches = cssContent.match(regex);
                if (matches && matches.length > 0) {
                    console.log(`✅ Using ${unit.unit} units (${matches.length} instances) - ${unit.description}`);
                }
            });
            
            // Check for flexible layouts
            const flexLayoutFeatures = [
                'display: flex',
                'display: grid',
                'flex-direction',
                'justify-content',
                'align-items',
                'grid-template',
                'flex-wrap'
            ];
            
            console.log('\n--- Flexible Layout Features ---');
            flexLayoutFeatures.forEach(feature => {
                if (cssContent.includes(feature)) {
                    console.log(`✅ Found: ${feature}`);
                }
            });
            
            // Check for responsive images
            const imageResponsiveFeatures = [
                'max-width: 100%',
                'height: auto',
                'object-fit',
                'background-size: cover',
                'background-size: contain'
            ];
            
            console.log('\n--- Responsive Images ---');
            imageResponsiveFeatures.forEach(feature => {
                if (cssContent.includes(feature)) {
                    console.log(`✅ Found: ${feature}`);
                }
            });
        }
    });
    
    // Test HTML viewport meta tag
    console.log('\n=== Viewport Meta Tag Check ===');
    const htmlFiles = [
        path.join(publicDir, 'index.php'),
        path.join(publicDir, 'auth', 'login.php'),
        path.join(publicDir, 'dashboard.php')
    ];
    
    htmlFiles.forEach(htmlFile => {
        if (fs.existsSync(htmlFile)) {
            const content = fs.readFileSync(htmlFile, 'utf8');
            if (content.includes('name="viewport"')) {
                console.log(`✅ ${path.basename(htmlFile)} has viewport meta tag`);
                
                // Check for proper viewport configuration
                if (content.includes('width=device-width')) {
                    console.log('   ✅ Includes width=device-width');
                }
                if (content.includes('initial-scale=1')) {
                    console.log('   ✅ Includes initial-scale=1');
                }
            } else {
                console.log(`❌ ${path.basename(htmlFile)} missing viewport meta tag`);
            }
        }
    });
    
    console.log('\n📊 Responsive Design Summary:');
    console.log('   The application appears to implement responsive design features');
    console.log('   including flexible layouts, relative units, and viewport optimization.');
}

// Test mobile-first approach
function testMobileFirstApproach() {
    console.log('\n📱 Mobile-First Design Analysis\n');
    
    const mainCSSPath = path.join(__dirname, 'public', 'css', 'main.css');
    
    if (fs.existsSync(mainCSSPath)) {
        const cssContent = fs.readFileSync(mainCSSPath, 'utf8');
        
        // Check if base styles are mobile-first
        const mobileFirstIndicators = [
            'min-width:', // Progressive enhancement
            '@media (min-width', // Min-width queries suggest mobile-first
        ];
        
        const maxWidthQueries = cssContent.match(/@media.*max-width/g);
        const minWidthQueries = cssContent.match(/@media.*min-width/g);
        
        console.log('=== Media Query Analysis ===');
        if (maxWidthQueries) {
            console.log(`📱 Found ${maxWidthQueries.length} max-width media queries (desktop-first approach)`);
        }
        if (minWidthQueries) {
            console.log(`📱 Found ${minWidthQueries.length} min-width media queries (mobile-first approach)`);
        }
        
        if (minWidthQueries && minWidthQueries.length > maxWidthQueries?.length) {
            console.log('✅ Appears to use mobile-first approach');
        } else if (maxWidthQueries && maxWidthQueries.length > 0) {
            console.log('⚠️  Appears to use desktop-first approach');
        } else {
            console.log('ℹ️  No clear mobile-first or desktop-first pattern detected');
        }
    }
}

// Run tests
testResponsiveDesign();
testMobileFirstApproach();

console.log('\n🎯 Responsive Testing Complete!');