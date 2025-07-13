import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { MonitoringService } from '../services/monitoring.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Tenant - Advanced')
@Controller('tenant/monitoring')
@Auth()
@Tier(UserTier.TENANT)
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}
  // TODO: Implement monitoring endpoints
}
