import { Module } from '@nestjs/common';
import { KeycloakService } from './services/keycloak.service';
import { KeycloakAdminService } from './services/keycloak-admin.service';
import { JwtService } from './services/jwt.service';
import { LoggingService } from './services/logging.service';

@Module({
  providers: [
    KeycloakService,
    KeycloakAdminService,
    JwtService,
    LoggingService,
  ],
  exports: [
    KeycloakService,
    KeycloakAdminService,
    JwtService,
    LoggingService,
  ],
})
export class CommonModule {}
