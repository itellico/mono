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
      width: 1920,
      height: 1080
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

    // Take a full page screenshot
    const screenshotPath = './screenshots/docs-getting-started-readme.png';
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Also take a viewport-only screenshot to see the initial view
    const viewportScreenshotPath = './screenshots/docs-getting-started-readme-viewport.png';
    await page.screenshot({
      path: viewportScreenshotPath,
      fullPage: false
    });

    console.log(`Viewport screenshot saved to: ${viewportScreenshotPath}`);

  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();