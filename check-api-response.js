const { chromium } = require('playwright');

async function checkApiResponse() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Checking API response structure...\n');

  try {
    // Navigate to the API endpoint
    await page.goto('https://ezeditapp.fly.dev/api/websites');

    // Get the full response
    const content = await page.content();
    console.log('Full API Response:');
    console.log(content);

    // Try to extract JSON from the pre tag
    const jsonData = await page.evaluate(() => {
      const preElement = document.querySelector('pre');
      if (preElement) {
        try {
          return JSON.parse(preElement.textContent);
        } catch (e) {
          return preElement.textContent;
        }
      }
      return null;
    });

    if (jsonData) {
      console.log('\nParsed JSON Data:');
      console.log(JSON.stringify(jsonData, null, 2));
    }

  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  await browser.close();
  console.log('\n✅ API check complete!');
}

checkApiResponse().catch(console.error);