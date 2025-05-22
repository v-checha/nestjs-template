import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserCommand, RegisterUserCommandHandler } from './register-user.command';
import { UserService } from '@core/services/user.service';
import { UserMapper } from '@application/mappers/user.mapper';
import { User } from '@core/entities/user.entity';
import { Email } from '@core/value-objects/email.vo';
import { FirstName, LastName } from '@core/value-objects/name.vo';
import { I18nService } from 'nestjs-i18n';

// Mock user service
const mockUserService = {
  createUser: jest.fn(),
};

// Mock i18n service
const mockI18nService = {
  t: jest.fn().mockImplementation((key: string) => {
    const translations: Record<string, string> = {
      'common.auth.register.success': 'Registration successful',
    };

    return translations[key] || key;
  }),
};

describe('RegisterUserCommandHandler', () => {
  let handler: RegisterUserCommandHandler;
  let userService: UserService;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserCommandHandler,
        { provide: UserService, useValue: mockUserService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    handler = module.get<RegisterUserCommandHandler>(RegisterUserCommandHandler);
    userService = module.get<UserService>(UserService);

    // Mock UserMapper
    jest.spyOn(UserMapper, 'toBaseResponse').mockImplementation(user => {
      return {
        id: user.id.getValue(),
        email: user.email.getValue(),
        firstName: user.firstName.getValue(),
        lastName: user.lastName.getValue(),
      };
    });
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should register a new user and return user base response', async () => {
    // Arrange
    const command = new RegisterUserCommand({
      email: 'new@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
    });

    const createdUser = User.create(
      new Email('new@example.com'),
      'hashedPassword',
      new FirstName('New'),
      new LastName('User'),
    );

    mockUserService.createUser.mockResolvedValue(createdUser);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toEqual({
      id: createdUser.id.getValue(),
      email: createdUser.email.getValue(),
      firstName: createdUser.firstName.getValue(),
      lastName: createdUser.lastName.getValue(),
    });

    expect(userService.createUser).toHaveBeenCalledWith(
      'new@example.com',
      'Password123!',
      'New',
      'User',
    );

    expect(UserMapper.toBaseResponse).toHaveBeenCalledWith(createdUser);
  });

  it('should pass through errors from userService.createUser', async () => {
    // Arrange
    const command = new RegisterUserCommand({
      email: 'existing@example.com',
      password: 'Password123!',
      firstName: 'Existing',
      lastName: 'User',
    });

    const error = new Error('Email already in use');
    mockUserService.createUser.mockRejectedValue(error);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(error);

    expect(userService.createUser).toHaveBeenCalledWith(
      'existing@example.com',
      'Password123!',
      'Existing',
      'User',
    );
  });
});
