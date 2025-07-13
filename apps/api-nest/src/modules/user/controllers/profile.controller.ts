import { Controller, Get, Patch, Post, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { CurrentUser } from '@common/decorators/user.decorator';
import { ProfileService } from '../services/profile.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@ApiTags('User - Profile')
@Controller('user/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Auth({ permissions: ['user.profile.read'] })
  @Get('me')
  async getMyProfile(@CurrentUser() user: any) {
    return this.profileService.getProfile(user.id);
  }

  @Auth({ permissions: ['user.profile.update'] })
  @Patch('me')
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, updateProfileDto);
  }

  @Auth({ permissions: ['user.profile.update'] })
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(user.id, changePasswordDto);
  }

  @Auth()
  @Get(':uuid')
  async getPublicProfile(@Param('uuid') uuid: string) {
    return this.profileService.getPublicProfile(uuid);
  }
}