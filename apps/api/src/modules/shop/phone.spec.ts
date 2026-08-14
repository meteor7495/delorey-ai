import { describe, expect, it } from 'vitest';
import { isValidMobile, normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('keeps a local 09 mobile number', () => {
    expect(normalizePhone('09121234567')).toBe('09121234567');
  });

  it('converts Persian digits and strips spaces', () => {
    expect(normalizePhone('۰۹۱۲ ۱۲۳ ۴۵۶۷')).toBe('09121234567');
  });

  it('strips +98 / 0098 country code', () => {
    expect(normalizePhone('+989121234567')).toBe('09121234567');
    expect(normalizePhone('00989121234567')).toBe('09121234567');
  });

  it('prefixes a leading 9 with 0', () => {
    expect(normalizePhone('9121234567')).toBe('09121234567');
  });
});

describe('isValidMobile', () => {
  it('accepts Iranian mobiles after normalization', () => {
    expect(isValidMobile('۰۹۱۲۱۲۳۴۵۶۷')).toBe(true);
    expect(isValidMobile('+989121234567')).toBe(true);
  });

  it('rejects too-short or landline-like numbers', () => {
    expect(isValidMobile('02112345678')).toBe(false);
    expect(isValidMobile('0912')).toBe(false);
  });
});
