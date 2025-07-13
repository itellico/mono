import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { TenantPermissionsService } from '../services/permissions.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Tenant - Core')
@Controller('tenant/permissions')
@Auth()
@Tier(UserTier.TENANT)
export class TenantPermissionsController {
  constructor(private readonly permissionsService: TenantPermissionsService) {}
  // TODO: Implement tenant permissions endpoints
}
