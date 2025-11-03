/**
 * Mock implementations for repositories used in tests
 */

import { userFixture, adminFixture } from '../fixtures/user.fixtures';

// Mock User Repository
export const mockUserRepository = {
  findById: jest.fn().mockImplementation((id) => {
    if (id === userFixture.id) {
      return Promise.resolve(userFixture);
    } else if (id === adminFixture.id) {
      return Promise.resolve(adminFixture);
    }

    return Promise.resolve(null);
  }),

  findByEmail: jest.fn().mockImplementation((email) => {
    if (email === userFixture.email) {
      return Promise.resolve(userFixture);
    } else if (email === adminFixture.email) {
      return Promise.resolve(adminFixture);
    }

    return Promise.resolve(null);
  }),

  create: jest.fn().mockImplementation((userData) => {
    return Promise.resolve({
      id: '550e8400-e29b-41d4-a716-446655440099',
      ...userData,
      roles: ['user'],
      permissions: ['user:read'],
      isActive: true,
    });
  }),

  update: jest.fn().mockImplementation((id, userData) => {
    return Promise.resolve({
      ...(id === userFixture.id ? userFixture : adminFixture),
      ...userData,
    });
  }),

  findAll: jest.fn().mockResolvedValue([userFixture, adminFixture]),
};

// Mock Role Repository
export const mockRoleRepository = {
  findById: jest.fn().mockImplementation((id) => {
    if (id === '1') {
      return Promise.resolve({
        id: '1',
        name: 'admin',
        description: 'Administrator role',
        isDefault: false,
        permissions: [
          { id: '1', name: 'user:read' },
          { id: '2', name: 'user:write' },
          { id: '3', name: 'user:delete' },
        ],
      });
    } else if (id === '2') {
      return Promise.resolve({
        id: '2',
        name: 'user',
        description: 'Regular user role',
        isDefault: true,
        permissions: [{ id: '1', name: 'user:read' }],
      });
    }

    return Promise.resolve(null);
  }),

  findByName: jest.fn().mockImplementation((name) => {
    if (name === 'admin') {
      return Promise.resolve({
        id: '1',
        name: 'admin',
        description: 'Administrator role',
        isDefault: false,
        permissions: [
          { id: '1', name: 'user:read' },
          { id: '2', name: 'user:write' },
          { id: '3', name: 'user:delete' },
        ],
      });
    } else if (name === 'user') {
      return Promise.resolve({
        id: '2',
        name: 'user',
        description: 'Regular user role',
        isDefault: true,
        permissions: [{ id: '1', name: 'user:read' }],
      });
    }

    return Promise.resolve(null);
  }),

  findDefault: jest.fn().mockResolvedValue({
    id: '2',
    name: 'user',
    description: 'Regular user role',
    isDefault: true,
    permissions: [{ id: '1', name: 'user:read' }],
  }),

  findAll: jest.fn().mockResolvedValue([
    {
      id: '1',
      name: 'admin',
      description: 'Administrator role',
      isDefault: false,
      permissions: [
        { id: '1', name: 'user:read' },
        { id: '2', name: 'user:write' },
        { id: '3', name: 'user:delete' },
      ],
    },
    {
      id: '2',
      name: 'user',
      description: 'Regular user role',
      isDefault: true,
      permissions: [{ id: '1', name: 'user:read' }],
    },
  ]),

  create: jest.fn().mockImplementation((roleData) => {
    return Promise.resolve({
      id: '3',
      ...roleData,
      permissions: [],
    });
  }),

  update: jest.fn().mockImplementation((id, roleData) => {
    const baseRole =
      id === '1'
        ? {
            id: '1',
            name: 'admin',
            description: 'Administrator role',
            isDefault: false,
            permissions: [
              { id: '1', name: 'user:read' },
              { id: '2', name: 'user:write' },
              { id: '3', name: 'user:delete' },
            ],
          }
        : {
            id: '2',
            name: 'user',
            description: 'Regular user role',
            isDefault: true,
            permissions: [{ id: '1', name: 'user:read' }],
          };

    return Promise.resolve({
      ...baseRole,
      ...roleData,
    });
  }),

  delete: jest.fn().mockResolvedValue(true),
};

