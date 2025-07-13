#!/usr/bin/env tsx

/**
 * Test script for MCP server functionality
 */

import { DocumentationHandler } from './src/handlers/documentation.js';
import { ArchitectureHandler } from './src/handlers/architecture.js';
import { WorkflowHandler } from './src/handlers/workflows.js';
import { PatternsHandler } from './src/handlers/patterns.js';
import { ProjectStatusHandler } from './src/handlers/project-status.js';

async function testMCPServer() {
  console.log('🧪 Testing itellico Mono MCP Server...\n');

  // Test Documentation Handler
  console.log('📚 Testing Documentation Search...');
  const docHandler = new DocumentationHandler();
  const searchResult = await docHandler.search({ query: 'API architecture' });
  console.log('✅ Documentation search:', searchResult.content[0].text.substring(0, 100) + '...\n');

  // Test Architecture Handler
  console.log('🏗️ Testing Architecture Info...');
  const archHandler = new ArchitectureHandler();
  const archResult = await archHandler.getInfo({ component: 'api' });
  console.log('✅ Architecture info:', archResult.content[0].text.substring(0, 100) + '...\n');

  // Test Workflow Handler
  console.log('🔄 Testing Development Workflow...');
  const workflowHandler = new WorkflowHandler();
  const workflowResult = await workflowHandler.getWorkflow({ task: 'new-feature' });
  console.log('✅ Workflow info:', workflowResult.content[0].text.substring(0, 100) + '...\n');

  // Test Patterns Handler
  console.log('🎨 Testing Code Patterns...');
  const patternsHandler = new PatternsHandler();
  const patternResult = await patternsHandler.getPattern({ pattern_type: 'route', technology: 'fastify' });
  console.log('✅ Pattern info:', patternResult.content[0].text.substring(0, 100) + '...\n');

  // Test Project Status Handler
  console.log('📊 Testing Project Status...');
  const statusHandler = new ProjectStatusHandler();
  const statusResult = await statusHandler.getStatus({ area: 'overall' });
  console.log('✅ Status info:', statusResult.content[0].text.substring(0, 100) + '...\n');

  console.log('🎉 All MCP server handlers tested successfully!');
}

testMCPServer().catch(console.error);