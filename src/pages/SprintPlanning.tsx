import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SquadBucket, TaskWithSprintTask, ParticipantInfo } from '@/components/SquadBucket';
import { SprintRosterDialog } from '@/components/SprintRosterDialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { useLocalData } from '@/hooks/useLocalData';
import { Task, Sprint, Squad, TeamMember } from '@/types';
import { format } from 'date-fns';
import { GripVertical, CheckCircle } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

interface SprintWithSquad extends Sprint {
  squad: Squad;
}

const SprintPlanning = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    data,
    loading,
    addSprint,
    addSprintTask,
    removeSprintTask,
    updateTask,
    updateSprint,
  } = useLocalData() as any;

  const sprintId = id ? parseInt(id) : null;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [rosterSprint, setRosterSprint] = useState<SprintWithSquad | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('Backlog');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const sprint = useMemo<SprintWithSquad | null>(() => {
    const s: Sprint | undefined = data.sprints.find((s: Sprint) => s.id === sprintId);
    if (!s) return null;
    const squad: Squad | undefined = data.squads.find((sq: Squad) => sq.id === s.squad_id);
    if (!squad) return null;
    return { ...s, squad };
  }, [data.sprints, data.squads, sprintId]);

  // All active squads — each gets a bucket regardless of whether a sprint exists for this cycle
  const activeSquads = useMemo<Squad[]>(() => {
    return data.squads
      .filter((s: Squad) => s.status === 'Active')
      .sort((a: Squad, b: Squad) => a.name.localeCompare(b.name));
  }, [data.squads]);

  // For each active squad, find the sprint (if any) in the current cycle
  const sprintBySquad = useMemo<Map<number, SprintWithSquad>>(() => {
    const map = new Map<number, SprintWithSquad>();
    if (!sprint) return map;
    const start = new Date(sprint.start_date).getTime();
    const end = new Date(sprint.end_date).getTime();
    data.sprints.forEach((s: Sprint) => {
      const sStart = new Date(s.start_date).getTime();
      const sEnd = new Date(s.end_date).getTime();
      const overlaps = sStart <= end && sEnd >= start;
      if (!overlaps) return;
      const squad = data.squads.find((sq: Squad) => sq.id === s.squad_id);
      if (!squad) return;
      // Prefer earliest-created sprint per squad if multiple overlap
      const existing = map.get(squad.id);
      if (!existing || new Date(s.created_at) < new Date(existing.created_at)) {
        map.set(squad.id, { ...s, squad });
      }
    });
    return map;
  }, [data.sprints, data.squads, sprint]);

  // Map sprintId → effective roster (member + availability_pct).
  // Empty array means "no explicit roster yet" — SquadBucket falls back
  // to all active squad members at 100%.
  const participantsBySprint = useMemo<Map<number, ParticipantInfo[]>>(() => {
    const map = new Map<number, ParticipantInfo[]>();
    sprintBySquad.forEach((s) => {
      const rows = data.sprintParticipants.filter((p: any) => p.sprint_id === s.id);
      const items: ParticipantInfo[] = rows
        .map((p: any) => {
          const member = data.members.find((m: TeamMember) => m.id === p.member_id);
          if (!member) return null;
          return { member, availability_pct: p.availability_pct };
        })
        .filter(Boolean) as ParticipantInfo[];
      map.set(s.id, items);
    });
    return map;
  }, [data.sprintParticipants, data.members, sprintBySquad]);

  // Map sprintId → tasks in that sprint
  const tasksBySprint = useMemo<Map<number, TaskWithSprintTask[]>>(() => {
    const map = new Map<number, TaskWithSprintTask[]>();
    sprintBySquad.forEach((s) => {
      const items = data.sprintTasks
        .filter((st: any) => st.sprint_id === s.id)
        .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((st: any) => {
          const task = data.tasks.find((t: Task) => t.id === st.task_id);
          if (!task) return null;
          return { ...task, sprint_task_id: st.id } as TaskWithSprintTask;
        })
        .filter(Boolean) as TaskWithSprintTask[];
      map.set(s.id, items);
    });
    return map;
  }, [data.sprintTasks, data.tasks, sprintBySquad]);

  const backlogTasks = useMemo<Task[]>(
    () =>
      data.tasks
        .slice()
        .sort((a: Task, b: Task) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [data.tasks]
  );

  const filteredBacklog = useMemo(() => {
    return backlogTasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (typeFilter !== 'all' && task.task_type !== typeFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (
        searchQuery &&
        !task.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [backlogTasks, searchQuery, typeFilter, priorityFilter, statusFilter]);

  const findTaskById = (taskId: number): Task | undefined =>
    data.tasks.find((t: Task) => t.id === taskId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = String(active.id);
    const taskId = parseInt(activeIdStr.replace('task-', ''));
    const fromSprintId = active.data.current?.fromSprintId as number | undefined;
    const overId = String(over.id);

    try {
      if (overId === 'backlog') {
        if (fromSprintId) {
          await removeSprintTask(fromSprintId, taskId);
          await updateTask(taskId, { status: 'Backlog' });
          toast({ title: 'Tarefa removida da sprint' });
        }
        return;
      }

      if (overId.startsWith('squad-')) {
        const targetSprintId = parseInt(overId.replace('squad-', ''));
        if (fromSprintId === targetSprintId) return;

        if (fromSprintId) {
          await removeSprintTask(fromSprintId, taskId);
        }

        const orderIndex = tasksBySprint.get(targetSprintId)?.length || 0;
        await addSprintTask({
          sprint_id: targetSprintId,
          task_id: taskId,
          order_index: orderIndex,
          task_status: 'Todo',
        });
        await updateTask(taskId, { status: 'InSprint' });

        let targetSquad: string | undefined;
        sprintBySquad.forEach((s) => {
          if (s.id === targetSprintId) targetSquad = s.squad.name;
        });
        toast({
          title: fromSprintId ? 'Tarefa movida' : 'Tarefa adicionada',
          description: targetSquad ? `Squad: ${targetSquad}` : undefined,
        });
      }
    } catch (error: any) {
      console.error('Error in drag end:', error);
      toast({
        title: 'Erro ao mover tarefa',
        description: error?.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFromSquad = async (
    sprintIdToRemove: number,
    taskId: number
  ) => {
    try {
      await removeSprintTask(sprintIdToRemove, taskId);
      await updateTask(taskId, { status: 'Backlog' });
      toast({ title: 'Tarefa removida da sprint' });
    } catch (error: any) {
      console.error('Error removing task:', error);
      toast({
        title: 'Erro ao remover tarefa',
        description: error?.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateSprintForSquad = async (squad: Squad) => {
    if (!sprint) return;
    try {
      const created = await addSprint({
        name: sprint.name,
        squad_id: squad.id,
        start_date: sprint.start_date,
        end_date: sprint.end_date,
        status: 'Planning',
      });
      toast({
        title: 'Sprint criada',
        description: `${sprint.name} para ${squad.name}`,
      });
      // Prompt for roster + per-member capacity right after creation.
      if (created?.id) {
        setRosterSprint({ ...(created as Sprint), squad });
      }
    } catch (error: any) {
      console.error('Error creating sprint:', error);
      toast({
        title: 'Erro ao criar sprint',
        description: error?.message,
        variant: 'destructive',
      });
    }
  };

  const finishPlanning = async () => {
    if (!sprint) return;
    try {
      await updateSprint(sprint.id, { status: 'Active' });
      toast({
        title: 'Planejamento finalizado',
        description: 'A sprint está agora ativa!',
      });
      navigate('/sprints');
    } catch (error: any) {
      console.error('Error finishing planning:', error);
      toast({
        title: 'Erro ao finalizar planejamento',
        description: error?.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </Layout>
    );
  }

  if (!sprint) return null;

  const statusColors = {
    Planning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Active: 'bg-green-100 text-green-800 border-green-200',
    Completed: 'bg-gray-100 text-gray-800 border-gray-200',
    Cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  // Active task for the drag overlay (could be from backlog or any squad bucket)
  const activeTaskId = activeId
    ? parseInt(activeId.replace('task-', ''))
    : null;
  const activeTask = activeTaskId ? findTaskById(activeTaskId) : null;

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/sprints">Sprints</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/sprints">{sprint.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Planejamento</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {sprint.name}
              </h1>
              <Badge className={statusColors[sprint.status]}>
                {sprint.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {format(new Date(sprint.start_date), 'dd/MM/yyyy')} —{' '}
              {format(new Date(sprint.end_date), 'dd/MM/yyyy')} ·{' '}
              {activeSquads.length}{' '}
              {activeSquads.length === 1 ? 'squad ativo' : 'squads ativos'}
            </p>
          </div>
          {sprint.status === 'Planning' && (
            <Button onClick={() => setShowFinishDialog(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalizar Planejamento
            </Button>
          )}
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-[340px_minmax(0,1fr)] gap-6">
            <BacklogColumn
              tasks={filteredBacklog}
              activeId={activeId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              typeFilter={typeFilter}
              onTypeChange={setTypeFilter}
              priorityFilter={priorityFilter}
              onPriorityChange={setPriorityFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
            />

            <div className="overflow-x-auto pb-2">
              {activeSquads.length === 0 ? (
                <div className="flex items-center justify-center h-[500px] border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    Nenhum squad ativo
                  </p>
                </div>
              ) : (
                <div
                  className="flex gap-4 items-stretch"
                  style={{
                    minWidth: `${activeSquads.length * 320}px`,
                  }}
                >
                  {activeSquads.map((squad) => {
                    const squadSprint = sprintBySquad.get(squad.id);
                    const squadSprintId = squadSprint?.id ?? null;
                    return (
                      <div key={squad.id} className="w-[320px] flex-shrink-0">
                        <SquadBucket
                          sprintId={squadSprintId}
                          squadName={squad.name}
                          members={data.members.filter(
                            (m: TeamMember) => m.squad_id === squad.id
                          )}
                          participants={
                            squadSprintId
                              ? participantsBySprint.get(squadSprintId) || []
                              : []
                          }
                          tasks={
                            squadSprintId
                              ? tasksBySprint.get(squadSprintId) || []
                              : []
                          }
                          isCurrent={squadSprintId === sprintId}
                          onRemove={(taskId) =>
                            squadSprintId &&
                            handleRemoveFromSquad(squadSprintId, taskId)
                          }
                          onCreateSprint={
                            squadSprintId
                              ? undefined
                              : () => handleCreateSprintForSquad(squad)
                          }
                          onOpenRoster={
                            squadSprintId && squadSprint
                              ? () => setRosterSprint(squadSprint)
                              : undefined
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeTask ? <BacklogTaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <SprintRosterDialog
        open={!!rosterSprint}
        onClose={() => setRosterSprint(null)}
        sprint={rosterSprint}
        squadName={rosterSprint?.squad.name || ''}
      />

      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar planejamento?</AlertDialogTitle>
            <AlertDialogDescription>
              A sprint passará para o estado Ativo. Você ainda poderá adicionar
              ou remover tarefas depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={finishPlanning}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Backlog column
// ─────────────────────────────────────────────────────────────────────────────

const BacklogColumn = ({
  tasks,
  activeId,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  priorityFilter,
  onPriorityChange,
  statusFilter,
  onStatusChange,
}: {
  tasks: Task[];
  activeId: string | null;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  priorityFilter: string;
  onPriorityChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: 'backlog' });

  return (
    <Card
      ref={setNodeRef}
      className={`bg-muted/30 transition-colors ${
        isOver ? 'ring-2 ring-primary bg-muted/50' : ''
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Backlog</h2>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>

        <div className="space-y-2 mb-4">
          <Input
            placeholder="Buscar tarefa..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-background"
          />
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={onTypeChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="Feature">Feature</SelectItem>
                <SelectItem value="Bug">Bug</SelectItem>
                <SelectItem value="TechDebt">Tech Debt</SelectItem>
                <SelectItem value="Spike">Spike</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={onPriorityChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="High">Alta</SelectItem>
                <SelectItem value="Medium">Média</SelectItem>
                <SelectItem value="Low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Discovery">Discovery</SelectItem>
              <SelectItem value="Refinement">Refinement</SelectItem>
              <SelectItem value="ReadyForEng">Ready for Eng</SelectItem>
              <SelectItem value="Backlog">Backlog</SelectItem>
              <SelectItem value="InSprint">Em Sprint</SelectItem>
              <SelectItem value="Review">Review</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
              <SelectItem value="Archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
          {tasks.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhuma tarefa disponível
            </p>
          ) : (
            tasks.map((task) => (
              <BacklogDraggableCard
                key={task.id}
                task={task}
                isDragging={activeId === `task-${task.id}`}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const BacklogDraggableCard = ({
  task,
  isDragging,
}: {
  task: Task;
  isDragging?: boolean;
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `task-${task.id}`,
    data: { fromSprintId: undefined, taskId: task.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={isDragging ? 'opacity-40' : ''}
    >
      <BacklogTaskCard task={task} />
    </div>
  );
};

const BacklogTaskCard = ({
  task,
  isDragging,
}: {
  task: Task;
  isDragging?: boolean;
}) => {
  const typeColors: Record<string, string> = {
    Feature: 'bg-blue-100 text-blue-800 border-blue-200',
    Bug: 'bg-red-100 text-red-800 border-red-200',
    TechDebt: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Spike: 'bg-purple-100 text-purple-800 border-purple-200',
    Improvement: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    Deployment: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const priorityColors: Record<string, string> = {
    High: 'bg-red-100 text-red-800 border-red-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const statusColors: Record<string, string> = {
    Discovery: 'bg-purple-100 text-purple-800 border-purple-200',
    Refinement: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    ReadyForEng: 'bg-teal-100 text-teal-800 border-teal-200',
    Backlog: 'bg-slate-100 text-slate-800 border-slate-200',
    InSprint: 'bg-amber-100 text-amber-800 border-amber-200',
    Review: 'bg-orange-100 text-orange-800 border-orange-200',
    Done: 'bg-green-100 text-green-800 border-green-200',
    Archived: 'bg-gray-200 text-gray-700 border-gray-300',
  };

  const statusLabels: Record<string, string> = {
    Discovery: 'Discovery',
    Refinement: 'Refinement',
    ReadyForEng: 'Ready Eng',
    Backlog: 'Backlog',
    InSprint: 'Em Sprint',
    Review: 'Review',
    Done: 'Done',
    Archived: 'Arquivado',
  };

  const total =
    (task.estimate_frontend || 0) +
    (task.estimate_backend || 0) +
    (task.estimate_qa || 0) +
    (task.estimate_design || 0);

  return (
    <div
      className={`bg-background border rounded-md p-2.5 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDragging ? 'shadow-xl scale-105' : ''
      }`}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-snug mb-1.5 line-clamp-2">
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            <Badge
              className={`text-[10px] py-0 px-1.5 ${typeColors[task.task_type] || ''}`}
            >
              {task.task_type}
            </Badge>
            <Badge
              className={`text-[10px] py-0 px-1.5 ${priorityColors[task.priority] || ''}`}
            >
              {task.priority}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] py-0 px-1.5 ${statusColors[task.status] || ''}`}
            >
              {statusLabels[task.status] || task.status}
            </Badge>
            {total > 0 && (
              <span className="text-[10px] font-semibold ml-auto bg-secondary text-secondary-foreground px-1.5 rounded">
                {total} pts
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintPlanning;
