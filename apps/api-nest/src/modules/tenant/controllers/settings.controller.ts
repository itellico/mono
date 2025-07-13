import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Tenant - Configuration')
@ApiBearerAuth('JWT-auth')
@Controller('tenant/settings')
@Auth()
@Tier(UserTier.TENANT)
export class SettingsController {
  @Get()
  @Permission('tenant.settings.view')
  @ApiOperation({ summary: 'Get all tenant settings' })
  async getAllSettings() {
    return {
      success: true,
      data: {}
    };
  }

  @Get(':key')
  @Permission('tenant.settings.view')
  @ApiOperation({ summary: 'Get setting by key' })
  async getSetting(@Param('key') key: string) {
    return {
      success: true,
      data: { key, value: null }
    };
  }

  @Put(':key')
  @Permission('tenant.settings.update')
  @ApiOperation({ summary: 'Update setting' })
  async updateSetting(@Param('key') key: string, @Body() body: { value: any }) {
    return {
      success: true,
      data: { key, value: body.value, updated: true }
    };
  }

  @Post('active-modes')
  @Permission('tenant.settings.view')
  @ApiOperation({ summary: 'Get active operational modes' })
  async getActiveModes() {
    return {
      success: true,
      data: { modes: [] }
    };
  }

  @Post('toggle-developer-mode')
  @Permission('tenant.settings.manage_dev_mode')
  @ApiOperation({ summary: 'Toggle developer mode' })
  async toggleDeveloperMode(@Body() body: { enabled: boolean }) {
    return {
      success: true,
      data: { developerMode: body.enabled }
    };
  }

  @Post('god-mode')
  @Permission('tenant.settings.manage_god_mode')
  @ApiOperation({ summary: 'Enable/disable god mode' })
  async manageGodMode(@Body() body: { action: 'enable' | 'disable' }) {
    return {
      success: true,
      data: { godMode: body.action === 'enable' }
    };
  }
}