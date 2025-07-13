import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { BusinessService } from '../services/business.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Account - Core')
@Controller('account/business')
@Auth()
@Tier(UserTier.ACCOUNT)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}
  // TODO: Implement business endpoints
}