import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LoginCommand, LoginCommandHandler } from './login.command';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { TokenProvider } from '@presentation/modules/auth/providers/token.provider';
import { UserMapper } from '@application/mappers/user.mapper';
import { IRoleRepository } from '@core/repositories/role.repository.interface';
import { User } from '@core/entities/user.entity';
import { Email } from '@core/value-objects/email.vo';
import { FirstName, LastName } from '@core/value-objects/name.vo';
import { Role } from '@core/entities/role.entity';
import { Permission } from '@core/entities/permission.entity';
import { ResourceAction, ActionType } from '@core/value-objects/resource-action.vo';
import { I18nService } from 'nestjs-i18n';
import { LoggerService } from '@infrastructure/logger/logger.service';
import { ROLE_REPOSITORY } from '@shared/constants/tokens';

// Mock dependencies
const mockUserService = {
  validateCredentials: jest.fn(),
};

const mockAuthService = {
  updateLastLogin: jest.fn(),
  isEmailVerified: jest.fn(),
};

const mockTokenProvider = {
  generateTokens: jest.fn(),
};

const mockRoleRepository = {
  findById: jest.fn(),
};

const mockI18nService = {
  t: jest.fn().mockImplementation((key: string) => {
    const translations: Record<string, string> = {
      'common.auth.login.failed': 'Invalid credentials',
      'common.auth.verification.email_sent': 'Email verification required',
      'common.auth.2fa.enabled': 'OTP verification required',
      'common.auth.login.success': 'Login successful',
    };

    return translations[key] || key;
  }),
};

