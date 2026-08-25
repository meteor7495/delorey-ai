import { z } from 'zod';

export const paginationInput = {
  limit: z.number().int().min(1).max(100).default(20).describe('Page size (max 100)'),
  offset: z.number().int().min(0).default(0).describe('Offset for pagination'),
};

export const paginationSchema = z.object(paginationInput);

export function pageMeta(total: number, limit: number, offset: number) {
  return { total, limit, offset, hasMore: offset + limit < total };
}

export function defineToolInput<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape);
}
