import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { OperationsService } from '../services/operations.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@Controller('platform/operations')
@ApiTags('Platform - Monitoring')
@Auth()
@Tier(UserTier.PLATFORM)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}
  // TODO: Implement operations endpoints
}
