import { AuthTokenResponse, VerifyOtpRequest } from '@application/dtos';
import { UserMapper } from '@application/mappers/user.mapper';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { AuthService } from '@core/services/auth.service';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { USER_REPOSITORY } from '@shared/constants/tokens';
import { v4 as uuidv4 } from 'uuid';

export class VerifyOtpCommand extends Command<AuthTokenResponse> {
  constructor(
    public readonly userId: string,
    public readonly verifyOtpDto: VerifyOtpRequest,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(VerifyOtpCommand)
export class VerifyOtpCommandHandler implements ICommandHandler<VerifyOtpCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: VerifyOtpCommand) {
    const { userId, verifyOtpDto } = command;

    // Verify OTP
    const isOtpValid = await this.authService.verifyOtp(userId, verifyOtpDto.otp);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate JWT tokens
    const payload = {
      sub: user.id.getValue(),
      email: user.email.getValue(),
      roles: user.roles.map((role) => role.name),
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });

    const refreshToken = uuidv4();
    await this.authService.createRefreshToken(user.id.getValue(), refreshToken);

    return {
      accessToken,
      refreshToken,
      user: UserMapper.toAuthResponse(user, true),
    };
  }
}
