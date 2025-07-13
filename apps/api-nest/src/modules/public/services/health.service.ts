import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import * as os from 'os';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  getHealth() {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getReadiness() {
    const checks = {
      database: false,
      redis: false,
    };

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      // Database not ready
    }

    // Check Redis
    try {
      await this.redis.set('health:check', Date.now(), 10);
      checks.redis = true;
    } catch (error) {
      // Redis not ready
    }

    const isReady = Object.values(checks).every(check => check === true);

    return {
      success: isReady,
      data: {
        status: isReady ? 'ready' : 'not ready',
        services: checks,
        timestamp: new Date().toISOString(),
      },
    };
  }

  getLiveness() {
    return {
      success: true,
      data: {
        status: 'alive',
        pid: process.pid,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    };
  }

  getInfo() {
    return {
      success: true,
      data: {
        name: 'itellico API',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        system: {
          hostname: os.hostname(),
          platform: os.platform(),
          release: os.release(),
          cpus: os.cpus().length,
          memory: {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem(),
          },
        },
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
        timestamp: new Date().toISOString(),
      },
    };
  }
}