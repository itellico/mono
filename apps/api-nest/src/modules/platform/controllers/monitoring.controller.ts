import { 
  Controller, 
  Get, 
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { MonitoringService } from '../services/monitoring.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Platform - Monitoring')
@Controller('platform/monitoring')
@Auth()
@Tier(UserTier.PLATFORM)
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('system')
  @Permission('platform.monitoring.view')
  @ApiOperation({ 
    summary: 'Get comprehensive system health and diagnostics',
    description: 'Returns detailed system health including database, Redis, disk space, memory usage, and other diagnostics. For basic health checks, use /api/v2/public/health instead.'
  })
  async getSystemHealth() {
    return this.monitoringService.getSystemHealth();
  }

  @Get('metrics')
  @Permission('platform.monitoring.view')
  async getMetrics(
    @Query() query: { 
      metric?: string;
      period?: 'minute' | 'hour' | 'day' | 'week' | 'month';
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.monitoringService.getMetrics(query);
  }

  @Get('services')
  @Permission('platform.monitoring.view')
  async getServicesStatus() {
    return this.monitoringService.getServicesStatus();
  }

  @Get('resources')
  @Permission('platform.monitoring.view')
  async getResourceUsage() {
    return this.monitoringService.getResourceUsage();
  }

  @Get('errors')
  @Permission('platform.monitoring.view')
  async getErrors(
    @Query() query: { 
      severity?: 'low' | 'medium' | 'high' | 'critical';
      service?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return this.monitoringService.getErrors(query);
  }

  @Get('performance')
  @Permission('platform.monitoring.view')
  async getPerformanceMetrics(
    @Query() query: { 
      endpoint?: string;
      method?: string;
      percentile?: number;
    },
  ) {
    return this.monitoringService.getPerformanceMetrics(query);
  }

  @Get('alerts')
  @Permission('platform.monitoring.view')
  async getAlerts(
    @Query() query: { 
      status?: 'active' | 'resolved' | 'acknowledged';
      severity?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return this.monitoringService.getAlerts(query);
  }

  @Get('logs')
  @Permission('platform.monitoring.view')
  async getLogs(
    @Query() query: { 
      level?: 'debug' | 'info' | 'warn' | 'error';
      service?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return this.monitoringService.getLogs(query);
  }

  @Get('uptime')
  @Permission('platform.monitoring.view')
  async getUptime(
    @Query() query: { 
      service?: string;
      period?: string;
    },
  ) {
    return this.monitoringService.getUptime(query);
  }

  @Get('queue')
  @Permission('platform.monitoring.view')
  async getQueueStats() {
    return this.monitoringService.getQueueStats();
  }

  @Get('database')
  @Permission('platform.monitoring.view')
  async getDatabaseStats() {
    return this.monitoringService.getDatabaseStats();
  }

  @Get('cache')
  @Permission('platform.monitoring.view')
  async getCacheStats() {
    return this.monitoringService.getCacheStats();
  }
}