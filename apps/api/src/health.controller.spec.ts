import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports ok with seloma-api service id', () => {
    const body = new HealthController().check();
    expect(body.ok).toBe(true);
    expect(body.service).toBe('seloma-api');
    expect(body.slice).toBe('omnichannel-native-shop');
  });
});
