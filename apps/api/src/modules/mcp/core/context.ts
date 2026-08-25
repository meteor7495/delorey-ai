import { AsyncLocalStorage } from 'node:async_hooks';
import type { McpRequestContext } from './types';

export const mcpContextStorage = new AsyncLocalStorage<McpRequestContext>();

export function getMcpContext(): McpRequestContext {
  const ctx = mcpContextStorage.getStore();
  if (!ctx) {
    throw new Error('MCP context missing — call must run inside mcpContextStorage.run');
  }
  return ctx;
}

export function runWithMcpContext<T>(ctx: McpRequestContext, fn: () => Promise<T>): Promise<T> {
  return mcpContextStorage.run(ctx, fn);
}
