import { Module } from '@nestjs/common';
import { TimezonesController } from './timezones.controller';
import { TimezonesService } from './timezones.service';
import { PrismaModule } from '@common/prisma/prisma.module';
import { RedisModule } from '@common/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [TimezonesController],
  providers: [TimezonesService],
  exports: [TimezonesService]
})
export class TimezonesModule {}