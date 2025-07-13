import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class DataService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}
  // TODO: Implement data service methods
}
