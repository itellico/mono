import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { 
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { User } from '@common/decorators/user.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { SystemService } from '../services/system.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';
import { AuthenticatedUser } from '@common/types/auth.types';

@Controller('platform/system')
@ApiTags('Platform - Core')
@ApiBearerAuth('JWT-auth')
@Auth()
@Tier(UserTier.PLATFORM)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  @Get('subscriptions')
  @Permission('platform.subscriptions.view')
  @ApiOperation({ summary: 'Get all platform subscriptions with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: ['active', 'expired', 'trial', 'cancelled'] 
  })
  @ApiResponse({ status: 200, description: 'Returns paginated list of subscriptions' })
  async getSubscriptions(
    @Query() query: { 
      page?: number; 
      limit?: number; 
      search?: string;
      status?: 'active' | 'expired' | 'trial' | 'cancelled';
    },
  ) {
    return this.systemService.getSubscriptions(query);
  }

  @Get('subscriptions/:subscriptionId')
  @Permission('platform.subscriptions.view')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiParam({ 
    name: 'subscriptionId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Returns subscription details' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getSubscription(@Param('subscriptionId', ParseUUIDPipe) subscriptionId: string) {
    return this.systemService.getSubscription(subscriptionId);
  }

  @Post('subscriptions')
  @Permission('platform.subscriptions.create')
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createSubscription(
    @User() user: AuthenticatedUser,
    @Body() createSubscriptionDto: {
      tenantId: string;
      planId: string;
      startDate: string;
      endDate?: string;
      status: string;
    },
  ) {
    return this.systemService.createSubscription(user.id, createSubscriptionDto);
  }

  @Put('subscriptions/:subscriptionId')
  @Permission('platform.subscriptions.update')
  @ApiOperation({ summary: 'Update subscription details' })
  @ApiParam({ 
    name: 'subscriptionId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async updateSubscription(
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Body() updateSubscriptionDto: {
      tenantId?: string;
      planId?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
    },
  ) {
    return this.systemService.updateSubscription(subscriptionId, updateSubscriptionDto);
  }

  @Delete('subscriptions/:subscriptionId')
  @Permission('platform.subscriptions.delete')
  @ApiOperation({ summary: 'Delete a subscription' })
  @ApiParam({ 
    name: 'subscriptionId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Subscription deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async deleteSubscription(@Param('subscriptionId', ParseUUIDPipe) subscriptionId: string) {
    return this.systemService.deleteSubscription(subscriptionId);
  }

  // ==================== PLAN MANAGEMENT ====================

  @Get('plans')
  @Permission('platform.plans.view')
  @ApiOperation({ summary: 'Get all platform plans with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Returns paginated list of plans' })
  async getPlans(
    @Query() query: { 
      page?: number; 
      limit?: number; 
      search?: string;
      active?: boolean;
    },
  ) {
    return this.systemService.getPlans(query);
  }

  @Get('plans/:planId')
  @Permission('platform.plans.view')
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiParam({ 
    name: 'planId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Returns plan details' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlan(@Param('planId', ParseUUIDPipe) planId: string) {
    return this.systemService.getPlan(planId);
  }

  @Post('plans')
  @Permission('platform.plans.create')
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createPlan(
    @User() user: AuthenticatedUser,
    @Body() createPlanDto: {
      name: string;
      description?: string;
      price: number;
      currency: string;
      billingCycle: string;
      features: { featureId: string; limit: number }[];
    },
  ) {
    return this.systemService.createPlan(user.id, createPlanDto);
  }

  @Put('plans/:planId')
  @Permission('platform.plans.update')
  @ApiOperation({ summary: 'Update plan details' })
  @ApiParam({ 
    name: 'planId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async updatePlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() updatePlanDto: {
      name?: string;
      description?: string;
      price?: number;
      currency?: string;
      billingCycle?: string;
      features?: { featureId: string; limit: number }[];
    },
  ) {
    return this.systemService.updatePlan(planId, updatePlanDto);
  }

  @Delete('plans/:planId')
  @Permission('platform.plans.delete')
  @ApiOperation({ summary: 'Delete a plan' })
  @ApiParam({ 
    name: 'planId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async deletePlan(@Param('planId', ParseUUIDPipe) planId: string) {
    return this.systemService.deletePlan(planId);
  }

  // ==================== FEATURE MANAGEMENT ====================

  @Get('features')
  @Permission('platform.features.view')
  @ApiOperation({ summary: 'Get all platform features with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Returns paginated list of features' })
  async getFeatures(
    @Query() query: { 
      page?: number; 
      limit?: number; 
      search?: string;
      active?: boolean;
    },
  ) {
    return this.systemService.getFeatures(query);
  }

  @Get('features/:featureId')
  @Permission('platform.features.view')
  @ApiOperation({ summary: 'Get feature by ID' })
  @ApiParam({ 
    name: 'featureId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Returns feature details' })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async getFeature(@Param('featureId', ParseUUIDPipe) featureId: string) {
    return this.systemService.getFeature(featureId);
  }

  @Post('features')
  @Permission('platform.features.create')
  @ApiOperation({ summary: 'Create a new feature' })
  @ApiResponse({ status: 201, description: 'Feature created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createFeature(
    @User() user: AuthenticatedUser,
    @Body() createFeatureDto: {
      key: string;
      name: string;
      description?: string;
    },
  ) {
    return this.systemService.createFeature(user.id, createFeatureDto);
  }

  @Put('features/:featureId')
  @Permission('platform.features.update')
  @ApiOperation({ summary: 'Update feature details' })
  @ApiParam({ 
    name: 'featureId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Feature updated successfully' })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async updateFeature(
    @Param('featureId', ParseUUIDPipe) featureId: string,
    @Body() updateFeatureDto: {
      key?: string;
      name?: string;
      description?: string;
      isActive?: boolean;
    },
  ) {
    return this.systemService.updateFeature(featureId, updateFeatureDto);
  }

  @Delete('features/:featureId')
  @Permission('platform.features.delete')
  @ApiOperation({ summary: 'Delete a feature' })
  @ApiParam({ 
    name: 'featureId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Feature deleted successfully' })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async deleteFeature(@Param('featureId', ParseUUIDPipe) featureId: string) {
    return this.systemService.deleteFeature(featureId);
  }
}
