import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';

// Mocks
import {
  createMockUserRepository,
  createMockRoleRepository,
} from '../../test/mocks/repositories.factory';
import { DomainValidationService, ValidationResult } from './domain-validation.service';

// Tokens
import { USER_REPOSITORY, ROLE_REPOSITORY } from '@shared/constants/tokens';

// Fixtures
import { userFixtures } from '../../test/fixtures/user.fixtures';

// Exceptions
import {
  EntityNotFoundException,
  EntityAlreadyExistsException,
  AuthenticationException,
  InvalidValueObjectException,
} from '@core/exceptions/domain-exceptions';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mockedSalt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock DomainValidationService
const createMockDomainValidationService = () => ({
  validatePasswordComplexity: jest.fn().mockReturnValue({
    isValid: true,
    throwIfInvalid: jest.fn(),
  }),
  validateRoleAssignment: jest.fn().mockReturnValue({
    isValid: true,
    throwIfInvalid: jest.fn(),
  }),
});

describe('UserService', () => {
  let service: UserService;
  let userRepository;
  let roleRepository;
  let domainValidationService;

  beforeEach(async () => {
    // Create fresh mocks for each test
    userRepository = createMockUserRepository();
    roleRepository = createMockRoleRepository();
    domainValidationService = createMockDomainValidationService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: USER_REPOSITORY, useValue: userRepository },
        { provide: ROLE_REPOSITORY, useValue: roleRepository },
        { provide: DomainValidationService, useValue: domainValidationService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user with default role', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'StrongPass123!';
      const firstName = 'John';
      const lastName = 'Doe';

      userRepository.findByEmail.mockResolvedValue(null); // No existing user
      roleRepository.findDefaultRole.mockResolvedValue(userFixtures.roles.userRole());
      userRepository.create.mockImplementationOnce(() => {
        return Promise.resolve({
          id: '550e8400-e29b-41d4-a716-446655440099',
          email: { getValue: () => email },
          firstName: { getValue: () => firstName },
          lastName: { getValue: () => lastName },
          passwordHash: 'hashedPassword',
          roles: [{ id: '2', name: 'user' }],
          isActive: true,
        });
      });

      // Act
      const result = await service.createUser(email, password, firstName, lastName);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(roleRepository.findDefaultRole).toHaveBeenCalled();
      expect(userRepository.create).toHaveBeenCalled();
      expect(result.email.getValue()).toBe(email);
      expect(result.firstName.getValue()).toBe(firstName);
      expect(result.lastName.getValue()).toBe(lastName);
      expect(result.passwordHash).toBe('hashedPassword');
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('user');
    });

    it('should create a user without default role if none exists', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'StrongPass123!';
      const firstName = 'John';
      const lastName = 'Doe';

      userRepository.findByEmail.mockResolvedValue(null); // No existing user
      roleRepository.findDefaultRole.mockResolvedValue(null); // No default role
      userRepository.create.mockImplementationOnce(() => {
        return Promise.resolve({
          id: '550e8400-e29b-41d4-a716-446655440099',
          email: { getValue: () => email },
          firstName: { getValue: () => firstName },
          lastName: { getValue: () => lastName },
          passwordHash: 'hashedPassword',
          roles: [], // No roles
          isActive: true,
        });
      });

      // Act
      const result = await service.createUser(email, password, firstName, lastName);

      // Assert
      expect(roleRepository.findDefaultRole).toHaveBeenCalled();
      expect(userRepository.create).toHaveBeenCalled();
      expect(result.roles).toHaveLength(0);
    });

    it('should throw EntityAlreadyExistsException if email is already in use', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'StrongPass123!';
      const firstName = 'John';
      const lastName = 'Doe';

      userRepository.findByEmail.mockResolvedValue(userFixtures.users.validUser());

      // Act & Assert
      await expect(service.createUser(email, password, firstName, lastName)).rejects.toThrow(
        EntityAlreadyExistsException,
      );
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InvalidValueObjectException for invalid email', async () => {
      // Arrange
      const email = 'invalid-email';
      const password = 'StrongPass123!';
      const firstName = 'John';
      const lastName = 'Doe';

      // Act & Assert
      await expect(service.createUser(email, password, firstName, lastName)).rejects.toThrow(
        InvalidValueObjectException,
      );
      expect(userRepository.findByEmail).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InvalidValueObjectException for invalid password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'weak'; // Too weak
      const firstName = 'John';
      const lastName = 'Doe';

      // Act & Assert
      await expect(service.createUser(email, password, firstName, lastName)).rejects.toThrow(
        InvalidValueObjectException,
      );
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('validateCredentials', () => {
    it('should return user for valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'StrongPass123!';
      const user = userFixtures.users.validUser();

      userRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.validateCredentials(email, password);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.passwordHash);
      expect(result).toEqual(user);
    });

    it('should return null for invalid email', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'StrongPass123!';

      userRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await service.validateCredentials(email, password);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      // Arrange
      const email = 'inactive@example.com';
      const password = 'StrongPass123!';
      const inactiveUser = userFixtures.users.inactiveUser();

      userRepository.findByEmail.mockResolvedValue(inactiveUser);

      // Act
      const result = await service.validateCredentials(email, password);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null for incorrect password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'WrongPassword123!';
      const user = userFixtures.users.validUser();

      userRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await service.validateCredentials(email, password);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.passwordHash);
      expect(result).toBeNull();
    });

    it('should return null for invalid email format without throwing', async () => {
      // Arrange
      const email = 'invalid-email';
      const password = 'StrongPass123!';

      // Act
      const result = await service.validateCredentials(email, password);

      // Assert
      expect(userRepository.findByEmail).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('updateUserDetails', () => {
    it('should update user details', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const newFirstName = 'Jane';
      const newLastName = 'Smith';
      const newEmail = 'jane.smith@example.com';
      const user = userFixtures.users.validUser();

      userRepository.findById.mockResolvedValue(user);
      userRepository.findByEmail.mockResolvedValue(null); // Email not in use

      // Mock the repository update to return updated user
      const updatedUser = {
        ...user,
        firstName: { getValue: () => newFirstName },
        lastName: { getValue: () => newLastName },
        email: { getValue: () => newEmail },
      };
      userRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateUserDetails(userId, newFirstName, newLastName, newEmail);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(newEmail);
      expect(userRepository.update).toHaveBeenCalled();
      expect(result.firstName.getValue()).toBe(newFirstName);
      expect(result.lastName.getValue()).toBe(newLastName);
      expect(result.email.getValue()).toBe(newEmail);
    });

    it('should throw EntityNotFoundException for non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-id';
      const newFirstName = 'Jane';

      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateUserDetails(userId, newFirstName)).rejects.toThrow(
        EntityNotFoundException,
      );
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should throw EntityAlreadyExistsException if new email is already in use', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const newEmail = 'existing@example.com';
      const user = userFixtures.users.validUser();
      const existingUser = {
        ...userFixtures.users.validUser(),
        id: { getValue: () => 'different-id' },
      };

      userRepository.findById.mockResolvedValue(user);
      userRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.updateUserDetails(userId, null, null, newEmail)).rejects.toThrow(
        EntityAlreadyExistsException,
      );
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(newEmail);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should allow updating to the same email', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const sameEmail = 'test@example.com';
      const user = userFixtures.users.validUser();

      userRepository.findById.mockResolvedValue(user);
      userRepository.findByEmail.mockResolvedValue(user); // Same user found

      // Act
      await service.updateUserDetails(userId, null, null, sameEmail);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(sameEmail);
      expect(userRepository.update).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password with current password verification', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const currentPassword = 'OldPass123!';
      const newPassword = 'NewPass456!';
      const user = {
        ...userFixtures.users.validUser(),
        passwordHash: 'hashedPassword',
      };

      userRepository.findById.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Current password is correct

      // Act
      const result = await service.changePassword(userId, newPassword, currentPassword);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, 'hashedPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 'mockedSalt');
      expect(userRepository.update).toHaveBeenCalled();
      expect(result.passwordHash).toBe('hashedPassword');
    });

    it('should change password without current password verification', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const newPassword = 'NewPass456!';
      const user = userFixtures.users.validUser();

      userRepository.findById.mockResolvedValue(user);

      // Act
      await service.changePassword(userId, newPassword);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 'mockedSalt');
      expect(userRepository.update).toHaveBeenCalled();
    });

    it('should throw EntityNotFoundException for non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-id';
      const newPassword = 'NewPass456!';

      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.changePassword(userId, newPassword)).rejects.toThrow(
        EntityNotFoundException,
      );
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationException if current password is incorrect', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const currentPassword = 'WrongPass123!';
      const newPassword = 'NewPass456!';
      const user = userFixtures.users.validUser();

      userRepository.findById.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Current password is incorrect

      // Act & Assert
      await expect(service.changePassword(userId, newPassword, currentPassword)).rejects.toThrow(
        AuthenticationException,
      );
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, user.passwordHash);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should throw InvalidValueObjectException for invalid new password', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const newPassword = 'weak'; // Too weak
      const user = userFixtures.users.validUser();

      userRepository.findById.mockResolvedValue(user);

      // Act & Assert
      await expect(service.changePassword(userId, newPassword)).rejects.toThrow(
        InvalidValueObjectException,
      );
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  // Testing a few more methods to cover key functionality

  describe('assignRoleToUser', () => {
    it('should assign role to user', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const roleId = '550e8400-e29b-41d4-a716-446655440001';
      const user = userFixtures.users.validUser();
      const role = userFixtures.roles.userRole();

      userRepository.findById.mockResolvedValue(user);
      roleRepository.findById.mockResolvedValue(role);
      userRepository.update.mockImplementationOnce(user => {
        return Promise.resolve({
          ...user,
          roles: [{ id: roleId, name: 'user' }],
        });
      });

      // Act
      const result = await service.assignRoleToUser(userId, roleId);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(roleRepository.findById).toHaveBeenCalledWith(roleId);
      expect(userRepository.update).toHaveBeenCalled();
      expect(result.roles).toContainEqual(expect.objectContaining({ id: roleId }));
    });
  });

  describe('activateUser and deactivateUser', () => {
    it('should activate user', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const inactiveUser = userFixtures.users.inactiveUser();

      userRepository.findById.mockResolvedValue(inactiveUser);
      userRepository.update.mockImplementationOnce(() => {
        return Promise.resolve({
          ...inactiveUser,
          isActive: true,
        });
      });

      // Act
      const result = await service.activateUser(userId);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.update).toHaveBeenCalled();
      expect(result.isActive).toBe(true);
    });

    it('should deactivate user', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const activeUser = userFixtures.users.validUser();

      userRepository.findById.mockResolvedValue(activeUser);
      userRepository.update.mockImplementationOnce(() => {
        return Promise.resolve({
          ...activeUser,
          isActive: false,
        });
      });

      // Act
      const result = await service.deactivateUser(userId);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.update).toHaveBeenCalled();
      expect(result.isActive).toBe(false);
    });
  });
});