// Mock Logger
const mockLoggerService = {
  setContext: jest.fn().mockReturnThis(),
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

// Create utility functions for test data
const createTestUser = (): User => {
  const user = User.create(
    new Email('test@example.com'),
    'hashedPassword',
    new FirstName('John'),
    new LastName('Doe'),
  );

  // Add roles
  const role = Role.fromData({
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'user',
    description: 'Regular user role',
    isDefault: true,
    permissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  user.addRole(role);

  return user;
};

const createRoleWithPermissions = (): Role => {
  const resourceAction = new ResourceAction('user', ActionType.READ);
  const permission = Permission.fromData({
    id: '550e8400-e29b-41d4-a716-446655440002',
    resourceAction,
    description: 'Can read user details',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const role = Role.fromData({
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'user',
    description: 'Regular user role',
    isDefault: true,
    permissions: [permission],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return role;
};

describe('LoginCommandHandler', () => {
  let handler: LoginCommandHandler;
  let userService: UserService;
  let authService: AuthService;
  let tokenProvider: TokenProvider;
  let roleRepository: IRoleRepository;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginCommandHandler,
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: TokenProvider, useValue: mockTokenProvider },
        { provide: ROLE_REPOSITORY, useValue: mockRoleRepository },
        { provide: I18nService, useValue: mockI18nService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    handler = module.get<LoginCommandHandler>(LoginCommandHandler);
    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
    tokenProvider = module.get<TokenProvider>(TokenProvider);
    roleRepository = module.get<IRoleRepository>(ROLE_REPOSITORY);

    // Mock UserMapper if needed
    jest.spyOn(UserMapper, 'toAuthResponse').mockImplementation((user, emailVerified) => {
      return {
        id: user.id.getValue(),
        email: user.email.getValue(),
        firstName: user.firstName.getValue(),
        lastName: user.lastName.getValue(),
        emailVerified: emailVerified || false,
        roles: user.roles.map(role => ({
          id: role.id.getValue(),
          name: role.name,
        })),
      };
    });
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should throw UnauthorizedException when credentials are invalid', async () => {
    // Arrange
    const command = new LoginCommand({
      email: 'test@example.com',
      password: 'wrongPassword',
    });

    mockUserService.validateCredentials.mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(UnauthorizedException);
    expect(userService.validateCredentials).toHaveBeenCalledWith(
      'test@example.com',
      'wrongPassword',
    );
  });

  it('should return email verification required response when email is not verified', async () => {
    // Arrange
    const command = new LoginCommand({
      email: 'test@example.com',
      password: 'Password123!',
    });

    const user = createTestUser();
    mockUserService.validateCredentials.mockResolvedValue(user);
    mockAuthService.updateLastLogin.mockResolvedValue(user);
    mockAuthService.isEmailVerified.mockResolvedValue(false);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toEqual({
      requiresEmailVerification: true,
      userId: user.id.getValue(),
      email: user.email.getValue(),
      message: 'Email verification required',
    });

    expect(userService.validateCredentials).toHaveBeenCalledWith(
      'test@example.com',
      'Password123!',
    );
    expect(authService.updateLastLogin).toHaveBeenCalledWith(user.id.getValue());
    expect(authService.isEmailVerified).toHaveBeenCalledWith('test@example.com');
  });

  it('should return OTP required response when user has OTP enabled', async () => {
    // Arrange
    const command = new LoginCommand({
      email: 'test@example.com',
      password: 'Password123!',
    });

    const user = createTestUser();
    user.enableTwoFactor('OTPSECRETBASE32');

    mockUserService.validateCredentials.mockResolvedValue(user);
    mockAuthService.updateLastLogin.mockResolvedValue(user);
    mockAuthService.isEmailVerified.mockResolvedValue(true);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toEqual({
      requiresOtp: true,
      userId: user.id.getValue(),
      message: 'OTP verification required',
    });

    expect(userService.validateCredentials).toHaveBeenCalledWith(
      'test@example.com',
      'Password123!',
    );
    expect(authService.updateLastLogin).toHaveBeenCalledWith(user.id.getValue());
    expect(authService.isEmailVerified).toHaveBeenCalledWith('test@example.com');
  });

  it('should return auth tokens when login is successful', async () => {
    // Arrange
    const command = new LoginCommand({
      email: 'test@example.com',
      password: 'Password123!',
    });

    const user = createTestUser();
    const roleWithPermissions = createRoleWithPermissions();

    mockUserService.validateCredentials.mockResolvedValue(user);
    mockAuthService.updateLastLogin.mockResolvedValue(user);
    mockAuthService.isEmailVerified.mockResolvedValue(true);
    mockRoleRepository.findById.mockResolvedValue(roleWithPermissions);
    mockTokenProvider.generateTokens.mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toEqual({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      message: 'Login successful',
      user: expect.objectContaining({
        id: user.id.getValue(),
        email: user.email.getValue(),
        emailVerified: true,
      }),
    });

    expect(userService.validateCredentials).toHaveBeenCalledWith(
      'test@example.com',
      'Password123!',
    );
    expect(authService.updateLastLogin).toHaveBeenCalledWith(user.id.getValue());
    expect(authService.isEmailVerified).toHaveBeenCalledWith('test@example.com');
    expect(roleRepository.findById).toHaveBeenCalledWith(user.roles[0].id.getValue());
    expect(tokenProvider.generateTokens).toHaveBeenCalledWith(user, ['user:read'], true);
    expect(UserMapper.toAuthResponse).toHaveBeenCalledWith(user, true);
  });

  it('should collect permissions from all user roles', async () => {
    // Arrange
    const command = new LoginCommand({
      email: 'test@example.com',
      password: 'Password123!',
    });

    const user = createTestUser();

    // Add another role to the user - mock the eligibility check
    const adminRole = Role.fromData({
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'admin',
      description: 'Administrator role',
      isDefault: false,
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock the eligibility check to allow admin role assignment
    jest.spyOn(user, 'isEligibleForAdminRole').mockReturnValue(true);
    user.addRole(adminRole);

    // Create roles with permissions for repository responses
    const userRoleWithPermissions = createRoleWithPermissions();

    const adminResourceAction = new ResourceAction('user', ActionType.WRITE);
    const adminPermission = Permission.fromData({
      id: '550e8400-e29b-41d4-a716-446655440004',
      resourceAction: adminResourceAction,
      description: 'Can write user details',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const adminRoleWithPermissions = Role.fromData({
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'admin',
      description: 'Administrator role',
      isDefault: false,
      permissions: [adminPermission],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUserService.validateCredentials.mockResolvedValue(user);
    mockAuthService.updateLastLogin.mockResolvedValue(user);
    mockAuthService.isEmailVerified.mockResolvedValue(true);

    // Mock repository to return different roles based on role id
    mockRoleRepository.findById.mockImplementation(roleId => {
      if (roleId === '550e8400-e29b-41d4-a716-446655440001') {
        return Promise.resolve(userRoleWithPermissions);
      } else if (roleId === '550e8400-e29b-41d4-a716-446655440003') {
        return Promise.resolve(adminRoleWithPermissions);
      }

      return Promise.resolve(null);
    });

    mockTokenProvider.generateTokens.mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });

    // Act
    await handler.execute(command);

    // Assert
    // Check that permissions from both roles are included
    expect(tokenProvider.generateTokens).toHaveBeenCalledWith(
      user,
      expect.arrayContaining(['user:read', 'user:write']),
      true,
    );

    // Also check that roleRepository.findById was called for both roles
    expect(roleRepository.findById).toHaveBeenCalledTimes(2);
    expect(roleRepository.findById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001');
    expect(roleRepository.findById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440003');
  });
});
