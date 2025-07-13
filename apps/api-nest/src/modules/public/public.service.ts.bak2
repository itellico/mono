import { Injectable } from '@nestjs/common';

@Injectable()
export class PublicService {
  getHealth() {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    };
  }

  getStatus() {
    return {
      success: true,
      data: {
        name: 'itellico API',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
      },
    };
  }
}