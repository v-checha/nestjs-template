import { SendVerificationEmailRequest } from '@application/dtos';
import { AuthService } from '@core/services/auth.service';
import { Injectable } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailProvider } from '@presentation/modules/auth/providers/email.provider';

export class SendVerificationEmailCommand extends Command<{ message: string }> {
  constructor(public readonly dto: SendVerificationEmailRequest) {
    super();
  }
}

@Injectable()
@CommandHandler(SendVerificationEmailCommand)
export class SendVerificationEmailCommandHandler
  implements ICommandHandler<SendVerificationEmailCommand>
{
  constructor(
    private readonly authService: AuthService,
    private readonly emailProvider: EmailProvider,
  ) {}

  async execute(command: SendVerificationEmailCommand) {
    const { email } = command.dto;

    // Generate a verification code
    const code = await this.authService.generateEmailVerificationCode(email);

    // Send the verification email
    await this.emailProvider.sendVerificationCode(email, code);

    return { message: 'Verification email sent successfully' };
  }
}
