#!/usr/bin/env tsx

import { DocumentationRenderer } from '../src/lib/services/documentation-renderer';
import path from 'path';

async function main() {
  console.log('🚀 Building Documentation...');
  
  const renderer = new DocumentationRenderer(
    path.join(process.cwd(), 'mcp-server/src/data'),
    path.join(process.cwd(), 'docs')
  );
  
  try {
    await renderer.renderAllDocumentation();
    console.log('✅ Documentation build complete!');
    console.log('📁 HTML documentation available at: ./docs/');
    console.log('🌐 Open ./docs/index.html to view');
  } catch (error) {
    console.error('❌ Documentation build failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}