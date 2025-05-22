import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/entities/user.entity';

@Injectable()
export class TokenProvider {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Generate a JWT payload with user information
   */
  buildPayload(user: User, permissions: string[], isEmailVerified: boolean) {
    return {
      sub: user.id.getValue(),
      email: user.email.getValue(),
      emailVerified: isEmailVerified,
      roles: user.roles.map(role => role.name),
      permissions: permissions,
    };
  }

  /**
   * Generate an access token
   */
  generateAccessToken(payload: Record<string, unknown>): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });
  }

  /**
   * Generate a refresh token and store it
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const refreshToken = uuidv4();
    await this.authService.createRefreshToken(userId, refreshToken);

    return refreshToken;
  }

  /**
   * Generate both access and refresh tokens for a user
   */
  async generateTokens(user: User, permissions: string[], isEmailVerified: boolean) {
    const payload = this.buildPayload(user, permissions, isEmailVerified);
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(user.id.getValue());

    return {
      accessToken,
      refreshToken,
    };
  }
}
