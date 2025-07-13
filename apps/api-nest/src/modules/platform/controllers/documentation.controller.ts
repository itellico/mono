import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { DocumentationService } from '../services/documentation.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@Controller('platform/documentation')
@ApiTags('Platform - Core')
@Auth()
@Tier(UserTier.PLATFORM)
export class DocumentationController {
  constructor(private readonly documentationService: DocumentationService) {}
  // TODO: Implement documentation endpoints
}
