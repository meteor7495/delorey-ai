import { describe, expect, it } from 'vitest';
import { inferCartChannel } from './cart';

describe('inferCartChannel', () => {
  it('reads messaging prefixes from the cart session id', () => {
    expect(inferCartChannel('telegram:abc')).toBe('telegram');
    expect(inferCartChannel('bale:1')).toBe('bale');
    expect(inferCartChannel('instagram:xyz')).toBe('instagram');
  });

  it('defaults anonymous website sessions to website', () => {
    expect(inferCartChannel('sess_123')).toBe('website');
    expect(inferCartChannel('')).toBe('website');
  });
});
