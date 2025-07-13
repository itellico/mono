import { buildApp } from './src/app.js';

async function test() {
  const app = await buildApp({ logger: true });
  
  console.log('App built successfully');
  console.log('Auth service available:', !!app.authService);
  console.log('Auth service type:', typeof app.authService);
  
  if (app.authService) {
    console.log('Auth service has login method:', typeof app.authService.login === 'function');
  }
  
  await app.close();
}

test().catch(console.error);