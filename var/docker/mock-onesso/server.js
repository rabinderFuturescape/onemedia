const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3002;
const JWT_SECRET = 'mock-onesso-jwt-secret';

// Middleware
app.use(cors({
  origin: ['http://localhost:5003', 'http://localhost:3000', 'http://localhost:4200'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mock databases
const users = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin',
    roles: ['admin'],
    tenants: ['default', 'tenant1']
  },
  {
    id: '2',
    username: 'user',
    email: 'user@example.com',
    password: 'user',
    roles: ['user'],
    tenants: ['default']
  },
  {
    id: '3',
    username: 'tenant1admin',
    email: 'tenant1admin@example.com',
    password: 'password',
    roles: ['tenant_admin'],
    tenants: ['tenant1']
  }
];

const tenants = [
  {
    id: 'default',
    name: 'Default Tenant',
    description: 'Default tenant for all users',
    features: ['basic'],
    settings: {
      theme: 'light',
      language: 'en'
    }
  },
  {
    id: 'tenant1',
    name: 'Tenant 1',
    description: 'First custom tenant',
    features: ['basic', 'advanced'],
    settings: {
      theme: 'dark',
      language: 'en'
    }
  }
];

const roles = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'System administrator with full access',
    permissions: ['*']
  },
  {
    id: 'user',
    name: 'User',
    description: 'Regular user with limited access',
    permissions: ['read:profile', 'update:profile']
  },
  {
    id: 'tenant_admin',
    name: 'Tenant Administrator',
    description: 'Administrator for a specific tenant',
    permissions: ['read:tenant', 'update:tenant', 'read:users', 'update:users']
  }
];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'mock-onesso',
    version: '1.0.0'
  });
});

// Register routers
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'Mock onesso API',
      version: '1.0.0',
      description: 'A mock API for testing onesso integration'
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check endpoint',
          responses: {
            '200': {
              description: 'Service health information'
            }
          }
        }
      },
      '/api/auth/login': {
        post: {
          summary: 'Login endpoint',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: {
                      type: 'string'
                    },
                    password: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful'
            },
            '401': {
              description: 'Invalid credentials'
            }
          }
        }
      },
      '/api/tenants': {
        get: {
          summary: 'Get all tenants',
          responses: {
            '200': {
              description: 'List of tenants'
            }
          }
        },
        post: {
          summary: 'Create a new tenant',
          responses: {
            '201': {
              description: 'Tenant created successfully'
            },
            '400': {
              description: 'Invalid tenant data'
            }
          }
        }
      },
      '/api/tenants/{id}': {
        get: {
          summary: 'Get tenant by ID',
          responses: {
            '200': {
              description: 'Tenant details'
            },
            '404': {
              description: 'Tenant not found'
            }
          }
        },
        put: {
          summary: 'Update tenant',
          responses: {
            '200': {
              description: 'Tenant updated successfully'
            },
            '404': {
              description: 'Tenant not found'
            }
          }
        },
        delete: {
          summary: 'Delete tenant',
          responses: {
            '204': {
              description: 'Tenant deleted successfully'
            },
            '404': {
              description: 'Tenant not found'
            }
          }
        }
      },
      '/api/roles': {
        get: {
          summary: 'Get all roles',
          responses: {
            '200': {
              description: 'List of roles'
            }
          }
        }
      },
      '/api/users': {
        get: {
          summary: 'Get all users',
          responses: {
            '200': {
              description: 'List of users'
            }
          }
        }
      }
    }
  });
});

// Auth endpoints
const authRouter = express.Router();

