/**
 * Plan entitlements — AI Employee is a paid add-on, not included in site-builder plans.
 * @see docs/00-overview/product-positioning.md
 */

/** Plans that unlock AI Employee Runtime + Workspace AI surfaces */
export const AI_EMPLOYEE_PLAN_IDS = [
  'ai-sales',
  'ai-business',
  /** Direct /auth/signup and local demos */
  'trial',
  /** Pre-repositioning aliases still accepted by AccessService */
  'professional',
  'business',
] as const;

export type AiEmployeePlanId = (typeof AI_EMPLOYEE_PLAN_IDS)[number];

export function normalizePlanId(plan: string | null | undefined): string {
  return (plan ?? '').trim().toLowerCase();
}

export function hasAiEmployeeEntitlement(
  plan: string | null | undefined,
): boolean {
  const id = normalizePlanId(plan);
  return (AI_EMPLOYEE_PLAN_IDS as readonly string[]).includes(id);
}
