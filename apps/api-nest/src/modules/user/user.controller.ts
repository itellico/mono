import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';
import { UserService } from './user.service';

@ApiTags('User - Profile')
@ApiBearerAuth('JWT-auth')
@Controller('user')
@Auth()
@Tier(UserTier.USER)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @Permission('user.profile.view')
  getProfile() {
    // TODO: Add auth guard and get user from request
    return this.userService.getProfile('current-user-id');
  }

  @Put('profile')
  @Permission('user.profile.update')
  updateProfile(@Body() updateData: any) {
    // TODO: Add validation and auth guard
    return this.userService.updateProfile('current-user-id', updateData);
  }

  @Get('settings')
  @Permission('user.settings.view')
  getSettings() {
    return this.userService.getSettings('current-user-id');
  }
}