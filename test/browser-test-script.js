/**
 * Browser Console Test Script
 * Copy and paste this into your browser console when on localhost:3000
 * This will automatically test the login flow and admin pages
 */

// Test configuration
const TEST_CONFIG = {
  email: '1@1.com',
  password: 'Admin123!',
  adminPages: [
    { name: 'Dashboard', url: '/admin' },
    { name: 'Tenants', url: '/admin/tenants' },
    { name: 'Categories', url: '/admin/categories' },
    { name: 'Tags', url: '/admin/tags' },
    { name: 'Permissions', url: '/admin/permissions' },
    { name: 'Settings', url: '/admin/settings' },
    { name: 'Monitoring', url: '/admin/monitoring' },
    { name: 'Subscriptions', url: '/admin/subscriptions' },
    { name: 'Users', url: '/admin/users' },
    { name: 'Audit', url: '/admin/audit' }
  ]
};

// Utility functions
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logSection = (title) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🔍 ${title}`);
  console.log(`${'='.repeat(50)}`);
};

const logResult = (test, status, details = '') => {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${test}: ${status.toUpperCase()}${details ? ` - ${details}` : ''}`);
};

// Test login functionality
async function testLogin() {
  logSection('Testing Login Flow');
  
  try {
    // Navigate to login page
    window.location.href = '/auth/signin';
    await wait(2000);
    
    // Check if we're on the login page
    if (!window.location.pathname.includes('/auth/signin')) {
      logResult('Login page navigation', 'fail', 'Not on login page');
      return false;
    }
    
    logResult('Login page navigation', 'pass');
    
    // Fill in the form
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const submitButton = document.querySelector('button[type="submit"]');
    
    if (!emailInput || !passwordInput || !submitButton) {
      logResult('Login form elements', 'fail', 'Missing form elements');
      return false;
    }
    
    logResult('Login form elements', 'pass');
    
    // Fill and submit
    emailInput.value = TEST_CONFIG.email;
    passwordInput.value = TEST_CONFIG.password;
    
    // Create promise to wait for navigation
    const navigationPromise = new Promise((resolve) => {
      const checkNavigation = () => {
        if (window.location.pathname !== '/auth/signin') {
          resolve(true);
        } else {
          setTimeout(checkNavigation, 100);
        }
      };
      setTimeout(checkNavigation, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => resolve(false), 10000);
    });
    
    submitButton.click();
    
    const navigated = await navigationPromise;
    
    if (!navigated) {
      logResult('Login submission', 'fail', 'Did not navigate away from login page');
      return false;
    }
    
    logResult('Login submission', 'pass', `Redirected to ${window.location.pathname}`);
    
    // Check for auth errors
    const errorMessages = document.querySelectorAll('[role="alert"], .alert, .error');
    if (errorMessages.length > 0) {
      logResult('Login errors', 'warn', `Found ${errorMessages.length} error messages`);
      errorMessages.forEach(el => console.log('Error:', el.textContent));
    } else {
      logResult('Login errors', 'pass', 'No error messages found');
    }
    
    return true;
  } catch (error) {
    logResult('Login test', 'fail', error.message);
    return false;
  }
}

// Test admin page access
async function testAdminPages() {
  logSection('Testing Admin Page Access');
  
  const results = [];
  
  for (const page of TEST_CONFIG.adminPages) {
    try {
      console.log(`\n📄 Testing ${page.name} (${page.url})`);
      
      // Navigate to page
      window.location.href = page.url;
      await wait(3000); // Wait for page load
      
      // Check if we got redirected back to login
      if (window.location.pathname.includes('/auth/signin')) {
        logResult(page.name, 'fail', 'Redirected to login - authentication issue');
        results.push({ ...page, status: 'auth_fail' });
        continue;
      }
      
      // Check for permission errors
      const permissionErrors = document.querySelectorAll('[data-testid="access-denied"], .permission-error');
      if (permissionErrors.length > 0) {
        logResult(page.name, 'fail', 'Permission denied');
        results.push({ ...page, status: 'permission_fail' });
        continue;
      }
      
      // Check for React errors
      const reactErrors = document.querySelectorAll('[data-react-error], .react-error');
      if (reactErrors.length > 0) {
        logResult(page.name, 'fail', 'React component error');
        results.push({ ...page, status: 'react_error' });
        continue;
      }
      
      // Check for 404 errors
      if (document.title.includes('404') || document.body.textContent.includes('Page not found')) {
        logResult(page.name, 'fail', '404 - Page not found');
        results.push({ ...page, status: '404' });
        continue;
      }
      
      // Check for loading spinners (might indicate stuck loading)
      const spinners = document.querySelectorAll('[data-testid="loading"], .loading, .spinner');
      if (spinners.length > 0) {
        logResult(page.name, 'warn', 'Page still loading or stuck');
        results.push({ ...page, status: 'loading' });
        continue;
      }
      
      // Check for main content
      const hasContent = document.querySelector('main, [role="main"], .main-content, .admin-content');
      if (!hasContent) {
        logResult(page.name, 'warn', 'No main content detected');
        results.push({ ...page, status: 'no_content' });
        continue;
      }
      
      logResult(page.name, 'pass', 'Page loaded successfully');
      results.push({ ...page, status: 'success' });
      
    } catch (error) {
      logResult(page.name, 'fail', `Error: ${error.message}`);
      results.push({ ...page, status: 'error', error: error.message });
    }
  }
  
  return results;
}

