import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@core/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '@core/repositories/refresh-token.repository.interface';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RefreshToken as PrismaRefreshToken } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { UserId } from '@core/value-objects/user-id.vo';
import { Token } from '@core/value-objects/token.vo';

@Injectable()
export class RefreshTokenRepository
  extends BaseRepository<RefreshToken>
  implements IRefreshTokenRepository
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async findById(id: string): Promise<RefreshToken | null> {
    return this.executeWithErrorHandling('findById', async () => {
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { id },
      });

      if (!tokenRecord) {
        return null;
      }

      return this.mapToModel(tokenRecord);
    });
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.executeWithErrorHandling('findByToken', async () => {
      const tokenRecord = await this.prisma.refreshToken.findFirst({
        where: { token },
      });

      if (!tokenRecord) {
        return null;
      }

      return this.mapToModel(tokenRecord);
    });
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    return this.executeWithErrorHandling('findByUserId', async () => {
      const tokenRecords = await this.prisma.refreshToken.findMany({
        where: { userId },
      });

      return tokenRecords.map(record => this.mapToModel(record));
    });
  }

  async create(token: RefreshToken): Promise<RefreshToken> {
    return this.executeWithErrorHandling('create', async () => {
      const createdToken = await this.prisma.refreshToken.create({
        data: {
          id: token.id,
          userId: token.userId.getValue(),
          token: token.token.getValue(),
          expiresAt: token.expiresAt,
          revokedAt: token.revokedAt,
          createdAt: token.createdAt,
        },
      });

      return this.mapToModel(createdToken);
    });
  }

  async update(token: RefreshToken): Promise<RefreshToken> {
    return this.executeWithErrorHandling('update', async () => {
      const updatedToken = await this.prisma.refreshToken.update({
        where: { id: token.id },
        data: {
          token: token.token.getValue(),
          expiresAt: token.expiresAt,
          revokedAt: token.revokedAt,
        },
      });

      return this.mapToModel(updatedToken);
    });
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    return this.executeWithErrorHandling(
      'deleteByUserId',
      async () => {
        await this.prisma.refreshToken.deleteMany({
          where: { userId },
        });

        return true;
      },
      false,
    );
  }

  async deleteExpired(): Promise<number> {
    return this.executeWithErrorHandling(
      'deleteExpired',
      async () => {
        const result = await this.prisma.refreshToken.deleteMany({
          where: {
            expiresAt: {
              lt: new Date(),
            },
          },
        });

        return result.count;
      },
      0,
    );
  }

  private mapToModel(record: PrismaRefreshToken): RefreshToken {
    const refreshExpiration = parseInt(
      this.configService.get('JWT_REFRESH_EXPIRATION', '7').replace('d', ''),
      10,
    );

    // Create value objects from primitive values
    const userIdVO = UserId.fromString(record.userId);
    const tokenVO = new Token(record.token);

    const refreshToken = new RefreshToken(userIdVO, tokenVO, refreshExpiration);

    refreshToken.id = record.id;
    refreshToken.expiresAt = record.expiresAt;
    refreshToken.revokedAt = record.revokedAt || undefined;
    refreshToken.createdAt = record.createdAt;

    return refreshToken;
  }
}
