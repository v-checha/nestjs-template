import { v4 as uuidv4 } from 'uuid';
import { InvalidValueObjectException } from '@core/exceptions/domain-exceptions';

export class Token {
  private readonly value: string;

  constructor(token: string) {
    if (!this.isValid(token)) {
      throw new InvalidValueObjectException('Invalid token format');
    }
    this.value = token;
  }

  private isValid(token: string): boolean {
    // Basic validation for UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return uuidRegex.test(token);
  }

  getValue(): string {
    return this.value;
  }

  equals(token: Token): boolean {
    return this.value === token.getValue();
  }

  static generate(): Token {
    return new Token(uuidv4());
  }
}
