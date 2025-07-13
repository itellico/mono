import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { AdministrationService } from '../services/administration.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Tenant - Core')
@Controller('tenant/administration')
@Auth()
@Tier(UserTier.TENANT)
export class AdministrationController {
  constructor(private readonly administrationService: AdministrationService) {}
  // TODO: Implement administration endpoints
}