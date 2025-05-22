import { Injectable } from '@nestjs/common';
import { PasswordReset } from '@core/entities/password-reset.entity';
import { IPasswordResetRepository } from '@core/repositories/password-reset.repository.interface';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Email } from '@core/value-objects/email.vo';
import { Token } from '@core/value-objects/token.vo';
import { UserId } from '@core/value-objects/user-id.vo';
import { PasswordReset as PrismaPasswordReset } from '@prisma/client';

@Injectable()
export class PasswordResetRepository
  extends BaseRepository<PasswordReset>
  implements IPasswordResetRepository
{
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<PasswordReset | null> {
    return this.executeWithErrorHandling('findById', async () => {
      const record = await this.prisma.passwordReset.findUnique({
        where: { id },
      });

      return record ? this.mapToModel(record) : null;
    });
  }

  async findByUserId(userId: string): Promise<PasswordReset | null> {
    return this.executeWithErrorHandling('findByUserId', async () => {
      const record = await this.prisma.passwordReset.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return record ? this.mapToModel(record) : null;
    });
  }

  async findByToken(token: string): Promise<PasswordReset | null> {
    return this.executeWithErrorHandling('findByToken', async () => {
      const record = await this.prisma.passwordReset.findUnique({
        where: { token },
      });

      return record ? this.mapToModel(record) : null;
    });
  }

  async findByEmail(email: string): Promise<PasswordReset | null> {
    return this.executeWithErrorHandling('findByEmail', async () => {
      const record = await this.prisma.passwordReset.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
      });

      return record ? this.mapToModel(record) : null;
    });
  }

  async create(passwordReset: PasswordReset): Promise<PasswordReset> {
    return this.executeWithErrorHandling('create', async () => {
      await this.prisma.passwordReset.create({
        data: {
          id: passwordReset.id,
          userId: passwordReset.userId.getValue(),
          email: passwordReset.email.getValue(),
          token: passwordReset.token.getValue(),
          expiresAt: passwordReset.expiresAt,
          usedAt: passwordReset.usedAt,
          createdAt: passwordReset.createdAt,
        },
      });

      return passwordReset;
    });
  }

  async update(passwordReset: PasswordReset): Promise<PasswordReset> {
    return this.executeWithErrorHandling('update', async () => {
      await this.prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: {
          userId: passwordReset.userId.getValue(),
          email: passwordReset.email.getValue(),
          token: passwordReset.token.getValue(),
          expiresAt: passwordReset.expiresAt,
          usedAt: passwordReset.usedAt,
        },
      });

      return passwordReset;
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.executeWithErrorHandling(
      'delete',
      async () => {
        await this.prisma.passwordReset.delete({
          where: { id },
        });

        return true;
      },
      false,
    );
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    return this.executeWithErrorHandling(
      'deleteByUserId',
      async () => {
        await this.prisma.passwordReset.deleteMany({
          where: { userId },
        });

        return true;
      },
      false,
    );
  }

  async deleteByEmail(email: string): Promise<boolean> {
    return this.executeWithErrorHandling(
      'deleteByEmail',
      async () => {
        await this.prisma.passwordReset.deleteMany({
          where: { email },
        });

        return true;
      },
      false,
    );
  }

  private mapToModel(record: PrismaPasswordReset): PasswordReset {
    // Create value objects from primitive values
    const userIdVO = UserId.fromString(record.userId);
    const emailVO = new Email(record.email);
    const tokenVO = new Token(record.token);

    const passwordReset = new PasswordReset(
      userIdVO,
      emailVO,
      0, // We don't need to specify expiration here as we're loading from DB
    );

    passwordReset.id = record.id;
    passwordReset.token = tokenVO; // Override the auto-generated token with the one from DB
    passwordReset.expiresAt = record.expiresAt;
    passwordReset.usedAt = record.usedAt;
    passwordReset.createdAt = record.createdAt;

    return passwordReset;
  }
}
