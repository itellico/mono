import { Module } from '@nestjs/common';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';
import { PrismaModule } from '@common/prisma/prisma.module';
import { RedisModule } from '@common/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [CountriesController],
  providers: [CountriesService],
  exports: [CountriesService]
})
export class CountriesModule {}