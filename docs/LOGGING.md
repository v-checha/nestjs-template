# Logging System

This document provides an overview of the logging system used in this application.

## Overview

The application uses a custom Logger service that extends NestJS's built-in LoggerService. It provides structured logging with context tracking and different log levels based on the environment.

## Features

- Structured JSON logging (for easier parsing by log aggregation tools)
- Context-based logging (to track which component generated the log)
- Different log levels (error, warn, log, debug, verbose)
- Environment-based log level configuration

## Using the Logger

### Injecting the Logger

You can inject the Logger service into any component:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { LoggerService } from '@infrastructure/logger/logger.service';

@Injectable()
export class YourService {
  constructor(
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {
    // Set the context for all logs from this service
    this.logger.setContext(YourService.name);
  }
}
```

### Logging Messages

The logger supports different log levels and structured logging:

```typescript
// Simple string logging
this.logger.log('This is a log message');
this.logger.error('This is an error message');

// Structured logging (recommended)
this.logger.log({ 
  message: 'User action performed',
  userId: '123',
  action: 'create',
});

// Error with stack trace
try {
  // Something that might throw an error
} catch (error) {
  this.logger.error(
    { message: 'Operation failed', operationName: 'createUser' },
    error.stack
  );
}
```

## Log Levels

The following log levels are available, in order of severity:

1. `error` - Critical issues that require immediate attention
2. `warn` - Issues that don't prevent the application from working but need attention
3. `log` - Regular application flow (standard info level)
4. `debug` - Detailed information useful for debugging
5. `verbose` - Very detailed information for tracing application flow

In production, only `error`, `warn`, and `log` levels are enabled by default.

## Best Practices

1. **Always use structured logging** for improved searchability:
   ```typescript
   // Instead of this:
   this.logger.log(`User ${userId} performed action ${action}`);
   
   // Do this:
   this.logger.log({ message: 'User action', userId, action });
   ```

2. **Set appropriate log levels**:
   - Use `error` for exceptions and failures
   - Use `warn` for non-critical issues
   - Use `log` for important application events
   - Use `debug` for detailed information during troubleshooting
   - Use `verbose` for very detailed tracing

3. **Provide context**:
   - Always set the context using `setContext()`
   - Include relevant IDs (userId, transactionId, etc.) in log messages

4. **Avoid sensitive information**:
   - Never log credentials, tokens, or personal identifiable information (PII)
   - Be cautious with request and response bodies

5. **Be concise but complete**:
   - Log messages should be to the point but include all relevant information
   - For errors, include what went wrong and, if possible, how to fix it

## Implementation Details

The logger is implemented as a global NestJS module, so it's available throughout the application without needing to import the module in each feature module.

### Key Files

- `src/infrastructure/logger/logger.service.ts` - The main logger service
- `src/infrastructure/logger/logger.module.ts` - The module definition
- `src/infrastructure/logger/logger.interface.ts` - The logger interface

### Configuration

Log levels are configured based on the environment:

- **Development**: All log levels enabled
- **Production**: Only `error`, `warn`, and `log` levels enabled

This is controlled via the `NODE_ENV` environment variable.