import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { STATUS_LABEL_PT, STATUS_STYLES } from '@/utils/initiativeStatus';
import type { SprintStatus, TaskStatus, VersionStatus } from '@/types';

/**
 * Canonical status-tone mapping shared by sprint / release / task badges so a
 * "Done" sprint, a "Released" release and a "Done" task all read with the same
 * green tone. Lives here (and not in initiativeStatus.ts) because it's purely a
 * presentation concern. Uses Tailwind shades for now; once design tokens for
 * status states are finalised in index.css this can move to semantic tokens.
 */
const SPRINT_STATUS_STYLES: Record<SprintStatus, string> = {
  Planning: 'bg-amber-50 text-amber-700 ring-amber-200',
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Completed: 'bg-muted text-foreground ring-border',
  Cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const SPRINT_STATUS_LABEL_PT: Record<SprintStatus, string> = {
  Planning: 'Planejamento',
  Active: 'Ativa',
  Completed: 'Concluída',
  Cancelled: 'Cancelada',
};

const VERSION_STATUS_STYLES: Record<VersionStatus, string> = {
  Planned: 'bg-muted text-foreground ring-border',
  InProgress: 'bg-blue-50 text-blue-700 ring-blue-200',
  Released: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const VERSION_STATUS_LABEL_PT: Record<VersionStatus, string> = {
  Planned: 'Planejada',
  InProgress: 'Em andamento',
  Released: 'Lançada',
  Cancelled: 'Cancelada',
};

type Kind = 'task' | 'sprint' | 'release';

interface StatusBadgeProps {
  kind: Kind;
  status: TaskStatus | SprintStatus | VersionStatus;
  /** Override the displayed label (e.g. when translated via i18n). */
  label?: string;
  className?: string;
}

/**
 * Renders the canonical pill for any of the three lifecycle namespaces
 * (Task/Initiative, Sprint, Release). Pass `kind` to scope the lookup.
 *
 * Single source of truth replaces ad-hoc colour maps scattered across
 * Sprints.tsx, Releases.tsx, Backlog kanban cards, etc.
 */
export const StatusBadge = ({ kind, status, label, className }: StatusBadgeProps) => {
  let styles = '';
  let text = label;
  if (kind === 'task') {
    styles = STATUS_STYLES[status as TaskStatus] ?? '';
    text = text ?? STATUS_LABEL_PT[status as TaskStatus] ?? status;
  } else if (kind === 'sprint') {
    styles = SPRINT_STATUS_STYLES[status as SprintStatus] ?? '';
    text = text ?? SPRINT_STATUS_LABEL_PT[status as SprintStatus] ?? status;
  } else {
    styles = VERSION_STATUS_STYLES[status as VersionStatus] ?? '';
    text = text ?? VERSION_STATUS_LABEL_PT[status as VersionStatus] ?? status;
  }

  return (
    <Badge
      variant="outline"
      className={cn('font-medium ring-1 ring-inset border-transparent', styles, className)}
    >
      {text}
    </Badge>
  );
};
