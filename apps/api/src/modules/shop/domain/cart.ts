export type CartChannel = 'website' | 'telegram' | 'bale' | 'instagram';

const CHANNEL_PREFIX: Array<[string, CartChannel]> = [
  ['telegram:', 'telegram'],
  ['bale:', 'bale'],
  ['instagram:', 'instagram'],
];

export function inferCartChannel(sessionId: string): CartChannel {
  const value = sessionId.trim().toLowerCase();
  for (const [prefix, channel] of CHANNEL_PREFIX) {
    if (value.startsWith(prefix)) return channel;
  }
  return 'website';
}
