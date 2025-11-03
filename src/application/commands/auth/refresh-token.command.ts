import { RefreshTokenRequest, RefreshTokenResponse } from '@application/dtos';
import { IRoleRepository } from '@core/repositories/role.repository.interface';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { AuthService } from '@core/services/auth.service';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { ROLE_REPOSITORY, USER_REPOSITORY } from '@shared/constants/tokens';
import { v4 as uuidv4 } from 'uuid';

export class RefreshTokenCommand extends Command<RefreshTokenResponse> {
  constructor(public readonly refreshTokenDto: RefreshTokenRequest) {
    super();
  }
}

@Injectable()
@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: RefreshTokenCommand) {
    const { refreshToken } = command.refreshTokenDto;

    // Validate refresh token
    const token = await this.authService.validateRefreshToken(refreshToken);
    if (!token) {
      throw new UnauthorizedException();
    }

    // Get user
    const user = await this.userRepository.findById(token.userId.getValue());
    if (!user) {
      throw new UnauthorizedException();
    }

    // Revoke current refresh token
    await this.authService.revokeRefreshToken(refreshToken);

    // Collect all permissions from all user roles
    const userPermissions = new Set<string>();
    for (const role of user.roles) {
      const roleWithPermissions = await this.roleRepository.findById(role.id.getValue());
      if (roleWithPermissions && roleWithPermissions.permissions) {
        roleWithPermissions.permissions.forEach((permission) => {
          userPermissions.add(permission.getStringName());
        });
      }
    }

    // Check if email is verified
    const isEmailVerified = await this.authService.isEmailVerified(user.email.getValue());

    // Generate new JWT tokens
    const payload = {
      sub: user.id.getValue(),
      email: user.email.getValue(),
      emailVerified: isEmailVerified,
      roles: user.roles.map((role) => role.name),
      permissions: Array.from(userPermissions),
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });

    const newRefreshToken = uuidv4();
    await this.authService.createRefreshToken(user.id.getValue(), newRefreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      userId: user.id.getValue(),
    };
  }
}
