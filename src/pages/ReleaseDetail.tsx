import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Caption, KpiCard, SectionLabel, StatusBadge, TypeBadge } from '@/components/ui-patterns';
import { useLocalData } from '@/hooks/useLocalData';
import { Release, ReleaseAuditLog, Sprint, Task } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TYPE_LABEL_PT } from '@/utils/initiativeStatus';
import {
  ArrowLeft,
  ArrowRightLeft,
  CalendarDays,
  History,
  Pencil,
  Plus,
  PlusCircle,
  Rocket,
  Trash2,
  X,
} from 'lucide-react';
import { ReleaseFormDialog } from '@/components/ReleaseFormDialog';

/** Maps each audit action to its visual signature in the history list. */
const RELEASE_ACTION_META: Record<
  ReleaseAuditLog['action'],
  { icon: typeof PlusCircle; label: string; bg: string; color: string }
> = {
  create: {
    icon: PlusCircle,
    label: 'criou a release',
    bg: 'bg-emerald-50',
    color: 'text-emerald-700',
  },
  update: {
    icon: Pencil,
    label: 'editou a release',
    bg: 'bg-blue-50',
    color: 'text-blue-700',
  },
  delete: {
    icon: Trash2,
    label: 'excluiu a release',
    bg: 'bg-rose-50',
    color: 'text-rose-700',
  },
};

/** Friendly field labels for the per-field diff in the history. */
const RELEASE_FIELD_LABELS: Record<string, string> = {
  version_name: 'Nome',
  release_date: 'Data de lançamento',
  squad_id: 'Squad',
  status: 'Status',
  description: 'Descrição',
  release_notes: 'Release notes',
  color: 'Cor',
};

function formatReleaseAuditValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ReleaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    data,
    addReleaseTask,
    removeReleaseTask,
    updateRelease,
    setReleaseSprints,
    addReleaseSprint,
    removeReleaseSprint,
  } = useLocalData() as any;

  const releaseId = id ? parseInt(id) : null;
  const [isAddTasksOpen, setIsAddTasksOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddSprintsOpen, setIsAddSprintsOpen] = useState(false);
  const [selectedSprintIds, setSelectedSprintIds] = useState<number[]>([]);
  const [sprintSearch, setSprintSearch] = useState('');
  /** When true, the picker shows every task in the workspace. When false (default),
   *  it restricts to tasks of the sprints linked to this release. */
  const [showAllInPicker, setShowAllInPicker] = useState(false);

  const release = useMemo(
    () => data.releases.find((r: any) => r.id === releaseId),
    [data.releases, releaseId]
  );
  const squad = useMemo(
    () => (release?.squad_id ? data.squads.find((s: any) => s.id === release.squad_id) : null),
    [data.squads, release]
  );
  const taskIdsInRelease = useMemo(
    () =>
      data.releaseTasks
        .filter((rt: any) => rt.release_id === releaseId)
        .map((rt: any) => rt.task_id),
    [data.releaseTasks, releaseId]
  );
  const tasks: Task[] = useMemo(
    () => data.tasks.filter((t: Task) => taskIdsInRelease.includes(t.id)),
    [data.tasks, taskIdsInRelease]
  );
  const allTasks: Task[] = data.tasks;

  const linkedSprints = useMemo<Sprint[]>(() => {
    const ids = (data.releaseSprints || [])
      .filter((rs: any) => rs.release_id === releaseId)
      .map((rs: any) => rs.sprint_id);
    return data.sprints
      .filter((s: Sprint) => ids.includes(s.id))
      .sort(
        (a: Sprint, b: Sprint) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
  }, [data.releaseSprints, data.sprints, releaseId]);

  /** IDs of sprints currently linked to this release — drives the edit dialog
   *  pre-selection. */
  const linkedSprintIds = useMemo<number[]>(
    () => linkedSprints.map((s) => s.id),
    [linkedSprints]
  );

  /** Audit log entries for this release, newest first. */
  const auditLogs = useMemo<ReleaseAuditLog[]>(
    () =>
      ((data.releaseAuditLogs as ReleaseAuditLog[]) || [])
        .filter((l) => l.release_id === releaseId)
        .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()),
    [data.releaseAuditLogs, releaseId]
  );

  const handleEditSave = async (
    releaseData: Omit<Release, 'id' | 'created_at'>,
    sprintIds: number[]
  ) => {
    if (!releaseId) return;
    await updateRelease(releaseId, releaseData);
    await setReleaseSprints(releaseId, sprintIds);
    setIsEditOpen(false);
    toast({ title: 'Release atualizada' });
  };

  /** Sprints not yet linked to this release — used to populate the "add" picker. */
  const availableSprintsForRelease = useMemo<Sprint[]>(() => {
    const linkedIds = new Set(linkedSprints.map((s) => s.id));
    const matchesSearch = (s: Sprint) =>
      s.name.toLowerCase().includes(sprintSearch.toLowerCase());
    return (data.sprints as Sprint[])
      .filter((s) => !linkedIds.has(s.id) && matchesSearch(s))
      .sort(
        (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
  }, [data.sprints, linkedSprints, sprintSearch]);

  const handleAddSprints = async () => {
    if (!releaseId || selectedSprintIds.length === 0) return;
    try {
      await Promise.all(
        selectedSprintIds.map((sprintId) =>
          addReleaseSprint({ release_id: releaseId, sprint_id: sprintId })
        )
      );
      toast({
        title: 'Sprints vinculadas',
        description: `${selectedSprintIds.length} sprint(s) adicionada(s) à release`,
      });
      setIsAddSprintsOpen(false);
      setSelectedSprintIds([]);
      setSprintSearch('');
    } catch (e: any) {
      toast({
        title: 'Erro ao vincular sprints',
        description: e.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveSprint = async (sprintId: number) => {
    if (!releaseId) return;
    try {
      await removeReleaseSprint(releaseId, sprintId);
      toast({ title: 'Sprint desvinculada da release' });
    } catch (e: any) {
      toast({
        title: 'Erro ao desvincular sprint',
        description: e.message,
        variant: 'destructive',
      });
    }
  };

  /** Group tasks of the release by the linked sprints where they were worked.
   *  A task may belong to multiple linked sprints; it appears under each. Tasks
   *  not in any linked sprint go into the "Outras" bucket. */
  const tasksByGroup = useMemo(() => {
    const groups: { key: string; sprint: Sprint | null; tasks: Task[] }[] = [];
    const remaining = new Set(tasks.map((t) => t.id));

    linkedSprints.forEach((sprint) => {
      const sprintTaskIds = data.sprintTasks
        .filter((st: any) => st.sprint_id === sprint.id)
        .map((st: any) => st.task_id);
      const groupTasks = tasks.filter((t) => sprintTaskIds.includes(t.id));
      groupTasks.forEach((t) => remaining.delete(t.id));
      groups.push({ key: `sprint-${sprint.id}`, sprint, tasks: groupTasks });
    });

    const otherTasks = tasks.filter((t) => remaining.has(t.id));
    if (otherTasks.length > 0 || linkedSprints.length === 0) {
      groups.push({ key: 'other', sprint: null, tasks: otherTasks });
    }
    return groups;
  }, [linkedSprints, tasks, data.sprintTasks]);

  const handleAddTasks = async () => {
    if (!releaseId || selectedTaskIds.length === 0) return;

    try {
      await Promise.all(
        selectedTaskIds.map((taskId) => addReleaseTask({ release_id: releaseId, task_id: taskId }))
      );
      toast({
        title: 'Tarefas adicionadas',
        description: `${selectedTaskIds.length} tarefa(s) adicionada(s) à release`,
      });
      setIsAddTasksOpen(false);
      setSelectedTaskIds([]);
    } catch (e: any) {
      toast({ title: 'Erro ao adicionar tarefas', description: e.message, variant: 'destructive' });
    }
  };

  const handleRemoveTask = async (taskId: number) => {
    if (!releaseId) return;
    await removeReleaseTask(releaseId, taskId);
    toast({ title: 'Tarefa removida', description: 'Tarefa removida da release' });
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return { done: 0, total: 0, percentage: 0 };
    const done = tasks.filter((t) => t.status === 'Done').length;
    return {
      done,
      total: tasks.length,
      percentage: Math.round((done / tasks.length) * 100),
    };
  };

  const calculatePoints = () =>
    tasks.reduce(
      (sum, task) =>
        sum +
        (task.estimate_frontend || 0) +
        (task.estimate_backend || 0) +
        (task.estimate_qa || 0) +
        (task.estimate_design || 0),
      0
    );

  /** Map of taskId → list of OTHER releases (not this one) that already include
   *  the task. Used to warn the user about double-allocation across deliveries. */
  const otherReleasesByTaskId = useMemo(() => {
    const map = new Map<number, { id: number; version_name: string }[]>();
    (data.releaseTasks as { release_id: number; task_id: number }[]).forEach((rt) => {
      if (rt.release_id === releaseId) return;
      const rel = data.releases.find((r: any) => r.id === rt.release_id);
      if (!rel) return;
      const list = map.get(rt.task_id) ?? [];
      list.push({ id: rel.id, version_name: rel.version_name });
      map.set(rt.task_id, list);
    });
    return map;
  }, [data.releaseTasks, data.releases, releaseId]);

  /** Candidate tasks for the picker, grouped by linked sprint (with an "Outras"
   *  bucket when showAllInPicker is on). Already-included tasks and tasks that
   *  don't match the search are filtered out. */
  const pickerGroups = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const taskIsCandidate = (t: Task) =>
      !tasks.some((x) => x.id === t.id) && t.title.toLowerCase().includes(term);

    const groups: { key: string; sprint: Sprint | null; tasks: Task[] }[] = [];
    const seen = new Set<number>();

    linkedSprints.forEach((sprint) => {
      const sprintTaskIds = data.sprintTasks
        .filter((st: any) => st.sprint_id === sprint.id)
        .map((st: any) => st.task_id);
      const groupTasks = (allTasks as Task[]).filter(
        (t) => sprintTaskIds.includes(t.id) && taskIsCandidate(t)
      );
      groupTasks.forEach((t) => seen.add(t.id));
      groups.push({ key: `sprint-${sprint.id}`, sprint, tasks: groupTasks });
    });

    if (showAllInPicker) {
      const otherTasks = (allTasks as Task[]).filter(
        (t) => !seen.has(t.id) && taskIsCandidate(t)
      );
      if (otherTasks.length > 0 || linkedSprints.length === 0) {
        groups.push({ key: 'other', sprint: null, tasks: otherTasks });
      }
    }

    return groups;
  }, [linkedSprints, data.sprintTasks, allTasks, tasks, searchTerm, showAllInPicker]);

  const totalPickerCount = pickerGroups.reduce((sum, g) => sum + g.tasks.length, 0);

  const progress = calculateProgress();
  const totalPoints = calculatePoints();

  if (!release) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => navigate('/releases')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{release.version_name}</h1>
          <StatusBadge kind="release" status={release.status} />
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-2"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <KpiCard label="Total de Tarefas" value={tasks.length} />
          <KpiCard label="Pontos Totais" value={totalPoints} />
          <KpiCard
            label="Progresso"
            value={`${progress.done}/${progress.total}`}
            hint={`${progress.percentage}% concluído`}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Data de Lançamento:</span>
              <span>{format(new Date(release.release_date), 'dd/MM/yyyy')}</span>
            </div>
            {squad && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Squad:</span>
                <span>{squad.name}</span>
              </div>
            )}
            {release.description && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground">Descrição:</span>
                <span>{release.description}</span>
              </div>
            )}
            {release.release_notes && (
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground">Release Notes:</span>
                <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                  {release.release_notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Rocket className="h-5 w-5 text-muted-foreground" />
                Sprints vinculadas
                {linkedSprints.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {linkedSprints.length}
                  </Badge>
                )}
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedSprintIds([]);
                  setSprintSearch('');
                  setIsAddSprintsOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar sprint
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {linkedSprints.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma sprint vinculada. Use o botão acima para vincular as sprints que compõem o
                trabalho desta entrega.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {linkedSprints.map((sprint) => (
                  <div
                    key={sprint.id}
                    className="group inline-flex items-center gap-2 rounded-md border pl-3 pr-1 py-1 text-sm hover:bg-accent/40 transition"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/sprints/${sprint.id}/planning`)}
                      className="inline-flex items-center gap-2 py-0.5"
                    >
                      <span className="font-medium">{sprint.name}</span>
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {format(new Date(sprint.start_date), 'dd MMM', { locale: ptBR })} —{' '}
                        {format(new Date(sprint.end_date), 'dd MMM', { locale: ptBR })}
                      </span>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Desvincular ${sprint.name}`}
                      onClick={() => handleRemoveSprint(sprint.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg font-semibold">Tarefas Incluídas</CardTitle>
              <Button onClick={() => setIsAddTasksOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Tarefas
              </Button>
            </div>
          </CardHeader>
          <CardContent>

          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma tarefa adicionada ainda.
            </div>
          ) : (
            <div className="space-y-6">
              {tasksByGroup.map((group) => (
                <div key={group.key} className="space-y-2">
                  <SectionLabel
                    trailing={
                      <>
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {group.tasks.length}
                        </Badge>
                        {group.sprint && (
                          <Caption as="span">
                            {format(new Date(group.sprint.start_date), 'dd MMM', { locale: ptBR })} —{' '}
                            {format(new Date(group.sprint.end_date), 'dd MMM yyyy', { locale: ptBR })}
                          </Caption>
                        )}
                      </>
                    }
                  >
                    {group.sprint ? group.sprint.name : 'Outras'}
                  </SectionLabel>
                  {group.tasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic pl-1">
                      Nenhuma tarefa desta sprint está incluída na release.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {group.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium">{task.title}</span>
                              <TypeBadge type={task.task_type} />
                              <StatusBadge kind="task" status={task.status} />
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {(task.estimate_frontend || 0) +
                                (task.estimate_backend || 0) +
                                (task.estimate_qa || 0) +
                                (task.estimate_design || 0)}{' '}
                              pontos
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Remover tarefa"
                            onClick={() => handleRemoveTask(task.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Histórico de alterações
              {auditLogs.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {auditLogs.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Sem alterações registradas ainda.
              </div>
            ) : (
              <ol className="divide-y">
                {auditLogs.map((log) => {
                  const meta = RELEASE_ACTION_META[log.action];
                  const Icon = meta.icon;
                  return (
                    <li key={log.id} className="p-4 flex gap-3">
                      <span
                        className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${meta.bg} ${meta.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-medium">
                            {log.changed_by_name || 'Sistema'}
                          </span>
                          <span className="text-sm text-muted-foreground">{meta.label}</span>
                          <span
                            className="text-xs text-muted-foreground"
                            title={format(new Date(log.changed_at), 'dd/MM/yyyy HH:mm:ss')}
                          >
                            ·{' '}
                            {formatDistanceToNow(new Date(log.changed_at), {
                              locale: ptBR,
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        {log.summary && (
                          <p className="text-sm text-muted-foreground">{log.summary}</p>
                        )}
                        {log.changes.length > 0 && (
                          <ul className="text-xs space-y-1 mt-1">
                            {log.changes.slice(0, 8).map((c, idx) => (
                              <li key={idx} className="flex flex-wrap items-center gap-1.5">
                                <span className="font-medium text-foreground">
                                  {RELEASE_FIELD_LABELS[c.field] ?? c.field}:
                                </span>
                                <span className="text-muted-foreground line-through max-w-[200px] truncate">
                                  {formatReleaseAuditValue(c.old)}
                                </span>
                                <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                                <span className="text-foreground max-w-[260px] truncate">
                                  {formatReleaseAuditValue(c.new)}
                                </span>
                              </li>
                            ))}
                            {log.changes.length > 8 && (
                              <li className="text-muted-foreground italic">
                                + {log.changes.length - 8} alteração(ões)
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <ReleaseFormDialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleEditSave}
        release={release}
        squads={data.squads}
        sprints={data.sprints || []}
        initialSprintIds={linkedSprintIds}
      />

      <Dialog
        open={isAddSprintsOpen}
        onOpenChange={(open) => {
          setIsAddSprintsOpen(open);
          if (!open) {
            setSelectedSprintIds([]);
            setSprintSearch('');
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar sprints à release</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Buscar sprints..."
              value={sprintSearch}
              onChange={(e) => setSprintSearch(e.target.value)}
            />

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {availableSprintsForRelease.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {linkedSprints.length === data.sprints.length
                    ? 'Todas as sprints já estão vinculadas a esta release.'
                    : 'Nenhuma sprint encontrada.'}
                </div>
              ) : (
                availableSprintsForRelease.map((sprint) => {
                  const squad = data.squads.find((s: any) => s.id === sprint.squad_id);
                  return (
                    <label
                      key={sprint.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedSprintIds.includes(sprint.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSprintIds([...selectedSprintIds, sprint.id]);
                          } else {
                            setSelectedSprintIds(
                              selectedSprintIds.filter((id) => id !== sprint.id)
                            );
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{sprint.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                          {squad && <span>{squad.name}</span>}
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {format(new Date(sprint.start_date), 'dd MMM', { locale: ptBR })} —{' '}
                            {format(new Date(sprint.end_date), 'dd MMM yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsAddSprintsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddSprints} disabled={selectedSprintIds.length === 0}>
                Adicionar {selectedSprintIds.length} selecionada(s)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddTasksOpen} onOpenChange={setIsAddTasksOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Tarefas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {linkedSprints.length > 0 && (
              <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                <div>
                  <Label htmlFor="show-all-tasks" className="text-sm font-medium cursor-pointer">
                    Mostrar todas as tarefas
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {showAllInPicker
                      ? 'Exibindo tarefas das sprints vinculadas e fora delas.'
                      : 'Exibindo apenas tarefas das sprints vinculadas a esta release.'}
                  </p>
                </div>
                <Switch
                  id="show-all-tasks"
                  checked={showAllInPicker}
                  onCheckedChange={setShowAllInPicker}
                />
              </div>
            )}

            <div className="space-y-5 max-h-[50vh] overflow-y-auto">
              {totalPickerCount === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {linkedSprints.length === 0
                    ? 'Vincule sprints à release ou ative "Mostrar todas as tarefas".'
                    : 'Nenhuma tarefa disponível com esses filtros.'}
                </div>
              ) : (
                pickerGroups.map((group) => (
                  <div key={group.key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.sprint ? group.sprint.name : 'Outras tarefas'}
                      </h4>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                        {group.tasks.length}
                      </Badge>
                      {group.sprint && (
                        <span className="text-[11px] text-muted-foreground">
                          {format(new Date(group.sprint.start_date), 'dd MMM', { locale: ptBR })} —{' '}
                          {format(new Date(group.sprint.end_date), 'dd MMM yyyy', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    {group.tasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic pl-1">
                        Todas as tarefas desta sprint já estão na release ou em outra.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {group.tasks.map((task) => {
                          const otherReleases = otherReleasesByTaskId.get(task.id) ?? [];
                          return (
                            <label
                              key={task.id}
                              className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedTaskIds.includes(task.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedTaskIds([...selectedTaskIds, task.id]);
                                  } else {
                                    setSelectedTaskIds(
                                      selectedTaskIds.filter((id) => id !== task.id)
                                    );
                                  }
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{task.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {TYPE_LABEL_PT[task.task_type] ?? task.task_type}
                                  </Badge>
                                  <Badge className="text-xs">{task.status}</Badge>
                                </div>
                                {otherReleases.length > 0 && (
                                  <div className="mt-1 text-[11px] text-amber-700">
                                    Já incluída em:{' '}
                                    {otherReleases.map((r) => r.version_name).join(', ')}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsAddTasksOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddTasks} disabled={selectedTaskIds.length === 0}>
                Adicionar {selectedTaskIds.length} selecionada(s)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
