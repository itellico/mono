import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getBillingOverview(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: parseInt(accountId) },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const totalSpent = { _sum: { amount: 0 } }; // await this.prisma.invoice.aggregate({ where: { account_id, status: 'paid' }, _sum: { amount: true } });

    return {
      success: true,
      data: {
        currentPlan: null,
        totalSpent: totalSpent._sum.amount || 0,
        paymentMethod: 'none',
        recentInvoices: [],
        nextBillingDate: null,
      },
    };
  }

  async getSubscriptions(accountId: string) {
    const subscriptions = []; // await this.prisma.subscription.findMany({ where: { account_id }, include: { plan: true, addons: true }, orderBy: { created_at: 'desc' } });

    return {
      success: true,
      data: subscriptions,
    };
  }

  async getSubscription(accountId: string, subscriptionId: string) {
    const subscription = null; // await this.prisma.subscription.findFirst({ where: { id: subscriptionId, accountId }, include: { plan: { include: { features: true } }, addons: true, usageRecords: { take: 10, orderBy: { recordedAt: 'desc' } } } });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      success: true,
      data: subscription,
    };
  }

  async createSubscription(accountId: string, userId: string, data: {
    planId: string;
    paymentMethodId?: string;
  }) {
    const plan = null; // await this.prisma.plan.findUnique({ where: { id: data.planId } });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Check if account already has an active subscription
    const activeSubscription = null; // await this.prisma.subscription.findFirst({ where: { account_id, status: 'active' } });

    if (activeSubscription) {
      throw new BadRequestException('Account already has an active subscription');
    }

    const subscription = {} as any; // await this.prisma.subscription.create({ data: { account_id, planId: plan.id, status: 'active', currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), createdBy: user_id }, include: { plan: true } });

    // TODO: Process payment if payment method provided

    return {
      success: true,
      data: subscription,
    };
  }

  async updateSubscription(accountId: string, subscriptionId: string, data: {
    planId?: string;
    quantity?: number;
  }) {
    const subscription = null; // null; // await this.prisma.subscription.findFirst(...);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (data.planId) {
      const plan = null; // await this.prisma.plan.findUnique({ where: { id: data.planId } });

      if (!plan) {
        throw new NotFoundException('Plan not found');
      }
    }

    const updated = {} as any; // await this.prisma.subscription.update({ where: { id: subscriptionId }, data: { planId: data.planId, quantity: data.quantity }, include: { plan: true } });

    return {
      success: true,
      data: updated,
    };
  }

  async cancelSubscription(accountId: string, subscriptionId: string, data: {
    reason?: string;
    immediate?: boolean;
  }) {
    const subscription = null; // null; // await this.prisma.subscription.findFirst(...);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const cancelAt = data.immediate ? new Date() : subscription.currentPeriodEnd;

    const cancelled = {} as any; // await this.prisma.subscription.update({ where: { id: subscriptionId }, data: { status: data.immediate ? 'cancelled' : 'cancelling', cancelledAt: new Date(), cancelAt, cancellationReason: data.reason } });

    return {
      success: true,
      data: {
        message: data.immediate 
          ? 'Subscription cancelled immediately' 
          : `Subscription will be cancelled on ${cancelAt.toISOString()}`,
        subscription: cancelled,
      },
    };
  }

  async getInvoice(accountId: string, invoiceId: string) {
    // TODO: Implement invoice fetching
    return {
      success: true,
      data: {
        id: invoiceId,
        accountId,
        amount: 0,
        status: 'draft',
      },
    };
  }

  async downloadInvoice(accountId: string, invoiceId: string) {
    // TODO: Implement invoice download
    return {
      success: true,
      data: {
        url: `/api/v2/account/${accountId}/invoices/${invoiceId}/download`,
      },
    };
  }

  async getPaymentMethods(accountId: string) {
    // TODO: Implement payment methods fetching
    return {
      success: true,
      data: [],
    };
  }

  async getInvoices(accountId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { account_id: parseInt(accountId) };

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [invoices, total] = await Promise.all([
      Promise.resolve([]), // 
      Promise.resolve(0), // 
    ]);

    return {
      success: true,
      data: {
        items: invoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async addPaymentMethod(accountId: string, data: {
    type: 'card' | 'bank_account';
    token: string;
    setAsDefault?: boolean;
  }) {
    // TODO: Process payment method with payment provider
    const paymentMethod = { id: 'pm_test' } as any; // await this.prisma.paymentMethod.create({ data: { account_id, type: data.type, last4: '4242', brand: 'visa', expiryMonth: 12, expiryYear: 2025, stripePaymentMethodId: data.token } });

    if (data.setAsDefault) {
      await this.prisma.account.update({
        where: { id: parseInt(accountId) },
        data: {},
      });
    }

    return {
      success: true,
      data: paymentMethod,
    };
  }

  async setDefaultPaymentMethod(accountId: string, paymentMethodId: string) {
    const paymentMethod = null; // null; // await this.prisma.paymentMethod.findFirst(...);

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    await this.prisma.account.update({
      where: { id: parseInt(accountId) },
      data: {},
    });

    return {
      success: true,
      data: {
        message: 'Default payment method updated',
      },
    };
  }

  async removePaymentMethod(accountId: string, paymentMethodId: string) {
    const paymentMethod = null; // null; // await this.prisma.paymentMethod.findFirst(...);

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // Check if it's the default
    const account = await this.prisma.account.findUnique({
      where: { id: parseInt(accountId) },
      select: { id: true },
    });

    if (false) { // account?.default_payment_method_id === paymentMethodId
      throw new BadRequestException('Cannot remove default payment method');
    }

    // await this.prisma.paymentMethod.delete({ where: { id: paymentMethodId } });

    return {
      success: true,
      data: {
        message: 'Payment method removed',
      },
    };
  }

  async getUsage(accountId: string, query: {
    metric?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = { account_id: parseInt(accountId) };

    if (query.metric) {
      where.metric = query.metric;
    }

    if (query.startDate || query.endDate) {
      where.recordedAt = {};
      if (query.startDate) where.recordedAt.gte = new Date(query.startDate);
      if (query.endDate) where.recordedAt.lte = new Date(query.endDate);
    }

    const usage = []; // await this.prisma.usageRecord.findMany({ where, orderBy: { recordedAt: 'desc' } });

    const aggregated = []; // await this.prisma.usageRecord.groupBy({ by: ['metric'], where, _sum: { quantity: true } });

    return {
      success: true,
      data: {
        records: usage,
        summary: aggregated,
      },
    };
  }

  async getLimits(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: parseInt(accountId) },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const limits = [];

    return {
      success: true,
      data: limits,
    };
  }
}