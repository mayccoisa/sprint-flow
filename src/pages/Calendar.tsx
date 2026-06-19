import { useEffect, useMemo, useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer, View, ToolbarProps } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Layout } from '@/components/Layout';
import { Task, Sprint, Release, Squad } from '@/types';
import { PRIORITY_LABEL_PT } from '@/utils/initiativeStatus';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useLocalData } from '@/hooks/useLocalData';
import { InitiativeFormDialog } from '@/components/InitiativeFormDialog';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  buildShareUrl,
  disablePublicCalendar,
  enablePublicCalendar,
  getShareInfo,
} from '@/lib/publicCalendar';
import {
  AlertTriangle,
  History,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  CalendarDays,
  Rocket,
  Bug,
  Wrench,
  Sparkles,
  FlaskConical,
  Truck,
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  ListTodo,
  Share2,
  Globe,
  Lock,
  Copy,
  Check,
} from 'lucide-react';
import { format, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, parseDateLocal } from '@/lib/utils';
import { PageHeader } from '@/components/ui-patterns';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

type EventType = 'sprint' | 'task' | 'release';

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  type: EventType;
  data: Sprint | Task | Release;
  color: string;
  meta: {
    icon: typeof Rocket;
    subtitle?: string;
    hasAlert?: boolean;
  };
}

// ---------- design tokens ----------
const SQUAD_PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ec4899', '#14b8a6', '#6366f1'];

const TASK_TYPE_STYLES: Record<string, { color: string; icon: typeof Rocket; label: string }> = {
  Feature: { color: '#3b82f6', icon: Sparkles, label: 'Feature' },
  Bug: { color: '#ef4444', icon: Bug, label: 'Bug' },
  TechDebt: { color: '#f59e0b', icon: Wrench, label: 'Tech Debt' },
  Spike: { color: '#8b5cf6', icon: FlaskConical, label: 'Spike' },
  Improvement: { color: '#06b6d4', icon: Sparkles, label: 'Melhoria' },
  Deployment: { color: '#64748b', icon: Truck, label: 'Deploy' },
};

/** Colors for the two process bars an initiative can render on the canvas.
 *  The bar color encodes the *process* (Produto/Engenharia); the task-type is
 *  still conveyed by the icon. */
const PROCESS_STYLES = {
  product: { color: '#06b6d4', label: 'Produto' },
  engineering: { color: '#8b5cf6', label: 'Engenharia' },
} as const;

const RELEASE_STATUS_STYLES: Record<string, { color: string; icon: typeof Rocket; label: string }> = {
  Planned: { color: '#64748b', icon: ListTodo, label: 'Planejada' },
  InProgress: { color: '#3b82f6', icon: Rocket, label: 'Em andamento' },
  Released: { color: '#10b981', icon: CheckCircle2, label: 'Lançada' },
  Cancelled: { color: '#ef4444', icon: XCircle, label: 'Cancelada' },
};

const SPRINT_STATUS_LABELS: Record<string, string> = {
  Planning: 'Planejamento',
  Active: 'Ativa',
  Completed: 'Concluída',
  Cancelled: 'Cancelada',
};

// ---------- helpers ----------
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Resolve a [start, end] range from a date pair, tolerating a missing start
 *  (falls back to the end date) so initiatives that only have a deadline still
 *  get positioned on the canvas instead of being silently dropped. */
function resolveRange(
  startStr: string | null | undefined,
  endStr: string | null | undefined
): { start: Date; end: Date } | null {
  const start = parseDateLocal(startStr ?? null) ?? parseDateLocal(endStr ?? null);
  if (!start) return null;
  let end = parseDateLocal(endStr ?? null) ?? start;
  // Defend against inverted ranges (end before start): a negative-duration
  // event is invalid and react-big-calendar silently drops it, making the
  // initiative vanish from the canvas. Clamp end to start so it still renders
  // (as a single-day bar) on the start date.
  if (end < start) end = start;
  return { start, end };
}

/** Human-readable label for a date pair, used in the task popover. */
function formatRange(startStr: string | null | undefined, endStr: string | null | undefined): string {
  const s = parseDateLocal(startStr ?? null);
  const e = parseDateLocal(endStr ?? null);
  if (s && e) return `${format(s, 'dd/MM', { locale: ptBR })} → ${format(e, 'dd/MM/yy', { locale: ptBR })}`;
  if (s) return format(s, 'dd/MM/yy', { locale: ptBR });
  if (e) return `até ${format(e, 'dd/MM/yy', { locale: ptBR })}`;
  return '—';
}

/** Build the calendar event(s) for one initiative. Renders up to two bars —
 *  one for the Product period and one for the Engineering period. When neither
 *  process range is set, falls back to a single bar from the overall
 *  start/end (legacy initiatives that predate the split). */
