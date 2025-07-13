const puppeteer = require('puppeteer');

async function takeScreenshot() {
  console.log('Starting Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport to a standard desktop size
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Navigating to login page...');
    // First login
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle2' });
    
    // Wait for form to load
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Fill login form
    await page.type('input[type="email"]', '1@1.com');
    await page.type('input[type="password"]', '123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log('Navigating to tenants page...');
    // Navigate to tenants page
    await page.goto('http://localhost:3000/admin/tenants', { waitUntil: 'networkidle2' });
    
    // Wait for navigation to complete and give time for React components to render
    console.log('Waiting for page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Give React time to render
    
    // Take screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `/tmp/tenants-page-${timestamp}.png`;
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    // Also take a focused screenshot of just the table area
    const tableElement = await page.$('main');
    if (tableElement) {
      const focusedPath = `/tmp/tenants-table-${timestamp}.png`;
      await tableElement.screenshot({ path: focusedPath });
      console.log(`Focused screenshot saved to: ${focusedPath}`);
    }
    
    return screenshotPath;
  } catch (error) {
    console.error('Error taking screenshot:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
takeScreenshot()
  .then(path => {
    console.log('Screenshot completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Screenshot failed:', error);
    process.exit(1);
  });