/**
 * Admin Interface Automated Test Script
 * 
 * This script can be run in the browser console to systematically test
 * all admin pages and generate a comprehensive report.
 * 
 * Usage:
 * 1. Login to http://localhost:3000/auth/signin with 1@1.com / Admin123!
 * 2. Navigate to the admin dashboard
 * 3. Open browser console (F12)
 * 4. Paste this entire script and press Enter
 * 5. The script will automatically test all pages and generate a report
 */

class AdminInterfaceTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.testResults = [];
        this.currentIndex = 0;
        this.testDelay = 2000; // 2 seconds between tests
        
        // All admin pages to test (based on AdminSidebar component)
        this.adminPages = [
            { name: 'Dashboard', url: '/admin', category: 'Core' },
            { name: 'Users', url: '/admin/users', category: 'Core' },
            { name: 'Tenants', url: '/admin/tenants', category: 'Core' },
            { name: 'Messages', url: '/messages', category: 'Core', badge: 'NEW' },
            { name: 'Job Management', url: '/admin/jobs', category: 'Core', badge: 'NEW' },
            { name: 'Workflows', url: '/admin/workflows/manage', category: 'Workflow' },
            { name: 'Integrations', url: '/admin/integrations', category: 'Workflow' },
            { name: 'LLM Integrations', url: '/admin/llm-integrations', category: 'Workflow' },
            { name: 'Subscriptions', url: '/admin/subscriptions', category: 'Financial' },
            { name: 'Categories', url: '/admin/categories', category: 'Content' },
            { name: 'Tags', url: '/admin/tags', category: 'Content' },
            { name: 'Schemas', url: '/admin/schemas', category: 'Content' },
            { name: 'Model Schemas', url: '/admin/model-schemas', category: 'Content' },
            { name: 'Option Sets', url: '/admin/option-sets', category: 'Content' },
            { name: 'Entity Metadata', url: '/admin/entity-metadata', category: 'Content' },
            { name: 'Form Builder', url: '/admin/form-builder', category: 'Builder' },
            { name: 'Zone Editor', url: '/admin/zone-editor', category: 'Builder' },
            { name: 'Saved Zones', url: '/admin/zones', category: 'Builder' },
            { name: 'Industry Templates', url: '/admin/industry-templates', category: 'Industry', badge: 'ENHANCED' },
            { name: 'Industry Content', url: '/admin/industry-content', category: 'Industry', badge: 'NEW' },
            { name: 'Build System', url: '/admin/build-system', category: 'Industry', badge: 'NEW' },
            { name: 'Search Management', url: '/admin/search', category: 'Search', badge: 'NEW' },
            { name: 'Saved Searches', url: '/admin/saved-searches', category: 'Search', badge: 'NEW' },
            { name: 'Template Tester', url: '/admin/test-template', category: 'Templates' },
            { name: 'Translations', url: '/admin/translations', category: 'Localization' },
            { name: 'Email System', url: '/admin/email', category: 'Communication' },
            { name: 'Modules', url: '/admin/modules', category: 'System' },
            { name: 'Backup Management', url: '/admin/backup', category: 'System' },
            { name: 'Import/Export', url: '/admin/import-export', category: 'System', badge: 'NEW' },
            { name: 'Audit System', url: '/admin/audit', category: 'System' },
            { name: 'Monitoring', url: '/admin/monitoring', category: 'System', badge: 'NEW' },
            { name: 'Permissions', url: '/admin/permissions', category: 'Security' },
            { name: 'Dev Tools', url: '/admin/dev', category: 'Development' },
            { name: 'Documentation', url: '/docs', category: 'Help' },
            { name: 'Preferences', url: '/admin/preferences', category: 'User' },
            { name: 'Platform Settings', url: '/admin/settings', category: 'Configuration' }
        ];
        
        this.errorPatterns = [
            'Cannot read properties of undefined',
            '404 Not Found',
            '500 Internal Server Error',
            'Unauthorized',
            'Forbidden',
            'Hydration failed',
            'Element type is invalid',
            'Cannot resolve module',
            'Network Error',
            'Failed to fetch'
        ];
    }
    
    // Start the comprehensive test
    async runTests() {
        console.log('🚀 Starting Admin Interface Comprehensive Test...');
        console.log(`📋 Testing ${this.adminPages.length} admin pages`);
        console.log('⏱️  Estimated time: ~2 minutes');
        
        this.startTime = Date.now();
        
        // Clear any existing errors
        this.clearConsoleErrors();
        
        // Test each page
        for (let i = 0; i < this.adminPages.length; i++) {
            this.currentIndex = i;
            await this.testPage(this.adminPages[i]);
        }
        
        // Generate and display report
        this.generateReport();
    }
    
    // Test a single page
    async testPage(page) {
        console.log(`\n📄 Testing ${page.name} (${this.currentIndex + 1}/${this.adminPages.length})`);
        
        const testResult = {
            name: page.name,
            url: page.url,
            category: page.category,
            badge: page.badge,
            timestamp: new Date().toISOString(),
            loadTime: 0,
            status: 'unknown',
            errors: [],
            warnings: [],
            hasData: false,
            emptyState: false,
            functionalElements: [],
            consoleErrors: [],
            networkErrors: []
        };
        
        try {
            // Clear console before testing
            this.clearConsoleErrors();
            
            // Track console errors during page load
            const consoleErrors = [];
            const originalConsoleError = console.error;
            console.error = (...args) => {
                consoleErrors.push(args.join(' '));
                originalConsoleError.apply(console, args);
            };
            
            // Navigate to page
            const startTime = Date.now();
            window.location.href = this.baseUrl + page.url;
            
            // Wait for page to load
            await this.waitForPageLoad();
            
            const loadTime = Date.now() - startTime;
            testResult.loadTime = loadTime;
            
            // Restore console.error
            console.error = originalConsoleError;
            testResult.consoleErrors = consoleErrors;
            
            // Check page status
            testResult.status = this.checkPageStatus();
            
            // Check for data/empty states
            testResult.hasData = this.checkForData();
            testResult.emptyState = this.checkForEmptyState();
            
            // Check for functional elements
            testResult.functionalElements = this.checkFunctionalElements();
            
            // Check for errors
            testResult.errors = this.checkForErrors();
            testResult.warnings = this.checkForWarnings();
            
            // Check network errors
            testResult.networkErrors = this.checkNetworkErrors();
            
            console.log(`✅ ${page.name}: ${testResult.status} (${loadTime}ms)`);
            
        } catch (error) {
            console.error(`❌ Error testing ${page.name}:`, error);
            testResult.status = 'error';
            testResult.errors.push(error.message);
        }
        
        this.testResults.push(testResult);
        
        // Wait before next test
        await this.sleep(this.testDelay);
    }
    
    // Wait for page to load
    async waitForPageLoad() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
                // Fallback timeout
                setTimeout(resolve, 5000);
            }
        });
    }
    
    // Check page status
    checkPageStatus() {
        // Check for common error indicators
        const errorIndicators = [
            'This page could not be found',
            'Internal Server Error',
            'Something went wrong',
            'Error 404',
            'Error 500',
            'Unauthorized',
            'Access Denied'
        ];
        
        const bodyText = document.body.innerText;
        for (const indicator of errorIndicators) {
            if (bodyText.includes(indicator)) {
                return 'error';
            }
        }
        
        // Check if page loaded successfully
        if (document.querySelector('[data-testid="loading"]') || 
            document.querySelector('.loading') ||
            document.querySelector('.spinner')) {
            return 'loading';
        }
        
        return 'success';
    }
    
    // Check for data presence
    checkForData() {
        const dataIndicators = [
            'table tbody tr',
            '.data-table tbody tr',
            '.list-item',
            '.card',
            '.user-item',
            '.tenant-item',
            '.category-item',
            '.tag-item'
        ];
        
        return dataIndicators.some(selector => {
            const elements = document.querySelectorAll(selector);
            return elements.length > 0;
        });
    }
    
    // Check for empty state
    checkForEmptyState() {
        const emptyStateIndicators = [
            'No data available',
            'No users found',
            'No tenants found',
            'No results found',
            'Empty state',
            'No items to display',
            'Get started by creating',
            'No records found'
        ];
        
        const bodyText = document.body.innerText;
        return emptyStateIndicators.some(indicator => 
            bodyText.includes(indicator)
        );
    }
    
    // Check for functional elements
    checkFunctionalElements() {
        const functionalElements = [];
        
        // Check for common UI elements
        const elements = [
            { selector: 'button[type="submit"]', name: 'Submit Button' },
            { selector: '.btn-primary', name: 'Primary Button' },
            { selector: 'input[type="search"]', name: 'Search Input' },
            { selector: '.search-bar', name: 'Search Bar' },
            { selector: '.data-table', name: 'Data Table' },
            { selector: '.pagination', name: 'Pagination' },
            { selector: '.filter-panel', name: 'Filter Panel' },
            { selector: '.modal', name: 'Modal' },
            { selector: '.dropdown', name: 'Dropdown' },
            { selector: '.tab-panel', name: 'Tab Panel' }
        ];
        
        elements.forEach(element => {
            if (document.querySelector(element.selector)) {
                functionalElements.push(element.name);
            }
        });
        
        return functionalElements;
    }
    
    // Check for errors
    checkForErrors() {
        const errors = [];
        const bodyText = document.body.innerText;
        
        this.errorPatterns.forEach(pattern => {
            if (bodyText.includes(pattern)) {
                errors.push(pattern);
            }
        });
        
        return errors;
    }
    
    // Check for warnings
    checkForWarnings() {
        const warnings = [];
        const bodyText = document.body.innerText;
        
        const warningPatterns = [
            'Warning:',
            'Deprecated',
            'Not recommended',
            'Please update',
            'Missing configuration'
        ];
        
        warningPatterns.forEach(pattern => {
            if (bodyText.includes(pattern)) {
                warnings.push(pattern);
            }
        });
        
        return warnings;
    }
    
    // Check network errors
    checkNetworkErrors() {
        // This would need to be implemented with proper network monitoring
        // For now, return empty array
        return [];
    }
    
    // Clear console errors
    clearConsoleErrors() {
        if (console.clear) {
            console.clear();
        }
    }
    
    // Sleep utility
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Generate comprehensive report
    generateReport() {
        const endTime = Date.now();
        const totalTime = (endTime - this.startTime) / 1000;
        
        console.log('\n📊 COMPREHENSIVE ADMIN INTERFACE TEST REPORT');
        console.log('==========================================');
        console.log(`⏱️  Total Time: ${totalTime.toFixed(2)}s`);
        console.log(`📄 Pages Tested: ${this.testResults.length}`);
        
        // Summary statistics
        const stats = this.calculateStats();
        console.log('\n📈 SUMMARY STATISTICS');
        console.log('-------------------');
        console.log(`✅ Working: ${stats.working}`);
        console.log(`❌ Broken: ${stats.broken}`);
        console.log(`⚠️  Issues: ${stats.issues}`);
        console.log(`🔄 Loading: ${stats.loading}`);
        console.log(`📊 Success Rate: ${((stats.working / this.testResults.length) * 100).toFixed(1)}%`);
        
        // Detailed results by category
        console.log('\n📋 DETAILED RESULTS BY CATEGORY');
        console.log('-------------------------------');
        
        const categories = this.groupByCategory();
        Object.keys(categories).forEach(category => {
            console.log(`\n📂 ${category.toUpperCase()}`);
            categories[category].forEach(result => {
                const status = this.getStatusIcon(result.status);
                const badge = result.badge ? ` [${result.badge}]` : '';
                console.log(`  ${status} ${result.name}${badge} - ${result.loadTime}ms`);
                
                if (result.errors.length > 0) {
                    console.log(`    ❌ Errors: ${result.errors.join(', ')}`);
                }
                if (result.warnings.length > 0) {
                    console.log(`    ⚠️  Warnings: ${result.warnings.join(', ')}`);
                }
                if (result.consoleErrors.length > 0) {
                    console.log(`    🔴 Console Errors: ${result.consoleErrors.length}`);
                }
                if (result.emptyState) {
                    console.log(`    📭 Empty State: Yes`);
                }
            });
        });
        
        // Problem pages
        const problemPages = this.testResults.filter(r => 
            r.status === 'error' || r.errors.length > 0 || r.consoleErrors.length > 0
        );
        
        if (problemPages.length > 0) {
            console.log('\n🚨 PAGES REQUIRING ATTENTION');
            console.log('---------------------------');
            problemPages.forEach(page => {
                console.log(`❌ ${page.name} (${page.url})`);
                if (page.errors.length > 0) {
                    console.log(`   Errors: ${page.errors.join(', ')}`);
                }
                if (page.consoleErrors.length > 0) {
                    console.log(`   Console Errors: ${page.consoleErrors.length}`);
                }
            });
        }
        
        // Data seeding recommendations
        const emptyStatePages = this.testResults.filter(r => r.emptyState);
        if (emptyStatePages.length > 0) {
            console.log('\n🌱 DATA SEEDING RECOMMENDATIONS');
            console.log('------------------------------');
            emptyStatePages.forEach(page => {
                console.log(`📭 ${page.name} - No data available`);
            });
        }
        
        // Performance insights
        console.log('\n⚡ PERFORMANCE INSIGHTS');
        console.log('---------------------');
        const avgLoadTime = this.testResults.reduce((sum, r) => sum + r.loadTime, 0) / this.testResults.length;
        const slowPages = this.testResults.filter(r => r.loadTime > avgLoadTime * 2);
        
        console.log(`📊 Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
        if (slowPages.length > 0) {
            console.log('🐌 Slow Loading Pages:');
            slowPages.forEach(page => {
                console.log(`   ${page.name}: ${page.loadTime}ms`);
            });
        }
        
        // Export results
        this.exportResults();
    }
    
    // Calculate statistics
    calculateStats() {
        const stats = {
            working: 0,
            broken: 0,
            issues: 0,
            loading: 0
        };
        
        this.testResults.forEach(result => {
            if (result.status === 'success' && result.errors.length === 0) {
                stats.working++;
            } else if (result.status === 'error') {
                stats.broken++;
            } else if (result.status === 'loading') {
                stats.loading++;
            } else {
                stats.issues++;
            }
        });
        
        return stats;
    }
    
    // Group results by category
    groupByCategory() {
        const categories = {};
        this.testResults.forEach(result => {
            if (!categories[result.category]) {
                categories[result.category] = [];
            }
            categories[result.category].push(result);
        });
        return categories;
    }
    
    // Get status icon
    getStatusIcon(status) {
        switch (status) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'loading': return '🔄';
            default: return '⚠️';
        }
    }
    
    // Export results for further analysis
    exportResults() {
        const exportData = {
            timestamp: new Date().toISOString(),
            summary: this.calculateStats(),
            results: this.testResults,
            totalTime: (Date.now() - this.startTime) / 1000
        };
        
        // Store in localStorage for later retrieval
        localStorage.setItem('adminTestResults', JSON.stringify(exportData));
        
        console.log('\n💾 EXPORT COMPLETE');
        console.log('Results saved to localStorage as "adminTestResults"');
        console.log('To retrieve: JSON.parse(localStorage.getItem("adminTestResults"))');
    }
}

// Auto-run the test when script is loaded
console.log('🔧 Admin Interface Tester Loaded!');
console.log('Run: new AdminInterfaceTester().runTests()');

// Create global instance
window.adminTester = new AdminInterfaceTester();

// Uncomment the line below to auto-start testing
// window.adminTester.runTests();