function buildTaskEvents(task: Task, hasAlert: boolean): CalendarEvent[] {
  const typeStyle = TASK_TYPE_STYLES[task.task_type] || TASK_TYPE_STYLES.Feature;
  const out: CalendarEvent[] = [];

  const product = resolveRange(task.product_start_date, task.product_end_date);
  if (product) {
    out.push({
      id: task.id * 10 + 1,
      title: task.title,
      start: product.start,
      end: endOfDay(product.end),
      type: 'task',
      data: task,
      color: PROCESS_STYLES.product.color,
      meta: { icon: typeStyle.icon, subtitle: `${PROCESS_STYLES.product.label} · ${typeStyle.label}`, hasAlert },
    });
  }

  const eng = resolveRange(task.eng_start_date, task.eng_end_date);
  if (eng) {
    out.push({
      id: task.id * 10 + 2,
      title: task.title,
      start: eng.start,
      end: endOfDay(eng.end),
      type: 'task',
      data: task,
      color: PROCESS_STYLES.engineering.color,
      meta: { icon: typeStyle.icon, subtitle: `${PROCESS_STYLES.engineering.label} · ${typeStyle.label}`, hasAlert },
    });
  }

  if (out.length === 0) {
    const total = resolveRange(task.start_date, task.end_date);
    if (total) {
      out.push({
        id: task.id * 10,
        title: task.title,
        start: total.start,
        end: endOfDay(total.end),
        type: 'task',
        data: task,
        color: typeStyle.color,
        meta: { icon: typeStyle.icon, subtitle: typeStyle.label, hasAlert },
      });
    }
  }

  return out;
}

interface CalendarProps {
  publicMode?: boolean;
}

export default function Calendar({ publicMode = false }: CalendarProps = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspace();
  const { data: firestoreData, updateTask } = useLocalData() as any;
  const taskDateChanges = firestoreData.taskDateChanges;
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [showSprints, setShowSprints] = useState(true);
  const [showReleases, setShowReleases] = useState(true);
  const [selectedSquad, setSelectedSquad] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  /** Active when the user "zooms" into a sprint — calendar then renders the
   *  tasks inside that sprint instead of the sprint/release overview. */
  const [zoomedSprintId, setZoomedSprintId] = useState<number | null>(null);
  /** Cross-sprint mode: shows every initiative attached to any sprint with a
   *  start_date on the canvas. Mutually exclusive with zoom into a single sprint.
   *  Defaults ON — the main calendar lands on the initiative view; the
   *  Sprints+Releases overview is one click away in the header selector. */
  const [allInitiativesMode, setAllInitiativesMode] = useState(true);
  /** Task currently being edited via the calendar popover → "Editar" flow. */
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const initialShare = currentWorkspaceId ? getShareInfo(currentWorkspaceId) : null;
  const [isPublic, setIsPublic] = useState<boolean>(!!initialShare?.isPublic);
  const [shareToken, setShareToken] = useState<string | null>(initialShare?.token || null);
  const [copied, setCopied] = useState(false);

  const handleTogglePublic = async (value: boolean) => {
    if (!currentWorkspaceId) return;
    try {
      if (value) {
        const entry = await enablePublicCalendar(currentWorkspaceId);
        setShareToken(entry.token);
        setIsPublic(true);
        toast({
          title: 'Calendário público',
          description: 'Qualquer pessoa com o link pode visualizar.',
        });
      } else {
        await disablePublicCalendar(currentWorkspaceId);
        setIsPublic(false);
        toast({ title: 'Calendário privado', description: 'O link público foi desativado.' });
      }
    } catch (err: any) {
      toast({
        title: 'Não foi possível atualizar o link',
        description: err?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    }
  };

  const shareUrl = shareToken ? buildShareUrl(shareToken) : '';

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: 'Não foi possível copiar', variant: 'destructive' });
    }
  };

  const sprints: Sprint[] = firestoreData.sprints;
  const tasks: Task[] = useMemo(
    () =>
      firestoreData.tasks.filter(
        (t) =>
          t.start_date ||
          t.end_date ||
          t.product_start_date ||
          t.product_end_date ||
          t.eng_start_date ||
          t.eng_end_date
      ),
    [firestoreData.tasks]
  );
  const releases: Release[] = firestoreData.releases;
  const squads: Squad[] = firestoreData.squads;

  const zoomedSprint = useMemo<Sprint | null>(
    () => (zoomedSprintId != null ? sprints.find((s) => s.id === zoomedSprintId) ?? null : null),
    [sprints, zoomedSprintId]
  );
  const zoomedSquad = useMemo(
    () => (zoomedSprint ? squads.find((s) => s.id === zoomedSprint.squad_id) : null),
    [squads, zoomedSprint]
  );
  /** IDs of tasks assigned to the zoomed sprint (via sprint_tasks). Empty when not zoomed. */
  const zoomedSprintTaskIds = useMemo<number[]>(() => {
    if (!zoomedSprint) return [];
    return firestoreData.sprintTasks
      .filter((st) => st.sprint_id === zoomedSprint.id)
      .map((st) => st.task_id);
  }, [firestoreData.sprintTasks, zoomedSprint]);
  /** Tasks in the zoomed sprint that *don't* have explicit start_date — shown
   *  in the sidebar so the user still knows they're part of the sprint. */
  const zoomedTasksWithoutDates = useMemo<Task[]>(() => {
    if (!zoomedSprint) return [];
    return firestoreData.tasks.filter(
      (t) => zoomedSprintTaskIds.includes(t.id) && !t.start_date
    );
  }, [firestoreData.tasks, zoomedSprintTaskIds, zoomedSprint]);

  /** All tasks linked to the zoomed sprint, regardless of whether they have a
   *  date. Used by the sidebar so nothing the sprint contains is hidden — the
   *  calendar canvas may not render a task whose date sits outside the visible
   *  month, but the user still sees it here. */
  const zoomedAllSprintTasks = useMemo<Task[]>(() => {
    if (!zoomedSprint) return [];
    return firestoreData.tasks.filter((t) => zoomedSprintTaskIds.includes(t.id));
  }, [firestoreData.tasks, zoomedSprintTaskIds, zoomedSprint]);

  /** All-initiatives view: tasks attached to *any* sprint, grouped by sprint.
   *  Each entry carries the parent sprint so the sidebar can show them in
   *  buckets. Tasks linked to multiple sprints appear under each. */
  const allInitiativesGroups = useMemo<
    { sprint: Sprint; tasks: Task[] }[]
  >(() => {
    if (!allInitiativesMode) return [];
    const taskById = new Map(firestoreData.tasks.map((t) => [t.id, t]));
    return sprints
      .map((sprint) => {
        const taskIds = firestoreData.sprintTasks
          .filter((st) => st.sprint_id === sprint.id)
          .map((st) => st.task_id);
        const sprintTasksData = taskIds
          .map((id) => taskById.get(id))
          .filter((t): t is Task => !!t);
        return { sprint, tasks: sprintTasksData };
      })
      .filter((g) => g.tasks.length > 0)
      .sort(
        (a, b) =>
          new Date(b.sprint.start_date).getTime() - new Date(a.sprint.start_date).getTime()
      );
  }, [allInitiativesMode, sprints, firestoreData.sprintTasks, firestoreData.tasks]);

  // When entering zoom mode, focus the calendar on the sprint range and pick
  // a sensible default view (week for short sprints, month otherwise).
  useEffect(() => {
    if (!zoomedSprint) return;
    setDate(parseDateLocal(zoomedSprint.start_date)!);
    const spanDays =
      (parseDateLocal(zoomedSprint.end_date)!.getTime() -
        parseDateLocal(zoomedSprint.start_date)!.getTime()) /
      (1000 * 60 * 60 * 24);
    setView(spanDays <= 14 ? 'week' : 'month');
  }, [zoomedSprint]);

  const squadColorMap = useMemo(() => {
    const map: Record<number, string> = {};
    squads.forEach((s, i) => {
      map[s.id] = SQUAD_PALETTE[i % SQUAD_PALETTE.length];
    });
    return map;
  }, [squads]);

  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];

    // Zoom mode: render tasks linked to the zoomed sprint that have explicit
    // start_date, plus any releases linked to this sprint (so their delivery
    // dates show up alongside the sprint plan).
    if (zoomedSprint) {
      tasks.forEach((task) => {
        if (!zoomedSprintTaskIds.includes(task.id)) return;
        const hasChanges = taskDateChanges.some((c) => c.task_id === task.id);
        result.push(...buildTaskEvents(task, hasChanges));
      });

      const releaseIdsForSprint = new Set(
        (firestoreData.releaseSprints ?? [])
          .filter((rs) => rs.sprint_id === zoomedSprint.id)
          .map((rs) => rs.release_id)
      );
      releases.forEach((release) => {
        if (!releaseIdsForSprint.has(release.id)) return;
        const start = parseDateLocal(release.release_date);
        if (!start) return;
        const style = RELEASE_STATUS_STYLES[release.status] || RELEASE_STATUS_STYLES.Planned;
        result.push({
          id: release.id,
          title: release.version_name,
          start,
          end: endOfDay(start),
          type: 'release',
          data: release,
          color: release.color || style.color,
          meta: { icon: Flag, subtitle: style.label },
        });
      });

      return result;
    }

    // All-initiatives mode: every task linked to any sprint with start_date.
    // No sprint bars (those would just duplicate the info).
    if (allInitiativesMode) {
      const taskToSprintColor = new Map<number, string>();
      firestoreData.sprintTasks.forEach((st) => {
        if (!taskToSprintColor.has(st.task_id)) {
          const sprint = sprints.find((s) => s.id === st.sprint_id);
          if (sprint) {
            taskToSprintColor.set(st.task_id, squadColorMap[sprint.squad_id] || '#6366f1');
          }
        }
      });
      tasks.forEach((task) => {
        if (!taskToSprintColor.has(task.id)) return;
        if (selectedSquad !== 'all') {
          const taskSprintIds = firestoreData.sprintTasks
            .filter((st) => st.task_id === task.id)
            .map((st) => st.sprint_id);
          const anyMatches = taskSprintIds.some((sid) => {
            const sprint = sprints.find((s) => s.id === sid);
            const squad = sprint && squads.find((sq) => sq.id === sprint.squad_id);
            return squad?.name === selectedSquad;
          });
          if (!anyMatches) return;
        }
        const hasChanges = taskDateChanges.some((c) => c.task_id === task.id);
        result.push(...buildTaskEvents(task, hasChanges));
      });
      if (showReleases) {
        releases.forEach((release) => {
          if (selectedSquad !== 'all' && release.squad_id) {
            const squad = squads.find((s) => s.id === release.squad_id);
            if (!squad || squad.name !== selectedSquad) return;
          }
          const start = parseDateLocal(release.release_date);
          if (!start) return;
          const style = RELEASE_STATUS_STYLES[release.status] || RELEASE_STATUS_STYLES.Planned;
          result.push({
            id: release.id,
            title: release.version_name,
            start,
            end: endOfDay(start),
            type: 'release',
            data: release,
            color: release.color || style.color,
            meta: { icon: Flag, subtitle: style.label },
          });
        });
      }
      return result;
    }

    if (showSprints) {
      sprints.forEach((sprint) => {
        if (selectedSquad !== 'all') {
          const squad = squads.find((s) => s.id === sprint.squad_id);
          if (!squad || squad.name !== selectedSquad) return;
        }
        const squad = squads.find((s) => s.id === sprint.squad_id);
        result.push({
          id: sprint.id,
          title: sprint.name,
          start: parseDateLocal(sprint.start_date)!,
          end: endOfDay(parseDateLocal(sprint.end_date)!),
          type: 'sprint',
          data: sprint,
          color: squadColorMap[sprint.squad_id] || '#6366f1',
          meta: { icon: Rocket, subtitle: squad?.name },
        });
      });
    }

    if (showReleases) {
      releases.forEach((release) => {
        if (selectedSquad !== 'all' && release.squad_id) {
          const squad = squads.find((s) => s.id === release.squad_id);
          if (!squad || squad.name !== selectedSquad) return;
        }
        const style = RELEASE_STATUS_STYLES[release.status] || RELEASE_STATUS_STYLES.Planned;
        result.push({
          id: release.id,
          title: release.version_name,
          start: parseDateLocal(release.release_date)!,
          end: endOfDay(parseDateLocal(release.release_date)!),
          type: 'release',
          data: release,
          color: release.color || style.color,
          meta: { icon: Flag, subtitle: style.label },
        });
      });
    }

    return result;
  }, [
    sprints,
    tasks,
    releases,
    squads,
    showSprints,
    showReleases,
    selectedSquad,
    squadColorMap,
    taskDateChanges,
    zoomedSprint,
    zoomedSprintTaskIds,
    allInitiativesMode,
    firestoreData.releaseSprints,
    firestoreData.sprintTasks,
  ]);

  // ---------- event renderer ----------
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const Icon = event.meta.icon;
    const isSprint = event.type === 'sprint';
    const isRelease = event.type === 'release';

    const baseStyle: React.CSSProperties = isSprint
      ? {
          background: hexToRgba(event.color, 0.15),
          borderLeft: `3px solid ${event.color}`,
          color: event.color,
        }
      : isRelease
      ? {
          background: event.color,
          color: '#fff',
          fontWeight: 600,
        }
      : {
          background: hexToRgba(event.color, 0.12),
          borderLeft: `3px solid ${event.color}`,
          color: 'hsl(var(--foreground))',
        };

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div
            className="cursor-pointer h-full px-1.5 py-0.5 rounded-sm flex items-center gap-1 overflow-hidden text-xs leading-tight hover:brightness-95 transition"
            style={baseStyle}
          >
            <Icon className="h-3 w-3 shrink-0" strokeWidth={2.25} />
            <span className="truncate font-medium">{event.title}</span>
            {event.meta.hasAlert && (
              <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80">{renderPopoverContent(event)}</PopoverContent>
      </Popover>
    );
  };

  const renderPopoverContent = (event: CalendarEvent) => {
    if (event.type === 'sprint') {
      const sprint = event.data as Sprint;
      const squad = squads.find((s) => s.id === sprint.squad_id);
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div
              className="mt-1 h-3 w-3 rounded-sm shrink-0"
              style={{ background: event.color }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold leading-tight">{sprint.name}</h4>
              {squad && <p className="text-xs text-muted-foreground">{squad.name}</p>}
            </div>
          </div>
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>
                {format(parseDateLocal(sprint.start_date)!, 'dd MMM', { locale: ptBR })} —{' '}
                {format(parseDateLocal(sprint.end_date)!, 'dd MMM yyyy', { locale: ptBR })}
              </span>
            </div>
            <Badge variant="secondary">{SPRINT_STATUS_LABELS[sprint.status] || sprint.status}</Badge>
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => setZoomedSprintId(event.id)}
          >
            Ver tarefas no calendário
          </Button>
        </div>
      );
    }

    if (event.type === 'task') {
      const task = event.data as Task;
      const style = TASK_TYPE_STYLES[task.task_type] || TASK_TYPE_STYLES.Feature;
      const changes = taskDateChanges.filter((c) => c.task_id === task.id);
      return (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <div
                className="mt-1 h-3 w-3 rounded-sm shrink-0"
                style={{ background: style.color }}
              />
              <h4 className="font-semibold leading-tight">{task.title}</h4>
            </div>
            {changes.length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1 shrink-0">
                <AlertTriangle className="h-3 w-3" />
                Prazo
              </Badge>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">{task.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{style.label}</Badge>
            <Badge variant="outline">{PRIORITY_LABEL_PT[task.priority] ?? task.priority}</Badge>
            <Badge variant="outline">{task.status}</Badge>
          </div>

          {(() => {
            const hasProduct = !!(task.product_start_date || task.product_end_date);
            const hasEng = !!(task.eng_start_date || task.eng_end_date);
            const hasTotal = !!(task.start_date || task.end_date);
            if (!hasProduct && !hasEng && !hasTotal) return null;
            return (
              <div className="space-y-1.5 rounded-md border bg-muted/30 p-2.5 text-xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Datas planejadas
                </div>
                {hasProduct && (
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ background: PROCESS_STYLES.product.color }}
                    />
                    <span className="text-muted-foreground w-20">Produto</span>
                    <span className="font-medium">
                      {formatRange(task.product_start_date, task.product_end_date)}
                    </span>
                  </div>
                )}
                {hasEng && (
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ background: PROCESS_STYLES.engineering.color }}
                    />
                    <span className="text-muted-foreground w-20">Engenharia</span>
                    <span className="font-medium">
                      {formatRange(task.eng_start_date, task.eng_end_date)}
                    </span>
                  </div>
                )}
                {/* Legacy initiatives that predate the Product/Engineering split:
                    fall back to the overall period so the dates are still shown. */}
                {!hasProduct && !hasEng && hasTotal && (
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0 bg-muted-foreground/40" />
                    <span className="text-muted-foreground w-20">Período</span>
                    <span className="font-medium">
                      {formatRange(task.start_date, task.end_date)}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {changes.length > 0 && (
            <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/60 p-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 uppercase tracking-wider">
                <History className="h-3 w-3" />
                Datas alteradas
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {changes
                  .slice()
                  .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
                  .map((change, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-md bg-white border border-amber-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2 text-amber-800 font-medium">
                        <span>
                          De:{' '}
                          {change.old_end_date
                            ? format(parseDateLocal(change.old_end_date)!, 'dd/MM/yy')
                            : '—'}
                        </span>
                        <span aria-hidden>→</span>
                        <span>
                          Para:{' '}
                          {change.new_end_date
                            ? format(parseDateLocal(change.new_end_date)!, 'dd/MM/yy')
                            : '—'}
                        </span>
                      </div>
                      {change.reason && <p className="italic text-amber-700">"{change.reason}"</p>}
                      <div className="text-xs text-amber-600/70 text-right">
                        {format(new Date(change.changed_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {!publicMode && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={() => setEditingTask(task)}
              >
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/initiatives/${task.id}`)}
              >
                Abrir detalhes
              </Button>
            </div>
          )}
        </div>
      );
    }

    const release = event.data as Release;
    const style = RELEASE_STATUS_STYLES[release.status] || RELEASE_STATUS_STYLES.Planned;
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Flag className="h-4 w-4 mt-0.5 shrink-0" style={{ color: event.color }} />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold leading-tight">{release.version_name}</h4>
            <p className="text-xs text-muted-foreground">{style.label}</p>
          </div>
        </div>
        {release.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{release.description}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {format(parseDateLocal(release.release_date)!, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
        <Button size="sm" className="w-full" onClick={() => navigate(`/releases/${event.id}`)}>
          Abrir release
        </Button>
      </div>
    );
  };

  // ---------- custom toolbar ----------
  const Toolbar = ({ label, onNavigate, onView, view: currentView }: ToolbarProps<CalendarEvent>) => {
    const views: { value: View; label: string }[] = [
      { value: 'month', label: 'Mês' },
      { value: 'week', label: 'Semana' },
      { value: 'day', label: 'Dia' },
    ];
    return (
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? 'Ocultar legenda' : 'Mostrar legenda'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate('TODAY')}>
            Hoje
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate('PREV')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate('NEXT')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold capitalize">{label}</h2>
        </div>
        <div className="inline-flex rounded-md border bg-card p-0.5">
          {views.map((v) => (
            <button
              key={v.value}
              onClick={() => onView(v.value)}
              className={`px-3 py-1 text-xs font-medium rounded transition ${
                currentView === v.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ---------- counters ----------
  const counts = useMemo(
    () => ({
      sprints: events.filter((e) => e.type === 'sprint').length,
      releases: events.filter((e) => e.type === 'release').length,
    }),
    [events]
  );

  const sharePopover = !publicMode && (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {isPublic ? <Globe className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
          Compartilhar
          {isPublic && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              público
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px]" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2">
              {isPublic ? (
                <>
                  <Globe className="h-4 w-4 text-emerald-600" />
                  Calendário público
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Calendário privado
                </>
              )}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {isPublic
                ? 'Qualquer pessoa com o link consegue visualizar este calendário (somente leitura).'
                : 'Ative para gerar um link público que pode ser compartilhado.'}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle" className="text-sm font-medium cursor-pointer">
                Tornar público
              </Label>
              <p className="text-xs text-muted-foreground">
                {isPublic ? 'Acesso liberado por link' : 'Acesso restrito ao workspace'}
              </p>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
              disabled={!currentWorkspaceId}
            />
          </div>

          {isPublic && shareUrl && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Link de compartilhamento</Label>
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} className="text-xs h-9 font-mono" />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0"
                  onClick={handleCopyLink}
                  title="Copiar link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Desabilite o toggle a qualquer momento para revogar o acesso.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  const handleSaveEditedTask = async (data: any) => {
    if (!editingTask) return;
    try {
      await updateTask(editingTask.id, data);
      toast({ title: 'Iniciativa atualizada' });
    } catch (e: any) {
      toast({
        title: 'Erro ao atualizar iniciativa',
        description: e?.message,
        variant: 'destructive',
      });
    }
    setEditingTask(null);
  };

  const content = (
      <div className="space-y-6">
        <InitiativeFormDialog
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveEditedTask}
          task={editingTask}
        />
        <PageHeader
          icon={CalendarDays}
          title="Calendário"
          subtitle={
            publicMode
              ? 'Visualização somente leitura compartilhada via link.'
              : 'Sprints e releases em uma linha do tempo. Clique em uma sprint para ver as tarefas planejadas.'
          }
          badge={
            publicMode && (
              <Badge variant="secondary" className="ml-1 gap-1">
                <Globe className="h-3 w-3" /> público
              </Badge>
            )
          }
          actions={
            <>
              {sharePopover}
              {!zoomedSprint && (
                <Select
                  value={allInitiativesMode ? 'initiatives' : 'sprints'}
                  onValueChange={(v) => {
                    setAllInitiativesMode(v === 'initiatives');
                    setZoomedSprintId(null);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sprints">Sprints + Releases</SelectItem>
                    <SelectItem value="initiatives">Todas as iniciativas</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Select value={selectedSquad} onValueChange={setSelectedSquad}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Todos os squads" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os squads</SelectItem>
                  {squads.map((squad) => (
                    <SelectItem key={squad.id} value={squad.name}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: squadColorMap[squad.id] }}
                        />
                        {squad.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />

        {zoomedSprint && (
          <div className="rounded-lg border bg-accent/40 p-3 flex items-center gap-3 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoomedSprintId(null)}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar ao calendário
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2 min-w-0">
              <Rocket className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold truncate">{zoomedSprint.name}</div>
                <div className="text-xs text-muted-foreground">
                  {zoomedSquad?.name ? `${zoomedSquad.name} · ` : ''}
                  {format(parseDateLocal(zoomedSprint.start_date)!, 'dd MMM', { locale: ptBR })} —{' '}
                  {format(parseDateLocal(zoomedSprint.end_date)!, 'dd MMM yyyy', { locale: ptBR })}
                </div>
              </div>
            </div>
            {!publicMode && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => navigate(`/sprints/${zoomedSprint.id}/planning`)}
              >
                Abrir planning
              </Button>
            )}
          </div>
        )}

        <div
          className={`grid gap-4 ${sidebarOpen ? 'lg:grid-cols-[280px_1fr]' : 'lg:grid-cols-1'}`}
        >
          {/* Sidebar: filters + legend */}
          {sidebarOpen && (
          <div className="space-y-4">
            {zoomedSprint ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    Iniciativas da sprint
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                      {zoomedAllSprintTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {zoomedAllSprintTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma iniciativa nesta sprint ainda.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {zoomedAllSprintTasks.map((task) => {
                        const style =
                          TASK_TYPE_STYLES[task.task_type] || TASK_TYPE_STYLES.Feature;
                        const Icon = style.icon;
                        const start = parseDateLocal(task.start_date);
                        const end = parseDateLocal(task.end_date);
                        const hasDate = !!start;
                        const dateLabel = !start
                          ? 'sem data'
                          : end && task.end_date !== task.start_date
                            ? `${format(start, 'dd/MM', { locale: ptBR })} → ${format(end, 'dd/MM', { locale: ptBR })}`
                            : format(start, 'dd/MM/yyyy', { locale: ptBR });
                        return (
                          <li
                            key={task.id}
                            className="flex items-start gap-2 text-xs p-1.5 rounded-md hover:bg-accent/50"
                          >
                            <Icon
                              className="h-3 w-3 shrink-0 mt-0.5"
                              style={{ color: style.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{task.title}</div>
                              <div
                                className={cn(
                                  'text-xs mt-0.5',
                                  hasDate ? 'text-muted-foreground' : 'text-amber-600'
                                )}
                              >
                                {dateLabel}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ) : allInitiativesMode ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    Iniciativas por sprint
                    <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                      {allInitiativesGroups.reduce((sum, g) => sum + g.tasks.length, 0)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {allInitiativesGroups.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma iniciativa vinculada a sprints.
                    </p>
                  ) : (
                    allInitiativesGroups.map((group) => (
                      <div key={group.sprint.id} className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAllInitiativesMode(false);
                              setZoomedSprintId(group.sprint.id);
                            }}
                            className="text-xs font-semibold hover:text-primary text-left truncate"
                          >
                            {group.sprint.name}
                          </button>
                          <Badge variant="outline" className="h-4 px-1 text-xs">
                            {group.tasks.length}
                          </Badge>
                        </div>
                        <ul className="space-y-0.5 pl-2">
                          {group.tasks.slice(0, 5).map((task) => {
                            const style =
                              TASK_TYPE_STYLES[task.task_type] || TASK_TYPE_STYLES.Feature;
                            const Icon = style.icon;
                            return (
                              <li
                                key={`${group.sprint.id}-${task.id}`}
                                className="flex items-center gap-1.5 text-xs"
                              >
                                <Icon
                                  className="h-3 w-3 shrink-0"
                                  style={{ color: style.color }}
                                />
                                <span className="truncate text-muted-foreground">
                                  {task.title}
                                </span>
                                {!task.start_date && (
                                  <span className="text-amber-600 shrink-0">·</span>
                                )}
                              </li>
                            );
                          })}
                          {group.tasks.length > 5 && (
                            <li className="text-xs text-muted-foreground italic pl-4">
                              + {group.tasks.length - 5} mais
                            </li>
                          )}
                        </ul>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Filtros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <FilterRow
                    id="sprints"
                    checked={showSprints}
                    onChange={setShowSprints}
                    label={t('pages.calendar.sprints') || 'Sprints'}
                    count={counts.sprints}
                    icon={<Rocket className="h-3.5 w-3.5" />}
                  />
                  <FilterRow
                    id="releases"
                    checked={showReleases}
                    onChange={setShowReleases}
                    label={t('pages.calendar.releases') || 'Releases'}
                    count={counts.releases}
                    icon={<Flag className="h-3.5 w-3.5" />}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Legenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!zoomedSprint && !allInitiativesMode && (
                  <>
                    <LegendSection title="Sprints por squad" hint="Barra colorida por squad">
                      {squads.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhum squad cadastrado.</p>
                      ) : (
                        squads.map((squad) => (
                          <LegendItem
                            key={squad.id}
                            color={squadColorMap[squad.id]}
                            variant="bar"
                            label={squad.name}
                          />
                        ))
                      )}
                    </LegendSection>

                    <Separator />

                    <LegendSection title="Releases por status" hint="Pílula sólida na data">
                      {Object.entries(RELEASE_STATUS_STYLES).map(([key, s]) => {
                        const Icon = s.icon;
                        return (
                          <LegendItem
                            key={key}
                            color={s.color}
                            variant="solid"
                            label={s.label}
                            icon={<Icon className="h-3 w-3 text-white" />}
                          />
                        );
                      })}
                    </LegendSection>
                  </>
                )}

                {(zoomedSprint || allInitiativesMode) && (
                  <>
                    <LegendSection title="Períodos" hint="Cor da faixa = processo">
                      <LegendItem
                        color={PROCESS_STYLES.product.color}
                        variant="bar"
                        label="Produto"
                      />
                      <LegendItem
                        color={PROCESS_STYLES.engineering.color}
                        variant="bar"
                        label="Engenharia"
                      />
                    </LegendSection>

                    <Separator />

                    <LegendSection title="Tarefas por tipo" hint="Ícone identifica o tipo">
                      {Object.entries(TASK_TYPE_STYLES).map(([key, s]) => {
                        const Icon = s.icon;
                        return (
                          <LegendItem
                            key={key}
                            color={s.color}
                            variant="bar"
                            label={s.label}
                            icon={<Icon className="h-3 w-3" style={{ color: s.color }} />}
                          />
                        );
                      })}
                    </LegendSection>

                    <Separator />

                    <LegendSection
                      title={allInitiativesMode ? 'Releases por status' : 'Releases vinculadas'}
                      hint="Pílula sólida na data"
                    >
                      {Object.entries(RELEASE_STATUS_STYLES).map(([key, s]) => {
                        const Icon = s.icon;
                        return (
                          <LegendItem
                            key={key}
                            color={s.color}
                            variant="solid"
                            label={s.label}
                            icon={<Icon className="h-3 w-3 text-white" />}
                          />
                        );
                      })}
                    </LegendSection>
                  </>
                )}

                <Separator />

                <LegendSection title="Indicadores">
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-muted-foreground">Tarefa com prazo alterado</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">Dia atual destacado</span>
                  </div>
                </LegendSection>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Calendar */}
          <div className="bg-card rounded-lg border p-4">
            <div style={{ height: 720 }} className="flex flex-col">
              <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                views={['month', 'week', 'day']}
                date={date}
                onNavigate={setDate}
                popup
                components={{
                  event: EventComponent,
                  toolbar: Toolbar,
                }}
                formats={{
                  weekdayFormat: (date) => format(date, 'EEE', { locale: ptBR }).toUpperCase(),
                  dayFormat: (date) => format(date, 'EEE dd/MM', { locale: ptBR }),
                  monthHeaderFormat: (date) => format(date, "MMMM 'de' yyyy", { locale: ptBR }),
                  dayHeaderFormat: (date) => format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }),
                  dayRangeHeaderFormat: ({ start, end }) =>
                    `${format(start, 'dd MMM', { locale: ptBR })} – ${format(end, 'dd MMM yyyy', { locale: ptBR })}`,
                  agendaHeaderFormat: ({ start, end }) =>
                    `${format(start, 'dd/MM/yyyy')} – ${format(end, 'dd/MM/yyyy')}`,
                  agendaDateFormat: (date) => format(date, 'EEE dd/MM', { locale: ptBR }),
                  agendaTimeFormat: (date) => format(date, 'HH:mm'),
                  agendaTimeRangeFormat: ({ start, end }) =>
                    `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`,
                  timeGutterFormat: (date) => format(date, 'HH:mm'),
                }}
                messages={{
                  date: 'Data',
                  time: 'Hora',
                  event: 'Evento',
                  allDay: 'Dia inteiro',
                  week: 'Semana',
                  work_week: 'Semana útil',
                  day: 'Dia',
                  month: 'Mês',
                  previous: 'Anterior',
                  next: 'Próximo',
                  yesterday: 'Ontem',
                  tomorrow: 'Amanhã',
                  today: 'Hoje',
                  agenda: 'Agenda',
                  noEventsInRange: 'Nenhum evento neste período.',
                  showMore: (count) => `+${count} mais`,
                }}
                eventPropGetter={() => ({ style: {} })}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>
      </div>
  );

  if (publicMode) {
    return <div className="container mx-auto p-4 md:p-8">{content}</div>;
  }
  return <Layout>{content}</Layout>;
}

// ---------- small presentational helpers ----------
function FilterRow({
  id,
  checked,
  onChange,
  label,
  count,
  icon,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label
        htmlFor={id}
        className="flex items-center gap-2 text-sm font-normal cursor-pointer flex-1"
      >
        <span className="text-muted-foreground">{icon}</span>
        {label}
        <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
          {count}
        </Badge>
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function LegendSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  variant,
  icon,
}: {
  color: string;
  label: string;
  variant: 'bar' | 'solid';
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {variant === 'bar' ? (
        <div
          className="h-4 w-6 rounded-sm shrink-0"
          style={{
            background: hexToRgba(color, 0.15),
            borderLeft: `3px solid ${color}`,
          }}
        />
      ) : (
        <div
          className="h-4 w-6 rounded-sm shrink-0 flex items-center justify-center"
          style={{ background: color }}
        >
          {icon}
        </div>
      )}
      <span className="text-foreground/80 flex items-center gap-1.5">
        {variant === 'bar' && icon}
        {label}
      </span>
    </div>
  );
}
