import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { ConfigurationService } from '../services/configuration.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Account - Core')
@Controller('account/configuration')
@Auth()
@Tier(UserTier.ACCOUNT)
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}
  // TODO: Implement configuration endpoints
}