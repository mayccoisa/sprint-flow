import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PRIORITY_LABEL_PT } from '@/utils/initiativeStatus';
import type { TaskPriority } from '@/types';

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  High: 'bg-rose-50 text-rose-700 ring-rose-200',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  Low: 'bg-muted text-muted-foreground ring-border',
};

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

/**
 * Canonical priority pill. Replaces per-page `priorityColors` maps in
 * TaskCard, ProductBacklog, Backlog, kanban cards, etc.
 */
export const PriorityBadge = ({ priority, className }: PriorityBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium ring-1 ring-inset border-transparent',
        PRIORITY_STYLES[priority],
        className
      )}
    >
      {PRIORITY_LABEL_PT[priority] ?? priority}
    </Badge>
  );
};
