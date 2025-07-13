import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiParam, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { Auth } from '@common/decorators/auth.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@Controller('platform')
@ApiTags('Platform - Core')
@ApiBearerAuth('JWT-auth')
@Auth()
@Tier(UserTier.PLATFORM)
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  // NOTE: Tenant management endpoints moved to platform/system/tenants controller
  // This controller now focuses on system-level platform operations

  @Get('system/status')
  @Permission('platform.system.view')
  @ApiOperation({ summary: 'Get system status and health information' })
  getSystemStatus() {
    return this.platformService.getSystemStatus();
  }

  @Get('system/metrics')
  @Permission('platform.system.view')
  @ApiOperation({ summary: 'Get system performance metrics' })
  getSystemMetrics() {
    return this.platformService.getSystemMetrics();
  }

  @Get('subscriptions')
  @Permission('platform.subscriptions.view')
  @ApiOperation({ summary: 'Get all platform subscriptions' })
  getSubscriptions() {
    return this.platformService.getSubscriptions();
  }

  @Get('settings')
  @Permission('platform.settings.view')
  @ApiOperation({ summary: 'Get platform-wide settings' })
  getSettings() {
    return this.platformService.getSettings();
  }

  @Put('settings')
  @Permission('platform.settings.update')
  @ApiOperation({ summary: 'Update platform-wide settings' })
  updateSettings(@Body() settings: any) {
    return this.platformService.updateSettings(settings);
  }
}