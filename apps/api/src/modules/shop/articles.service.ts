import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../platform/prisma.service';
import { toSlug } from './domain';

const ARTICLE_STATUSES = ['draft', 'published', 'archived'] as const;
type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export interface ArticleInput {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string;
  featuredImageUrl?: string | null;
  categoryId?: string | null;
  tags?: string[];
  status?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface ArticleFilters {
  q?: string;
  status?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, filters: ArticleFilters = {}) {
    const limit = Math.min(Math.max(filters.limit ?? 25, 1), 100);
    const offset = Math.max(filters.offset ?? 0, 0);

    const where: Prisma.ArticleWhereInput = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.q) {
      const q = filters.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.map(r, { withContent: false })),
      total,
      limit,
      offset,
    };
  }

  async get(tenantId: string, id: string) {
    const row = await this.prisma.article.findFirst({
      where: { id, tenantId },
    });
    if (!row) throw new NotFoundException('مقاله پیدا نشد');
    return this.map(row);
  }

  async create(tenantId: string, body: ArticleInput, authorUserId?: string) {
    const title = (body.title ?? '').trim();
    if (!title) throw new BadRequestException('عنوان مقاله الزامی است');

    const status = this.normalizeStatus(body.status);
    const slug = await this.uniqueSlug(
      tenantId,
      body.slug || toSlug(title, uuid()),
    );
    if (body.categoryId) await this.assertCategory(tenantId, body.categoryId);

    const row = await this.prisma.article.create({
      data: {
        tenantId,
        title,
        slug,
        excerpt: body.excerpt ?? null,
        content: body.content ?? '',
        featuredImageUrl: body.featuredImageUrl ?? null,
        categoryId: body.categoryId || null,
        tags: body.tags ?? [],
        status,
        authorUserId: authorUserId ?? null,
        seoTitle: body.seoTitle ?? null,
        seoDescription: body.seoDescription ?? null,
        publishedAt: status === 'published' ? new Date() : null,
      },
    });
    return this.map(row);
  }

  async update(tenantId: string, id: string, body: ArticleInput) {
    const existing = await this.prisma.article.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('مقاله پیدا نشد');

    const slug = body.slug
      ? await this.uniqueSlug(tenantId, body.slug, id)
      : existing.slug;
    const status = body.status
      ? this.normalizeStatus(body.status)
      : (existing.status as ArticleStatus);

    if (body.categoryId) await this.assertCategory(tenantId, body.categoryId);

    const row = await this.prisma.article.update({
      where: { id },
      data: {
        title: body.title?.trim() ?? existing.title,
        slug,
        excerpt: body.excerpt === undefined ? existing.excerpt : body.excerpt,
        content: body.content ?? existing.content,
        featuredImageUrl:
          body.featuredImageUrl === undefined
            ? existing.featuredImageUrl
            : body.featuredImageUrl,
        categoryId:
          body.categoryId === undefined
            ? existing.categoryId
            : body.categoryId || null,
        tags: body.tags ?? existing.tags,
        status,
        seoTitle:
          body.seoTitle === undefined ? existing.seoTitle : body.seoTitle,
        seoDescription:
          body.seoDescription === undefined
            ? existing.seoDescription
            : body.seoDescription,
        publishedAt: this.resolvePublishedAt(status, existing.publishedAt),
      },
    });
    return this.map(row);
  }

  async setStatus(tenantId: string, id: string, status: ArticleStatus) {
    const existing = await this.prisma.article.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('مقاله پیدا نشد');

    const row = await this.prisma.article.update({
      where: { id },
      data: {
        status,
        publishedAt: this.resolvePublishedAt(status, existing.publishedAt),
      },
    });
    return this.map(row);
  }

  publish(tenantId: string, id: string) {
    return this.setStatus(tenantId, id, 'published');
  }

  unpublish(tenantId: string, id: string) {
    return this.setStatus(tenantId, id, 'draft');
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.article.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('مقاله پیدا نشد');
    await this.prisma.article.delete({ where: { id } });
    return { ok: true };
  }

  // ─── Public / AI reads ─────────────────────────────────────────────

  async published(tenantId: string, opts: { q?: string; limit?: number } = {}) {
    const limit = Math.min(Math.max(opts.limit ?? 10, 1), 50);
    const where: Prisma.ArticleWhereInput = { tenantId, status: 'published' };
    if (opts.q) {
      const q = opts.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }
    const rows = await this.prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => this.map(r, { withContent: false }));
  }

  async publishedBySlug(tenantId: string, slug: string) {
    const row = await this.prisma.article.findFirst({
      where: { tenantId, slug, status: 'published' },
    });
    if (!row) throw new NotFoundException('مقاله پیدا نشد');
    return this.map(row);
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private normalizeStatus(status?: string): ArticleStatus {
    if (status && (ARTICLE_STATUSES as readonly string[]).includes(status)) {
      return status as ArticleStatus;
    }
    if (status) throw new BadRequestException('وضعیت مقاله نامعتبر است');
    return 'draft';
  }

  /**
   * First publish stamps the date. Unpublishing keeps it so re-publishing does
   * not reorder the article ahead of newer content.
   */
  private resolvePublishedAt(next: ArticleStatus, current: Date | null) {
    if (next === 'published') return current ?? new Date();
    return current;
  }

  private async assertCategory(tenantId: string, categoryId: string) {
    const found = await this.prisma.category.count({
      where: { tenantId, id: categoryId },
    });
    if (found === 0) throw new BadRequestException('دسته پیدا نشد');
  }

  private async uniqueSlug(tenantId: string, desired: string, skipId?: string) {
    const base = toSlug(desired, uuid());
    let slug = base;
    let n = 2;
    for (;;) {
      const clash = await this.prisma.article.findFirst({
        where: { tenantId, slug, ...(skipId ? { NOT: { id: skipId } } : {}) },
        select: { id: true },
      });
      if (!clash) return slug;
      slug = `${base}-${n++}`;
    }
  }

  private map(
    row: {
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      content: string;
      featuredImageUrl: string | null;
      categoryId: string | null;
      tags: string[];
      status: string;
      authorUserId: string | null;
      seoTitle: string | null;
      seoDescription: string | null;
      publishedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    opts: { withContent?: boolean } = {},
  ) {
    const withContent = opts.withContent !== false;
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      ...(withContent ? { content: row.content } : {}),
      featuredImageUrl: row.featuredImageUrl,
      categoryId: row.categoryId,
      tags: row.tags,
      status: row.status,
      authorUserId: row.authorUserId,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
