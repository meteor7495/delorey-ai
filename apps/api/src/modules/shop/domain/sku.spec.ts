import { describe, expect, it } from 'vitest';
import { buildVariantSku, isValidSku, normalizeSku, toSlug } from './sku';

describe('toSlug', () => {
  it('lowercases and dash-separates', () => {
    expect(toSlug('Classic T-Shirt', 'abcdef12')).toBe('classic-t-shirt');
  });

  it('trims leading and trailing separators', () => {
    expect(toSlug('  !Hello World!  ', 'abcdef12')).toBe('hello-world');
  });

  it('keeps Persian letters instead of falling back to an id', () => {
    expect(toSlug('راهنمای انتخاب سایز', 'abcdef1234')).toBe(
      'راهنمای-انتخاب-سایز',
    );
  });

  it('turns a ZWNJ into a word separator', () => {
    expect(toSlug('تی\u200cشرت نخی', 'abcdef1234')).toBe('تی-شرت-نخی');
  });

  it('drops invisible bidi marks rather than dashing them', () => {
    expect(toSlug('\u200fکیف چرمی\u200e', 'abcdef1234')).toBe('کیف-چرمی');
  });

  it('folds Arabic lookalikes so identical-looking titles share a slug', () => {
    // Arabic yeh + kaf vs. Persian yeh + keheh — visually identical.
    expect(toSlug('كيف', 'abcdef1234')).toBe(toSlug('کیف', 'abcdef1234'));
  });

  it('strips Arabic diacritics', () => {
    expect(toSlug('مُحَمَّد', 'abcdef1234')).toBe('محمد');
  });

  it('normalizes Persian and Arabic-Indic digits to ASCII', () => {
    expect(toSlug('سایز ۴۲', 'abcdef1234')).toBe('سایز-42');
    expect(toSlug('سایز ٤٢', 'abcdef1234')).toBe('سایز-42');
  });

  it('mixes scripts without inventing separators', () => {
    expect(toSlug('کفش Nike مدل 2024', 'abcdef1234')).toBe('کفش-nike-مدل-2024');
  });

  it('still falls back when nothing survives normalization', () => {
    expect(toSlug('!!! ---', 'abcdef1234')).toBe('item-abcdef12');
    expect(toSlug('', 'abcdef1234')).toBe('item-abcdef12');
  });

  it('never ends in a dash after truncation', () => {
    const slug = toSlug(`${'a'.repeat(80)} tail`, 'abcdef1234');
    expect(slug).toHaveLength(80);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('normalizeSku', () => {
  it('uppercases and dash-separates', () => {
    expect(normalizeSku('ts blk m')).toBe('TS-BLK-M');
  });

  it('collapses invalid characters', () => {
    expect(normalizeSku('ts__blk//m')).toBe('TS-BLK-M');
  });

  it('returns an empty string for input with no alphanumerics', () => {
    expect(normalizeSku('///')).toBe('');
    expect(isValidSku('///')).toBe(false);
    expect(isValidSku('ts-blk-m')).toBe(true);
  });
});

describe('buildVariantSku', () => {
  it('appends normalized value labels to the base SKU', () => {
    expect(buildVariantSku('TS', ['Black', 'M'])).toBe('TS-BLACK-M');
  });

  it('returns the base SKU when there are no labels', () => {
    expect(buildVariantSku('TS', [])).toBe('TS');
  });

  it('is stable for the same inputs', () => {
    expect(buildVariantSku('ts', ['black', 'm'])).toBe(
      buildVariantSku('TS', ['Black', 'M']),
    );
  });
});
