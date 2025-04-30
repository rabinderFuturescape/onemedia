import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Tenant already exists' })
  async createTenant(@Body() createTenantDto: CreateTenantDto) {
    try {
      return await this.tenantsService.createTenant(createTenantDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create tenant: ${error.message}`);
    }
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({ status: 200, description: 'List of tenants' })
  async findAllTenants() {
    return this.tenantsService.findAllTenants();
  }

  @Get(':name')
  @Roles('admin', 'tenant-admin')
  @ApiOperation({ summary: 'Get tenant by name' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findTenantByName(@Param('name') name: string) {
    try {
      return await this.tenantsService.findTenantByName(name);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to find tenant: ${error.message}`);
    }
  }

  @Put(':name')
  @Roles('admin', 'tenant-admin')
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateTenant(
    @Param('name') name: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    try {
      return await this.tenantsService.updateTenant(name, updateTenantDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update tenant: ${error.message}`);
    }
  }

  @Delete(':name')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete tenant' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async deleteTenant(@Param('name') name: string) {
    try {
      await this.tenantsService.deleteTenant(name);
      return { message: `Tenant ${name} deleted successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }
  }

  @Post(':name/users/:userId')
  @Roles('admin', 'tenant-admin')
  @ApiOperation({ summary: 'Add user to tenant' })
  @ApiResponse({ status: 200, description: 'User added to tenant successfully' })
  @ApiResponse({ status: 404, description: 'Tenant or user not found' })
  async addUserToTenant(
    @Param('name') name: string,
    @Param('userId') userId: string,
  ) {
    try {
      await this.tenantsService.addUserToTenant(name, userId);
      return { message: `User ${userId} added to tenant ${name} successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to add user to tenant: ${error.message}`);
    }
  }

  @Delete(':name/users/:userId')
  @Roles('admin', 'tenant-admin')
  @ApiOperation({ summary: 'Remove user from tenant' })
  @ApiResponse({ status: 200, description: 'User removed from tenant successfully' })
  @ApiResponse({ status: 404, description: 'Tenant or user not found' })
  async removeUserFromTenant(
    @Param('name') name: string,
    @Param('userId') userId: string,
  ) {
    try {
      await this.tenantsService.removeUserFromTenant(name, userId);
      return { message: `User ${userId} removed from tenant ${name} successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to remove user from tenant: ${error.message}`);
    }
  }

  @Get(':name/users')
  @Roles('admin', 'tenant-admin')
  @ApiOperation({ summary: 'Get users in tenant' })
  @ApiResponse({ status: 200, description: 'List of users in tenant' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getUsersInTenant(@Param('name') name: string) {
    try {
      return await this.tenantsService.getUsersInTenant(name);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to get users in tenant: ${error.message}`);
    }
  }
}
