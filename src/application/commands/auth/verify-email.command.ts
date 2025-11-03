import { AuthTokenResponse, VerifyEmailRequest } from '@application/dtos';
import { UserMapper } from '@application/mappers/user.mapper';
import { IRoleRepository } from '@core/repositories/role.repository.interface';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { AuthService } from '@core/services/auth.service';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { ROLE_REPOSITORY, USER_REPOSITORY } from '@shared/constants/tokens';
import { v4 as uuidv4 } from 'uuid';

export class VerifyEmailCommand extends Command<AuthTokenResponse | { verified: boolean }> {
  constructor(public readonly dto: VerifyEmailRequest) {
    super();
  }
}

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailCommandHandler implements ICommandHandler<VerifyEmailCommand> {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: VerifyEmailCommand) {
    const { email, code } = command.dto;

    // Verify the email code
    const verified = await this.authService.verifyEmailCode(email, code);

    if (!verified) {
      return { verified: false };
    }

    // If verification succeeded, we can immediately login the user
    // 1. Find the user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 2. Update last login
    await this.authService.updateLastLogin(user.id.getValue());

    // 3. Collect all permissions from all user roles
    const userPermissions = new Set<string>();
    for (const role of user.roles) {
      const roleWithPermissions = await this.roleRepository.findById(role.id.getValue());
      if (roleWithPermissions && roleWithPermissions.permissions) {
        roleWithPermissions.permissions.forEach((permission) => {
          userPermissions.add(permission.getStringName());
        });
      }
    }

    // 4. Generate JWT tokens
    const payload = {
      sub: user.id.getValue(),
      email: user.email.getValue(),
      emailVerified: true,
      roles: user.roles.map((role) => role.name),
      permissions: Array.from(userPermissions),
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });

    const refreshToken = uuidv4();
    await this.authService.createRefreshToken(user.id.getValue(), refreshToken);

    // 5. Return tokens and user information
    return {
      accessToken,
      refreshToken,
      user: UserMapper.toAuthResponse(user, true),
    };
  }
}
