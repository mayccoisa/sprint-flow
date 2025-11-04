import { useState, useEffect, useMemo } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { Task, Sprint, Squad } from '@/types';
import { format } from 'date-fns';
import { GripVertical, X, CheckCircle } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

interface SprintWithSquad extends Sprint {
  squad: Squad;
}

interface TaskWithSprintTask extends Task {
  sprint_task_id?: number;
}

const SprintPlanning = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [sprint, setSprint] = useState<SprintWithSquad | null>(null);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [sprintTasks, setSprintTasks] = useState<TaskWithSprintTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [removeTaskId, setRemoveTaskId] = useState<number | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Load sprint with squad
      const { data: sprintData, error: sprintError } = await supabase
        .from('sprints')
        .select(`
          *,
          squad:squads(*)
        `)
        .eq('id', id)
        .single();

      if (sprintError) throw sprintError;
      if (!sprintData) {
        toast({
          title: 'Sprint não encontrada',
          variant: 'destructive',
        });
        navigate('/sprints');
        return;
      }

      setSprint(sprintData as any);

      // Load backlog tasks
      const { data: backlogData, error: backlogError } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'Backlog')
        .order('order_index');

      if (backlogError) throw backlogError;
      setBacklogTasks(backlogData || []);

      // Load sprint tasks
      const { data: sprintTasksData, error: sprintTasksError } = await supabase
        .from('sprint_tasks')
        .select(`
          id,
          order_index,
          task:tasks(*)
        `)
        .eq('sprint_id', id)
        .order('order_index');

      if (sprintTasksError) throw sprintTasksError;

      const tasksWithSprintId = (sprintTasksData || []).map((st: any) => ({
        ...st.task,
        sprint_task_id: st.id,
      }));

      setSprintTasks(tasksWithSprintId);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBacklog = useMemo(() => {
    return backlogTasks.filter((task) => {
      if (typeFilter !== 'all' && task.task_type !== typeFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter)
        return false;
      if (
        searchQuery &&
        !task.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [backlogTasks, searchQuery, typeFilter, priorityFilter]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as number;
    const overId = over.id as string;

    // Check if dropping to sprint column
    if (overId === 'sprint-column') {
      await addTaskToSprint(taskId);
    }
  };

  const addTaskToSprint = async (taskId: number) => {
    if (!sprint) return;

    try {
      // Insert into sprint_tasks
      const { error: insertError } = await supabase.from('sprint_tasks').insert({
        sprint_id: parseInt(id!),
        task_id: taskId,
        order_index: sprintTasks.length,
      });

      if (insertError) throw insertError;

      // Update task status
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'InSprint' })
        .eq('id', taskId);

      if (updateError) throw updateError;

      toast({
        title: 'Tarefa adicionada à sprint',
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error adding task to sprint:', error);
      toast({
        title: 'Erro ao adicionar tarefa',
        variant: 'destructive',
      });
    }
  };

  const removeTaskFromSprint = async (taskId: number) => {
    try {
      const task = sprintTasks.find((t) => t.id === taskId);
      if (!task || !task.sprint_task_id) return;

      // Delete from sprint_tasks
      const { error: deleteError } = await supabase
        .from('sprint_tasks')
        .delete()
        .eq('id', task.sprint_task_id);

      if (deleteError) throw deleteError;

      // Update task status back to Backlog
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'Backlog' })
        .eq('id', taskId);

      if (updateError) throw updateError;

      toast({
        title: 'Tarefa removida da sprint',
      });

      setRemoveTaskId(null);
      await loadData();
    } catch (error) {
      console.error('Error removing task from sprint:', error);
      toast({
        title: 'Erro ao remover tarefa',
        variant: 'destructive',
      });
    }
  };

  const finishPlanning = async () => {
    if (!sprint) return;

    try {
      const { error } = await supabase
        .from('sprints')
        .update({ status: 'Active' })
        .eq('id', sprint.id);

      if (error) throw error;

      toast({
        title: 'Planejamento finalizado',
        description: 'A sprint está agora ativa!',
      });

      navigate('/sprints');
    } catch (error) {
      console.error('Error finishing planning:', error);
      toast({
        title: 'Erro ao finalizar planejamento',
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

  if (!sprint) {
    return null;
  }

  const totalSprintPoints = sprintTasks.reduce(
    (sum, task) =>
      sum +
      (task.estimate_frontend || 0) +
      (task.estimate_backend || 0) +
      (task.estimate_qa || 0) +
      (task.estimate_design || 0),
    0
  );

  const statusColors = {
    Planning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Active: 'bg-green-100 text-green-800 border-green-200',
    Completed: 'bg-gray-100 text-gray-800 border-gray-200',
    Cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
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

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {sprint.name} - {sprint.squad.name}
              </h1>
              <Badge className={statusColors[sprint.status]}>
                {sprint.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {format(new Date(sprint.start_date), 'dd/MM/yyyy')} -{' '}
              {format(new Date(sprint.end_date), 'dd/MM/yyyy')}
            </p>
          </div>
          {sprint.status === 'Planning' && (
            <Button onClick={() => setShowFinishDialog(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalizar Planejamento
            </Button>
          )}
        </div>

        {/* Two Column Layout */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Backlog */}
            <div className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Tarefas Disponíveis
                  </h2>

                  {/* Filters */}
                  <div className="space-y-3 mb-4">
                    <Input
                      placeholder="Buscar tarefa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
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
                      <Select
                        value={priorityFilter}
                        onValueChange={setPriorityFilter}
                      >
                        <SelectTrigger>
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
                  </div>

                  {/* Backlog Tasks List */}
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredBacklog.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma tarefa no backlog
                      </p>
                    ) : (
                      filteredBacklog.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          isDragging={activeId === task.id}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sprint */}
            <div className="space-y-4">
              <Card className="bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      Sprint: {sprint.name}
                    </h2>
                    <Badge variant="secondary" className="text-base">
                      {sprintTasks.length} tarefas · {totalSprintPoints} pontos
                    </Badge>
                  </div>

                  {/* Sprint Tasks Drop Zone */}
                  <SprintDropZone
                    sprintTasks={sprintTasks}
                    onRemove={(taskId) => setRemoveTaskId(taskId)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <DragOverlay>
            {activeId ? (
              <TaskCard
                task={
                  backlogTasks.find((t) => t.id === activeId) ||
                  sprintTasks.find((t) => t.id === activeId)!
                }
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Finish Planning Dialog */}
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

      {/* Remove Task Dialog */}
      <AlertDialog
        open={!!removeTaskId}
        onOpenChange={() => setRemoveTaskId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover tarefa da sprint?</AlertDialogTitle>
            <AlertDialogDescription>
              A tarefa voltará para o backlog e poderá ser adicionada novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeTaskId && removeTaskFromSprint(removeTaskId)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

// Task Card Component for Drag & Drop
const TaskCard = ({
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
  };

  const priorityColors: Record<string, string> = {
    High: 'bg-red-100 text-red-800 border-red-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const totalEstimate =
    (task.estimate_frontend || 0) +
    (task.estimate_backend || 0) +
    (task.estimate_qa || 0) +
    (task.estimate_design || 0);

  return (
    <div
      className={`bg-background border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 shadow-xl scale-105' : ''
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-1 truncate">{task.title}</h4>
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge className={`text-xs ${typeColors[task.task_type]}`}>
              {task.task_type}
            </Badge>
            <Badge className={`text-xs ${priorityColors[task.priority]}`}>
              {task.priority}
            </Badge>
          </div>
          <div className="flex gap-1 flex-wrap text-xs">
            {task.estimate_frontend ? (
              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                FE: {task.estimate_frontend}
              </span>
            ) : null}
            {task.estimate_backend ? (
              <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                BE: {task.estimate_backend}
              </span>
            ) : null}
            {task.estimate_qa ? (
              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                QA: {task.estimate_qa}
              </span>
            ) : null}
            {task.estimate_design ? (
              <span className="bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded">
                Design: {task.estimate_design}
              </span>
            ) : null}
            {totalEstimate > 0 && (
              <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-semibold ml-auto">
                {totalEstimate} pts
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sprint Drop Zone Component
const SprintDropZone = ({
  sprintTasks,
  onRemove,
}: {
  sprintTasks: TaskWithSprintTask[];
  onRemove: (taskId: number) => void;
}) => {
  const typeColors: Record<string, string> = {
    Feature: 'bg-blue-100 text-blue-800 border-blue-200',
    Bug: 'bg-red-100 text-red-800 border-red-200',
    TechDebt: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Spike: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const priorityColors: Record<string, string> = {
    High: 'bg-red-100 text-red-800 border-red-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <div
      id="sprint-column"
      className="space-y-2 max-h-[600px] overflow-y-auto min-h-[400px] border-2 border-dashed border-primary/30 rounded-lg p-4"
    >
      {sprintTasks.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center">
          <p className="text-muted-foreground">
            Arraste tarefas do backlog para começar o planejamento
          </p>
        </div>
      ) : (
        sprintTasks.map((task) => {
          const totalEstimate =
            (task.estimate_frontend || 0) +
            (task.estimate_backend || 0) +
            (task.estimate_qa || 0) +
            (task.estimate_design || 0);

          return (
            <div
              key={task.id}
              className="bg-background border-2 border-primary/20 rounded-lg p-3 relative group"
            >
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(task.id)}
              >
                <X className="h-4 w-4" />
              </Button>
              <h4 className="font-medium text-sm mb-2 pr-8">{task.title}</h4>
              <div className="flex flex-wrap gap-1 mb-2">
                <Badge className={`text-xs ${typeColors[task.task_type]}`}>
                  {task.task_type}
                </Badge>
                <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                  {task.priority}
                </Badge>
              </div>
              <div className="flex gap-1 flex-wrap text-xs">
                {task.estimate_frontend ? (
                  <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                    FE: {task.estimate_frontend}
                  </span>
                ) : null}
                {task.estimate_backend ? (
                  <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                    BE: {task.estimate_backend}
                  </span>
                ) : null}
                {task.estimate_qa ? (
                  <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                    QA: {task.estimate_qa}
                  </span>
                ) : null}
                {task.estimate_design ? (
                  <span className="bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded">
                    Design: {task.estimate_design}
                  </span>
                ) : null}
                {totalEstimate > 0 && (
                  <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-semibold ml-auto">
                    {totalEstimate} pts
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Atribuir pessoas →
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default SprintPlanning;
