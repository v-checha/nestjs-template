import { AuthService } from '@core/services/auth.service';
import { Injectable } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CheckEmailVerificationStatusCommand extends Command<boolean> {
  constructor(public readonly email: string) {
    super();
  }
}

@Injectable()
@CommandHandler(CheckEmailVerificationStatusCommand)
export class CheckEmailVerificationStatusCommandHandler
  implements ICommandHandler<CheckEmailVerificationStatusCommand>
{
  constructor(private readonly authService: AuthService) {}

  async execute(command: CheckEmailVerificationStatusCommand) {
    const { email } = command;

    // Check if the email is verified
    return this.authService.isEmailVerified(email);
  }
}
