import axios from 'axios';
import { chromium } from 'playwright';

const API_BASE_URL = 'http://localhost:3001/api/v1';
const FRONTEND_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  error?: string;
  details?: any;
}

class AdminTester {
  private results: TestResult[] = [];
  private authToken: string = '';
  private browser: any;
  private page: any;

  async initialize() {
    // Get auth token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    this.authToken = loginResponse.data.token;

    // Initialize browser
    this.browser = await chromium.launch({ headless: false });
    const context = await this.browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: FRONTEND_URL,
            localStorage: [
              {
                name: 'auth-token',
                value: this.authToken
              }
            ]
          }
        ]
      }
    });
    this.page = await context.newPage();
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private addResult(name: string, status: 'PASS' | 'FAIL', error?: string, details?: any) {
    this.results.push({ name, status, error, details });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${name}${error ? `: ${error}` : ''}`);
  }

  // API Testing Methods
  async testTagsAPI() {
    console.log('\n📋 Testing Tags API Endpoints...\n');

    // Test GET /api/v1/admin/tags
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/tags`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      this.addResult('GET /api/v1/admin/tags', 'PASS', undefined, {
        statusCode: response.status,
        dataCount: response.data.data?.length || 0
      });
    } catch (error: any) {
      this.addResult('GET /api/v1/admin/tags', 'FAIL', error.message);
    }

    // Test POST /api/v1/admin/tags (Create)
    let createdTagId: string | undefined;
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/tags`,
        {
          name: 'Test Tag',
          slug: 'test-tag-' + Date.now(),
          description: 'Test tag description',
          metadata: { test: true }
        },
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );
      createdTagId = response.data.data?.id;
      this.addResult('POST /api/v1/admin/tags', 'PASS', undefined, {
        statusCode: response.status,
        tagId: createdTagId
      });
    } catch (error: any) {
      this.addResult('POST /api/v1/admin/tags', 'FAIL', error.message);
    }

    // Test GET /api/v1/admin/tags/[uuid]
    if (createdTagId) {
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/tags/${createdTagId}`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });
        this.addResult('GET /api/v1/admin/tags/[uuid]', 'PASS', undefined, {
          statusCode: response.status,
          tagName: response.data.data?.name
        });
      } catch (error: any) {
        this.addResult('GET /api/v1/admin/tags/[uuid]', 'FAIL', error.message);
      }

      // Test PUT /api/v1/admin/tags/[uuid] (Update)
      try {
        const response = await axios.put(
          `${API_BASE_URL}/admin/tags/${createdTagId}`,
          {
            name: 'Updated Test Tag',
            description: 'Updated description'
          },
          { headers: { Authorization: `Bearer ${this.authToken}` } }
        );
        this.addResult('PUT /api/v1/admin/tags/[uuid]', 'PASS', undefined, {
          statusCode: response.status
        });
      } catch (error: any) {
        this.addResult('PUT /api/v1/admin/tags/[uuid]', 'FAIL', error.message);
      }

      // Test DELETE /api/v1/admin/tags/[uuid]
      try {
        const response = await axios.delete(`${API_BASE_URL}/admin/tags/${createdTagId}`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });
        this.addResult('DELETE /api/v1/admin/tags/[uuid]', 'PASS', undefined, {
          statusCode: response.status
        });
      } catch (error: any) {
        this.addResult('DELETE /api/v1/admin/tags/[uuid]', 'FAIL', error.message);
      }
    }

    // Test GET /api/v1/admin/tags/stats
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/tags/stats`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      this.addResult('GET /api/v1/admin/tags/stats', 'PASS', undefined, {
        statusCode: response.status
      });
    } catch (error: any) {
      this.addResult('GET /api/v1/admin/tags/stats', 'FAIL', error.message);
    }
  }

  async testCategoriesAPI() {
    console.log('\n📋 Testing Categories API Endpoints...\n');

    // Test GET /api/v1/admin/categories
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      this.addResult('GET /api/v1/admin/categories', 'PASS', undefined, {
        statusCode: response.status,
        dataCount: response.data.data?.length || 0
      });
    } catch (error: any) {
      this.addResult('GET /api/v1/admin/categories', 'FAIL', error.message);
    }

    // Test POST /api/v1/admin/categories/create
    let createdCategoryId: string | undefined;
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/categories/create`,
        {
          name: 'Test Category',
          slug: 'test-category-' + Date.now(),
          description: 'Test category description',
          metadata: { test: true }
        },
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );
      createdCategoryId = response.data.data?.id;
      this.addResult('POST /api/v1/admin/categories/create', 'PASS', undefined, {
        statusCode: response.status,
        categoryId: createdCategoryId
      });
    } catch (error: any) {
      this.addResult('POST /api/v1/admin/categories/create', 'FAIL', error.message);
    }

    // Test GET /api/v1/admin/categories/[uuid]
    if (createdCategoryId) {
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/categories/${createdCategoryId}`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });
        this.addResult('GET /api/v1/admin/categories/[uuid]', 'PASS', undefined, {
          statusCode: response.status,
          categoryName: response.data.data?.name
        });
      } catch (error: any) {
        this.addResult('GET /api/v1/admin/categories/[uuid]', 'FAIL', error.message);
      }

      // Test PUT /api/v1/admin/categories/update
      try {
        const response = await axios.put(
          `${API_BASE_URL}/admin/categories/update`,
          {
            id: createdCategoryId,
            name: 'Updated Test Category',
            description: 'Updated description'
          },
          { headers: { Authorization: `Bearer ${this.authToken}` } }
        );
        this.addResult('PUT /api/v1/admin/categories/update', 'PASS', undefined, {
          statusCode: response.status
        });
      } catch (error: any) {
        this.addResult('PUT /api/v1/admin/categories/update', 'FAIL', error.message);
      }

      // Test DELETE /api/v1/admin/categories/delete
      try {
        const response = await axios.post(
          `${API_BASE_URL}/admin/categories/delete`,
          { id: createdCategoryId },
          { headers: { Authorization: `Bearer ${this.authToken}` } }
        );
        this.addResult('DELETE /api/v1/admin/categories/delete', 'PASS', undefined, {
          statusCode: response.status
        });
      } catch (error: any) {
        this.addResult('DELETE /api/v1/admin/categories/delete', 'FAIL', error.message);
      }
    }

    // Test GET /api/v1/admin/categories/stats
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/categories/stats`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      this.addResult('GET /api/v1/admin/categories/stats', 'PASS', undefined, {
        statusCode: response.status
      });
    } catch (error: any) {
      this.addResult('GET /api/v1/admin/categories/stats', 'FAIL', error.message);
    }

    // Test POST /api/v1/admin/categories/bulk
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/categories/bulk`,
        {
          action: 'delete',
          ids: []
        },
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );
      this.addResult('POST /api/v1/admin/categories/bulk', 'PASS', undefined, {
        statusCode: response.status
      });
    } catch (error: any) {
      this.addResult('POST /api/v1/admin/categories/bulk', 'FAIL', error.message);
    }
  }

  async testTagsUI() {
    console.log('\n🖥️  Testing Tags UI Components...\n');

    // Navigate to tags page
    await this.page.goto(`${FRONTEND_URL}/admin/tags`);
    await this.page.waitForLoadState('networkidle');

    // Test page loads
    try {
      await this.page.waitForSelector('h1:has-text("Tags")', { timeout: 5000 });
      this.addResult('Tags page loads', 'PASS');
    } catch (error: any) {
      this.addResult('Tags page loads', 'FAIL', 'Page did not load properly');
    }

    // Test Create Modal
    try {
      await this.page.click('button:has-text("Create Tag")');
      await this.page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      
      // Fill form
      await this.page.fill('input[name="name"]', 'UI Test Tag');
      await this.page.fill('textarea[name="description"]', 'Created via UI test');
      
      // Submit
      await this.page.click('button:has-text("Create")');
      await this.page.waitForTimeout(2000);
      
      this.addResult('Create Tag Modal', 'PASS');
    } catch (error: any) {
      this.addResult('Create Tag Modal', 'FAIL', error.message);
    }

    // Test Edit Modal
    try {
      // Click edit on first tag
      await this.page.click('button[aria-label="Edit"]:first-of-type');
      await this.page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      
      // Update field
      await this.page.fill('textarea[name="description"]', 'Updated via UI test');
      
      // Submit
      await this.page.click('button:has-text("Save")');
      await this.page.waitForTimeout(2000);
      
      this.addResult('Edit Tag Modal', 'PASS');
    } catch (error: any) {
      this.addResult('Edit Tag Modal', 'FAIL', error.message);
    }

    // Test Delete Modal
    try {
      // Click delete on first tag
      await this.page.click('button[aria-label="Delete"]:first-of-type');
      await this.page.waitForSelector('[role="dialog"]:has-text("Delete")', { timeout: 3000 });
      
      // Confirm deletion
      await this.page.click('button:has-text("Delete"):last-of-type');
      await this.page.waitForTimeout(2000);
      
      this.addResult('Delete Tag Modal', 'PASS');
    } catch (error: any) {
      this.addResult('Delete Tag Modal', 'FAIL', error.message);
    }

    // Test Filters
    try {
      // Click filter button
      await this.page.click('button:has-text("Filters")');
      await this.page.waitForTimeout(1000);
      
      // Test search filter
      const searchInput = await this.page.$('input[placeholder*="Search"]');
      if (searchInput) {
        await searchInput.fill('test');
        await this.page.click('button:has-text("Apply")');
        await this.page.waitForTimeout(2000);
        this.addResult('Tags Search Filter', 'PASS');
      } else {
        this.addResult('Tags Search Filter', 'FAIL', 'Search input not found');
      }
      
      // Test save filter
      await this.page.click('button:has-text("Save Filter")');
      await this.page.fill('input[placeholder*="Filter name"]', 'Test Filter');
      await this.page.click('button:has-text("Save"):last-of-type');
      await this.page.waitForTimeout(1000);
      this.addResult('Save Tags Filter', 'PASS');
      
      // Test load saved filter
      await this.page.click('button:has-text("Saved Filters")');
      await this.page.click('text=Test Filter');
      await this.page.waitForTimeout(1000);
      this.addResult('Load Saved Tags Filter', 'PASS');
      
    } catch (error: any) {
      this.addResult('Tags Filters', 'FAIL', error.message);
    }
  }

  async testCategoriesUI() {
    console.log('\n🖥️  Testing Categories UI Components...\n');

    // Navigate to categories page
    await this.page.goto(`${FRONTEND_URL}/admin/categories`);
    await this.page.waitForLoadState('networkidle');

    // Test page loads
    try {
      await this.page.waitForSelector('h1:has-text("Categories")', { timeout: 5000 });
      this.addResult('Categories page loads', 'PASS');
    } catch (error: any) {
      this.addResult('Categories page loads', 'FAIL', 'Page did not load properly');
    }

    // Test Create Modal
    try {
      await this.page.click('button:has-text("Create Category")');
      await this.page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      
      // Fill form
      await this.page.fill('input[name="name"]', 'UI Test Category');
      await this.page.fill('textarea[name="description"]', 'Created via UI test');
      
      // Submit
      await this.page.click('button:has-text("Create")');
      await this.page.waitForTimeout(2000);
      
      this.addResult('Create Category Modal', 'PASS');
    } catch (error: any) {
      this.addResult('Create Category Modal', 'FAIL', error.message);
    }

    // Test Edit Modal
    try {
      // Click edit on first category
      await this.page.click('button[aria-label="Edit"]:first-of-type');
      await this.page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      
      // Update field
      await this.page.fill('textarea[name="description"]', 'Updated via UI test');
      
      // Submit
      await this.page.click('button:has-text("Save")');
      await this.page.waitForTimeout(2000);
      
      this.addResult('Edit Category Modal', 'PASS');
    } catch (error: any) {
      this.addResult('Edit Category Modal', 'FAIL', error.message);
    }

    // Test Delete Modal
    try {
      // Click delete on first category
      await this.page.click('button[aria-label="Delete"]:first-of-type');
      await this.page.waitForSelector('[role="dialog"]:has-text("Delete")', { timeout: 3000 });
      
      // Confirm deletion
      await this.page.click('button:has-text("Delete"):last-of-type');
      await this.page.waitForTimeout(2000);
      
      this.addResult('Delete Category Modal', 'PASS');
    } catch (error: any) {
      this.addResult('Delete Category Modal', 'FAIL', error.message);
    }

    // Test Filters
    try {
      // Click filter button
      await this.page.click('button:has-text("Filters")');
      await this.page.waitForTimeout(1000);
      
      // Test search filter
      const searchInput = await this.page.$('input[placeholder*="Search"]');
      if (searchInput) {
        await searchInput.fill('test');
        await this.page.click('button:has-text("Apply")');
        await this.page.waitForTimeout(2000);
        this.addResult('Categories Search Filter', 'PASS');
      } else {
        this.addResult('Categories Search Filter', 'FAIL', 'Search input not found');
      }
      
      // Test save filter
      await this.page.click('button:has-text("Save Filter")');
      await this.page.fill('input[placeholder*="Filter name"]', 'Test Category Filter');
      await this.page.click('button:has-text("Save"):last-of-type');
      await this.page.waitForTimeout(1000);
      this.addResult('Save Categories Filter', 'PASS');
      
      // Test load saved filter
      await this.page.click('button:has-text("Saved Filters")');
      await this.page.click('text=Test Category Filter');
      await this.page.waitForTimeout(1000);
      this.addResult('Load Saved Categories Filter', 'PASS');
      
    } catch (error: any) {
      this.addResult('Categories Filters', 'FAIL', error.message);
    }
  }

  generateReport() {
    console.log('\n📊 TEST REPORT\n');
    console.log('═'.repeat(60));
    
    const passCount = this.results.filter(r => r.status === 'PASS').length;
    const failCount = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`Success Rate: ${((passCount / this.results.length) * 100).toFixed(1)}%`);
    
    if (failCount > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error || 'Unknown error'}`);
        });
    }
    
    console.log('\n═'.repeat(60));
  }
}

// Run tests
async function runTests() {
  const tester = new AdminTester();
  
  try {
    await tester.initialize();
    
    // Run API tests
    await tester.testTagsAPI();
    await tester.testCategoriesAPI();
    
    // Run UI tests
    await tester.testTagsUI();
    await tester.testCategoriesUI();
    
    // Generate report
    tester.generateReport();
    
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await tester.cleanup();
  }
}

runTests();