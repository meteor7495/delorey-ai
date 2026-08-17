import { describe, expect, it } from 'vitest';
import {
  hashCheckoutToken,
  issueCheckoutToken,
  verifyCheckoutToken,
} from './checkout-token';

describe('checkout token', () => {
  it('issues a signed token that verifies with the same secret', () => {
    const { token, hash } = issueCheckoutToken('secret');
    expect(verifyCheckoutToken(token, 'secret')).toBe(true);
    expect(hashCheckoutToken(token)).toBe(hash);
  });

  it('rejects a tampered token or the wrong secret', () => {
    const { token } = issueCheckoutToken('secret');
    expect(verifyCheckoutToken(token, 'other')).toBe(false);
    expect(verifyCheckoutToken(`${token}x`, 'secret')).toBe(false);
    expect(verifyCheckoutToken('not-a-token', 'secret')).toBe(false);
  });
});
