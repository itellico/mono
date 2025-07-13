import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { TagsService } from '../services/tags.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Tenant - Configuration')
@Controller('tenant/tags')
@Auth()
@Tier(UserTier.TENANT)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}
  // TODO: Implement tags endpoints
}
