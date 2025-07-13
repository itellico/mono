import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ProfileController } from './controllers/profile.controller';
import { SettingsController } from './controllers/settings.controller';
import { ProfileService } from './services/profile.service';
import { SettingsService } from './services/settings.service';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [AuthModule, PermissionsModule], // Import AuthModule for AuthService
  controllers: [
    UserController,
    ProfileController,
    SettingsController,
  ],
  providers: [
    UserService,
    ProfileService,
    SettingsService,
  ],
  exports: [UserService, ProfileService, SettingsService],
})
export class UserModule {}