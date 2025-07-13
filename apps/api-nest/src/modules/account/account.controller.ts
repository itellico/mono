import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';
import { AccountService } from './account.service';

@ApiTags('Account - Core')
@ApiBearerAuth('JWT-auth')
@Controller('account')
@Auth()
@Tier(UserTier.ACCOUNT)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('members')
  @Permission('account.members.view')
  getMembers() {
    // TODO: Add auth guard and account context
    return this.accountService.getMembers('current-account-id');
  }

  @Post('members')
  @Permission('account.members.create')
  addMember(@Body() memberData: any) {
    return this.accountService.addMember('current-account-id', memberData);
  }

  @Get('settings')
  @Permission('account.settings.view')
  getSettings() {
    return this.accountService.getSettings('current-account-id');
  }

  @Put('settings')
  @Permission('account.settings.update')
  updateSettings(@Body() settings: any) {
    return this.accountService.updateSettings('current-account-id', settings);
  }
}