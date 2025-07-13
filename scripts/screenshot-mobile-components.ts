import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

// Mobile device configurations
const devices = [
  { name: 'iphone-14', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: 'iphone-se', width: 375, height: 667, deviceScaleFactor: 2 },
  { name: 'pixel-7', width: 412, height: 915, deviceScaleFactor: 2.625 },
  { name: 'ipad-mini', width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: 'desktop', width: 1920, height: 1080, deviceScaleFactor: 1 }
];

const tabs = [
  'overview',
  'list-pattern',
  'edit-pattern',
  'modals',
  'forms',
  'search-pattern',
  'advanced'
];

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(process.cwd(), 'screenshots', 'mobile-components');
    await fs.mkdir(screenshotsDir, { recursive: true });

    for (const device of devices) {
      console.log(`📱 Taking screenshots for ${device.name}...`);
      
      const page = await browser.newPage();
      
      // Set viewport to device dimensions
      await page.setViewport({
        width: device.width,
        height: device.height,
        deviceScaleFactor: device.deviceScaleFactor,
        isMobile: device.name !== 'desktop',
        hasTouch: device.name !== 'desktop'
      });

      // Navigate to components page
      try {
        await page.goto('http://localhost:3000/dev/components', {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
      } catch (navError) {
        console.log(`  ⚠️  Navigation timeout for ${device.name}, continuing...`);
      }

      // Wait for the page to load - check if we need to login first
      try {
        await page.waitForSelector('h1', { timeout: 5000 });
      } catch (waitError) {
        // Check if we're on the login page
        const isLoginPage = await page.$('input[type="email"]') !== null;
        if (isLoginPage) {
          console.log(`  ℹ️  Detected login page, screenshots require authentication`);
          await page.close();
          continue;
        }
      }

      // Take screenshot of main page
      const mainScreenshotPath = path.join(screenshotsDir, `${device.name}-components-main.png`);
      await page.screenshot({
        path: mainScreenshotPath,
        fullPage: true
      });
      console.log(`  ✅ Saved: ${mainScreenshotPath}`);

      // Take screenshots of each tab
      for (const tab of tabs) {
        try {
          // Click on the tab
          const tabText = tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          try {
            // Try multiple selectors
            await page.evaluate((tabValue, text) => {
              // Try data-value attribute first
              let button = document.querySelector(`button[data-value="${tabValue}"]`);
              // If not found, try by text content
              if (!button) {
                const buttons = document.querySelectorAll('button');
                button = Array.from(buttons).find(b => b.textContent?.trim() === text);
              }
              if (button) {
                (button as HTMLButtonElement).click();
              }
            }, tab, tabText);
          } catch (clickError) {
            console.log(`  ⚠️  Could not click tab: ${tabText}`);
            continue;
          }
          
          // Wait for content to load
          await new Promise(resolve => setTimeout(resolve, 500));

          // Scroll to top
          await page.evaluate(() => window.scrollTo(0, 0));

          // Take screenshot
          const tabScreenshotPath = path.join(screenshotsDir, `${device.name}-components-${tab}.png`);
          await page.screenshot({
            path: tabScreenshotPath,
            fullPage: true
          });
          console.log(`  ✅ Saved: ${tabScreenshotPath}`);

          // For mobile devices, also take screenshots of specific interactive elements
          if (device.name !== 'desktop' && tab === 'list-pattern') {
            // Scroll to AdminListPage example if visible
            const adminListSelector = '.space-y-6';
            const adminListElement = await page.$(adminListSelector);
            if (adminListElement) {
              await adminListElement.scrollIntoViewIfNeeded();
              await new Promise(resolve => setTimeout(resolve, 300));
              
              const interactiveScreenshotPath = path.join(screenshotsDir, `${device.name}-components-${tab}-interactive.png`);
              await page.screenshot({
                path: interactiveScreenshotPath,
                clip: await adminListElement.boundingBox() || undefined
              });
              console.log(`  ✅ Saved: ${interactiveScreenshotPath}`);
            }
          }
        } catch (error) {
          console.error(`  ❌ Error capturing ${tab} tab:`, error.message);
        }
      }

      await page.close();
    }

    console.log('\n✨ All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${path.join(process.cwd(), 'screenshots', 'mobile-components')}`);

  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Run the screenshot script
takeScreenshots().catch(console.error);