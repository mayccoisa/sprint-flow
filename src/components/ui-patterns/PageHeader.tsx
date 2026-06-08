import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Right-aligned action buttons (one primary + optional secondaries). */
  actions?: ReactNode;
  /** Inline badge rendered next to the title (e.g. "público", "Beta"). */
  badge?: ReactNode;
  className?: string;
}

/**
 * Canonical page header per design.md §4.2:
 *   h1 (text-2xl font-semibold tracking-tight) + optional subtitle (text-sm muted) + actions.
 *
 * Use this in every page-level component instead of rolling your own markup.
 * Keeps page tops visually consistent across the product.
 */
export const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  badge,
  className,
}: PageHeaderProps) => {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 flex-wrap',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          {Icon && <Icon className="h-6 w-6 text-primary" aria-hidden="true" />}
          {title}
          {badge}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
};
