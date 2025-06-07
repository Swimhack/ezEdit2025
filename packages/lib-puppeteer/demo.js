/**
 * ezEdit Puppeteer Demo Script
 * 
 * This script demonstrates how to use Puppeteer for taking screenshots
 * and making web edits, which will be integrated into the ezEdit application.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Take a screenshot of a website
 */
async function takeScreenshot(url, options = {}) {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: options.viewport || { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${timestamp}.png`;
    const filepath = path.join(outputDir, filename);
    
    await page.screenshot({
      path: filepath,
      fullPage: options.fullPage || false
    });
    
    console.log(`Screenshot saved to: ${filepath}`);
    return filepath;
  } finally {
    await browser.close();
  }
}

/**
 * Make edits to a website and take a screenshot
 */
async function editWebsiteAndScreenshot(url, edits) {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    console.log('Making edits to the page...');
    
    // Apply each edit
    for (const edit of edits) {
      if (edit.type === 'setText') {
        await page.evaluate((selector, value) => {
          const element = document.querySelector(selector);
          if (element) {
            if ('value' in element) {
              element.value = value;
            } else {
              element.textContent = value;
            }
          }
        }, edit.selector, edit.value);
        console.log(`Set text of "${edit.selector}" to: ${edit.value}`);
      }
      
      if (edit.type === 'addStyle') {
        await page.addStyleTag({ content: edit.content });
        console.log('Added custom style');
      }
    }
    
    // Take a screenshot of the edited page
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `edited-${timestamp}.png`;
    const filepath = path.join(outputDir, filename);
    
    await page.screenshot({
      path: filepath,
      fullPage: true
    });
    
    console.log(`Edited screenshot saved to: ${filepath}`);
    return filepath;
  } finally {
    await browser.close();
  }
}

/**
 * Run the demo
 */
async function runDemo() {
  try {
    // Take a simple screenshot
    console.log('Taking a screenshot of example.com...');
    await takeScreenshot('https://example.com');
    
    // Edit a website and take a screenshot
    console.log('\nEditing example.com and taking a screenshot...');
    await editWebsiteAndScreenshot('https://example.com', [
      {
        type: 'setText',
        selector: 'h1',
        value: 'Modified by ezEdit'
      },
      {
        type: 'setText',
        selector: 'p',
        value: 'This page has been modified using the ezEdit Puppeteer integration.'
      },
      {
        type: 'addStyle',
        content: `
          body { background-color: #f0f8ff; }
          h1 { color: #0066cc; }
          p { font-size: 18px; color: #333; }
        `
      }
    ]);
    
    console.log('\nDemo completed successfully!');
  } catch (error) {
    console.error('Error running demo:', error);
  }
}

// Run the demo
runDemo();
