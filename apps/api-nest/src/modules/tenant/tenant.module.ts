import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { AdministrationController } from './controllers/administration.controller';
import { WorkflowsController } from './controllers/workflows.controller';
import { MonitoringController } from './controllers/monitoring.controller';
import { DataController } from './controllers/data.controller';
import { ContentController } from './controllers/content.controller';
import { TenantUsersController } from './controllers/users.controller';
import { TenantPermissionsController } from './controllers/permissions.controller';
import { TagsController } from './controllers/tags.controller';
import { CategoriesController } from './controllers/categories.controller';
import { ModelSchemasController } from './controllers/model-schemas.controller';
import { OptionSetsController } from './controllers/option-sets.controller';
import { IntegrationsController } from './controllers/integrations.controller';
import { SettingsController } from './controllers/settings.controller';
import { MediaController } from './controllers/media.controller';
import { TranslationsController } from './controllers/translations.controller';
import { AdministrationService } from './services/administration.service';
import { WorkflowsService } from './services/workflows.service';
import { MonitoringService } from './services/monitoring.service';
import { DataService } from './services/data.service';
import { ContentService } from './services/content.service';
import { TenantUsersService } from './services/users.service';
import { TenantPermissionsService } from './services/permissions.service';
import { TagsService } from './services/tags.service';
import { CategoriesService } from './services/categories.service';
import { ModelSchemasService } from './services/model-schemas.service';
import { OptionSetsService } from './services/option-sets.service';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [AuthModule, PermissionsModule],
  controllers: [
    TenantController,
    AdministrationController,
    WorkflowsController,
    MonitoringController,
    DataController,
    ContentController,
    TenantUsersController,
    TenantPermissionsController,
    TagsController,
    CategoriesController,
    ModelSchemasController,
    OptionSetsController,
    IntegrationsController,
    SettingsController,
    MediaController,
    TranslationsController,
  ],
  providers: [
    TenantService,
    AdministrationService,
    WorkflowsService,
    MonitoringService,
    DataService,
    ContentService,
    TenantUsersService,
    TenantPermissionsService,
    TagsService,
    CategoriesService,
    ModelSchemasService,
    OptionSetsService,
  ],
  exports: [
    TenantService,
    AdministrationService,
    WorkflowsService,
    MonitoringService,
    DataService,
    ContentService,
    TenantUsersService,
    TenantPermissionsService,
    TagsService,
    CategoriesService,
    ModelSchemasService,
    OptionSetsService,
  ],
})
export class TenantModule {}