// Login endpoint
authRouter.post('/login', (req, res) => {
  const { username, password, tenant_id } = req.body;

  const user = users.find(u =>
    (u.username === username || u.email === username) &&
    u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // If tenant_id is specified, check if user has access to this tenant
  if (tenant_id && !user.tenants.includes(tenant_id)) {
    return res.status(403).json({ message: 'User does not have access to this tenant' });
  }

  // Get user's roles
  const userRoles = user.roles;

  // Get user's tenants with details
  const userTenants = tenants.filter(tenant => user.tenants.includes(tenant.id));

  // Get permissions for user's roles
  const userPermissions = [];
  userRoles.forEach(roleId => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      if (role.permissions.includes('*')) {
        userPermissions.push('*');
      } else {
        userPermissions.push(...role.permissions);
      }
    }
  });

  // Remove duplicates from permissions
  const uniquePermissions = [...new Set(userPermissions)];

  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      tenants: user.tenants,
      permissions: uniquePermissions,
      // If tenant_id is specified, set it as the active tenant
      active_tenant: tenant_id || user.tenants[0]
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    access_token: token,
    token_type: 'Bearer',
    expires_in: 3600,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: userRoles,
      tenants: user.tenants,
      permissions: uniquePermissions,
      active_tenant: tenant_id || user.tenants[0],
      tenant_details: userTenants
    }
  });
});

// Mock onesso login flow
authRouter.get('/login/onesso', (req, res) => {
  // Get tenant_id from query parameter if provided
  const tenant_id = req.query.tenant_id;

  // Get user (using admin by default)
  const user = users.find(u => u.id === '1');

  // If tenant_id is specified, check if user has access to this tenant
  if (tenant_id && !user.tenants.includes(tenant_id)) {
    return res.status(403).json({ message: 'User does not have access to this tenant' });
  }

  // Get user's roles
  const userRoles = user.roles;

  // Get user's tenants with details
  const userTenants = tenants.filter(tenant => user.tenants.includes(tenant.id));

  // Get permissions for user's roles
  const userPermissions = [];
  userRoles.forEach(roleId => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      if (role.permissions.includes('*')) {
        userPermissions.push('*');
      } else {
        userPermissions.push(...role.permissions);
      }
    }
  });

  // Remove duplicates from permissions
  const uniquePermissions = [...new Set(userPermissions)];

  // Create token
  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      tenants: user.tenants,
      permissions: uniquePermissions,
      // If tenant_id is specified, set it as the active tenant
      active_tenant: tenant_id || user.tenants[0]
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Get redirect URL from query parameter or use default
  const redirect_url = req.query.redirect_url || 'http://localhost:5003';

  // Redirect back to the frontend with the token
  res.redirect(`${redirect_url}?token=${token}`);
});

// User info endpoint
authRouter.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user's tenants with details
    const userTenants = tenants.filter(tenant => decoded.tenants.includes(tenant.id));

    // Get user's roles with details
    const userRolesDetails = roles.filter(role => decoded.roles.includes(role.id));

    res.json({
      id: decoded.sub,
      username: decoded.username,
      email: decoded.email,
      roles: decoded.roles,
      tenants: decoded.tenants,
      permissions: decoded.permissions || [],
      active_tenant: decoded.active_tenant || decoded.tenants[0],
      tenant_details: userTenants,
      role_details: userRolesDetails
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Add default permissions to roles
roles.forEach(role => {
  if (role.id === 'admin') {
    role.permissions = ['*'];
  } else if (role.id === 'user') {
    role.permissions = ['read:profile', 'update:profile'];
  } else if (role.id === 'tenant_admin') {
    role.permissions = ['read:tenant', 'update:tenant', 'read:users', 'update:users'];
  }
});

// Authorization middleware
const authorize = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user roles
    const userRoles = req.user.roles || [];

    // Get permissions for these roles
    let userPermissions = [];

    // Check if user has admin role (which has all permissions)
    if (userRoles.includes('admin')) {
      return next();
    }

    // Get permissions for each role
    userRoles.forEach(roleId => {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        // If role has wildcard permission, allow all
        if (role.permissions.includes('*')) {
          userPermissions = ['*'];
          return;
        }

        // Add role permissions to user permissions
        userPermissions = [...userPermissions, ...role.permissions];
      }
    });

    // Check if user has required permissions
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      userPermissions.includes('*') || userPermissions.includes(permission)
    );

    if (hasRequiredPermissions) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden' });
  };
};

