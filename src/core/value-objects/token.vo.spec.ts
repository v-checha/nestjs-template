import { Token } from './token.vo';
import { InvalidValueObjectException } from '@core/exceptions/domain-exceptions';

describe('Token Value Object', () => {
  it('should create a valid token', () => {
    // Arrange & Act
    const token = new Token('550e8400-e29b-41d4-a716-446655440005');

    // Assert
    expect(token).toBeDefined();
    expect(token.getValue()).toBe('550e8400-e29b-41d4-a716-446655440005');
  });

  it('should accept valid tokens', () => {
    // Assert
    expect(() => new Token('550e8400-e29b-41d4-a716-446655440005')).not.toThrow();
    expect(() => new Token('55dde296-b6ce-4afa-980b-8bc05a94a5f8')).not.toThrow();
    expect(() => new Token('991a660d-5e9d-4909-93c9-04df5dbe95e0')).not.toThrow();
  });

  it('should throw for invalid token format', () => {
    // Arrange & Act & Assert
    expect(() => new Token('invalid-token')).toThrow(InvalidValueObjectException);
    expect(() => new Token('550e8400-e29b-41d4-a716-446655440005-invalid')).toThrow(InvalidValueObjectException);
    expect(() => new Token('')).toThrow(InvalidValueObjectException);
    expect(() => new Token('  ')).toThrow(InvalidValueObjectException);
  });

  it('should get the value properly', () => {
    // Arrange
    const token = new Token('550e8400-e29b-41d4-a716-446655440005');

    // Act
    const value = token.getValue();

    // Assert
    expect(value).toBe('550e8400-e29b-41d4-a716-446655440005');
  });

  it('should check equality between tokens', () => {
    // Arrange & Act
    const token = new Token('550e8400-e29b-41d4-a716-446655440005');

    // Assert
    expect(() => token.equals(token)).not.toThrow();
  });

  it('should generate a new token', () => {
    // Arrange & Act
    const token = Token.generate();

    // Assert
    expect(token).toBeDefined();
    expect(token.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