// Check browser console for errors
function checkConsoleErrors() {
  logSection('Console Error Check');
  
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  const errors = [];
  const warnings = [];
  
  // Override console methods to capture errors
  console.error = (...args) => {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  console.warn = (...args) => {
    warnings.push(args.join(' '));
    originalWarn.apply(console, args);
  };
  
  // Restore after a short delay
  setTimeout(() => {
    console.error = originalError;
    console.warn = originalWarn;
    
    console.log(`\n📊 Console Summary:`);
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Recent Errors:');
      errors.slice(-5).forEach(error => console.log(`   - ${error}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️ Recent Warnings:');
      warnings.slice(-5).forEach(warning => console.log(`   - ${warning}`));
    }
  }, 1000);
}

// Main test runner
async function runTests() {
  console.clear();
  logSection('Starting Mono Platform Admin Test Suite');
  console.log('🚀 This will test login and admin page functionality');
  console.log('⏱️ Please wait for tests to complete...');
  
  checkConsoleErrors();
  
  // Test login
  const loginSuccess = await testLogin();
  
  if (!loginSuccess) {
    console.log('\n🛑 Login failed - cannot test admin pages');
    return;
  }
  
  // Wait a bit for auth to settle
  await wait(2000);
  
  // Test admin pages
  const pageResults = await testAdminPages();
  
  // Generate summary report
  logSection('Test Summary Report');
  
  const summary = {
    success: pageResults.filter(r => r.status === 'success').length,
    authFail: pageResults.filter(r => r.status === 'auth_fail').length,
    permissionFail: pageResults.filter(r => r.status === 'permission_fail').length,
    reactError: pageResults.filter(r => r.status === 'react_error').length,
    notFound: pageResults.filter(r => r.status === '404').length,
    loading: pageResults.filter(r => r.status === 'loading').length,
    noContent: pageResults.filter(r => r.status === 'no_content').length,
    error: pageResults.filter(r => r.status === 'error').length
  };
  
  console.log('\n📊 Results Summary:');
  console.log(`   ✅ Working: ${summary.success}`);
  console.log(`   🔐 Auth Issues: ${summary.authFail}`);
  console.log(`   🚫 Permission Issues: ${summary.permissionFail}`);
  console.log(`   ⚛️ React Errors: ${summary.reactError}`);
  console.log(`   📄 Not Found: ${summary.notFound}`);
  console.log(`   ⏳ Loading Issues: ${summary.loading}`);
  console.log(`   📝 No Content: ${summary.noContent}`);
  console.log(`   💥 Other Errors: ${summary.error}`);
  
  // Detailed results
  console.log('\n📋 Detailed Results:');
  pageResults.forEach(result => {
    const icon = result.status === 'success' ? '✅' : 
                result.status === 'auth_fail' ? '🔐' :
                result.status === 'permission_fail' ? '🚫' :
                result.status === 'react_error' ? '⚛️' :
                result.status === '404' ? '📄' :
                result.status === 'loading' ? '⏳' :
                result.status === 'no_content' ? '📝' : '💥';
    
    console.log(`   ${icon} ${result.name} (${result.url}) - ${result.status}`);
    if (result.error) {
      console.log(`       Error: ${result.error}`);
    }
  });
  
  console.log('\n🏁 Test completed!');
  console.log('💡 Use this information to prioritize fixes');
}

// Auto-run if called directly, or expose for manual execution
if (typeof window !== 'undefined') {
  console.log('🔧 Mono Platform Test Suite Loaded');
  console.log('📝 Run runTests() to start testing');
  console.log('🎯 Or call individual functions: testLogin(), testAdminPages()');
  
  // Make functions available globally
  window.monoTestSuite = {
    runTests,
    testLogin,
    testAdminPages,
    checkConsoleErrors
  };
} else {
  // If running in Node.js context, just export
  module.exports = { runTests, testLogin, testAdminPages };
}