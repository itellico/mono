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
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { User } from '@common/decorators/user.decorator';
import { AccountContext } from '@common/decorators/account.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { BillingService } from '../services/billing.service';
import { AuthenticatedUser } from '@common/types/auth.types';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Account - Billing')
@Controller('account/billing')
@Auth()
@Tier(UserTier.ACCOUNT)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // Billing Overview
  @Get()
  @Permission('account.billing.view')
  @ApiOperation({ summary: 'Get billing overview' })
  async getBillingOverview(@AccountContext() accountId: string) {
    return this.billingService.getBillingOverview(accountId);
  }

  // Subscriptions
  @Get('subscriptions')
  @Permission('account.billing.view')
  @ApiOperation({ summary: 'Get all subscriptions' })
  async getSubscriptions(@AccountContext() accountId: string) {
    return this.billingService.getSubscriptions(accountId);
  }

  @Get('subscriptions/:subscriptionId')
  @Permission('account.billing.view')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiParam({ 
    name: 'subscriptionId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getSubscription(
    @AccountContext() accountId: string,
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
  ) {
    return this.billingService.getSubscription(accountId, subscriptionId);
  }

  @Post('subscriptions')
  @Permission('account.billing.manage')
  @ApiOperation({ summary: 'Create new subscription' })
  async createSubscription(
    @AccountContext() accountId: string,
    @User() user: AuthenticatedUser,
    @Body() data: { planId: string; paymentMethodId?: string },
  ) {
    return this.billingService.createSubscription(accountId, user.id, data);
  }

  @Put('subscriptions/:subscriptionId')
  @Permission('account.billing.manage')
  @ApiOperation({ summary: 'Update subscription' })
  @ApiParam({ 
    name: 'subscriptionId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async updateSubscription(
    @AccountContext() accountId: string,
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Body() data: { planId?: string; quantity?: number },
  ) {
    return this.billingService.updateSubscription(accountId, subscriptionId, data);
  }

  @Delete('subscriptions/:subscriptionId')
  @Permission('account.billing.manage')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiParam({ 
    name: 'subscriptionId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async cancelSubscription(
    @AccountContext() accountId: string,
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Body() data: { reason?: string; immediate?: boolean },
  ) {
    return this.billingService.cancelSubscription(accountId, subscriptionId, data);
  }

  // Invoices
  @Get('invoices')
  @Permission('account.billing.view')
  @ApiOperation({ summary: 'Get all invoices with pagination and filtering' })
  async getInvoices(
    @AccountContext() accountId: string,
    @Query() query: { 
      page?: number; 
      limit?: number; 
      status?: 'paid' | 'pending' | 'overdue';
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.billingService.getInvoices(accountId, query);
  }

  @Get('invoices/:invoiceId')
  @Permission('account.billing.view')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ 
    name: 'invoiceId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getInvoice(
    @AccountContext() accountId: string,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ) {
    return this.billingService.getInvoice(accountId, invoiceId);
  }

  @Get('invoices/:invoiceId/download')
  @Permission('account.billing.view')
  @ApiOperation({ summary: 'Download invoice PDF' })
  @ApiParam({ 
    name: 'invoiceId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async downloadInvoice(
    @AccountContext() accountId: string,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ) {
    return this.billingService.downloadInvoice(accountId, invoiceId);
  }

  // Payment Methods
  @Get('payment-methods')
  @Permission('account.billing.view')
  @ApiOperation({ summary: 'Get all payment methods' })
  async getPaymentMethods(@AccountContext() accountId: string) {
    return this.billingService.getPaymentMethods(accountId);
  }

  @Post('payment-methods')
  @Permission('account.billing.manage')
  @ApiOperation({ summary: 'Add new payment method' })
  async addPaymentMethod(
    @AccountContext() accountId: string,
    @Body() data: { 
      type: 'card' | 'bank_account';
      token: string;
      setAsDefault?: boolean;
    },
  ) {
    return this.billingService.addPaymentMethod(accountId, data);
  }

  @Put('payment-methods/:paymentMethodId/default')
  @Permission('account.billing.manage')
  @ApiOperation({ summary: 'Set default payment method' })
  @ApiParam({ 
    name: 'paymentMethodId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async setDefaultPaymentMethod(
    @AccountContext() accountId: string,
    @Param('paymentMethodId', ParseUUIDPipe) paymentMethodId: string,
  ) {
    return this.billingService.setDefaultPaymentMethod(accountId, paymentMethodId);
  }

  @Delete('payment-methods/:paymentMethodId')
  @Permission('account.billing.manage')
  @ApiOperation({ summary: 'Remove payment method' })
  @ApiParam({ 
    name: 'paymentMethodId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async removePaymentMethod(
    @AccountContext() accountId: string,
    @Param('paymentMethodId', ParseUUIDPipe) paymentMethodId: string,
  ) {
    return this.billingService.removePaymentMethod(accountId, paymentMethodId);
  }

  // Usage & Limits
  @Get('usage')
  @Permission('account.billing.view')
  @ApiOperation({ summary: 'Get usage metrics' })
  async getUsage(
    @AccountContext() accountId: string,
    @Query() query: { 
      metric?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.billingService.getUsage(accountId, query);
  }

  @Get('limits')
  @Permission('account.billing.view')
  @ApiOperation({ summary: 'Get account limits' })
  async getLimits(@AccountContext() accountId: string) {
    return this.billingService.getLimits(accountId);
  }
}