---
title: Puppeteer MCP Server
sidebar_label: Puppeteer
description: Browser automation and testing
---

# Puppeteer MCP Server

Provides browser automation capabilities for testing, screenshot capture, and web interaction through Puppeteer.

## Overview

The Puppeteer MCP server enables:
- Web page navigation
- Screenshot capture
- Element interaction
- Form filling
- JavaScript execution
- Automated testing

## Available Functions

### Navigate

```javascript
mcp__puppeteer__puppeteer_navigate({
  url: "http://192.168.178.94:3000",
  allowDangerous: false,
  launchOptions: {
    headless: true,
    args: ['--no-sandbox']
  }
});
```

**Launch Options:**
- `headless` - Run without UI
- `args` - Browser arguments
- `devtools` - Open DevTools
- `slowMo` - Slow down actions

### Screenshot

```javascript
mcp__puppeteer__puppeteer_screenshot({
  name: "dashboard-view",
  selector: "#main-content", // optional
  width: 1200,
  height: 800,
  encoded: false // true for base64
});
```

**Parameters:**
- Full page or element
- Custom dimensions
- Binary or base64 output
- Named for reference

### Click

```javascript
mcp__puppeteer__puppeteer_click({
  selector: "button[type='submit']"
});
```

### Fill

```javascript
mcp__puppeteer__puppeteer_fill({
  selector: "input[name='email']",
  value: "test@example.com"
});
```

### Select

```javascript
mcp__puppeteer__puppeteer_select({
  selector: "select#country",
  value: "US"
});
```

### Hover

```javascript
mcp__puppeteer__puppeteer_hover({
  selector: ".dropdown-trigger"
});
```

### Evaluate

```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    document.querySelector('.counter').innerText;
  `
});
```

## Usage Examples

### Testing Login Flow

```javascript
// 1. Navigate to login page
await mcp__puppeteer__puppeteer_navigate({
  url: "http://192.168.178.94:3000/login"
});

// 2. Fill credentials
await mcp__puppeteer__puppeteer_fill({
  selector: "input[name='email']",
  value: "admin@itellico.ai"
});

await mcp__puppeteer__puppeteer_fill({
  selector: "input[name='password']",
  value: "Admin123!@#"
});

// 3. Submit form
await mcp__puppeteer__puppeteer_click({
  selector: "button[type='submit']"
});

// 4. Verify dashboard loads
await mcp__puppeteer__puppeteer_screenshot({
  name: "post-login-dashboard"
});
```

### Visual Regression Testing

```javascript
// Capture baseline
await mcp__puppeteer__puppeteer_navigate({
  url: "http://192.168.178.94:3000/user/profile"
});

await mcp__puppeteer__puppeteer_screenshot({
  name: "profile-baseline",
  selector: ".profile-card"
});

// After changes, capture new version
await mcp__puppeteer__puppeteer_screenshot({
  name: "profile-updated",
  selector: ".profile-card"
});
```

### Form Testing

```javascript
// Test form validation
await mcp__puppeteer__puppeteer_navigate({
  url: "http://192.168.178.94:3000/register"
});

// Submit empty form
await mcp__puppeteer__puppeteer_click({
  selector: "button[type='submit']"
});

// Check for validation errors
const errors = await mcp__puppeteer__puppeteer_evaluate({
  script: `
    Array.from(document.querySelectorAll('.error-message'))
      .map(el => el.textContent);
  `
});
```

## Testing Patterns

### Page Object Pattern

```javascript
// Login page actions
async function login(email, password) {
  await mcp__puppeteer__puppeteer_fill({
    selector: "input[name='email']",
    value: email
  });
  
  await mcp__puppeteer__puppeteer_fill({
    selector: "input[name='password']",
    value: password
  });
  
  await mcp__puppeteer__puppeteer_click({
    selector: "button[type='submit']"
  });
}
```

### Responsive Testing

```javascript
// Test different viewports
const viewports = [
  { width: 375, height: 667 },   // Mobile
  { width: 768, height: 1024 },  // Tablet
  { width: 1920, height: 1080 }  // Desktop
];

for (const viewport of viewports) {
  await mcp__puppeteer__puppeteer_screenshot({
    name: `homepage-${viewport.width}x${viewport.height}`,
    width: viewport.width,
    height: viewport.height
  });
}
```

## Best Practices

### 1. Selector Strategy
```javascript
// Good: Specific, stable selectors
"[data-testid='submit-button']"
"#user-profile"
".nav-menu > li:first-child"

// Avoid: Brittle selectors
"div > div > button"
".css-12xyz"
":nth-child(3)"
```

### 2. Wait Strategies
```javascript
// Wait for element before interaction
await mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => {
      const observer = new MutationObserver(() => {
        if (document.querySelector('.loaded')) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  `
});
```

### 3. Error Handling
```javascript
try {
  await mcp__puppeteer__puppeteer_click({
    selector: "#submit"
  });
} catch (error) {
  // Element might not exist
  await mcp__puppeteer__puppeteer_screenshot({
    name: "error-state"
  });
}
```

## Common Use Cases

### 1. E2E Testing
- User flow validation
- Cross-browser testing
- Performance monitoring
- Accessibility checks

### 2. Visual Testing
- Screenshot comparison
- Layout verification
- Responsive design
- Style regression

### 3. Automation
- Form submission
- Data extraction
- Report generation
- Batch operations

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Timeout errors | Increase wait times |
| Element not found | Check selector, wait for load |
| Navigation failed | Verify URL accessibility |
| Screenshot blank | Element might be hidden |

### Debug Tips

```javascript
// Enable non-headless mode for debugging
await mcp__puppeteer__puppeteer_navigate({
  url: "http://192.168.178.94:3000",
  launchOptions: {
    headless: false,
    devtools: true,
    slowMo: 100
  }
});
```

### Performance Tips
1. Reuse browser instance
2. Disable images for speed
3. Use specific selectors
4. Minimize evaluations

## Security Considerations

### Safe Usage
```javascript
// Safe: Controlled environment
await mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000",
  allowDangerous: false
});
```

### Dangerous Options
```javascript
// Only use when necessary
await mcp__puppeteer__puppeteer_navigate({
  url: "https://external-site.com",
  allowDangerous: true,
  launchOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});
```

## Integration Examples

### With Kanboard

```javascript
// Test feature, create bug report
await mcp__puppeteer__puppeteer_navigate({
  url: "http://192.168.178.94:3000/feature"
});

const error = await mcp__puppeteer__puppeteer_evaluate({
  script: "document.querySelector('.error')?.textContent"
});

if (error) {
  await mcp__kanboard-mcp__create_task({
    title: `Bug: ${error}`,
    description: "Found during automated testing",
    tags: ["bug", "automated-test"]
  });
}
```

## Related Documentation

- [MCP Servers Overview](./)
- [Testing Guide](../../development/testing/)
- [E2E Testing](../../development/testing/methodology.md)