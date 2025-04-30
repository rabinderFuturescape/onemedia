import { Injectable } from '@nestjs/common';
import { KeycloakAdminService } from '../../common/services/keycloak-admin.service';

@Injectable()
export class ProvidersService {
  constructor(private readonly keycloakAdminService: KeycloakAdminService) {}

  async findAll() {
    return { message: 'This method will return all identity providers' };
  }

  async findOne(id: string) {
    return { message: `This method will return identity provider with ID ${id}` };
  }
}
