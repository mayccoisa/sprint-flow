import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskCard } from '@/components/TaskCard';
import { TaskFormDialog } from '@/components/TaskFormDialog';
import { useLocalData } from '@/hooks/useLocalData';
import { Task } from '@/types';
import { Plus, ListChecks, Zap, AlertCircle, GitBranch } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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

const Backlog = () => {
  const { data, addTask, updateTask, deleteTask } = useLocalData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [archiveTaskId, setArchiveTaskId] = useState<number | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('Backlog');
  const [sortBy, setSortBy] = useState('order');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredTasks = useMemo(() => {
    let filtered = data.tasks.filter((task) => {
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

    // Sort
    if (sortBy === 'priority') {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      filtered.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    } else if (sortBy === 'created') {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === 'effort') {
      filtered.sort((a, b) => {
        const effortA =
          (a.estimate_frontend || 0) +
          (a.estimate_backend || 0) +
          (a.estimate_qa || 0) +
          (a.estimate_design || 0);
        const effortB =
          (b.estimate_frontend || 0) +
          (b.estimate_backend || 0) +
          (b.estimate_qa || 0) +
          (b.estimate_design || 0);
        return effortB - effortA;
      });
    } else {
      filtered.sort((a, b) => a.order_index - b.order_index);
    }

    return filtered;
  }, [data.tasks, searchQuery, typeFilter, priorityFilter, statusFilter, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const backlogTasks = data.tasks.filter((t) => t.status === 'Backlog');
    const totalEffort = backlogTasks.reduce(
      (sum, task) =>
        sum +
        (task.estimate_frontend || 0) +
        (task.estimate_backend || 0) +
        (task.estimate_qa || 0) +
        (task.estimate_design || 0),
      0
    );

    const byType = {
      Feature: backlogTasks.filter((t) => t.task_type === 'Feature').length,
      Bug: backlogTasks.filter((t) => t.task_type === 'Bug').length,
      TechDebt: backlogTasks.filter((t) => t.task_type === 'TechDebt').length,
      Spike: backlogTasks.filter((t) => t.task_type === 'Spike').length,
    };

    const byPriority = {
      High: backlogTasks.filter((t) => t.priority === 'High').length,
      Medium: backlogTasks.filter((t) => t.priority === 'Medium').length,
      Low: backlogTasks.filter((t) => t.priority === 'Low').length,
    };

    return {
      total: backlogTasks.length,
      totalEffort,
      byType,
      byPriority,
    };
  }, [data.tasks]);

  const handleSave = (taskData: Omit<Task, 'id' | 'created_at'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
      toast({
        title: 'Tarefa atualizada',
        description: 'A tarefa foi atualizada com sucesso.',
      });
    } else {
      const maxOrder = Math.max(...data.tasks.map((t) => t.order_index), -1);
      addTask({ ...taskData, order_index: maxOrder + 1 });
      toast({
        title: 'Tarefa criada',
        description: 'A tarefa foi criada com sucesso.',
      });
    }
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleArchive = (taskId: number) => {
    setArchiveTaskId(taskId);
  };

  const confirmArchive = () => {
    if (archiveTaskId) {
      updateTask(archiveTaskId, { status: 'Archived' });
      toast({
        title: 'Tarefa arquivada',
        description: 'A tarefa foi arquivada com sucesso.',
      });
      setArchiveTaskId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredTasks.findIndex((t) => t.id === active.id);
      const newIndex = filteredTasks.findIndex((t) => t.id === over.id);

      const reordered = arrayMove(filteredTasks, oldIndex, newIndex);

      // Update order_index for all affected tasks
      reordered.forEach((task, index) => {
        updateTask(task.id, { order_index: index });
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setPriorityFilter('all');
    setStatusFilter('Backlog');
    setSortBy('order');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Backlog</h1>
          <Button
            onClick={() => {
              setEditingTask(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Total de Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">no backlog</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Esforço Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalEffort}</div>
              <p className="text-sm text-muted-foreground">pontos acumulados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Features:</span>
                <span className="font-semibold">{stats.byType.Feature}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Bugs:</span>
                <span className="font-semibold">{stats.byType.Bug}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tech Debt:</span>
                <span className="font-semibold">{stats.byType.TechDebt}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Spikes:</span>
                <span className="font-semibold">{stats.byType.Spike}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Por Prioridade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-red-600">Alta:</span>
                <span className="font-semibold">{stats.byPriority.High}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-600">Média:</span>
                <span className="font-semibold">{stats.byPriority.Medium}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Baixa:</span>
                <span className="font-semibold">{stats.byPriority.Low}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <div className="w-64 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <Input
                    placeholder="Buscar por título..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Feature">Feature</SelectItem>
                      <SelectItem value="Bug">Bug</SelectItem>
                      <SelectItem value="TechDebt">Tech Debt</SelectItem>
                      <SelectItem value="Spike">Spike</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Prioridade</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="High">Alta</SelectItem>
                      <SelectItem value="Medium">Média</SelectItem>
                      <SelectItem value="Low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Backlog">Backlog</SelectItem>
                      <SelectItem value="InSprint">In Sprint</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order">Ordem Manual</SelectItem>
                      <SelectItem value="priority">Prioridade</SelectItem>
                      <SelectItem value="created">Data de Criação</SelectItem>
                      <SelectItem value="effort">Esforço Total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Task List */}
          <div className="flex-1">
            {filteredTasks.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  Nenhuma tarefa encontrada. Crie a primeira!
                </p>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEdit}
                      onArchive={handleArchive}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      <TaskFormDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSave}
        task={editingTask}
      />

      <AlertDialog open={!!archiveTaskId} onOpenChange={() => setArchiveTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta tarefa será arquivada e removida da visualização principal. Você poderá
              acessá-la através do filtro de status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>Arquivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Backlog;
