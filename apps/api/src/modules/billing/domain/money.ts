/** Integer تومان helpers. Never display tokens to merchants. */

export function toIrt(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

export function assertPositiveIrt(amount: number, field = 'amount'): number {
  const n = toIrt(amount);
  if (n <= 0) {
    throw new Error(`${field} must be a positive integer تومان`);
  }
  return n;
}

export function availableBalance(balance: number, reserved: number): number {
  return Math.max(0, toIrt(balance) - toIrt(reserved));
}

export function canCover(available: number, charge: number): boolean {
  const c = toIrt(charge);
  if (c < 0) return false;
  if (c === 0) return true;
  return toIrt(available) >= c;
}

export function tehranParts(now = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  return {
    year: parts.year!,
    month: parts.month!,
    day: parts.day!,
    hour: parts.hour!,
    minute: parts.minute!,
    second: parts.second!,
  };
}

/** Start of calendar day in Asia/Tehran, as a UTC Date. */
export function tehranDayStart(now = new Date()): Date {
  const p = tehranParts(now);
  return tehranWallToUtc(p.year, p.month, p.day, '00', '00', '00');
}

/** Start of calendar month in Asia/Tehran, as a UTC Date. */
export function tehranMonthStart(now = new Date()): Date {
  const p = tehranParts(now);
  return tehranWallToUtc(p.year, p.month, '01', '00', '00', '00');
}

export function tehranMonthKey(now = new Date()): string {
  const p = tehranParts(now);
  return `${p.year}-${p.month}`;
}

function tehranWallToUtc(
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string,
  second: string,
): Date {
  const guess = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}+03:30`,
  );
  return guess;
}
