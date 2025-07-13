const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport for a good desktop view
    await page.setViewport({
      width: 1200,
      height: 800
    });

    console.log('Navigating to docs page...');
    const url = 'http://localhost:3000/docs?doc=getting-started%2FREADME';
    
    // Navigate to the page with a longer timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait a bit for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take a viewport screenshot focused on the tree structure
    const screenshotPath = './screenshots/tree-fix-attempt-3.png';
    await page.screenshot({
      path: screenshotPath,
      fullPage: false
    });

    console.log(`Screenshot saved to: ${screenshotPath}`);

  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();