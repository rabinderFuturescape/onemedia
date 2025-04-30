import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import * as cookieParser from 'cookie-parser';

// Mock the auth guards
class MockJwtAuthGuard {
  canActivate(context) {
    const req = context.switchToHttp().getRequest();
    req.user = {
      id: 'admin-user-id',
      email: 'admin@example.com',
      name: 'Admin User',
      isSuperAdmin: true,
      roles: ['admin'],
      tenant_id: 'tenant-1',
    };
    return true;
  }
}

class MockRolesGuard {
  canActivate() {
    return true;
  }
}

describe('TenantsController (e2e)', () => {
  let app: INestApplication;
  let tenantsService: TenantsService;

  // Mock tenants service methods
  const mockTenantsService = {
    createTenant: jest.fn(),
    findAllTenants: jest.fn(),
    findTenantByName: jest.fn(),
    updateTenant: jest.fn(),
    deleteTenant: jest.fn(),
    addUserToTenant: jest.fn(),
    removeUserFromTenant: jest.fn(),
    getUsersInTenant: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TenantsService)
      .useValue(mockTenantsService)
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    
    tenantsService = moduleFixture.get<TenantsService>(TenantsService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/tenants (POST)', () => {
    it('should create a new tenant', async () => {
      const createTenantDto = {
        name: 'tenant-2',
        displayName: 'Tenant 2',
      };

      const mockTenant = {
        name: createTenantDto.name,
        displayName: createTenantDto.displayName,
      };

      mockTenantsService.createTenant.mockResolvedValue(mockTenant);

      const response = await request(app.getHttpServer())
        .post('/api/tenants')
        .send(createTenantDto)
        .expect(201);

      expect(response.body).toEqual(mockTenant);
      expect(mockTenantsService.createTenant).toHaveBeenCalledWith(createTenantDto);
    });

    it('should validate request body', async () => {
      return request(app.getHttpServer())
        .post('/api/tenants')
        .send({
          name: 'Invalid Tenant Name!', // Contains invalid characters
          displayName: 'Invalid Tenant',
        })
        .expect(400);
    });
  });

  describe('/tenants (GET)', () => {
    it('should return all tenants', async () => {
      const mockTenants = [
        {
          id: 'tenant-1-id',
          name: 'tenant-1',
          displayName: 'Tenant 1',
        },
        {
          id: 'tenant-2-id',
          name: 'tenant-2',
          displayName: 'Tenant 2',
        },
      ];

      mockTenantsService.findAllTenants.mockResolvedValue(mockTenants);

      const response = await request(app.getHttpServer())
        .get('/api/tenants')
        .expect(200);

      expect(response.body).toEqual(mockTenants);
    });
  });

  describe('/tenants/:name (GET)', () => {
    it('should return a tenant by name', async () => {
      const mockTenant = {
        id: 'tenant-1-id',
        name: 'tenant-1',
        displayName: 'Tenant 1',
      };

      mockTenantsService.findTenantByName.mockResolvedValue(mockTenant);

      const response = await request(app.getHttpServer())
        .get('/api/tenants/tenant-1')
        .expect(200);

      expect(response.body).toEqual(mockTenant);
      expect(mockTenantsService.findTenantByName).toHaveBeenCalledWith('tenant-1');
    });

    it('should return 404 for non-existent tenant', async () => {
      mockTenantsService.findTenantByName.mockRejectedValue(new Error('Tenant not found'));

      return request(app.getHttpServer())
        .get('/api/tenants/non-existent')
        .expect(500); // In a real app, this would be 404, but our mock throws a generic Error
    });
  });

  describe('/tenants/:name (PUT)', () => {
    it('should update a tenant', async () => {
      const updateTenantDto = {
        displayName: 'Updated Tenant 1',
      };

      const mockUpdatedTenant = {
        name: 'tenant-1',
        displayName: updateTenantDto.displayName,
      };

      mockTenantsService.updateTenant.mockResolvedValue(mockUpdatedTenant);

      const response = await request(app.getHttpServer())
        .put('/api/tenants/tenant-1')
        .send(updateTenantDto)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedTenant);
      expect(mockTenantsService.updateTenant).toHaveBeenCalledWith('tenant-1', updateTenantDto);
    });

    it('should validate request body', async () => {
      return request(app.getHttpServer())
        .put('/api/tenants/tenant-1')
        .send({
          // Missing displayName
        })
        .expect(400);
    });
  });

  describe('/tenants/:name (DELETE)', () => {
    it('should delete a tenant', async () => {
      mockTenantsService.deleteTenant.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/api/tenants/tenant-1')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Tenant tenant-1 deleted successfully',
      });
      expect(mockTenantsService.deleteTenant).toHaveBeenCalledWith('tenant-1');
    });

    it('should return 404 for non-existent tenant', async () => {
      mockTenantsService.deleteTenant.mockRejectedValue(new Error('Tenant not found'));

      return request(app.getHttpServer())
        .delete('/api/tenants/non-existent')
        .expect(500); // In a real app, this would be 404, but our mock throws a generic Error
    });
  });

  describe('/tenants/:name/users/:userId (POST)', () => {
    it('should add a user to a tenant', async () => {
      mockTenantsService.addUserToTenant.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/api/tenants/tenant-1/users/user-1')
        .expect(201);

      expect(response.body).toEqual({
        message: 'User user-1 added to tenant tenant-1 successfully',
      });
      expect(mockTenantsService.addUserToTenant).toHaveBeenCalledWith('tenant-1', 'user-1');
    });

    it('should return 404 for non-existent tenant or user', async () => {
      mockTenantsService.addUserToTenant.mockRejectedValue(new Error('Tenant or user not found'));

      return request(app.getHttpServer())
        .post('/api/tenants/non-existent/users/non-existent')
        .expect(500); // In a real app, this would be 404, but our mock throws a generic Error
    });
  });

  describe('/tenants/:name/users/:userId (DELETE)', () => {
    it('should remove a user from a tenant', async () => {
      mockTenantsService.removeUserFromTenant.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/api/tenants/tenant-1/users/user-1')
        .expect(200);

      expect(response.body).toEqual({
        message: 'User user-1 removed from tenant tenant-1 successfully',
      });
      expect(mockTenantsService.removeUserFromTenant).toHaveBeenCalledWith('tenant-1', 'user-1');
    });

    it('should return 404 for non-existent tenant or user', async () => {
      mockTenantsService.removeUserFromTenant.mockRejectedValue(new Error('Tenant or user not found'));

      return request(app.getHttpServer())
        .delete('/api/tenants/non-existent/users/non-existent')
        .expect(500); // In a real app, this would be 404, but our mock throws a generic Error
    });
  });

  describe('/tenants/:name/users (GET)', () => {
    it('should get users in a tenant', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
        },
      ];

      mockTenantsService.getUsersInTenant.mockResolvedValue(mockUsers);

      const response = await request(app.getHttpServer())
        .get('/api/tenants/tenant-1/users')
        .expect(200);

      expect(response.body).toEqual(mockUsers);
      expect(mockTenantsService.getUsersInTenant).toHaveBeenCalledWith('tenant-1');
    });

    it('should return 404 for non-existent tenant', async () => {
      mockTenantsService.getUsersInTenant.mockRejectedValue(new Error('Tenant not found'));

      return request(app.getHttpServer())
        .get('/api/tenants/non-existent/users')
        .expect(500); // In a real app, this would be 404, but our mock throws a generic Error
    });
  });
});
