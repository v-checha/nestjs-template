import { AuthService } from '@core/services/auth.service';
import { Injectable } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class Verify2FACommand extends Command<{ verified: boolean }> {
  constructor(
    public readonly userId: string,
    public readonly token: string,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(Verify2FACommand)
export class Verify2FACommandHandler implements ICommandHandler<Verify2FACommand> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: Verify2FACommand) {
    const { userId, token } = command;

    // Verify the 2FA token
    const isVerified = await this.authService.verifyTwoFactorToken(userId, token);

    return { verified: isVerified };
  }
}
