import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { InvitationsService } from '../services/invitations.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Account - Core')
@Controller('account/invitations')
@Auth()
@Tier(UserTier.ACCOUNT)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}
  // TODO: Implement invitations endpoints
}