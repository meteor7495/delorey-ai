import { Injectable } from '@nestjs/common';
import type {
  McpPromptDefinition,
  McpResourceDefinition,
  McpSurface,
  McpToolDefinition,
} from './types';
import { McpPlatformError } from './errors';

@Injectable()
export class McpRegistry {
  private readonly tools = new Map<string, McpToolDefinition>();
  private readonly resources: McpResourceDefinition[] = [];
  private readonly prompts = new Map<string, McpPromptDefinition>();

  registerTool(def: McpToolDefinition): void {
    if (this.tools.has(def.name)) {
      throw new Error(`Duplicate MCP tool: ${def.name}`);
    }
    this.tools.set(def.name, def);
  }

  registerResource(def: McpResourceDefinition): void {
    this.resources.push(def);
  }

  registerPrompt(def: McpPromptDefinition): void {
    if (this.prompts.has(def.name)) {
      throw new Error(`Duplicate MCP prompt: ${def.name}`);
    }
    this.prompts.set(def.name, def);
  }

  getTool(name: string): McpToolDefinition {
    const t = this.tools.get(name);
    if (!t) throw new McpPlatformError('not_found', `Unknown tool: ${name}`);
    return t;
  }

  listTools(surface?: McpSurface): McpToolDefinition[] {
    const all = [...this.tools.values()];
    if (!surface) return all;
    if (surface === 'public') return all.filter((t) => t.surface === 'public');
    return all;
  }

  listResources(surface?: McpSurface): McpResourceDefinition[] {
    if (!surface) return [...this.resources];
    if (surface === 'public') return this.resources.filter((r) => r.surface === 'public');
    return [...this.resources];
  }

  listPrompts(surface?: McpSurface): McpPromptDefinition[] {
    const all = [...this.prompts.values()];
    if (!surface) return all;
    if (surface === 'public') return all.filter((p) => p.surface === 'public');
    return all;
  }

  getPrompt(name: string): McpPromptDefinition {
    const p = this.prompts.get(name);
    if (!p) throw new McpPlatformError('not_found', `Unknown prompt: ${name}`);
    return p;
  }

  findResource(uri: string): McpResourceDefinition | undefined {
    const exact = this.resources.find((r) => r.uri === uri);
    if (exact) return exact;
    return this.resources.find((r) => {
      if (!r.uri.includes('{')) return false;
      const pattern = r.uri.replace(/\{[^}]+\}/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(uri);
    });
  }
}
