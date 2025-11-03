import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IThrottlerService } from '@core/services/throttler.service';
import { ThrottleLimit } from '@core/value-objects/throttle-limit.vo';
import { InvalidThrottleIdentifierException, ThrottlingException } from '@core/exceptions/domain-exceptions';

@Injectable()
export class ThrottlerService implements IThrottlerService {
  private readonly storage: Map<string, { count: number; ttl: number }> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async isAllowed(identifier: string, throttleLimit: ThrottleLimit = this.getDefaultThrottleLimit()): Promise<boolean> {
    if (!identifier) {
      throw new InvalidThrottleIdentifierException();
    }

    this.cleanupExpiredRecords();

    const record = this.storage.get(identifier);
    if (!record) {
      return true;
    }

    const now = Date.now();
    if (now > record.ttl) {
      this.storage.delete(identifier);

      return true;
    }

    return record.count < throttleLimit.getLimit;
  }

  async trackRequest(identifier: string, throttleLimit: ThrottleLimit = this.getDefaultThrottleLimit()): Promise<void> {
    if (!identifier) {
      throw new InvalidThrottleIdentifierException();
    }

    this.cleanupExpiredRecords();

    const now = Date.now();
    const record = this.storage.get(identifier);

    if (!record || now > record.ttl) {
      this.storage.set(identifier, {
        count: 1,
        ttl: now + throttleLimit.getTtl * 1000,
      });

      return;
    }

    if (record.count >= throttleLimit.getLimit) {
      throw new ThrottlingException(
        `Too many requests, please try again after ${Math.ceil((record.ttl - now) / 1000)} seconds`,
      );
    }

    this.storage.set(identifier, {
      count: record.count + 1,
      ttl: record.ttl,
    });
  }

  async getRemainingRequests(
    identifier: string,
    throttleLimit: ThrottleLimit = this.getDefaultThrottleLimit(),
  ): Promise<number> {
    if (!identifier) {
      throw new InvalidThrottleIdentifierException();
    }

    this.cleanupExpiredRecords();

    const record = this.storage.get(identifier);
    if (!record) {
      return throttleLimit.getLimit;
    }

    const now = Date.now();
    if (now > record.ttl) {
      this.storage.delete(identifier);

      return throttleLimit.getLimit;
    }

    return Math.max(0, throttleLimit.getLimit - record.count);
  }

  async resetThrottling(identifier: string): Promise<void> {
    if (!identifier) {
      throw new InvalidThrottleIdentifierException();
    }

    this.storage.delete(identifier);
  }

  private cleanupExpiredRecords(): void {
    const now = Date.now();
    this.storage.forEach((record, key) => {
      if (now > record.ttl) {
        this.storage.delete(key);
      }
    });
  }

  private getDefaultThrottleLimit(): ThrottleLimit {
    const ttl = this.configService.get<number>('throttler.ttl');
    const limit = this.configService.get<number>('throttler.limit');

    return ThrottleLimit.create(ttl, limit);
  }
}
