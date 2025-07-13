#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { join } from 'path';

const serverPath = join(process.cwd(), 'dist/server.js');

console.log('Starting server and waiting for document loading...\n');

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';

server.stderr.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log('Server output:', text.trim());
});

server.stdout.on('data', (data) => {
  const text = data.toString();
  console.log('Server stdout:', text.trim());
});

// Wait a bit for the server to load documents
setTimeout(() => {
  console.log('\n✅ Server started successfully');
  
  // Check if documents were loaded
  const loadedMatch = output.match(/Loaded (\d+) documents for search/);
  if (loadedMatch) {
    const count = parseInt(loadedMatch[1]);
    console.log(`📚 Documents loaded: ${count}`);
    
    if (count > 4) {
      console.log('✅ All documents appear to be loaded correctly!');
    } else {
      console.log('⚠️  Only a few documents were loaded. There might be an issue.');
    }
  } else {
    console.log('❌ Could not find document loading message');
  }
  
  // Kill the server
  server.kill();
  process.exit(0);
}, 3000);