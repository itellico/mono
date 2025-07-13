import { Module } from '@nestjs/common';
import { AdminPermissionsController } from './controllers/permissions.controller';
import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { PrismaModule } from '@common/prisma/prisma.module';
import { RedisModule } from '@common/redis/redis.module';
import { LoggerModule } from '@common/logger/logger.module';

@Module({
  imports: [PermissionsModule, PrismaModule, RedisModule, LoggerModule],
  controllers: [AdminPermissionsController, RolesController],
  providers: [RolesService],
  exports: [RolesService]
})
export class AdminModule {}