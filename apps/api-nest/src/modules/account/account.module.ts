import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { UsersController } from './controllers/users.controller';
import { BillingController } from './controllers/billing.controller';
// import { AnalyticsController } from './controllers/analytics.controller';
import { BusinessController } from './controllers/business.controller';
import { ConfigurationController } from './controllers/configuration.controller';
import { InvitationsController } from './controllers/invitations.controller';
import { UsersService } from './services/users.service';
import { BillingService } from './services/billing.service';
// import { AnalyticsService } from './services/analytics.service';
import { BusinessService } from './services/business.service';
import { ConfigurationService } from './services/configuration.service';
import { InvitationsService } from './services/invitations.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    AccountController,
    UsersController,
    BillingController,
    // AnalyticsController,
    BusinessController,
    ConfigurationController,
    InvitationsController,
  ],
  providers: [
    AccountService,
    UsersService,
    BillingService,
    // AnalyticsService,
    BusinessService,
    ConfigurationService,
    InvitationsService,
  ],
  exports: [
    AccountService,
    UsersService,
    BillingService,
    // AnalyticsService,
    BusinessService,
    ConfigurationService,
    InvitationsService,
  ],
})
export class AccountModule {}