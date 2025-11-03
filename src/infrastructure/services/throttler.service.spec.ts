import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ThrottlerService } from './throttler.service';
import { ThrottleLimit } from '@core/value-objects/throttle-limit.vo';
import { InvalidThrottleIdentifierException, ThrottlingException } from '@core/exceptions/domain-exceptions';

describe('ThrottlerService', () => {
  let service: ThrottlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThrottlerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'throttler.ttl') return 60;
              if (key === 'throttler.limit') return 10;

              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ThrottlerService>(ThrottlerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isAllowed', () => {
    it('should throw an exception when identifier is empty', async () => {
      await expect(service.isAllowed('')).rejects.toThrow(InvalidThrottleIdentifierException);
      await expect(service.isAllowed(null)).rejects.toThrow(InvalidThrottleIdentifierException);
    });

    it('should return true for first-time requests', async () => {
      const result = await service.isAllowed('test-id');
      expect(result).toBe(true);
    });

    it('should use the provided ThrottleLimit', async () => {
      const throttleLimit = ThrottleLimit.create(30, 5);
      const result = await service.isAllowed('test-id', throttleLimit);
      expect(result).toBe(true);
    });
  });

  describe('trackRequest', () => {
    it('should throw an exception when identifier is empty', async () => {
      await expect(service.trackRequest('')).rejects.toThrow(InvalidThrottleIdentifierException);
      await expect(service.trackRequest(null)).rejects.toThrow(InvalidThrottleIdentifierException);
    });

    it('should track requests successfully', async () => {
      await service.trackRequest('test-id');

      // Now we should have 1 request tracked
      expect(await service.getRemainingRequests('test-id')).toBe(9);
    });

    it('should throw an exception when limit is exceeded', async () => {
      const throttleLimit = ThrottleLimit.create(60, 2);

      // Track 2 requests
      await service.trackRequest('test-id', throttleLimit);
      await service.trackRequest('test-id', throttleLimit);

      // Third request should throw
      await expect(service.trackRequest('test-id', throttleLimit)).rejects.toThrow(ThrottlingException);

      try {
        await service.trackRequest('test-id', throttleLimit);
      } catch (error) {
        expect(error.message).toContain('Too many requests');
      }
    });
  });

  describe('getRemainingRequests', () => {
    it('should throw an exception when identifier is empty', async () => {
      await expect(service.getRemainingRequests('')).rejects.toThrow(InvalidThrottleIdentifierException);
      await expect(service.getRemainingRequests(null)).rejects.toThrow(InvalidThrottleIdentifierException);
    });

    it('should return the full limit for first-time requests', async () => {
      const result = await service.getRemainingRequests('new-id');
      expect(result).toBe(10);
    });

    it('should return the correct remaining requests', async () => {
      const throttleLimit = ThrottleLimit.create(60, 5);

      // Track 3 requests
      await service.trackRequest('test-id', throttleLimit);
      await service.trackRequest('test-id', throttleLimit);
      await service.trackRequest('test-id', throttleLimit);

      // Should have 2 remaining
      expect(await service.getRemainingRequests('test-id', throttleLimit)).toBe(2);
    });
  });

  describe('resetThrottling', () => {
    it('should throw an exception when identifier is empty', async () => {
      await expect(service.resetThrottling('')).rejects.toThrow(InvalidThrottleIdentifierException);
      await expect(service.resetThrottling(null)).rejects.toThrow(InvalidThrottleIdentifierException);
    });

    it('should reset throttling for an identifier', async () => {
      // Track some requests
      await service.trackRequest('test-id');
      await service.trackRequest('test-id');

      // Check remaining before reset
      expect(await service.getRemainingRequests('test-id')).toBe(8);

      // Reset
      await service.resetThrottling('test-id');

      // Should be back to full limit
      expect(await service.getRemainingRequests('test-id')).toBe(10);
    });
  });
});
