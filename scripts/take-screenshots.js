#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function takeScreenshots() {
  console.log('📸 Taking frontend screenshots...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Login page
    console.log('📸 Screenshot 1: Login page');
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle2' });
    await page.screenshot({ 
      path: 'screenshots/01-current-login-page.png',
      fullPage: true 
    });
    
    // 2. Try login and capture result
    console.log('📸 Screenshot 2: After login attempt');
    await page.type('input[type="email"]', '1@1.com');
    await page.type('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'screenshots/02-after-login-attempt.png',
      fullPage: true 
    });
    
    // 3. Try admin pages
    const adminPages = [
      { url: '/admin', name: '03-admin-dashboard' },
      { url: '/admin/tenants', name: '04-admin-tenants' },
      { url: '/admin/categories', name: '05-admin-categories' },
      { url: '/admin/permissions', name: '06-admin-permissions' }
    ];
    
    for (const pageInfo of adminPages) {
      try {
        console.log(`📸 Screenshot: ${pageInfo.name}`);
        await page.goto(`http://localhost:3000${pageInfo.url}`, { 
          waitUntil: 'networkidle2',
          timeout: 10000 
        });
        await page.waitForTimeout(2000);
        await page.screenshot({ 
          path: `screenshots/${pageInfo.name}.png`,
          fullPage: true 
        });
      } catch (error) {
        console.log(`⚠️  Could not capture ${pageInfo.name}: ${error.message}`);
      }
    }
    
    console.log('✅ Screenshots completed');
    
  } catch (error) {
    console.error('❌ Screenshot error:', error.message);
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch(console.error);