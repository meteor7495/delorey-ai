import { createHmac, createHash, randomBytes, timingSafeEqual } from 'crypto';

export function hashCheckoutToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function issueCheckoutToken(secret: string): { token: string; hash: string } {
  const nonce = randomBytes(24).toString('base64url');
  const sig = createHmac('sha256', secret).update(nonce).digest('base64url');
  const token = `${nonce}.${sig}`;
  return { token, hash: hashCheckoutToken(token) };
}

export function verifyCheckoutToken(token: string, secret: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [nonce, sig] = parts;
  if (!nonce || !sig) return false;
  const expected = createHmac('sha256', secret).update(nonce).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
