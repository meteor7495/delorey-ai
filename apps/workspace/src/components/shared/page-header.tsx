import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between', className)}>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-1)]">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-[var(--text-3)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
