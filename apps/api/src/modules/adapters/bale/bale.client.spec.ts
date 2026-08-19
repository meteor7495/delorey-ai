import { describe, expect, it } from 'vitest';
import { isBaleWebhookAuthorized } from './bale.client';

describe('isBaleWebhookAuthorized', () => {
  it('rejects when no stored secret exists', () => {
    expect(isBaleWebhookAuthorized(null, undefined)).toBe(false);
    expect(isBaleWebhookAuthorized('', undefined)).toBe(false);
  });

  it('allows missing header because Bale setWebhook has no secret_token', () => {
    expect(isBaleWebhookAuthorized('abc', undefined)).toBe(true);
    expect(isBaleWebhookAuthorized('abc', '  ')).toBe(true);
  });

  it('accepts a matching header and rejects a wrong one', () => {
    expect(isBaleWebhookAuthorized('abc', 'abc')).toBe(true);
    expect(isBaleWebhookAuthorized('abc', 'nope')).toBe(false);
  });
});
