import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
// import { PrismaMetricsService } from '../interceptors/prisma-metrics.interceptor';

@Global()
@Module({
  providers: [
    PrismaService,
    // PrismaMetricsService,
  ],
  exports: [PrismaService],
})
export class PrismaModule {}