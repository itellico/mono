import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { CronJobsService } from './cron-jobs.service';
import { BackgroundJobsService } from './background-jobs.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { LoggingModule } from '../logging/logging.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    RabbitMQModule,
    LoggingModule,
    PrismaModule,
    RedisModule,
  ],
  providers: [
    SchedulerService,
    CronJobsService,
    BackgroundJobsService,
  ],
  exports: [
    SchedulerService,
    CronJobsService,
    BackgroundJobsService,
  ],
})
export class SchedulerModule {}