// Simple test to check if server starts
const { spawn } = require('child_process');

const server = spawn('pnpm', ['dev'], {
  cwd: __dirname,
  stdio: 'pipe'
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log(data.toString());
  
  // Check if server started successfully
  if (output.includes('Fastify server running on')) {
    console.log('✅ Server started successfully!');
    server.kill();
    process.exit(0);
  }
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.error(data.toString());
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.error('❌ Server failed to start within 30 seconds');
  console.error('Output:', output);
  console.error('Error:', errorOutput);
  server.kill();
  process.exit(1);
}, 30000);