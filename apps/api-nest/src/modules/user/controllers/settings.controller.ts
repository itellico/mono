import { Controller, Get, Put, Post, Delete, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { CurrentUser } from '@common/decorators/user.decorator';
import { SettingsService } from '../services/settings.service';

@ApiTags('User - Profile')
@Controller('user/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Auth({ permissions: ['user.settings.read'] })
  @Get('preferences')
  async getPreferences(@CurrentUser() user: any) {
    return this.settingsService.getPreferences(user.id);
  }

  @Auth({ permissions: ['user.settings.update'] })
  @Put('preferences')
  async updatePreferences(
    @CurrentUser() user: any,
    @Body() preferences: any,
  ) {
    return this.settingsService.updatePreferences(user.id, preferences);
  }

  @Auth({ permissions: ['user.settings.update'] })
  @Post('2fa/:action')
  async toggle2FA(
    @CurrentUser() user: any,
    @Body() twoFactorData: any,
  ) {
    return this.settingsService.toggle2FA(user.id, twoFactorData);
  }

  @Auth({ permissions: ['user.settings.delete'] })
  @Delete('account')
  async deleteAccount(
    @CurrentUser() user: any,
    @Body() deleteData: { password: string; reason?: string },
  ) {
    return this.settingsService.deleteAccount(user.id, deleteData);
  }
}