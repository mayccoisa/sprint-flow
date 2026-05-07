import { useState, useMemo } from 'react';
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
  CircleDot,
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface CalendarProps {
  publicMode?: boolean;
}

export default function Calendar({ publicMode = false }: CalendarProps = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspace();
  const { data: firestoreData } = useLocalData();
  const taskDateChanges = firestoreData.taskDateChanges;
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [showSprints, setShowSprints] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showReleases, setShowReleases] = useState(true);
  const [selectedSquad, setSelectedSquad] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const initialShare = currentWorkspaceId ? getShareInfo(currentWorkspaceId) : null;
  const [isPublic, setIsPublic] = useState<boolean>(!!initialShare?.isPublic);
  const [shareToken, setShareToken] = useState<string | null>(initialShare?.token || null);
  const [copied, setCopied] = useState(false);

  const handleTogglePublic = (value: boolean) => {
    if (!currentWorkspaceId) return;
    if (value) {
      const entry = enablePublicCalendar(currentWorkspaceId);
      setShareToken(entry.token);
      setIsPublic(true);
      toast({ title: 'Calendário público', description: 'Qualquer pessoa com o link pode visualizar.' });
    } else {
      disablePublicCalendar(currentWorkspaceId);
      setIsPublic(false);
      toast({ title: 'Calendário privado', description: 'O link público foi desativado.' });
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
    () => firestoreData.tasks.filter((t) => t.start_date),
    [firestoreData.tasks]
  );
  const releases: Release[] = firestoreData.releases;
  const squads: Squad[] = firestoreData.squads;

  const squadColorMap = useMemo(() => {
    const map: Record<number, string> = {};
    squads.forEach((s, i) => {
      map[s.id] = SQUAD_PALETTE[i % SQUAD_PALETTE.length];
    });
    return map;
  }, [squads]);

  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];

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
          start: new Date(sprint.start_date),
          end: new Date(sprint.end_date),
          type: 'sprint',
          data: sprint,
          color: squadColorMap[sprint.squad_id] || '#6366f1',
          meta: { icon: Rocket, subtitle: squad?.name },
        });
      });
    }

    if (showTasks) {
      tasks.forEach((task) => {
        if (!task.start_date) return;
        const style = TASK_TYPE_STYLES[task.task_type] || TASK_TYPE_STYLES.Feature;
        const hasChanges = taskDateChanges.some((c) => c.task_id === task.id);
        result.push({
          id: task.id,
          title: task.title,
          start: new Date(task.start_date),
          end: task.end_date ? new Date(task.end_date) : new Date(task.start_date),
          type: 'task',
          data: task,
          color: style.color,
          meta: { icon: style.icon, subtitle: style.label, hasAlert: hasChanges },
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
          start: new Date(release.release_date),
          end: new Date(release.release_date),
          type: 'release',
          data: release,
          color: release.color || style.color,
          meta: { icon: Flag, subtitle: style.label },
        });
      });
    }

    return result;
  }, [sprints, tasks, releases, squads, showSprints, showTasks, showReleases, selectedSquad, squadColorMap, taskDateChanges]);

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
            className="cursor-pointer h-full px-1.5 py-0.5 rounded-sm flex items-center gap-1 overflow-hidden text-[11px] leading-tight hover:brightness-95 transition"
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
                {format(new Date(sprint.start_date), 'dd MMM', { locale: ptBR })} —{' '}
                {format(new Date(sprint.end_date), 'dd MMM yyyy', { locale: ptBR })}
              </span>
            </div>
            <Badge variant="secondary">{SPRINT_STATUS_LABELS[sprint.status] || sprint.status}</Badge>
          </div>
          <Button size="sm" className="w-full" onClick={() => navigate(`/sprints/${event.id}/planning`)}>
            Abrir sprint
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

          {changes.length > 0 && (
            <div className="space-y-2">
              <Separator />
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 uppercase tracking-wider">
                <History className="h-3 w-3" />
                Histórico de previsibilidade
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {changes
                  .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
                  .map((change, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-md bg-amber-50 border border-amber-100 text-[11px] space-y-1"
                    >
                      <div className="flex justify-between text-amber-800 font-medium">
                        <span>De: {format(new Date(change.old_end_date), 'dd/MM/yy')}</span>
                        <span>Para: {format(new Date(change.new_end_date), 'dd/MM/yy')}</span>
                      </div>
                      <p className="italic text-amber-700">"{change.reason}"</p>
                      <div className="text-[10px] text-amber-600/70 text-right">
                        {format(new Date(change.changed_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  ))}
              </div>
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
          {format(new Date(release.release_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
      { value: 'agenda', label: 'Agenda' },
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
          <h2 className="text-base font-semibold capitalize">{label}</h2>
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
      tasks: events.filter((e) => e.type === 'task').length,
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
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
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
              <p className="text-[11px] text-muted-foreground">
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
              <p className="text-[11px] text-muted-foreground">
                Desabilite o toggle a qualquer momento para revogar o acesso.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  const content = (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Calendário
              {publicMode && (
                <Badge variant="secondary" className="ml-1 gap-1">
                  <Globe className="h-3 w-3" /> público
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {publicMode
                ? 'Visualização somente leitura compartilhada via link.'
                : 'Visualize sprints, tarefas e releases em uma linha do tempo unificada.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
          {sharePopover}
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
          </div>
        </div>

        <div
          className={`grid gap-4 ${sidebarOpen ? 'lg:grid-cols-[280px_1fr]' : 'lg:grid-cols-1'}`}
        >
          {/* Sidebar: filters + legend */}
          {sidebarOpen && (
          <div className="space-y-4">
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
                  id="tasks"
                  checked={showTasks}
                  onChange={setShowTasks}
                  label="Tarefas"
                  count={counts.tasks}
                  icon={<CircleDot className="h-3.5 w-3.5" />}
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

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Legenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <LegendSection title="Tarefas por tipo" hint="Cor identifica o tipo">
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
                date={date}
                onNavigate={setDate}
                popup
                components={{
                  event: EventComponent,
                  toolbar: Toolbar,
                }}
                messages={{
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
        <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">
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
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {hint && <p className="text-[10px] text-muted-foreground/80">{hint}</p>}
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
