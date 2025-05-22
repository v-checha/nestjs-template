/**
 * Base Specification interface for implementing the Specification pattern
 * Specifications encapsulate business rules that can be combined and reused
 */
export interface ISpecification<T> {
  /**
   * Check if the candidate satisfies the specification
   */
  isSatisfiedBy(candidate: T): boolean;

  /**
   * Combine this specification with another using AND logic
   */
  and(other: ISpecification<T>): ISpecification<T>;

  /**
   * Combine this specification with another using OR logic
   */
  or(other: ISpecification<T>): ISpecification<T>;

  /**
   * Negate this specification
   */
  not(): ISpecification<T>;
}

/**
 * Abstract base class for Specifications
 */
export abstract class Specification<T> implements ISpecification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: ISpecification<T>): ISpecification<T> {
    return new AndSpecification(this, other);
  }

  or(other: ISpecification<T>): ISpecification<T> {
    return new OrSpecification(this, other);
  }

  not(): ISpecification<T> {
    return new NotSpecification(this);
  }
}

/**
 * Composite specification for AND logic
 */
class AndSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>,
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

/**
 * Composite specification for OR logic
 */
class OrSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>,
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

/**
 * Composite specification for NOT logic
 */
class NotSpecification<T> extends Specification<T> {
  constructor(private readonly inner: ISpecification<T>) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.inner.isSatisfiedBy(candidate);
  }
}
