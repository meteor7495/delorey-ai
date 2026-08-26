import { Injectable } from '@nestjs/common';
import type { McpRiskLevel } from '../mcp/core/types';
import type { EmployeeOperatingMode } from '../platform/types';

/**
 * Policy-bounded operating modes:
 * - copilot: all write/comms need approval
 * - assistant: auto ≤ LOW risk; MEDIUM+ approval
 * - autopilot: auto ≤ MEDIUM; HIGH+ always approval
 */
@Injectable()
export class OperatingModeService {
  requiresApproval(
    mode: EmployeeOperatingMode,
    risk: McpRiskLevel,
    auditClass?: string,
  ): boolean {
    const rank: Record<McpRiskLevel, number> = {
      READ: 0,
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    };
    const r = rank[risk] ?? 4;

    if (mode === 'copilot') {
      if (r === 0) return false;
      if (
        auditClass === 'write' ||
        auditClass === 'communication' ||
        auditClass === 'financial' ||
        auditClass === 'destructive'
      ) {
        return true;
      }
      return r > 0;
    }
    if (mode === 'assistant') {
      return r >= 2;
    }
    // autopilot
    return r >= 3;
  }
}
