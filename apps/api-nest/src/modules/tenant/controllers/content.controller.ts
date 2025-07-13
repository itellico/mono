import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { ContentService } from '../services/content.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Tenant - Configuration')
@Controller('tenant/content')
@Auth()
@Tier(UserTier.TENANT)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}
  // TODO: Implement content endpoints
}
