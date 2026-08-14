const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizePhone(raw: string): string {
  let s = raw.trim();
  s = s.replace(/[۰-۹]/g, (ch) => String(FA_DIGITS.indexOf(ch)));
  s = s.replace(/[٠-٩]/g, (ch) => String(AR_DIGITS.indexOf(ch)));
  s = s.replace(/[^\d]/g, '');
  if (s.startsWith('0098')) s = s.slice(4);
  if (s.startsWith('98') && s.length >= 12) s = s.slice(2);
  if (s.startsWith('9') && s.length === 10) s = `0${s}`;
  return s;
}

export function isValidMobile(phone: string): boolean {
  const n = normalizePhone(phone);
  return /^09\d{9}$/.test(n);
}
