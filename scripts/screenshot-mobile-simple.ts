import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

async function takeSimpleScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Create screenshots directory
    const screenshotsDir = path.join(process.cwd(), 'screenshots', 'mobile-components');
    await fs.mkdir(screenshotsDir, { recursive: true });

    // Mobile viewport
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });

    console.log('📱 Taking mobile screenshot...');
    
    // Navigate and take screenshot
    await page.goto('http://localhost:3000/dev/components', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Wait a bit for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    const screenshotPath = path.join(screenshotsDir, 'mobile-components-test.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`✅ Screenshot saved: ${screenshotPath}`);

    // Also take a desktop screenshot for comparison
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const desktopPath = path.join(screenshotsDir, 'desktop-components-test.png');
    await page.screenshot({
      path: desktopPath,
      fullPage: true
    });

    console.log(`✅ Desktop screenshot saved: ${desktopPath}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeSimpleScreenshots().catch(console.error);