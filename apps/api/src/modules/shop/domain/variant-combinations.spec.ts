import { describe, expect, it } from 'vitest';
import { CommerceRuleError } from './commerce-errors';
import {
  MAX_GENERATED_VARIANTS,
  buildOptionsKey,
  countCombinations,
  diffCombinations,
  generateCombinations,
  isDuplicateCombination,
  parseOptionsKey,
} from './variant-combinations';

const COLOR = 'attr-color';
const SIZE = 'attr-size';

describe('buildOptionsKey', () => {
  it('is independent of the order the values were selected in', () => {
    expect(buildOptionsKey(['black', 'medium'])).toBe(
      buildOptionsKey(['medium', 'black']),
    );
  });

  it('de-duplicates repeated values', () => {
    expect(buildOptionsKey(['black', 'black', 'medium'])).toBe('black|medium');
  });

  it('round-trips through parseOptionsKey', () => {
    const key = buildOptionsKey(['medium', 'black']);
    expect(parseOptionsKey(key)).toEqual(['black', 'medium']);
  });

  it('treats an empty key as no values', () => {
    expect(parseOptionsKey('')).toEqual([]);
  });
});

describe('generateCombinations', () => {
  it('produces the full cartesian product', () => {
    const combinations = generateCombinations([
      { attributeId: COLOR, valueIds: ['black', 'white'] },
      { attributeId: SIZE, valueIds: ['s', 'm', 'l'] },
    ]);

    expect(combinations).toHaveLength(6);
    expect(combinations.map((c) => c.optionsKey).sort()).toEqual([
      'black|l',
      'black|m',
      'black|s',
      'l|white',
      'm|white',
      's|white',
    ]);
  });

  it('keeps value ids in attribute order for labels and SKUs', () => {
    const combinations = generateCombinations([
      { attributeId: COLOR, valueIds: ['black'] },
      { attributeId: SIZE, valueIds: ['m'] },
    ]);

    expect(combinations).toHaveLength(1);
    expect(combinations[0]?.valueIds).toEqual(['black', 'm']);
  });

  it('never produces duplicate combinations', () => {
    const combinations = generateCombinations([
      { attributeId: COLOR, valueIds: ['black', 'black', 'white'] },
      { attributeId: SIZE, valueIds: ['m'] },
    ]);

    const keys = combinations.map((c) => c.optionsKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toHaveLength(2);
  });

  it('ignores attributes with no selected values instead of emptying the matrix', () => {
    const combinations = generateCombinations([
      { attributeId: COLOR, valueIds: ['black', 'white'] },
      { attributeId: SIZE, valueIds: [] },
    ]);

    expect(combinations.map((c) => c.optionsKey)).toEqual(['black', 'white']);
  });

  it('returns nothing when no attribute has values', () => {
    expect(generateCombinations([])).toEqual([]);
    expect(
      generateCombinations([{ attributeId: COLOR, valueIds: [] }]),
    ).toEqual([]);
  });

  it('rejects a matrix larger than the generation limit', () => {
    const attributes = [
      { attributeId: 'a', valueIds: Array.from({ length: 30 }, (_, i) => `a${i}`) },
      { attributeId: 'b', valueIds: Array.from({ length: 30 }, (_, i) => `b${i}`) },
    ];

    expect(countCombinations(attributes)).toBeGreaterThan(
      MAX_GENERATED_VARIANTS,
    );
    expect(() => generateCombinations(attributes)).toThrowError(
      CommerceRuleError,
    );
  });
});

describe('diffCombinations', () => {
  it('creates only what is missing and flags what is no longer requested', () => {
    const requested = generateCombinations([
      { attributeId: COLOR, valueIds: ['black', 'white'] },
      { attributeId: SIZE, valueIds: ['m'] },
    ]);

    const diff = diffCombinations(['black|m', 'red|m'], requested);

    expect(diff.toCreate.map((c) => c.optionsKey)).toEqual(['m|white']);
    expect(diff.unchanged).toEqual(['black|m']);
    expect(diff.toRemove).toEqual(['red|m']);
  });

  it('is a no-op when everything already exists', () => {
    const requested = generateCombinations([
      { attributeId: COLOR, valueIds: ['black'] },
      { attributeId: SIZE, valueIds: ['m'] },
    ]);

    const diff = diffCombinations(['black|m'], requested);

    expect(diff.toCreate).toEqual([]);
    expect(diff.toRemove).toEqual([]);
    expect(diff.unchanged).toEqual(['black|m']);
  });
});

describe('isDuplicateCombination', () => {
  it('detects an existing combination regardless of value order', () => {
    expect(isDuplicateCombination(['black|m'], ['m', 'black'])).toBe(true);
    expect(isDuplicateCombination(['black|m'], ['white', 'm'])).toBe(false);
  });
});
