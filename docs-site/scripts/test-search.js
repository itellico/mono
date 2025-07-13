const fs = require('fs');
const path = require('path');

// Test search functionality
const searchIndex = JSON.parse(fs.readFileSync(path.join(__dirname, '../static/search-index.json'), 'utf8'));

console.log('🔍 Testing Search Index');
console.log('====================\n');

// Test 1: Basic stats
console.log('📊 Basic Statistics:');
console.log(`- Total entries: ${searchIndex.length}`);
console.log(`- Categories: ${[...new Set(searchIndex.map(e => e.category))].join(', ')}`);
console.log(`- Unique titles: ${new Set(searchIndex.map(e => e.title)).size}`);
console.log();

// Test 2: Search for common terms
const testQueries = [
  'platform',
  'tenant',
  'authentication',
  'api',
  'user',
  'account',
  'permissions',
  'architecture',
  'development',
  'security',
  'database',
  'cache',
  'redis',
  'react',
  'fastify'
];

console.log('🔍 Search Results for Common Terms:');
console.log('===================================\n');

testQueries.forEach(query => {
  const results = searchIndex.filter(entry => 
    entry.title.toLowerCase().includes(query.toLowerCase()) ||
    entry.content.toLowerCase().includes(query.toLowerCase())
  );
  
  console.log(`Query: "${query}"`);
  console.log(`Results: ${results.length}`);
  if (results.length > 0) {
    console.log(`Top 3 results:`);
    results.slice(0, 3).forEach((result, i) => {
      console.log(`  ${i + 1}. ${result.title} (${result.category})`);
      console.log(`     Path: ${result.path}`);
    });
  }
  console.log();
});

// Test 3: Check category distribution
console.log('📈 Category Distribution:');
console.log('========================\n');

const categoryStats = {};
searchIndex.forEach(entry => {
  categoryStats[entry.category] = (categoryStats[entry.category] || 0) + 1;
});

Object.entries(categoryStats)
  .sort(([, a], [, b]) => b - a)
  .forEach(([category, count]) => {
    console.log(`${category}: ${count} entries`);
  });

console.log('\n✅ Search index test completed successfully!');