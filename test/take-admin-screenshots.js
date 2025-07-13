/**
 * Admin Interface Screenshot Taker
 * 
 * Simple script to take screenshots of admin pages for documentation
 * Can be used to capture error states, empty states, or working pages
 * 
 * Usage in browser console:
 * 1. Navigate to any admin page
 * 2. Open console (F12)
 * 3. Paste this script and run it
 * 4. It will automatically take a screenshot and provide download
 */

class AdminScreenshotTaker {
    constructor() {
        this.screenshotCount = 0;
    }
    
    // Take screenshot of current page
    async takeScreenshot(filename = null) {
        try {
            // Use html2canvas if available, otherwise try native screenshot API
            if (typeof html2canvas !== 'undefined') {
                return await this.takeScreenshotWithHtml2Canvas(filename);
            } else {
                return await this.takeScreenshotNative(filename);
            }
        } catch (error) {
            console.error('Screenshot failed:', error);
            this.showManualInstructions();
        }
    }
    
    // Take screenshot using html2canvas library
    async takeScreenshotWithHtml2Canvas(filename) {
        const canvas = await html2canvas(document.body, {
            height: window.innerHeight,
            width: window.innerWidth,
            useCORS: true,
            scrollX: 0,
            scrollY: 0
        });
        
        const imageData = canvas.toDataURL('image/png');
        this.downloadImage(imageData, filename);
        return imageData;
    }
    
    // Take screenshot using native browser API (limited support)
    async takeScreenshotNative(filename) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // This is a simplified approach - may not work in all browsers
            const imageData = canvas.toDataURL('image/png');
            this.downloadImage(imageData, filename);
            return imageData;
        } catch (error) {
            throw new Error('Native screenshot not supported');
        }
    }
    
    // Download image data as file
    downloadImage(imageData, filename = null) {
        const link = document.createElement('a');
        link.download = filename || this.generateFilename();
        link.href = imageData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`📸 Screenshot saved as: ${link.download}`);
        this.screenshotCount++;
    }
    
    // Generate filename based on current page
    generateFilename() {
        const path = window.location.pathname;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const pageName = path.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').trim('-');
        return `admin-${pageName}-${timestamp}.png`;
    }
    
    // Show manual screenshot instructions
    showManualInstructions() {
        const instructions = `
📸 Manual Screenshot Instructions:

Since automatic screenshots aren't available, please take manual screenshots:

1. Use your browser's built-in screenshot tools:
   - Chrome: F12 → Console → Ctrl+Shift+P → "Screenshot"
   - Firefox: F12 → Settings → "Take a screenshot"
   - Safari: Develop → Show Web Inspector → Elements → Screenshot

2. Or use OS screenshot tools:
   - Mac: Cmd+Shift+4 (select area) or Cmd+Shift+3 (full screen)
   - Windows: Win+Shift+S (select area) or PrtScn (full screen)
   - Linux: gnome-screenshot or similar

3. Save screenshots with descriptive names:
   Format: admin-[page-name]-[status].png
   Examples:
   - admin-users-working.png
   - admin-categories-error.png
   - admin-monitoring-empty-state.png

4. Organize in folders:
   - working-pages/
   - error-pages/
   - empty-states/
        `;
        
        console.log(instructions);
        
        // Try to create a modal with instructions
        this.showInstructionModal(instructions);
    }
    
    // Show instruction modal
    showInstructionModal(instructions) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #333;
            padding: 20px;
            z-index: 10000;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            font-family: monospace;
            font-size: 14px;
            line-height: 1.4;
        `;
        
        modal.innerHTML = `
            <h3>📸 Screenshot Instructions</h3>
            <pre>${instructions}</pre>
            <button onclick="this.parentElement.remove()" style="margin-top: 15px; padding: 10px 20px; background: #007cba; color: white; border: none; cursor: pointer;">
                Close
            </button>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 30000);
    }
    
    // Take multiple screenshots with different viewport sizes
    async takeResponsiveScreenshots(filename = null) {
        const viewports = [
            { width: 1920, height: 1080, name: 'desktop' },
            { width: 1366, height: 768, name: 'laptop' },
            { width: 768, height: 1024, name: 'tablet' },
            { width: 375, height: 667, name: 'mobile' }
        ];
        
        const originalWidth = window.innerWidth;
        const originalHeight = window.innerHeight;
        
        for (const viewport of viewports) {
            try {
                // Resize window (may not work in all browsers)
                window.resizeTo(viewport.width, viewport.height);
                await this.sleep(1000); // Wait for resize
                
                const responsiveFilename = filename ? 
                    filename.replace('.png', `-${viewport.name}.png`) :
                    this.generateFilename().replace('.png', `-${viewport.name}.png`);
                
                await this.takeScreenshot(responsiveFilename);
                
            } catch (error) {
                console.warn(`Failed to take ${viewport.name} screenshot:`, error);
            }
        }
        
        // Restore original size
        window.resizeTo(originalWidth, originalHeight);
    }
    
    // Utility: sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Get page information for documentation
    getPageInfo() {
        const info = {
            url: window.location.href,
            pathname: window.location.pathname,
            title: document.title,
            timestamp: new Date().toISOString(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            userAgent: navigator.userAgent,
            errors: this.getConsoleErrors(),
            status: this.getPageStatus()
        };
        
        console.log('📋 Page Information:', info);
        return info;
    }
    
    // Get console errors
    getConsoleErrors() {
        // This is a simplified approach - in practice, you'd need to capture errors as they occur
        const errors = [];
        
        // Check for common error indicators in the page
        const errorTexts = [
            'Error:',
            'TypeError:',
            'ReferenceError:',
            'SyntaxError:',
            'Network Error',
            'Failed to fetch',
            '404 Not Found',
            '500 Internal Server Error'
        ];
        
        const bodyText = document.body.innerText;
        errorTexts.forEach(errorText => {
            if (bodyText.includes(errorText)) {
                errors.push(errorText);
            }
        });
        
        return errors;
    }
    
    // Get page status
    getPageStatus() {
        const bodyText = document.body.innerText;
        
        if (bodyText.includes('Error') || bodyText.includes('failed')) {
            return 'error';
        } else if (bodyText.includes('Loading') || bodyText.includes('Skeleton')) {
            return 'loading';
        } else if (bodyText.includes('No data') || bodyText.includes('Empty')) {
            return 'empty';
        } else {
            return 'working';
        }
    }
    
    // Load html2canvas library if not available
    loadHtml2Canvas() {
        return new Promise((resolve, reject) => {
            if (typeof html2canvas !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Initialize and take screenshot
    async init() {
        console.log('📸 Admin Screenshot Taker initialized');
        console.log('Commands available:');
        console.log('- screenshotTaker.takeScreenshot() - Take current page screenshot');
        console.log('- screenshotTaker.takeResponsiveScreenshots() - Take multiple viewport screenshots');
        console.log('- screenshotTaker.getPageInfo() - Get page information');
        
        try {
            await this.loadHtml2Canvas();
            console.log('✅ html2canvas library loaded');
        } catch (error) {
            console.warn('⚠️  html2canvas not available, will use manual instructions');
        }
    }
}

// Initialize screenshot taker
const screenshotTaker = new AdminScreenshotTaker();
screenshotTaker.init();

// Make it globally available
window.screenshotTaker = screenshotTaker;

console.log('📸 Screenshot taker ready! Use: screenshotTaker.takeScreenshot()');