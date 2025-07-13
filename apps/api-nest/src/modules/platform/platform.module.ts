import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { AdminController } from './controllers/admin.controller';
import { TenantsController } from './controllers/tenants.controller';
import { PlatformUsersController } from './controllers/users.controller';
import { AuditController } from './controllers/audit.controller';
import { SystemController } from './controllers/system.controller';
import { OperationsController } from './controllers/operations.controller';
import { MonitoringController } from './controllers/monitoring.controller';
import { IntegrationsController } from './controllers/integrations.controller';
import { DocumentationController } from './controllers/documentation.controller';
import { FeatureSetsController } from './controllers/feature-sets.controller';
import { AdminService } from './services/admin.service';
import { TenantsService } from './services/tenants.service';
import { PlatformUsersService } from './services/users.service';
import { AuditService } from './services/audit.service';
import { SystemService } from './services/system.service';
import { OperationsService } from './services/operations.service';
import { MonitoringService } from './services/monitoring.service';
import { IntegrationsService } from './services/integrations.service';
import { DocumentationService } from './services/documentation.service';
import { FeatureSetsService } from './services/feature-sets.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    PlatformController,
    AdminController,
    TenantsController,
    PlatformUsersController,
    AuditController,
    SystemController,
    OperationsController,
    MonitoringController,
    IntegrationsController,
    DocumentationController,
    FeatureSetsController,
  ],
  providers: [
    PlatformService,
    AdminService,
    TenantsService,
    PlatformUsersService,
    AuditService,
    SystemService,
    OperationsService,
    MonitoringService,
    IntegrationsService,
    DocumentationService,
    FeatureSetsService,
  ],
  exports: [
    PlatformService,
    AdminService,
    TenantsService,
    PlatformUsersService,
    AuditService,
    SystemService,
    OperationsService,
    MonitoringService,
    IntegrationsService,
    DocumentationService,
    FeatureSetsService,
  ],
})
export class PlatformModule {}