import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { HealthController } from './controllers/health.controller';
import { PublicAuthController } from './controllers/auth.controller';
import { HealthService } from './services/health.service';
import { PublicAuthService } from './services/public-auth.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // Import AuthModule to use AuthService
  controllers: [
    PublicController,
    HealthController,
    PublicAuthController,
  ],
  providers: [
    PublicService,
    HealthService,
    PublicAuthService,
  ],
  exports: [PublicService, HealthService, PublicAuthService],
})
export class PublicModule {}