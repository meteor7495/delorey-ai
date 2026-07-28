import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--surface-3)] border border-[var(--border-color)]">
        <Icon className="h-7 w-7 text-[var(--text-4)]" />
      </div>
      <div>
        <p className="font-semibold text-[var(--text-1)]">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-[var(--text-3)]">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
