#!/usr/bin/env node
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the project root (two levels up from mcp-servers/kanboard)
dotenv.config({ path: resolve(__dirname, '../../.env') });

console.log('Testing .env loading for Kanboard MCP server...\n');

console.log('KANBOARD_API_TOKEN:', process.env.KANBOARD_API_TOKEN ? 'Loaded ✓' : 'Not found ✗');
console.log('KANBOARD_API_ENDPOINT:', process.env.KANBOARD_API_ENDPOINT || 'Not found');
console.log('KANBOARD_USERNAME:', process.env.KANBOARD_USERNAME || 'jsonrpc (default)');

if (process.env.KANBOARD_API_TOKEN && process.env.KANBOARD_API_ENDPOINT) {
  console.log('\n✅ Environment variables loaded successfully!');
} else {
  console.log('\n❌ Missing required environment variables!');
}