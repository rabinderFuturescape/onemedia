import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KcAdminClient from 'keycloak-admin';
import { Credentials } from 'keycloak-admin/lib/utils/auth';

@Injectable()
export class KeycloakAdminService {
  private kcAdminClient: KcAdminClient;

  constructor(private configService: ConfigService) {
    this.kcAdminClient = new KcAdminClient({
      baseUrl: this.configService.get<string>('KEYCLOAK_URL'),
      realmName: this.configService.get<string>('KEYCLOAK_REALM'),
    });

    this.configureAuthentication();
  }

  private async configureAuthentication() {
    const credentials: Credentials = {
      grantType: 'client_credentials',
      clientId: this.configService.get<string>('KEYCLOAK_CLIENT_ID'),
      clientSecret: this.configService.get<string>('KEYCLOAK_CLIENT_SECRET'),
    };

    await this.kcAdminClient.auth(credentials);

    // Set up automatic token refresh
    this.kcAdminClient.setConfig({
      realmName: this.configService.get<string>('KEYCLOAK_REALM'),
    });

    // Refresh token every 58 seconds (default token lifetime is 60 seconds)
    setInterval(() => {
      this.kcAdminClient.auth(credentials);
    }, 58 * 1000);
  }

  getClient(): KcAdminClient {
    return this.kcAdminClient;
  }

  async createUser(user: any): Promise<string> {
    const { id } = await this.kcAdminClient.users.create(user);
    return id;
  }

  async getUserById(id: string): Promise<any> {
    return this.kcAdminClient.users.findOne({ id });
  }

  async getUserByEmail(email: string): Promise<any[]> {
    return this.kcAdminClient.users.find({ email: email, exact: "true" });
  }

  async updateUser(id: string, user: any): Promise<void> {
    await this.kcAdminClient.users.update({ id }, user);
  }

  async deleteUser(id: string): Promise<void> {
    await this.kcAdminClient.users.del({ id });
  }

  async setUserPassword(id: string, password: string, temporary: boolean = false): Promise<void> {
    await this.kcAdminClient.users.resetPassword({
      id,
      credential: {
        temporary,
        type: 'password',
        value: password,
      },
    });
  }

  async getUserRoles(id: string): Promise<any[]> {
    return this.kcAdminClient.users.listRealmRoleMappings({ id });
  }

  async assignRoleToUser(id: string, roleName: string): Promise<void> {
    const role = await this.kcAdminClient.roles.findOneByName({ name: roleName });
    await this.kcAdminClient.users.addRealmRoleMappings({
      id,
      roles: [
        {
          id: role.id,
          name: role.name,
        },
      ],
    });
  }

  async removeRoleFromUser(id: string, roleName: string): Promise<void> {
    const role = await this.kcAdminClient.roles.findOneByName({ name: roleName });
    await this.kcAdminClient.users.delRealmRoleMappings({
      id,
      roles: [
        {
          id: role.id,
          name: role.name,
        },
      ],
    });
  }

  async setUserAttribute(id: string, name: string, value: string[]): Promise<void> {
    const user = await this.kcAdminClient.users.findOne({ id });
    const attributes = user.attributes || {};
    attributes[name] = value;

    await this.kcAdminClient.users.update(
      { id },
      { attributes }
    );
  }

  async getUserAttribute(id: string, name: string): Promise<string[] | undefined> {
    const user = await this.kcAdminClient.users.findOne({ id });
    return user.attributes?.[name];
  }

  async createTenant(tenantName: string, tenantDisplayName: string): Promise<string> {
    // In this implementation, we'll use client roles to represent tenants
    const role = await this.kcAdminClient.roles.create({
      name: `tenant:${tenantName}`,
      description: `Tenant: ${tenantDisplayName}`,
      attributes: {
        'tenant_display_name': [tenantDisplayName],
      },
    });

    // Return the tenant name
    return `tenant:${tenantName}`;
  }

  async assignUserToTenant(userId: string, tenantName: string): Promise<void> {
    // Assign the tenant role to the user
    await this.assignRoleToUser(userId, `tenant:${tenantName}`);

    // Also set the tenant_id attribute for the user
    await this.setUserAttribute(userId, 'tenant_id', [tenantName]);
  }

  async removeUserFromTenant(userId: string, tenantName: string): Promise<void> {
    // Remove the tenant role from the user
    await this.removeRoleFromUser(userId, `tenant:${tenantName}`);

    // Check if user has any other tenant roles
    const roles = await this.getUserRoles(userId);
    const tenantRoles = roles.filter(role => role.name.startsWith('tenant:'));

    if (tenantRoles.length === 0) {
      // If no other tenant roles, remove the tenant_id attribute
      const user = await this.kcAdminClient.users.findOne({ id: userId });
      const attributes = user.attributes || {};
      delete attributes['tenant_id'];

      await this.kcAdminClient.users.update(
        { id: userId },
        { attributes }
      );
    } else {
      // Set the tenant_id to the first remaining tenant
      const nextTenant = tenantRoles[0].name.replace('tenant:', '');
      await this.setUserAttribute(userId, 'tenant_id', [nextTenant]);
    }
  }

  async listTenants(): Promise<any[]> {
    const roles = await this.kcAdminClient.roles.find();
    return roles
      .filter(role => role.name.startsWith('tenant:'))
      .map(role => ({
        id: role.id,
        name: role.name.replace('tenant:', ''),
        displayName: role.attributes?.['tenant_display_name']?.[0] || role.name.replace('tenant:', ''),
      }));
  }

  async getTenantByName(tenantName: string): Promise<any> {
    try {
      const role = await this.kcAdminClient.roles.findOneByName({ name: `tenant:${tenantName}` });
      return {
        id: role.id,
        name: role.name.replace('tenant:', ''),
        displayName: role.attributes?.['tenant_display_name']?.[0] || role.name.replace('tenant:', ''),
      };
    } catch (error) {
      return null;
    }
  }

  async updateTenant(tenantName: string, tenantDisplayName: string): Promise<void> {
    const role = await this.kcAdminClient.roles.findOneByName({ name: `tenant:${tenantName}` });

    await this.kcAdminClient.roles.updateByName(
      { name: `tenant:${tenantName}` },
      {
        name: `tenant:${tenantName}`,
        description: `Tenant: ${tenantDisplayName}`,
        attributes: {
          'tenant_display_name': [tenantDisplayName],
        },
      }
    );
  }

  async deleteTenant(tenantName: string): Promise<void> {
    await this.kcAdminClient.roles.delByName({ name: `tenant:${tenantName}` });
  }

  async getUsersInTenant(tenantName: string): Promise<any[]> {
    const role = await this.kcAdminClient.roles.findOneByName({ name: `tenant:${tenantName}` });
    const users = await this.kcAdminClient.roles.findUsersWithRole({ name: `tenant:${tenantName}` });

    return users;
  }
}
