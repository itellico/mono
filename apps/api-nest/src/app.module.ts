import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PublicModule } from './modules/public/public.module';
import { UserModule } from './modules/user/user.module';
import { AccountModule } from './modules/account/account.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { PlatformModule } from './modules/platform/platform.module';
import { AuthModule } from './modules/auth/auth.module';
import { SharedModule } from './modules/shared/shared.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AdminModule } from './modules/admin/admin.module';
import { CountriesModule } from './modules/countries/countries.module';
import { LanguagesModule } from './modules/languages/languages.module';
import { TimezonesModule } from './modules/timezones/timezones.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { LoggingModule } from './common/logging/logging.module';
// import { RabbitMQModule } from './common/rabbitmq/rabbitmq.module';
// import { SchedulerModule } from './common/scheduler/scheduler.module';
// import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
// import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { ErrorHandlingInterceptor, ResponseTransformInterceptor, LoggingInterceptor } from './common/interceptors';
import { configuration, validationSchema } from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      cache: true,
    }),
    
    // Core modules
    LoggingModule,     // Pino logging
    PrismaModule,      // Database ORM
    RedisModule,       // Caching and sessions
    // RabbitMQModule,    // Message queue - DISABLED DUE TO TYPE ERRORS
    // SchedulerModule,   // Background jobs and cron tasks - TEMPORARILY DISABLED
    MetricsModule,     // Prometheus metrics
    AuthModule,        // Auth module
    SharedModule,      // Shared services (Email, etc.)
    PermissionsModule, // Permission system
    AdminModule,       // Admin management endpoints
    CountriesModule,   // International reference data
    LanguagesModule,   // Language reference data
    TimezonesModule,   // Timezone reference data
    CurrenciesModule,  // Currency reference data
    
    // 5-Tier modules
    PublicModule,      // /api/v2/public/*
    UserModule,        // /api/v2/user/*
    AccountModule,     // /api/v2/account/*
    TenantModule,      // /api/v2/tenant/*
    PlatformModule,    // /api/v2/platform/*
  ],
  controllers: [],
  providers: [
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard, // Global authentication guard - TEMPORARILY DISABLED
    // },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor, // Request/response logging
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorHandlingInterceptor, // Global error handling
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor, // Standardize response format
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: MetricsInterceptor, // Global metrics collection
    // },
  ],
})
export class AppModule {}