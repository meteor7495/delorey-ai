import type { AiProviderPort } from './provider.port';

export class ProviderRegistry {
  private readonly providers = new Map<string, AiProviderPort>();

  register(provider: AiProviderPort): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): AiProviderPort | undefined {
    return this.providers.get(id);
  }

  require(id: string): AiProviderPort {
    const p = this.providers.get(id);
    if (!p) {
      throw new Error(`Provider not registered: ${id}`);
    }
    return p;
  }

  has(id: string): boolean {
    return this.providers.has(id);
  }

  list(): AiProviderPort[] {
    return [...this.providers.values()];
  }

  ids(): string[] {
    return [...this.providers.keys()];
  }
}
