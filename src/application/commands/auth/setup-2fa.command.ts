import { AuthService } from '@core/services/auth.service';
import { Injectable } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class Setup2FACommand extends Command<{ secret: string; qrCodeUrl: string }> {
  constructor(public readonly userId: string) {
    super();
  }
}

@Injectable()
@CommandHandler(Setup2FACommand)
export class Setup2FACommandHandler implements ICommandHandler<Setup2FACommand> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: Setup2FACommand) {
    const { userId } = command;

    // Setup 2FA for the user
    return this.authService.setupTwoFactorAuth(userId);
  }
}
