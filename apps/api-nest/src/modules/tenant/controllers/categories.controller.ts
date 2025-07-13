import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { CategoriesService } from '../services/categories.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Tenant - Configuration')
@Controller('tenant/categories')
@Auth()
@Tier(UserTier.TENANT)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}
  // TODO: Implement categories endpoints
}