// Define API routes
const apiRouter = express.Router();

// Tenant endpoints
apiRouter.get('/tenants', authenticateToken, (req, res) => {
  // If user is not admin, filter tenants to only those the user has access to
  if (!req.user.roles.includes('admin')) {
    const userTenants = req.user.tenants || [];
    const filteredTenants = tenants.filter(tenant => userTenants.includes(tenant.id));
    return res.json(filteredTenants);
  }

  res.json(tenants);
});

apiRouter.post('/tenants', authenticateToken, authorize(['create:tenant']), (req, res) => {
  const { id, name, description, features, settings } = req.body;

  if (!id || !name) {
    return res.status(400).json({ message: 'Tenant ID and name are required' });
  }

  // Check if tenant already exists
  if (tenants.some(tenant => tenant.id === id)) {
    return res.status(400).json({ message: 'Tenant with this ID already exists' });
  }

  const newTenant = {
    id,
    name,
    description: description || '',
    features: features || ['basic'],
    settings: settings || { theme: 'light', language: 'en' }
  };

  tenants.push(newTenant);

  res.status(201).json(newTenant);
});

apiRouter.get('/tenants/:id', authenticateToken, authorize(['read:tenant']), (req, res) => {
  const { id } = req.params;

  // Check if user has access to this tenant
  if (!req.user.roles.includes('admin') && !req.user.tenants.includes(id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const tenant = tenants.find(tenant => tenant.id === id);

  if (!tenant) {
    return res.status(404).json({ message: 'Tenant not found' });
  }

  res.json(tenant);
});

apiRouter.put('/tenants/:id', authenticateToken, authorize(['update:tenant']), (req, res) => {
  const { id } = req.params;
  const { name, description, features, settings } = req.body;

  // Check if user has access to this tenant
  if (!req.user.roles.includes('admin') && !req.user.tenants.includes(id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const tenantIndex = tenants.findIndex(tenant => tenant.id === id);

  if (tenantIndex === -1) {
    return res.status(404).json({ message: 'Tenant not found' });
  }

  const updatedTenant = {
    ...tenants[tenantIndex],
    name: name || tenants[tenantIndex].name,
    description: description !== undefined ? description : tenants[tenantIndex].description,
    features: features || tenants[tenantIndex].features,
    settings: settings ? { ...tenants[tenantIndex].settings, ...settings } : tenants[tenantIndex].settings
  };

  tenants[tenantIndex] = updatedTenant;

  res.json(updatedTenant);
});

apiRouter.delete('/tenants/:id', authenticateToken, authorize(['delete:tenant']), (req, res) => {
  const { id } = req.params;

  // Prevent deletion of default tenant
  if (id === 'default') {
    return res.status(400).json({ message: 'Cannot delete default tenant' });
  }

  const tenantIndex = tenants.findIndex(tenant => tenant.id === id);

  if (tenantIndex === -1) {
    return res.status(404).json({ message: 'Tenant not found' });
  }

  tenants.splice(tenantIndex, 1);

  res.status(204).send();
});

// Role endpoints
apiRouter.get('/roles', authenticateToken, (req, res) => {
  res.json(roles);
});

// User endpoints
apiRouter.get('/users', authenticateToken, (req, res) => {
  // If user is not admin, filter users to only those in the same tenants
  if (!req.user.roles.includes('admin')) {
    const userTenants = req.user.tenants || [];

    const filteredUsers = users.filter(user => {
      // Check if user has any tenant in common with the requester
      return user.tenants.some(tenant => userTenants.includes(tenant));
    }).map(user => {
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return res.json(filteredUsers);
  }

  // For admins, return all users without passwords
  const usersWithoutPasswords = users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  res.json(usersWithoutPasswords);
});

// Log all registered routes
console.log('Registered routes:');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(`${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock onesso service running on port ${PORT}`);
});
