import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Constants
import {
  USER_REPOSITORY,
  ROLE_REPOSITORY,
  OTP_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  EMAIL_VERIFICATION_REPOSITORY,
  PASSWORD_RESET_REPOSITORY,
} from '@shared/constants/tokens';

// Controllers
import { AuthController } from './auth.controller';

// Repositories
import { UserRepository } from '@infrastructure/repositories/user.repository';
import { RoleRepository } from '@infrastructure/repositories/role.repository';
import { OtpRepository } from '@infrastructure/repositories/otp.repository';
import { RefreshTokenRepository } from '@infrastructure/repositories/refresh-token.repository';
import { EmailVerificationRepository } from '@infrastructure/repositories/email-verification.repository';
import { PasswordResetRepository } from '@infrastructure/repositories/password-reset.repository';
import { EmailProvider } from './providers/email.provider';
import { TokenProvider } from './providers/token.provider';

// Services
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';
import { I18nModule } from '@infrastructure/i18n/i18n.module';
import { CoreModule } from '@core/core.module';

// Command Handlers
import { RegisterUserCommandHandler } from '@application/commands/auth/register-user.command';
import { LoginCommandHandler } from '@application/commands/auth/login.command';
import { VerifyOtpCommandHandler } from '@application/commands/auth/verify-otp.command';
import { RefreshTokenCommandHandler } from '@application/commands/auth/refresh-token.command';
import { LogoutCommandHandler } from '@application/commands/auth/logout.command';
import { SendVerificationEmailCommandHandler } from '@application/commands/auth/send-verification-email.command';
import { VerifyEmailCommandHandler } from '@application/commands/auth/verify-email.command';
import { CheckEmailVerificationStatusCommandHandler } from '@application/commands/auth/check-email-verification-status.command';
import { RequestPasswordResetCommandHandler } from '@application/commands/auth/request-password-reset.command';
import { ResetPasswordCommandHandler } from '@application/commands/auth/reset-password.command';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';

const commandHandlers = [
  RegisterUserCommandHandler,
  LoginCommandHandler,
  VerifyOtpCommandHandler,
  RefreshTokenCommandHandler,
  LogoutCommandHandler,
  SendVerificationEmailCommandHandler,
  VerifyEmailCommandHandler,
  CheckEmailVerificationStatusCommandHandler,
  RequestPasswordResetCommandHandler,
  ResetPasswordCommandHandler,
];

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    I18nModule,
    CoreModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRATION', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Services
    UserService,
    AuthService,

    // Repository tokens
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: RoleRepository,
    },
    {
      provide: OTP_REPOSITORY,
      useClass: OtpRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenRepository,
    },
    {
      provide: EMAIL_VERIFICATION_REPOSITORY,
      useClass: EmailVerificationRepository,
    },
    {
      provide: PASSWORD_RESET_REPOSITORY,
      useClass: PasswordResetRepository,
    },

    // Providers
    EmailProvider,
    TokenProvider,

    // Strategy
    JwtStrategy,

    // Command handlers
    ...commandHandlers,
  ],
  exports: [UserService, AuthService],
})
export class AuthModule {}
