import { CommerceRuleError } from './commerce-errors';

/**
 * Variant matrix generation.
 *
 * A variant is identified by its `optionsKey` — the sorted, de-duplicated join
 * of the attribute value ids it is built from. Sorting makes the key
 * independent of the order the merchant picked the attributes in, so
 * `@@unique([productId, optionsKey])` is enough to make duplicate combinations
 * impossible at the database level.
 */

/** Upper bound on a single generate call — protects against matrix explosion. */
export const MAX_GENERATED_VARIANTS = 500;

export const OPTIONS_KEY_SEPARATOR = '|';

export interface AttributeSelection {
  attributeId: string;
  /** Attribute value ids the merchant selected for this attribute. */
  valueIds: string[];
}

export interface VariantCombination {
  /** Value ids in attribute order — use this for labels and SKU suffixes. */
  valueIds: string[];
  /** Stable identity of the combination. */
  optionsKey: string;
}

export interface CombinationDiff {
  toCreate: VariantCombination[];
  toRemove: string[];
  unchanged: string[];
}

export function buildOptionsKey(valueIds: string[]): string {
  return [...new Set(valueIds)].sort().join(OPTIONS_KEY_SEPARATOR);
}

export function parseOptionsKey(optionsKey: string): string[] {
  if (!optionsKey) return [];
  return optionsKey.split(OPTIONS_KEY_SEPARATOR).filter(Boolean);
}

/**
 * Attributes with no selected values do not participate — unchecking every
 * value of one attribute narrows the matrix instead of emptying it.
 */
function usableSelections(
  attributes: AttributeSelection[],
): AttributeSelection[] {
  return attributes
    .map((attribute) => ({
      attributeId: attribute.attributeId,
      valueIds: [...new Set(attribute.valueIds)].filter(Boolean),
    }))
    .filter((attribute) => attribute.valueIds.length > 0);
}

export function countCombinations(attributes: AttributeSelection[]): number {
  const selections = usableSelections(attributes);
  if (selections.length === 0) return 0;
  return selections.reduce((total, a) => total * a.valueIds.length, 1);
}

/** Cartesian product of the selected attribute values. */
export function generateCombinations(
  attributes: AttributeSelection[],
): VariantCombination[] {
  const selections = usableSelections(attributes);
  if (selections.length === 0) return [];

  const total = countCombinations(selections);
  if (total > MAX_GENERATED_VARIANTS) {
    throw new CommerceRuleError(
      'variant_limit_exceeded',
      `تعداد ترکیب‌ها (${total}) از حد مجاز ${MAX_GENERATED_VARIANTS} بیشتر است`,
    );
  }

  let rows: string[][] = [[]];
  for (const attribute of selections) {
    const next: string[][] = [];
    for (const row of rows) {
      for (const valueId of attribute.valueIds) {
        next.push([...row, valueId]);
      }
    }
    rows = next;
  }

  return rows.map((valueIds) => ({
    valueIds,
    optionsKey: buildOptionsKey(valueIds),
  }));
}

/**
 * Compare requested combinations against the variants a product already has,
 * so a regenerate only creates what is missing and never silently drops
 * variants the merchant still wants.
 */
export function diffCombinations(
  existingKeys: string[],
  requested: VariantCombination[],
): CombinationDiff {
  const existing = new Set(existingKeys);
  const requestedKeys = new Set(requested.map((c) => c.optionsKey));

  const seen = new Set<string>();
  const toCreate: VariantCombination[] = [];
  for (const combination of requested) {
    if (existing.has(combination.optionsKey)) continue;
    if (seen.has(combination.optionsKey)) continue;
    seen.add(combination.optionsKey);
    toCreate.push(combination);
  }

  return {
    toCreate,
    toRemove: existingKeys.filter((key) => !requestedKeys.has(key)),
    unchanged: existingKeys.filter((key) => requestedKeys.has(key)),
  };
}

/** True when the combination is already present in the given keys. */
export function isDuplicateCombination(
  existingKeys: string[],
  valueIds: string[],
): boolean {
  return existingKeys.includes(buildOptionsKey(valueIds));
}
