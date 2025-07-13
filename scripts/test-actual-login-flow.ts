import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testActualLoginFlow() {
  console.log('🧪 TESTING ACTUAL LOGIN FLOW WITH HTTP REQUESTS');
  console.log('=' .repeat(70));

  try {
    // ======== STEP 1: Check database user/roles ========
    console.log('\n📋 STEP 1: Database Verification');
    const account = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: {
        users: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!account || !account.users[0]) {
      console.error('❌ User 1@1.com not found in database!');
      return;
    }

    const user = account.users[0];
    const userRoles = user.roles.map(ur => ur.role.name);
    const totalPermissions = user.roles.reduce((count, userRole) => 
      count + userRole.role.permissions.length, 0
    );

    console.log(`✅ Database Check:`);
    console.log(`   Email: ${account.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Roles: [${userRoles.join(', ')}]`);
    console.log(`   Total Permissions: ${totalPermissions}`);
    console.log(`   Expected enhancedRoles: [${userRoles.join(', ')}]`);

    // ======== STEP 2: Get CSRF token ========
    console.log('\n🔐 STEP 2: Getting CSRF Token');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json() as any;
    console.log(`✅ CSRF Token: ${csrfData.csrfToken.substring(0, 20)}...`);

    // ======== STEP 3: Simulate actual login ========
    console.log('\n🔑 STEP 3: Simulating Login POST Request');
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `next-auth.csrf-token=${csrfData.csrfToken}`
      },
      body: new URLSearchParams({
        email: '1@1.com',
        password: '123',
        csrfToken: csrfData.csrfToken,
        callbackUrl: 'http://localhost:3000/admin',
        json: 'true'
      }).toString()
    });

    console.log(`🔍 Login Response Status: ${loginResponse.status}`);
    console.log(`🔍 Response Headers:`, Object.fromEntries(loginResponse.headers.entries()));

    if (loginResponse.status !== 200) {
      const errorText = await loginResponse.text();
      console.error(`❌ Login failed:`, errorText);
      return;
    }

    const loginData = await loginResponse.json() as any;
    console.log(`✅ Login Response:`, loginData);

    // Extract session cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log(`🍪 Set-Cookie Header:`, setCookieHeader);

    // ======== STEP 4: Get session with cookie ========
    console.log('\n🔍 STEP 4: Testing Session API');
    
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
      headers: {
        'Cookie': setCookieHeader || ''
      }
    });

    const sessionData = await sessionResponse.json() as any;
    console.log(`📊 Session Data:`, JSON.stringify(sessionData, null, 2));

    // Check if enhancedRoles are in session
    if (sessionData.user && sessionData.user.enhancedRoles) {
      console.log(`✅ enhancedRoles found in session: [${sessionData.user.enhancedRoles.join(', ')}]`);
    } else {
      console.log(`❌ enhancedRoles NOT found in session!`);
      console.log(`   Available session.user properties:`, Object.keys(sessionData.user || {}));
    }

    // ======== STEP 5: Test admin page access ========
    console.log('\n🎯 STEP 5: Testing Admin Page Access');
    
    const adminResponse = await fetch('http://localhost:3000/admin', {
      headers: {
        'Cookie': setCookieHeader || ''
      },
      redirect: 'manual' // Don't follow redirects automatically
    });

    console.log(`🔍 Admin Access Response:`);
    console.log(`   Status: ${adminResponse.status}`);
    console.log(`   Status Text: ${adminResponse.statusText}`);
    
    if (adminResponse.status === 302 || adminResponse.status === 307) {
      const location = adminResponse.headers.get('location');
      console.log(`   Redirect Location: ${location}`);
      
      if (location?.includes('unauthorized')) {
        console.log(`❌ REDIRECTED TO UNAUTHORIZED - Admin access denied!`);
      } else if (location?.includes('signin')) {
        console.log(`❌ REDIRECTED TO SIGNIN - Authentication failed!`);
      } else {
        console.log(`✅ REDIRECTED ELSEWHERE: ${location}`);
      }
    } else if (adminResponse.status === 200) {
      console.log(`✅ ADMIN ACCESS GRANTED - Status 200`);
    } else {
      console.log(`❌ UNEXPECTED RESPONSE: ${adminResponse.status}`);
    }

    // ======== STEP 6: Cookie analysis ========
    console.log('\n🔬 STEP 6: Cookie Analysis');
    
    if (setCookieHeader) {
      const cookies = setCookieHeader.split(';');
      console.log(`🍪 Cookies set:`, cookies.map(c => c.trim().split('=')[0]));
      
      const sessionCookie = cookies.find(c => c.includes('next-auth.session-token'));
      if (sessionCookie) {
        console.log(`✅ Session cookie found`);
      } else {
        console.log(`❌ No session cookie found`);
      }
    } else {
      console.log(`❌ No cookies set in response`);
    }

    // ======== SUMMARY ========
    console.log('\n📊 DIAGNOSIS SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Database User: ✅ Found with roles [${userRoles.join(', ')}]`);
    console.log(`Login: ${loginResponse.status === 200 ? '✅' : '❌'} Status ${loginResponse.status}`);
    console.log(`Session API: ${sessionResponse.status === 200 ? '✅' : '❌'} Status ${sessionResponse.status}`);
    console.log(`Session enhancedRoles: ${sessionData.user?.enhancedRoles ? '✅' : '❌'} ${sessionData.user?.enhancedRoles ? `[${sessionData.user.enhancedRoles.join(', ')}]` : 'Missing'}`);
    console.log(`Admin Access: ${adminResponse.status === 200 ? '✅' : '❌'} Status ${adminResponse.status}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Test failed:', errorMessage);
  } finally {
    await prisma.$disconnect();
  }
}

testActualLoginFlow(); 