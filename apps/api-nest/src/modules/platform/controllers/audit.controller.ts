import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { AuditService } from '../services/audit.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@Controller('platform/audit')
@ApiTags('Platform - Monitoring')
@Auth()
@Tier(UserTier.PLATFORM)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}
  // TODO: Implement audit endpoints
}
