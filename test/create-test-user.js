import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if account already exists
    const existingAccount = await prisma.account.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (existingAccount) {
      console.log('Account already exists, updating password...');
      
      // Update password
      const hashedPassword = await bcrypt.hash('password123', 12);
      await prisma.account.update({
        where: { email: 'test@example.com' },
        data: { passwordHash: hashedPassword }
      });
      
      console.log('Password updated successfully');
      return;
    }
    
    // Get tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.error('No tenant found. Please run seed first.');
      return;
    }
    
    // Get role
    const userRole = await prisma.role.findFirst({
      where: { name: 'super_admin' }
    });
    
    if (!userRole) {
      console.error('Role not found. Please run seed first.');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Generate userHash
    const userHash = createHash('sha256').update(`testuser-${Date.now()}`).digest('hex');
    
    // Create account with user
    const account = await prisma.account.create({
      data: {
        email: 'test@example.com',
        passwordHash: hashedPassword,
        tenantId: tenant.id,
        users: {
          create: {
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            userHash: userHash,
            isActive: true,
            userRoles: {
              create: {
                roleId: userRole.id
              }
            }
          }
        }
      },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });
    
    console.log('Test user created successfully:');
    console.log('Email:', account.email);
    console.log('Password: password123');
    console.log('User UUID:', account.users[0].uuid);
    console.log('Roles:', account.users[0].userRoles.map(ur => ur.role.name).join(', '));
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();