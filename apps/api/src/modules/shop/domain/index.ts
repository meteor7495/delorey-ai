/**
 * Commerce Core domain layer — pure, framework-free business rules.
 *
 * Application services (and later the AI Runtime commerce tools) must go
 * through these functions so pricing, stock and discount logic has exactly one
 * implementation.
 */
export * from './commerce-errors';
export * from './discounts';
export * from './inventory';
export * from './pricing';
export * from './sku';
export * from './variant-combinations';
