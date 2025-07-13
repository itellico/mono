import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Prisma disconnected from database');
  }

  // Utility method for cleaning up the database in tests
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase() is not allowed in production');
    }
    
    // Get all model names from Prisma
    const modelNames = Reflect.ownKeys(this).filter(
      (key) => key !== '_' && typeof this[key as keyof this] === 'object',
    );

    // Delete all data from each model
    return Promise.all(
      modelNames.map((modelName) => {
        return (this[modelName as keyof this] as any).deleteMany();
      }),
    );
  }
}