import { Injectable } from '@nestjs/common';
import { KeycloakAdminService } from '../../common/services/keycloak-admin.service';

@Injectable()
export class UsersService {
  constructor(private readonly keycloakAdminService: KeycloakAdminService) {}

  async findAll() {
    return { message: 'This method will return all users' };
  }

  async findOne(id: string) {
    return { message: `This method will return user with ID ${id}` };
  }
}
