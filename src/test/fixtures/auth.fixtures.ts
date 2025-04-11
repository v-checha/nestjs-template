/**
 * Authentication test fixtures
 */

export const authFixtures = {
  users: {
    validUser: () => ({
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
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
    }),
    adminUser: () => ({
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
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
    }),
    inactiveUser: () => ({
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'inactive@example.com',
      firstName: 'Inactive',
      lastName: 'User',
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
    }),
    twoFactorEnabledUser: () => ({
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: '2fa@example.com',
      firstName: '2FA',
      lastName: 'User',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      isActive: true,
      lastLoginAt: new Date(),
      twoFactorEnabled: true,
      roles: [{ id: '2', name: 'user', description: 'Regular user', permissions: [] }],
      getPermissions: () => ['user:read'],
      getRoleNames: () => ['user'],
      hasPermission: () => true,
      hasRole: () => true,
      updateLastLogin: jest.fn(),
    }),
  },

  refreshTokens: {
    validToken: () => ({
      id: '1',
      token: '550e8400-e29b-41d4-a716-446655440000',
      userId: { getValue: () => '550e8400-e29b-41d4-a716-446655440000' },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      revokedAt: null,
      createdAt: new Date(),
      isExpired: () => false,
      isRevoked: () => false,
      revoke: jest.fn(),
    }),
    expiredToken: () => ({
      id: '2',
      token: '550e8400-e29b-41d4-a716-446655440001',
      userId: { getValue: () => '550e8400-e29b-41d4-a716-446655440000' },
      expiresAt: new Date(Date.now() - 1000), // Expired
      revokedAt: null,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isExpired: () => true,
      isRevoked: () => false,
      revoke: jest.fn(),
    }),
    revokedToken: () => ({
      id: '3',
      token: '550e8400-e29b-41d4-a716-446655440002',
      userId: { getValue: () => '550e8400-e29b-41d4-a716-446655440000' },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: new Date(), // Revoked
      createdAt: new Date(),
      isExpired: () => false,
      isRevoked: () => true,
      revoke: jest.fn(),
    }),
  },

  emailVerifications: {
    validVerification: () => ({
      id: '1',
      email: 'test@example.com',
      code: '123456',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      verified: false,
      createdAt: new Date(),
      isExpired: () => false,
      isVerified: () => false,
      markAsVerified: jest.fn(),
    }),
    expiredVerification: () => ({
      id: '2',
      email: 'expired@example.com',
      code: '654321',
      expiresAt: new Date(Date.now() - 1000), // Expired
      verified: false,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      isExpired: () => true,
      isVerified: () => false,
      markAsVerified: jest.fn(),
    }),
    verifiedVerification: () => ({
      id: '3',
      email: 'verified@example.com',
      code: '123456',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      verified: true,
      createdAt: new Date(),
      isExpired: () => false,
      isVerified: () => true,
      markAsVerified: jest.fn(),
    }),
  },

  passwordResets: {
    validReset: () => ({
      id: '1',
      token: 'reset-token-123',
      email: 'test@example.com',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      usedAt: null,
      createdAt: new Date(),
    }),
    expiredReset: () => ({
      id: '2',
      token: 'expired-token-123',
      email: 'test@example.com',
      expiresAt: new Date(Date.now() - 1000), // Expired
      usedAt: null,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    }),
    usedReset: () => ({
      id: '3',
      token: 'used-token-123',
      email: 'test@example.com',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      usedAt: new Date(), // Already used
      createdAt: new Date(),
    }),
  },

  otp: {
    validOtp: () => ({
      id: '1',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      secret: 'AAABBBCCCDDDEEEFFFGGG',
      isVerified: true,
      createdAt: new Date(),
    }),
    unverifiedOtp: () => ({
      id: '2',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      secret: 'UNVERIFIEDSECRETKEYYYY',
      isVerified: false,
      createdAt: new Date(),
    }),
  },

  tokens: {
    accessToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJ1c2VyIl0sInBlcm1pc3Npb25zIjpbInVzZXI6cmVhZCJdLCJpYXQiOjE2OTgwMDAwMDAsImV4cCI6MTY5ODAwMzYwMH0.mJN5dCwhA9GjQvdS8vnKKlvsCmkFjKK91LEDx1wUuO4',
    refreshToken: '550e8400-e29b-41d4-a716-446655440000',
  },
};
