import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /**
   * When `bare`, renders without a Card wrapper — useful inside columns
   * or other surfaces that already provide their own background.
   */
  bare?: boolean;
}

/**
 * Standard empty state for any list, table, board column or page section.
 * Renders icon (h-12 w-12, muted) + title + optional description + optional CTA.
 *
 * Adopted across the product per design.md §6 (Padrões de Estado).
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  bare,
}: EmptyStateProps) => {
  const inner = (
    <div className="flex flex-col items-center text-center gap-3 px-6 py-10">
      <Icon className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );

  if (bare) {
    return <div className={cn('w-full', className)}>{inner}</div>;
  }

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="p-0">{inner}</CardContent>
    </Card>
  );
};
