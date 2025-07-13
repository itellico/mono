import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}
  // TODO: Implement invitations service methods
}