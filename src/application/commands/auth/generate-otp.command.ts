import { AuthService } from '@core/services/auth.service';
import { Injectable } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class GenerateOtpCommand extends Command<{ otp: string }> {
  constructor(public readonly userId: string) {
    super();
  }
}

@Injectable()
@CommandHandler(GenerateOtpCommand)
export class GenerateOtpCommandHandler implements ICommandHandler<GenerateOtpCommand> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: GenerateOtpCommand) {
    const { userId } = command;

    // Generate OTP for the user
    const otp = await this.authService.generateOtp(userId);

    return { otp };
  }
}
