#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');

async function takeScreenshot(url, outputPath) {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport to common desktop size
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    console.log(`Navigating to ${url}...`);
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait a bit for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take full page screenshot
    console.log(`Taking screenshot...`);
    await page.screenshot({
      path: outputPath,
      fullPage: true
    });

    console.log(`Screenshot saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    await browser.close();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const url = args[0] || 'http://localhost:3000/docs';
const outputPath = args[1] || path.join(process.cwd(), 'docs-screenshot.png');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node take-screenshot.js [URL] [OUTPUT_PATH]

Examples:
  node take-screenshot.js
  node take-screenshot.js http://localhost:3000/docs
  node take-screenshot.js http://localhost:3000/docs ./screenshots/docs.png
`);
  process.exit(0);
}

// Run the screenshot
takeScreenshot(url, outputPath)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });