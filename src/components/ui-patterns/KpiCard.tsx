import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  /** Small hint below the value (e.g. "+12% vs last sprint"). */
  hint?: ReactNode;
  className?: string;
}

/**
 * Standardised KPI display per design.md §5.2:
 *   - label: text-sm font-medium text-muted-foreground
 *   - value: text-2xl font-bold
 *   - optional icon (h-4 w-4 muted)
 *   - optional hint (text-xs)
 *
 * Use this for any "Total X / N" style number callouts. Replaces ad-hoc divs
 * that were drifting in size and weight across screens.
 */
export const KpiCard = ({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: KpiCardProps) => {
  return (
    <Card className={className}>
      <CardContent className="p-6 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {hint && <div className={cn('text-xs text-muted-foreground')}>{hint}</div>}
      </CardContent>
    </Card>
  );
};
