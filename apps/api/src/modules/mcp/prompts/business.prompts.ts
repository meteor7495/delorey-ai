import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../core/registry';

@Injectable()
export class McpPromptsRegistrar implements OnModuleInit {
  constructor(private readonly registry: McpRegistry) {}

  onModuleInit() {
    this.registry.registerPrompt({
      name: 'analyze_store',
      title: 'Analyze store',
      description: 'Prompt template to analyze store settings, catalog health, and next actions.',
      surface: 'internal',
      argsSchema: z.object({
        focus: z.string().optional().describe('Optional focus area'),
      }),
      build: async (_ctx, args) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Analyze this Seloma merchant store using MCP tools.',
                '1) Read seloma://store/settings',
                '2) Call analytics_get_summary and commerce_search_products (limit 10)',
                '3) Summarize risks, opportunities, and 3 concrete next actions.',
                args.focus ? `Focus: ${args.focus}` : '',
                'Do not invent prices or stock. Do not call high-risk tools without need.',
              ]
                .filter(Boolean)
                .join('\n'),
            },
          },
        ],
      }),
    });

    this.registry.registerPrompt({
      name: 'analyze_sales',
      title: 'Analyze sales',
      description: 'Template for revenue and channel performance analysis.',
      surface: 'internal',
      argsSchema: z.object({
        days: z.string().optional(),
      }),
      build: async (_ctx, args) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze sales for the last ${args.days ?? '7'} days using analytics_get_revenue, analytics_get_channel_performance, and orders_get_order_statistics. Return concise insights with figures. No fabricated data.`,
            },
          },
        ],
      }),
    });

    this.registry.registerPrompt({
      name: 'inventory_analysis',
      title: 'Inventory analysis',
      description: 'Template for low/out-of-stock review.',
      surface: 'internal',
      build: async () => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Use inventory_get_summary, inventory_get_low_stock, and inventory_get_out_of_stock. Prioritize restock recommendations. Do not adjust stock unless explicitly asked.',
            },
          },
        ],
      }),
    });

    this.registry.registerPrompt({
      name: 'daily_business_report',
      title: 'Daily business report',
      description: 'Morning ops digest template.',
      surface: 'internal',
      build: async () => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Produce a daily business report: analytics_get_summary(days=1), orders_search_orders (pending statuses), inventory_get_low_stock, channels_search_conversations(ownership=human_owned). Keep it short and actionable.',
            },
          },
        ],
      }),
    });

    this.registry.registerPrompt({
      name: 'customer_support',
      title: 'Customer support',
      description: 'Support handling with knowledge + order lookup.',
      surface: 'internal',
      argsSchema: z.object({
        issue: z.string().describe('Customer issue summary'),
      }),
      build: async (_ctx, args) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Help resolve: ${args.issue}. Use knowledge_search and orders_get_order when ids are known. Never refund/cancel via MCP. Escalate with channels_takeover_conversation when needed.`,
            },
          },
        ],
      }),
    });

    this.registry.registerPrompt({
      name: 'product_description',
      title: 'Product description',
      description: 'Write product copy from catalog facts only.',
      surface: 'internal',
      argsSchema: z.object({
        productId: z.string(),
      }),
      build: async (_ctx, args) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Call commerce_get_product for ${args.productId}, then draft a concise Persian product description. Do not invent price, SKU, or stock.`,
            },
          },
        ],
      }),
    });
  }
}
