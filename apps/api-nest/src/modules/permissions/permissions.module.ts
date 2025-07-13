import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PrismaModule } from '@common/prisma/prisma.module';
import { RedisModule } from '@common/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionsModule {}