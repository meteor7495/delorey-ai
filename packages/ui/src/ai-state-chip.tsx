'use client';

import { aiColors, aiStateLabel, type AiState } from './tokens';
import { tokens } from './tokens';

export function AiStateChip({ state }: { state: string }) {
  const color = aiColors[state as AiState] ?? tokens.color.muted;
  const isActive = state === 'active';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        border: isActive
          ? '1px solid rgba(139, 116, 255, 0.35)'
          : '1px solid rgba(255,255,255,0.12)',
        background: isActive
          ? 'rgba(108, 77, 255, 0.16)'
          : 'rgba(255,255,255,0.06)',
        color: '#E8E4F0',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: 99,
          background: color,
        }}
      />
      {aiStateLabel(state)}
    </span>
  );
}
