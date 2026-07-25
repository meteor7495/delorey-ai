export const tokens = {
  color: {
    bg: '#f4f6f8',
    surface: '#ffffff',
    text: '#14212b',
    muted: '#5b6b76',
    accent: '#0f6e6e',
    success: '#1f7a4c',
    warning: '#b54708',
    danger: '#b42318',
    info: '#175cd3',
    border: '#d7dee5',
  },
  font: {
    sans: '"Vazirmatn", "Segoe UI", Tahoma, sans-serif',
  },
  radius: {
    sm: '6px',
    md: '10px',
  },
} as const;

export type AiState =
  | 'inactive'
  | 'active'
  | 'paused'
  | 'syncing'
  | 'degraded'
  | 'awaiting_human';

const aiLabels: Record<AiState, string> = {
  inactive: 'غیرفعال',
  active: 'فعال',
  paused: 'متوقف',
  syncing: 'در حال همگام‌سازی',
  degraded: 'مختل',
  awaiting_human: 'در انتظار انسان',
};

const aiColors: Record<AiState, string> = {
  inactive: tokens.color.muted,
  active: tokens.color.success,
  paused: '#b54708',
  syncing: tokens.color.info,
  degraded: tokens.color.danger,
  awaiting_human: tokens.color.danger,
};

export function aiStateLabel(state: string): string {
  return aiLabels[state as AiState] ?? state;
}

export function AiStateChip({ state }: { state: string }) {
  const color = aiColors[state as AiState] ?? tokens.color.muted;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        color: tokens.color.text,
        fontSize: 13,
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
