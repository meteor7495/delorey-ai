import {
  OpenAiCompatibleProvider,
  type OpenAiCompatibleProviderConfig,
} from './openai-compatible.provider';

/**
 * 9Router upstream adapter — OpenAI-compatible transport only.
 * Seloma Gateway owns routing, retries, fallbacks, metering, and policy.
 * 9Router must never become system architecture or hold business rules.
 */
export class NineRouterProvider extends OpenAiCompatibleProvider {
  constructor(config: Omit<OpenAiCompatibleProviderConfig, 'providerId'>) {
    super({ ...config, providerId: 'ninerouter' });
  }
}
