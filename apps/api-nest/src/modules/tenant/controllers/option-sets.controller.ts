import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { OptionSetsService } from '../services/option-sets.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Tenant - Configuration')
@Controller('tenant/option-sets')
@Auth()
@Tier(UserTier.TENANT)
export class OptionSetsController {
  constructor(private readonly optionSetsService: OptionSetsService) {}
  // TODO: Implement option sets endpoints
}
