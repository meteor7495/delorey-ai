/**
 * Slug / SKU normalization shared by products, variants, categories and
 * articles so tenant-scoped uniqueness checks always compare the same shape.
 */

/**
 * Invisible bidi and joiner marks that carry no meaning in a URL. ZWNJ (U+200C)
 * is deliberately excluded — it separates Persian words, so it should become a
 * dash rather than disappear.
 */
const INVISIBLE_MARKS = /[\u200b\u200d\u200e\u200f\u2060\ufeff]/g;

/** Arabic diacritics and tatweel: decorative, and invisible once encoded. */
const ARABIC_DIACRITICS = /[\u0640\u064b-\u065f\u0670]/g;

/** Codepoints that render identically to their Persian counterparts. */
const LOOKALIKE_LETTERS: Array<[RegExp, string]> = [
  [/[\u064a\u0649]/g, '\u06cc'], // arabic yeh / alef maksura → farsi yeh
  [/\u0643/g, '\u06a9'], // arabic kaf → keheh
];

/** Persian (U+06F0) and Arabic-Indic (U+0660) digits → ASCII. */
function normalizeDigits(input: string): string {
  return input
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/**
 * URL-safe slug that keeps non-Latin letters.
 *
 * Persian titles are the norm here, and stripping them to ASCII left every
 * product and article with an opaque `item-<id>` URL. Percent-encoded Unicode
 * paths are valid and indexable, so letters from any script are preserved and
 * only punctuation collapses to dashes.
 *
 * Lookalike letters and digit forms are folded first so that two titles a
 * merchant cannot visually tell apart never produce two different slugs.
 */
export function toSlug(input: string, fallback: string): string {
  let slug = input
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(INVISIBLE_MARKS, '')
    .replace(ARABIC_DIACRITICS, '');

  for (const [pattern, replacement] of LOOKALIKE_LETTERS) {
    slug = slug.replace(pattern, replacement);
  }

  slug = normalizeDigits(slug)
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    // The slice can land mid-separator.
    .replace(/-+$/g, '');

  if (slug) return slug;
  return `item-${fallback.slice(0, 8)}`;
}

/** Uppercase, dash-separated SKU. Empty input yields an empty string. */
export function normalizeSku(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

export function isValidSku(input: string): boolean {
  return normalizeSku(input).length > 0;
}

/**
 * Deterministic variant SKU, e.g. buildVariantSku('TS', ['Black', 'M'])
 * → 'TS-BLACK-M'. Callers still need a tenant-scoped uniqueness check.
 */
export function buildVariantSku(baseSku: string, valueLabels: string[]): string {
  const base = normalizeSku(baseSku);
  const suffix = valueLabels
    .map((label) => normalizeSku(label))
    .filter(Boolean)
    .join('-');
  if (!suffix) return base;
  return normalizeSku(`${base}-${suffix}`);
}
