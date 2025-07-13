#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Paths
const claudeMdPath = path.join(__dirname, '../../CLAUDE.md');
const copyScriptPath = path.join(__dirname, 'copy-claude-md.js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

console.log(`${colors.blue}👀 Watching CLAUDE.md for changes...${colors.reset}`);
console.log(`${colors.yellow}📁 File: ${claudeMdPath}${colors.reset}\n`);

// Initial copy
exec(`node ${copyScriptPath}`, (error) => {
  if (!error) {
    console.log(`${colors.green}✅ Initial copy completed${colors.reset}`);
  }
});

// Watch for changes
let timeoutId = null;

fs.watchFile(claudeMdPath, { interval: 1000 }, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    // Clear any pending updates
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Debounce - wait 500ms for file to finish writing
    timeoutId = setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`\n${colors.yellow}🔄 [${timestamp}] CLAUDE.md changed, updating...${colors.reset}`);
      
      exec(`node ${copyScriptPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`${colors.bright}❌ Error updating:${colors.reset}`, error.message);
          return;
        }
        
        if (stdout) {
          // Parse the file size from stdout if available
          const lines = stdout.trim().split('\n');
          console.log(`${colors.green}✅ Updated successfully${colors.reset}`);
          lines.forEach(line => {
            if (line.includes('File size:') || line.includes('Last modified:')) {
              console.log(`   ${line.trim()}`);
            }
          });
        } else {
          console.log(`${colors.green}✅ Updated successfully${colors.reset}`);
        }
        
        console.log(`${colors.blue}👀 Watching for more changes...${colors.reset}`);
      });
    }, 500);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}👋 Stopping CLAUDE.md watcher${colors.reset}`);
  fs.unwatchFile(claudeMdPath);
  process.exit(0);
});

console.log(`${colors.bright}Press Ctrl+C to stop watching${colors.reset}\n`);