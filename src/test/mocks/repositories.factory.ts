/**
 * Factory functions for repository mocks to be used in tests
 */

import {
  mockUserRepository,
  mockRoleRepository,
  mockRefreshTokenRepository,
  mockOtpRepository,
  mockEmailVerificationRepository,
  mockPasswordResetRepository,
  mockPermissionRepository,
} from './repositories.mock';

/**
 * Create a fresh mock user repository for testing
 */
export const createMockUserRepository = () => ({
  ...mockUserRepository,
  findById: jest.fn().mockImplementation(mockUserRepository.findById),
  findByEmail: jest.fn().mockImplementation(mockUserRepository.findByEmail),
  create: jest.fn().mockImplementation((userData) => {
    return Promise.resolve({
      id: '550e8400-e29b-41d4-a716-446655440099',
      ...userData,
      email: {
        getValue: () => userData.email,
      },
      firstName: {
        getValue: () => userData.firstName,
      },
      lastName: {
        getValue: () => userData.lastName,
      },
      roles: ['user'],
      isActive: true,
      addRole: jest.fn(),
      updateLastLogin: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
    });
  }),
  update: jest.fn().mockImplementation((user) => {
    return Promise.resolve({
      ...user,
      email: user.email || { getValue: () => 'updated@example.com' },
      firstName: user.firstName || { getValue: () => 'Updated' },
      lastName: user.lastName || { getValue: () => 'User' },
      isActive: typeof user.isActive === 'boolean' ? user.isActive : true,
      lastLoginAt: new Date(),
      passwordHash: user.passwordHash || 'hashedPassword',
    });
  }),
  findAll: jest.fn().mockImplementation(mockUserRepository.findAll),
  delete: jest.fn().mockResolvedValue(true),
});

/**
 * Create a fresh mock role repository for testing
 */
export const createMockRoleRepository = () => ({
  ...mockRoleRepository,
  findById: jest.fn().mockImplementation(mockRoleRepository.findById),
  findByName: jest.fn().mockImplementation(mockRoleRepository.findByName),
  findDefaultRole: jest.fn().mockImplementation(mockRoleRepository.findDefault),
  findAll: jest.fn().mockImplementation(mockRoleRepository.findAll),
  create: jest.fn().mockImplementation(mockRoleRepository.create),
  update: jest.fn().mockImplementation(mockRoleRepository.update),
  delete: jest.fn().mockImplementation(mockRoleRepository.delete),
});

/**
 * Create a fresh mock refresh token repository for testing
 */
export const createMockRefreshTokenRepository = () => ({
  ...mockRefreshTokenRepository,
  findByToken: jest.fn().mockImplementation(mockRefreshTokenRepository.findByToken),
  create: jest.fn().mockImplementation(mockRefreshTokenRepository.create),
  deleteByUserId: jest.fn().mockImplementation(mockRefreshTokenRepository.deleteByUserId),
  deleteByToken: jest.fn().mockImplementation(mockRefreshTokenRepository.deleteByToken),
  deleteExpired: jest.fn().mockResolvedValue(true),
});

/**
 * Create a fresh mock OTP repository for testing
 */
export const createMockOtpRepository = () => ({
  ...mockOtpRepository,
  findByUserId: jest.fn().mockImplementation(mockOtpRepository.findByUserId),
  create: jest.fn().mockImplementation(mockOtpRepository.create),
  update: jest.fn().mockImplementation(mockOtpRepository.update),
  delete: jest.fn().mockImplementation(mockOtpRepository.delete),
});

/**
 * Create a fresh mock email verification repository for testing
 */
export const createMockEmailVerificationRepository = () => ({
  ...mockEmailVerificationRepository,
  findByEmail: jest.fn().mockImplementation(mockEmailVerificationRepository.findByEmail),
  findByEmailAndCode: jest.fn().mockImplementation((email, code) => {
    if (email === 'test@example.com' && code === '123456') {
      return Promise.resolve({
        id: '1',
        email: 'test@example.com',
        code: '123456',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verified: false,
      });
    }

    return Promise.resolve(null);
  }),
  create: jest.fn().mockImplementation(mockEmailVerificationRepository.create),
  update: jest.fn().mockImplementation(mockEmailVerificationRepository.update),
  deleteByEmail: jest.fn().mockResolvedValue(true),
  deleteExpired: jest.fn().mockResolvedValue(true),
});

/**
 * Create a fresh mock password reset repository for testing
 */
export const createMockPasswordResetRepository = () => ({
  ...mockPasswordResetRepository,
  findByToken: jest.fn().mockImplementation(mockPasswordResetRepository.findByToken),
  create: jest.fn().mockImplementation(mockPasswordResetRepository.create),
  update: jest.fn().mockImplementation(mockPasswordResetRepository.update),
  deleteByEmail: jest.fn().mockResolvedValue(true),
  deleteExpired: jest.fn().mockResolvedValue(true),
});

/**
 * Create a fresh mock permission repository for testing
 */
export const createMockPermissionRepository = () => ({
  ...mockPermissionRepository,
  findById: jest.fn().mockImplementation(mockPermissionRepository.findById),
  findByName: jest.fn().mockImplementation(mockPermissionRepository.findByName),
  findAll: jest.fn().mockImplementation(mockPermissionRepository.findAll),
});
