import { 
  Controller, 
  Get, 
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { AccountContext } from '@common/decorators/account.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { AnalyticsService } from '../services/analytics.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Account - Core')
@Controller('account/analytics')
@Auth()
@Tier(UserTier.ACCOUNT)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Permission('account.analytics.view')
  async getOverview(
    @AccountContext() accountId: string,
    @Query() query: { startDate?: string; endDate?: string },
  ) {
    return this.analyticsService.getOverview(accountId, query);
  }

  @Get('reports')
  @Permission('account.analytics.view')
  async getReports(
    @AccountContext() accountId: string,
    @Query() query: { type?: string; period?: string },
  ) {
    return this.analyticsService.getReports(accountId, query);
  }

  @Get('metrics')
  @Permission('account.analytics.view')
  async getMetrics(
    @AccountContext() accountId: string,
    @Query() query: { 
      metric: string;
      startDate?: string;
      endDate?: string;
      groupBy?: string;
    },
  ) {
    return this.analyticsService.getMetrics(accountId, query);
  }

  @Get('activity')
  @Permission('account.analytics.view')
  async getActivity(
    @AccountContext() accountId: string,
    @Query() query: { 
      page?: number;
      limit?: number;
      userId?: string;
      action?: string;
    },
  ) {
    return this.analyticsService.getActivity(accountId, query);
  }

  @Get('export')
  @Permission('account.analytics.export')
  async exportData(
    @AccountContext() accountId: string,
    @Query() query: { 
      format: 'csv' | 'json' | 'xlsx';
      type: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.analyticsService.exportData(accountId, query);
  }
}