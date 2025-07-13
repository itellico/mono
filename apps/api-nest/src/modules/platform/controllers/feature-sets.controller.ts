import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { FeatureSetsService } from '../services/feature-sets.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@Controller('platform/feature-sets')
@ApiTags('Platform - Core')
@Auth()
@Tier(UserTier.PLATFORM)
export class FeatureSetsController {
  constructor(private readonly featureSetsService: FeatureSetsService) {}
  // TODO: Implement feature sets endpoints
}
