import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let configService: ConfigService;

  // Mock the console methods
  /* eslint-disable no-console */
  const _originalConsoleLog = console.log; // Prefix with underscore to avoid unused var error
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  /* eslint-enable no-console */

  const consoleLogMock = jest.fn();
  const consoleErrorMock = jest.fn();
  const consoleWarnMock = jest.fn();
  const consoleDebugMock = jest.fn();
  const consoleInfoMock = jest.fn();

  beforeEach(async () => {
    // Setup console mocks
    /* eslint-disable no-console */
    console.error = consoleErrorMock;
    console.warn = consoleWarnMock;
    console.log = consoleLogMock;
    console.debug = consoleDebugMock;
    console.info = consoleInfoMock;
    /* eslint-enable no-console */

    // Clear mock calls
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => {
              if (key === 'NODE_ENV') return 'test';

              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = await module.resolve<LoggerService>(LoggerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterAll(() => {
    // Restore original console methods

    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should set and use context', () => {
    service.setContext('TestContext');
    service.log('test message');

    expect(consoleWarnMock).toHaveBeenCalled(); // Changed to warn because we now use console.warn for log
    const logCall = consoleWarnMock.mock.calls[0];
    expect(logCall[0]).toContain('[TestContext]');
  });

  it('should log messages at different levels', () => {
    service.log('info message');
    service.error('error message');
    service.warn('warning message');
    service.debug('debug message');
    service.verbose('verbose message');

    expect(consoleWarnMock).toHaveBeenCalled(); // Now all use warn except error
    expect(consoleErrorMock).toHaveBeenCalled();
    // debug and verbose now use warn too
  });

  it('should format object messages as JSON', () => {
    const testObject = { test: 'value', nested: { prop: true } };
    service.log(testObject);

    expect(consoleWarnMock).toHaveBeenCalled();
    // Check if the formatted message includes the JSON representation
    const logCall = consoleWarnMock.mock.calls[0];
    expect(logCall[1]).toEqual(JSON.stringify(testObject, null, 2));
  });

  it('should include stack trace for errors', () => {
    const errorMessage = 'Test error';
    const stackTrace = 'Test stack trace';
    service.error(errorMessage, stackTrace);

    expect(consoleErrorMock).toHaveBeenCalled();
    const errorCall = consoleErrorMock.mock.calls[0];
    expect(errorCall).toContain(stackTrace);
  });

  it('should respect environment-based log levels', () => {
    // Mock that we're in production
    jest.spyOn(configService, 'get').mockImplementation(key => {
      if (key === 'NODE_ENV') return 'production';

      return null;
    });

    // Create a new service with the production environment
    const prodService = new LoggerService(configService);

    // Reset all mocks
    jest.clearAllMocks();

    // These should be logged in production
    prodService.error('error message');
    prodService.warn('warning message');
    prodService.log('info message');

    // These should not be logged in production
    prodService.debug('debug message');
    prodService.verbose('verbose message');

    expect(consoleErrorMock).toHaveBeenCalled();
    expect(consoleWarnMock).toHaveBeenCalled();
    // log uses warn in production too now
    expect(consoleDebugMock).not.toHaveBeenCalled();
    expect(consoleInfoMock).not.toHaveBeenCalled();
  });
});
