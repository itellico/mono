import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { AdminService } from '../services/admin.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@Controller('platform/admin')
@ApiTags('Platform - Management')
@Auth()
@Tier(UserTier.PLATFORM)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  // TODO: Implement admin endpoints
}
