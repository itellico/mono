import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { TenantUsersService } from '../services/users.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Tenant - Core')
@Controller('tenant/users')
@Auth()
@Tier(UserTier.TENANT)
export class TenantUsersController {
  constructor(private readonly usersService: TenantUsersService) {}
  // TODO: Implement tenant users endpoints
}
