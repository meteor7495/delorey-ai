import { describe, expect, it } from 'vitest';
import { hasAiEmployeeEntitlement } from './entitlements';

describe('hasAiEmployeeEntitlement', () => {
  it('allows AI add-on plans', () => {
    expect(hasAiEmployeeEntitlement('ai-sales')).toBe(true);
    expect(hasAiEmployeeEntitlement('ai-business')).toBe(true);
    expect(hasAiEmployeeEntitlement('AI-Sales')).toBe(true);
  });

  it('allows trial and legacy aliases', () => {
    expect(hasAiEmployeeEntitlement('trial')).toBe(true);
    expect(hasAiEmployeeEntitlement('professional')).toBe(true);
    expect(hasAiEmployeeEntitlement('business')).toBe(true);
  });

  it('denies site-builder plans', () => {
    expect(hasAiEmployeeEntitlement('site-starter')).toBe(false);
    expect(hasAiEmployeeEntitlement('site-growth')).toBe(false);
    expect(hasAiEmployeeEntitlement('site-pro')).toBe(false);
    expect(hasAiEmployeeEntitlement('starter')).toBe(false);
  });

  it('denies empty / unknown', () => {
    expect(hasAiEmployeeEntitlement(null)).toBe(false);
    expect(hasAiEmployeeEntitlement(undefined)).toBe(false);
    expect(hasAiEmployeeEntitlement('')).toBe(false);
    expect(hasAiEmployeeEntitlement('unknown-plan')).toBe(false);
  });
});
