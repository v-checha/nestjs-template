/**
 * User fixtures for tests
 */

export const userFixtures = {
  users: {
    validUser: () => ({
      id: { getValue: () => '550e8400-e29b-41d4-a716-446655440000' },
      email: {
        getValue: () => 'test@example.com',
      },
      firstName: {
        getValue: () => 'Test',
      },
      lastName: {
        getValue: () => 'User',
      },
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      isActive: true,
      lastLoginAt: new Date(),
      twoFactorEnabled: false,
      roles: [{ id: '2', name: 'user', description: 'Regular user', permissions: [] }],
      getPermissions: () => ['user:read'],
      getRoleNames: () => ['user'],
      hasPermission: () => true,
      hasRole: () => true,
      updateLastLogin: jest.fn(),
      addRole: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      changeEmail: jest.fn(),
      isEligibleForAdminRole: jest.fn().mockReturnValue(true),
    }),
    adminUser: () => ({
      id: { getValue: () => '550e8400-e29b-41d4-a716-446655440001' },
      email: {
        getValue: () => 'admin@example.com',
      },
      firstName: {
        getValue: () => 'Admin',
      },
      lastName: {
        getValue: () => 'User',
      },
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      isActive: true,
      lastLoginAt: new Date(),
      twoFactorEnabled: false,
      roles: [{ id: '1', name: 'admin', description: 'Administrator', permissions: [] }],
      getPermissions: () => ['user:read', 'user:write', 'user:delete', 'role:read', 'role:write'],
      getRoleNames: () => ['admin'],
      hasPermission: () => true,
      hasRole: () => true,
      updateLastLogin: jest.fn(),
      addRole: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      changeEmail: jest.fn(),
      isEligibleForAdminRole: jest.fn().mockReturnValue(true),
    }),
    inactiveUser: () => ({
      id: { getValue: () => '550e8400-e29b-41d4-a716-446655440002' },
      email: {
        getValue: () => 'inactive@example.com',
      },
      firstName: {
        getValue: () => 'Inactive',
      },
      lastName: {
        getValue: () => 'User',
      },
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      isActive: false,
      lastLoginAt: null,
      twoFactorEnabled: false,
      roles: [],
      getPermissions: () => [],
      getRoleNames: () => [],
      hasPermission: () => false,
      hasRole: () => false,
      updateLastLogin: jest.fn(),
      addRole: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      changeEmail: jest.fn(),
      isEligibleForAdminRole: jest.fn().mockReturnValue(true),
    }),
  },

  roles: {
    adminRole: () => ({
      id: '1',
      name: 'admin',
      description: 'Administrator role',
      isDefault: false,
      permissions: [
        { id: '1', name: 'user:read' },
        { id: '2', name: 'user:write' },
        { id: '3', name: 'user:delete' },
        { id: '4', name: 'role:read' },
        { id: '5', name: 'role:write' },
      ],
      isAdminRole: jest.fn().mockReturnValue(true),
    }),
    userRole: () => ({
      id: '2',
      name: 'user',
      description: 'Regular user role',
      isDefault: true,
      permissions: [{ id: '1', name: 'user:read' }],
      isAdminRole: jest.fn().mockReturnValue(false),
    }),
  },

  permissions: {
    userRead: { id: '1', name: 'user:read' },
    userWrite: { id: '2', name: 'user:write' },
    userDelete: { id: '3', name: 'user:delete' },
    roleRead: { id: '4', name: 'role:read' },
    roleWrite: { id: '5', name: 'role:write' },
    roleDelete: { id: '6', name: 'role:delete' },
  },
};

// Legacy exports for backward compatibility
export const userFixture = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  password: 'hashedPassword123!',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  roles: ['user'],
  permissions: ['user:read'],
};

export const adminFixture = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'admin@example.com',
  password: 'hashedPassword123!',
  firstName: 'Admin',
  lastName: 'User',
  isActive: true,
  roles: ['admin'],
  permissions: ['user:read', 'user:write', 'user:delete', 'role:read', 'role:write', 'role:delete'],
};