// Mock Refresh Token Repository
export const mockRefreshTokenRepository = {
  findByToken: jest.fn().mockImplementation((token) => {
    if (token === '550e8400-e29b-41d4-a716-446655440000') {
      return Promise.resolve({
        id: '1',
        token: '550e8400-e29b-41d4-a716-446655440000',
        userId: userFixture.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
      });
    }

    return Promise.resolve(null);
  }),

  create: jest.fn().mockImplementation((tokenData) => {
    return Promise.resolve({
      id: '1',
      ...tokenData,
      createdAt: new Date(),
    });
  }),

  deleteByUserId: jest.fn().mockResolvedValue(true),

  deleteByToken: jest.fn().mockResolvedValue(true),
};

// Mock Permission Repository
export const mockPermissionRepository = {
  findById: jest.fn().mockImplementation((id) => {
    const permissions = {
      '1': { id: '1', name: 'user:read' },
      '2': { id: '2', name: 'user:write' },
      '3': { id: '3', name: 'user:delete' },
      '4': { id: '4', name: 'role:read' },
      '5': { id: '5', name: 'role:write' },
      '6': { id: '6', name: 'role:delete' },
    };

    return Promise.resolve(permissions[id] || null);
  }),

  findByName: jest.fn().mockImplementation((name) => {
    const permissionMapping = {
      'user:read': { id: '1', name: 'user:read' },
      'user:write': { id: '2', name: 'user:write' },
      'user:delete': { id: '3', name: 'user:delete' },
      'role:read': { id: '4', name: 'role:read' },
      'role:write': { id: '5', name: 'role:write' },
      'role:delete': { id: '6', name: 'role:delete' },
    };

    return Promise.resolve(permissionMapping[name] || null);
  }),

  findAll: jest.fn().mockResolvedValue([
    { id: '1', name: 'user:read' },
    { id: '2', name: 'user:write' },
    { id: '3', name: 'user:delete' },
    { id: '4', name: 'role:read' },
    { id: '5', name: 'role:write' },
    { id: '6', name: 'role:delete' },
  ]),
};

// Mock Email Verification Repository
export const mockEmailVerificationRepository = {
  findByEmail: jest.fn().mockImplementation((email) => {
    if (email === 'test@example.com') {
      return Promise.resolve({
        id: '1',
        email: 'test@example.com',
        code: 'ABC123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        verified: false,
      });
    }

    return Promise.resolve(null);
  }),

  create: jest.fn().mockImplementation((data) => {
    return Promise.resolve({
      id: '1',
      ...data,
      verified: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });
  }),

  update: jest.fn().mockImplementation((id, data) => {
    return Promise.resolve({
      id,
      email: 'test@example.com',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      ...data,
    });
  }),
};

// Mock OTP Repository
export const mockOtpRepository = {
  findByUserId: jest.fn().mockImplementation((userId) => {
    if (userId === userFixture.id) {
      return Promise.resolve({
        id: '1',
        userId: userFixture.id,
        secret: 'AAABBBCCCDDDEEEFFFGGG',
        isVerified: true,
      });
    }

    return Promise.resolve(null);
  }),

  create: jest.fn().mockImplementation((data) => {
    return Promise.resolve({
      id: '1',
      ...data,
      isVerified: false,
    });
  }),

  update: jest.fn().mockImplementation((id, data) => {
    return Promise.resolve({
      id,
      userId: userFixture.id,
      secret: 'AAABBBCCCDDDEEEFFFGGG',
      ...data,
    });
  }),

  delete: jest.fn().mockResolvedValue(true),
};

// Mock Password Reset Repository
export const mockPasswordResetRepository = {
  findByToken: jest.fn().mockImplementation((token) => {
    if (token === 'reset-token-123') {
      return Promise.resolve({
        id: '1',
        token: 'reset-token-123',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        usedAt: null,
      });
    }

    return Promise.resolve(null);
  }),

  create: jest.fn().mockImplementation((data) => {
    return Promise.resolve({
      id: '1',
      ...data,
      usedAt: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });
  }),

  update: jest.fn().mockImplementation((id, data) => {
    return Promise.resolve({
      id,
      token: 'reset-token-123',
      email: 'test@example.com',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      ...data,
    });
  }),
};
