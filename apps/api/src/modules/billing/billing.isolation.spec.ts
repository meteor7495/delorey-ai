import { describe, expect, it } from 'vitest';
import { BILLING_SERVICES, SERVICE_LABELS_FA } from './domain/billing.types';
import { mapTaskClassToService } from './domain/pricing';

describe('billing tenancy + provider independence', () => {
  it('does not couple services to OpenAI', () => {
    expect(BILLING_SERVICES).toContain('AI_CHAT');
    expect(BILLING_SERVICES).toContain('IMAGE_GENERATION');
    expect(mapTaskClassToService('chat.reply.cheap')).toBe('AI_CHAT');
    expect(mapTaskClassToService('embed.knowledge')).toBe('EMBEDDING');
    expect(mapTaskClassToService('vision.describe')).toBe('IMAGE_GENERATION');
  });

  it('merchant labels are تومان services not tokens', () => {
    expect(SERVICE_LABELS_FA.AI_CHAT).not.toMatch(/token/i);
    expect(SERVICE_LABELS_FA.AI_CHAT).toContain('هوش مصنوعی');
  });
});
