import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { IntegrationsService } from '../services/integrations.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@Controller('platform/integrations')
@ApiTags('Platform - Core')
@Auth()
@Tier(UserTier.PLATFORM)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}
  // TODO: Implement integrations endpoints
}
