import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { WorkflowsService } from '../services/workflows.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Tenant - Advanced')
@Controller('tenant/workflows')
@Auth()
@Tier(UserTier.TENANT)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}
  // TODO: Implement workflows endpoints
}
