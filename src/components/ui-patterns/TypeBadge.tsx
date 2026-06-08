import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TYPE_LABEL_PT } from '@/utils/initiativeStatus';
import type { TaskType } from '@/types';

const TYPE_STYLES: Record<TaskType, string> = {
  Feature: 'bg-blue-50 text-blue-700 ring-blue-200',
  Improvement: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  Bug: 'bg-rose-50 text-rose-700 ring-rose-200',
  Deployment: 'bg-slate-50 text-slate-700 ring-slate-200',
  TechDebt: 'bg-amber-50 text-amber-700 ring-amber-200',
  Spike: 'bg-violet-50 text-violet-700 ring-violet-200',
};

interface TypeBadgeProps {
  type: TaskType;
  className?: string;
}

/**
 * Canonical type pill. Replaces per-page `typeColors` maps in TaskCard,
 * kanban cards, ReleaseDetail tasks, etc. Colours stay aligned with TYPE_HEX
 * used in chart fills (initiativeStatus.ts).
 */
export const TypeBadge = ({ type, className }: TypeBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium ring-1 ring-inset border-transparent',
        TYPE_STYLES[type],
        className
      )}
    >
      {TYPE_LABEL_PT[type] ?? type}
    </Badge>
  );
};
