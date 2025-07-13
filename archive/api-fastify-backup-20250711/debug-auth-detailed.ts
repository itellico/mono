import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { buildApp } from './src/app.js';

const prisma = new PrismaClient();

async function debugAuth() {
  console.log('=== DEBUGGING AUTHENTICATION ===\n');

  // Step 1: Check database directly
  console.log('1. Checking database directly...');
  const account = await prisma.account.findUnique({
    where: { email: 'test@example.com' },
    include: {
      users: {
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!account) {
    console.log('ERROR: Account not found!');
    return;
  }

  console.log('✓ Account found:', account.email);
  console.log('✓ Has password hash:', !!account.passwordHash);
  console.log('✓ Active users:', account.users.filter(u => u.isActive).length);

  // Step 2: Test password verification
  console.log('\n2. Testing password verification...');
  const testPassword = 'password123';
  if (account.passwordHash) {
    const isValid = await bcrypt.compare(testPassword, account.passwordHash);
    console.log('✓ Password verification:', isValid ? 'PASSED' : 'FAILED');
  }

  // Step 3: Build app and test auth service
  console.log('\n3. Building app and testing auth service...');
  const app = await buildApp({ 
    logger: {
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    }
  });

  try {
    console.log('✓ App built successfully');
    console.log('✓ Auth service available:', !!app.authService);

    // Step 4: Test auth service login directly
    console.log('\n4. Testing auth service login directly...');
    try {
      const result = await app.authService.login(
        'test@example.com',
        'password123',
        '127.0.0.1',
        'test-script'
      );
      console.log('✓ Login successful!');
      console.log('  User ID:', result.user.id);
      console.log('  Email:', result.user.email);
      console.log('  Roles:', result.user.roles);
      console.log('  Session ID:', result.session.id);
    } catch (error: any) {
      console.log('✗ Login failed:', error.message);
      console.log('  Stack:', error.stack);
    }

    // Step 5: Test HTTP endpoint
    console.log('\n5. Testing HTTP endpoint...');
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: {
        'content-type': 'application/json'
      },
      payload: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    console.log('Response status:', response.statusCode);
    console.log('Response body:', response.body);
    
    if (response.statusCode === 200) {
      console.log('✓ HTTP login successful!');
      const cookies = response.headers['set-cookie'];
      console.log('Cookies set:', cookies ? 'Yes' : 'No');
    } else {
      console.log('✗ HTTP login failed');
    }

  } finally {
    await app.close();
  }

  await prisma.$disconnect();
}

debugAuth().catch(console.error);