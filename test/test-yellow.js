const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001/auth/signin', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.type('#email', '1@1.com');
    await page.type('#password', '123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    
    await page.goto('http://localhost:3001/admin/tenants', { waitUntil: 'networkidle0', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ path: 'test-yellow-background.png', fullPage: true });
    console.log('Screenshot saved with yellow background test');
    
    const hasYellow = await page.evaluate(() => {
      const yellowElements = document.querySelectorAll('[class*="bg-yellow"], [class*="border-yellow"]');
      return {
        yellowElementsFound: yellowElements.length,
        pageContent: document.body.innerHTML.includes('bg-yellow') ? 'Yellow found in HTML' : 'No yellow in HTML'
      };
    });
    
    console.log('Yellow background test:', hasYellow);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();