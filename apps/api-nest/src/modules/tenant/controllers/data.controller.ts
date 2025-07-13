import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { DataService } from '../services/data.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Tenant - Advanced')
@Controller('tenant/data')
@Auth()
@Tier(UserTier.TENANT)
export class DataController {
  constructor(private readonly dataService: DataService) {}
  // TODO: Implement data endpoints
}
