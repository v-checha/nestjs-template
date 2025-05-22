import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginDto } from '@application/dtos/auth/login.dto';
import { AuthResponse } from '@application/dtos/responses/user.response';
import { UnauthorizedException, Injectable, Inject } from '@nestjs/common';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { IRoleRepository } from '@core/repositories/role.repository.interface';
import { TokenProvider } from '@presentation/modules/auth/providers/token.provider';
import { UserMapper } from '@application/mappers/user.mapper';
import { I18nService } from 'nestjs-i18n';
import { ROLE_REPOSITORY } from '@shared/constants/tokens';
import { LoggerService } from '@infrastructure/logger/logger.service';

export class LoginCommand implements ICommand {
  constructor(public readonly loginDto: LoginDto) {}
}

@Injectable()
@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly tokenProvider: TokenProvider,
    private readonly i18n: I18nService,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {
    this.logger.setContext(LoginCommandHandler.name);
  }

  async execute(command: LoginCommand): Promise<AuthResponse> {
    const { email } = command.loginDto;

    this.logger.log({ message: 'Login attempt', email });

    // Validate credentials
    const user = await this.userService.validateCredentials(email, command.loginDto.password);
    if (!user) {
      this.logger.warn({ message: 'Login failed - invalid credentials', email });
      throw new UnauthorizedException(this.i18n.t('common.auth.login.failed'));
    }

    this.logger.debug({
      message: 'Credentials validated successfully',
      userId: user.id.getValue(),
      email,
    });

    // Update last login
    await this.authService.updateLastLogin(user.id.getValue());

    // Check if email is verified
    const isEmailVerified = await this.authService.isEmailVerified(email);

    // If email verification is required and not verified, prompt user to verify first
    if (!isEmailVerified) {
      this.logger.debug({
        message: 'Login requires email verification',
        userId: user.id.getValue(),
        email,
      });

      return {
        requiresEmailVerification: true,
        userId: user.id.getValue(),
        email: user.email.getValue(),
        message: this.i18n.t('common.auth.verification.email_sent'),
      };
    }

    // Check if OTP is enabled
    if (user.otpEnabled) {
      this.logger.debug({
        message: 'Login requires 2FA verification',
        userId: user.id.getValue(),
        email,
      });

      return {
        requiresOtp: true,
        userId: user.id.getValue(),
        message: this.i18n.t('common.auth.2fa.enabled'),
      };
    }

    // Collect all permissions from all user roles
    const userPermissions = new Set<string>();
    for (const role of user.roles) {
      const roleWithPermissions = await this.roleRepository.findById(role.id.getValue());
      if (roleWithPermissions && roleWithPermissions.permissions) {
        roleWithPermissions.permissions.forEach(permission => {
          userPermissions.add(permission.getStringName());
        });
      }
    }

    this.logger.debug({
      message: 'User permissions collected',
      userId: user.id.getValue(),
      roles: user.roles.map(r => r.name),
      permissionsCount: userPermissions.size,
    });

    // Generate JWT tokens
    const { accessToken, refreshToken } = await this.tokenProvider.generateTokens(
      user,
      Array.from(userPermissions),
      true, // Email is verified at this point
    );

    this.logger.log({
      message: 'Login successful',
      userId: user.id.getValue(),
      email,
    });

    return {
      accessToken,
      refreshToken,
      user: UserMapper.toAuthResponse(user, true),
      message: this.i18n.t('common.auth.login.success'),
    };
  }
}
