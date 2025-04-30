import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { KeycloakAdminService } from '../../common/services/keycloak-admin.service';
import { LoggingService } from '../../common/services/logging.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    private keycloakAdminService: KeycloakAdminService,
    private loggingService: LoggingService,
  ) {
    this.loggingService.setContext('TenantsService');
  }

  async createTenant(createTenantDto: CreateTenantDto): Promise<any> {
    try {
      // Check if tenant already exists
      const existingTenant = await this.keycloakAdminService.getTenantByName(createTenantDto.name);
      
      if (existingTenant) {
        throw new ConflictException(`Tenant with name ${createTenantDto.name} already exists`);
      }
      
      // Create tenant
      const tenantName = await this.keycloakAdminService.createTenant(
        createTenantDto.name,
        createTenantDto.displayName || createTenantDto.name,
      );
      
      this.loggingService.log(`Created tenant: ${tenantName}`);
      
      return {
        name: createTenantDto.name,
        displayName: createTenantDto.displayName || createTenantDto.name,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      
      this.loggingService.error(`Error creating tenant: ${error.message}`, error.stack);
      throw new Error(`Failed to create tenant: ${error.message}`);
    }
  }

  async findAllTenants(): Promise<any[]> {
    try {
      return this.keycloakAdminService.listTenants();
    } catch (error) {
      this.loggingService.error(`Error listing tenants: ${error.message}`, error.stack);
      throw new Error(`Failed to list tenants: ${error.message}`);
    }
  }

  async findTenantByName(name: string): Promise<any> {
    try {
      const tenant = await this.keycloakAdminService.getTenantByName(name);
      
      if (!tenant) {
        throw new NotFoundException(`Tenant with name ${name} not found`);
      }
      
      return tenant;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.loggingService.error(`Error finding tenant: ${error.message}`, error.stack);
      throw new Error(`Failed to find tenant: ${error.message}`);
    }
  }

  async updateTenant(name: string, updateTenantDto: UpdateTenantDto): Promise<any> {
    try {
      // Check if tenant exists
      const tenant = await this.keycloakAdminService.getTenantByName(name);
      
      if (!tenant) {
        throw new NotFoundException(`Tenant with name ${name} not found`);
      }
      
      // Update tenant
      await this.keycloakAdminService.updateTenant(
        name,
        updateTenantDto.displayName,
      );
      
      this.loggingService.log(`Updated tenant: ${name}`);
      
      return {
        name,
        displayName: updateTenantDto.displayName,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.loggingService.error(`Error updating tenant: ${error.message}`, error.stack);
      throw new Error(`Failed to update tenant: ${error.message}`);
    }
  }

  async deleteTenant(name: string): Promise<void> {
    try {
      // Check if tenant exists
      const tenant = await this.keycloakAdminService.getTenantByName(name);
      
      if (!tenant) {
        throw new NotFoundException(`Tenant with name ${name} not found`);
      }
      
      // Delete tenant
      await this.keycloakAdminService.deleteTenant(name);
      
      this.loggingService.log(`Deleted tenant: ${name}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.loggingService.error(`Error deleting tenant: ${error.message}`, error.stack);
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }
  }

  async addUserToTenant(tenantName: string, userId: string): Promise<void> {
    try {
      // Check if tenant exists
      const tenant = await this.keycloakAdminService.getTenantByName(tenantName);
      
      if (!tenant) {
        throw new NotFoundException(`Tenant with name ${tenantName} not found`);
      }
      
      // Check if user exists
      const user = await this.keycloakAdminService.getUserById(userId);
      
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      // Add user to tenant
      await this.keycloakAdminService.assignUserToTenant(userId, tenantName);
      
      this.loggingService.log(`Added user ${userId} to tenant ${tenantName}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.loggingService.error(`Error adding user to tenant: ${error.message}`, error.stack);
      throw new Error(`Failed to add user to tenant: ${error.message}`);
    }
  }

  async removeUserFromTenant(tenantName: string, userId: string): Promise<void> {
    try {
      // Check if tenant exists
      const tenant = await this.keycloakAdminService.getTenantByName(tenantName);
      
      if (!tenant) {
        throw new NotFoundException(`Tenant with name ${tenantName} not found`);
      }
      
      // Check if user exists
      const user = await this.keycloakAdminService.getUserById(userId);
      
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      // Remove user from tenant
      await this.keycloakAdminService.removeUserFromTenant(userId, tenantName);
      
      this.loggingService.log(`Removed user ${userId} from tenant ${tenantName}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.loggingService.error(`Error removing user from tenant: ${error.message}`, error.stack);
      throw new Error(`Failed to remove user from tenant: ${error.message}`);
    }
  }

  async getUsersInTenant(tenantName: string): Promise<any[]> {
    try {
      // Check if tenant exists
      const tenant = await this.keycloakAdminService.getTenantByName(tenantName);
      
      if (!tenant) {
        throw new NotFoundException(`Tenant with name ${tenantName} not found`);
      }
      
      // Get users in tenant
      return this.keycloakAdminService.getUsersInTenant(tenantName);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.loggingService.error(`Error getting users in tenant: ${error.message}`, error.stack);
      throw new Error(`Failed to get users in tenant: ${error.message}`);
    }
  }
}
