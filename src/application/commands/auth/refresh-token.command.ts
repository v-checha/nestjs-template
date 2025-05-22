import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RefreshTokenDto } from '@application/dtos/auth/refresh-token.dto';
import { IAuthRefreshTokenResponse } from '@application/dtos/responses/user.response';
import { UnauthorizedException, Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { IRoleRepository } from '@core/repositories/role.repository.interface';
import { AuthService } from '@core/services/auth.service';
import { v4 as uuidv4 } from 'uuid';
import { USER_REPOSITORY, ROLE_REPOSITORY } from '@shared/constants/tokens';

export class RefreshTokenCommand implements ICommand {
  constructor(public readonly refreshTokenDto: RefreshTokenDto) {}
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

  async execute(command: RefreshTokenCommand): Promise<IAuthRefreshTokenResponse> {
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
        roleWithPermissions.permissions.forEach(permission => {
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
      roles: user.roles.map(role => role.name),
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
    };
  }
}
