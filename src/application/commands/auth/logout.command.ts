import { AuthService } from '@core/services/auth.service';
import { Injectable } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class LogoutCommand extends Command<{ message: string }> {
  constructor(public readonly userId: string) {
    super();
  }
}

@Injectable()
@CommandHandler(LogoutCommand)
export class LogoutCommandHandler implements ICommandHandler<LogoutCommand> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: LogoutCommand) {
    const { userId } = command;

    // Revoke all refresh tokens for this user
    await this.authService.revokeAllRefreshTokens(userId);

    return { message: 'Logged out successfully' };
  }
}
