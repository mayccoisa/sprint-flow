import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { Plus, Search, Filter, AlertCircle, CheckCircle2, Circle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Task, TaskStatus, TaskPriority, TaskType } from '@/types';
import { TaskFormDialog } from '@/components/TaskFormDialog';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Layout } from '@/components/Layout';
import { TaskDateChangeDialog } from '@/components/TaskDateChangeDialog';
import { useLocalData } from '@/hooks/useLocalData';
import { PageSkeleton } from '@/components/ui-patterns';

type ColumnId = 'Backlog' | 'InSprint' | 'Review' | 'Done';

const priorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'High':
      return 'bg-status-danger/10 text-status-danger border-status-danger/30';
    case 'Medium':
      return 'bg-status-warning/10 text-status-warning border-status-warning/30';
    case 'Low':
      return 'bg-status-success/10 text-status-success border-status-success/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const typeIcon = (type: TaskType) => {
  switch (type) {
    case 'Feature':
      return <CheckCircle2 className="h-4 w-4 text-status-success" />;
    case 'Bug':
      return <AlertCircle className="h-4 w-4 text-status-danger" />;
    case 'TechDebt':
      return <Clock className="h-4 w-4 text-status-warning" />;
    default:
      return <Circle className="h-4 w-4 text-status-info" />;
  }
};

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isOverlay?: boolean;
}

const TaskCardContent = ({ task, onClick, isOverlay }: TaskCardProps) => (
  <Card
    onClick={onClick}
    className={cn(
      'cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative group',
      isOverlay && 'shadow-xl rotate-1'
    )}
  >
    <CardHeader className="p-4 space-y-0 pb-2">
      <div className="flex justify-between items-start gap-2">
        <Badge variant="outline" className={cn('text-[10px] px-1 py-0 h-5', priorityColor(task.priority))}>
          {task.priority}
        </Badge>
        {task.task_type && (
          <div title={task.task_type}>{typeIcon(task.task_type)}</div>
        )}
      </div>
      <CardTitle className="text-sm font-medium leading-tight mt-2 line-clamp-2">
        {task.title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4 pt-2">
      {task.description && (
        <CardDescription className="line-clamp-2 text-xs mb-2">
          {task.description}
        </CardDescription>
      )}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
        <span>{task.id}</span>
        {(task.estimate_frontend || task.estimate_backend || task.estimate_qa) && (
          <span className="flex items-center gap-1">
            <Circle className="h-3 w-3" />
            {(task.estimate_frontend || 0) + (task.estimate_backend || 0) + (task.estimate_qa || 0)} pts
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);

const DraggableTaskCard = ({ task, onClick }: { task: Task; onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : { opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCardContent task={task} onClick={onClick} />
    </div>
  );
};

const KanbanColumn = ({
  id,
  title,
  tasks,
  emptyLabel,
  onCardClick,
}: {
  id: ColumnId;
  title: string;
  tasks: Task[];
  emptyLabel: string;
  onCardClick: (task: Task) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={cn(
        'flex-1 min-w-[300px] bg-muted/40 rounded-lg p-4 flex flex-col transition-colors',
        isOver && 'bg-muted/70'
      )}
    >
      <h3 className="font-semibold mb-4 text-sm uppercase text-muted-foreground flex items-center justify-between">
        {title}
        <Badge variant="secondary" className="ml-2">
          {tasks.length}
        </Badge>
      </h3>

      <ScrollArea className="flex-1">
        <div ref={setNodeRef} className="space-y-3 min-h-[200px]">
          {tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onClick={() => onCardClick(task)}
            />
          ))}
          {tasks.length === 0 && (
            <div className="h-24 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
              {emptyLabel}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default function Backlog() {
  const { t } = useTranslation();
  const { data, loading, addTask, updateTask, syncWithJira, addTaskDateChange } = useLocalData() as any;
  const [searchQuery, setSearchQuery] = useState('');
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingDateChange, setPendingDateChange] = useState<{ task: Task; newDate: string; data: Partial<Task> } | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const { toast } = useToast();

  const tasks = data.tasks;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedTaskId = active.id as number;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((tk) => tk.id === draggedTaskId);
    if (!task || task.status === newStatus) return;

    updateTask(draggedTaskId, { status: newStatus });

    toast({
      title: t('common.saved') || 'Saved',
      description: `Task moved to ${newStatus}`,
    });
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'created_at'>) => {
    if (editingTask) {
      if (taskData.end_date && taskData.end_date !== editingTask.end_date) {
        setPendingDateChange({
          task: editingTask,
          newDate: taskData.end_date,
          data: taskData,
        });
        return;
      }
      updateTask(editingTask.id, taskData);
      toast({ title: t('common.updated') || 'Updated', description: 'Task updated successfully.' });
    } else {
      addTask({ ...taskData, status: 'Backlog' });
      toast({ title: t('common.created'), description: 'Task created successfully.' });
    }
  };

  const handleConfirmDateChange = async (reason: string) => {
    if (!pendingDateChange) return;

    const { task, data: taskData } = pendingDateChange;

    await addTaskDateChange({
      task_id: task.id,
      workspace_id: task.workspace_id || '1',
      old_end_date: task.end_date || '',
      new_end_date: pendingDateChange.newDate,
      reason: reason,
    });

    updateTask(task.id, taskData as Partial<Task>);

    toast({ title: t('common.updated') || 'Updated', description: 'Task updated with deadline justification.' });
    setPendingDateChange(null);
    setEditingTask(null);
    setIsTaskDialogOpen(false);
  };

  const handleJiraSync = async () => {
    setIsSyncing(true);
    await syncWithJira();
    setIsSyncing(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const columns: { id: ColumnId; title: string }[] = [
    { id: 'Backlog', title: t('engineeringBacklog.columns.backlog') },
    { id: 'InSprint', title: t('engineeringBacklog.columns.inSprint') },
    { id: 'Review', title: t('engineeringBacklog.columns.review') },
    { id: 'Done', title: t('engineeringBacklog.columns.done') },
  ];

  const stats = useMemo(() => {
    const totalBacklog = tasks.filter((tk) => tk.status === 'Backlog' || tk.status === 'InSprint').length;
    const totalEffort = tasks.reduce((acc, tk) => acc + (tk.estimate_frontend || 0) + (tk.estimate_backend || 0), 0);
    const bugs = tasks.filter((tk) => tk.task_type === 'Bug' && tk.status !== 'Done').length;
    const highPriority = tasks.filter((tk) => tk.priority === 'High' && tk.status !== 'Done').length;
    return { totalBacklog, totalEffort, bugs, highPriority };
  }, [tasks]);

  const matchesSearch = (task: Task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase());

  const tasksByColumn = useMemo(() => {
    const map = {} as Record<ColumnId, Task[]>;
    columns.forEach((c) => {
      map[c.id] = tasks.filter((tk) => tk.status === c.id).filter(matchesSearch);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, searchQuery]);

  const activeTask = activeId ? tasks.find((tk) => tk.id === activeId) ?? null : null;

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <PageSkeleton variant="kpi" />
          <PageSkeleton variant="kanban" count={4} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t('engineeringBacklog.title')}</h1>
            <p className="text-muted-foreground">{t('engineeringBacklog.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleJiraSync} disabled={isSyncing}>
              <RefreshCw className={cn('mr-2 h-4 w-4', isSyncing && 'animate-spin')} />
              Sincronizar Jira
            </Button>
            <Button onClick={() => { setEditingTask(null); setIsTaskDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> {t('engineeringBacklog.newTask')}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('engineeringBacklog.stats.total')}</CardTitle>
              <Circle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBacklog}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('engineeringBacklog.stats.effort')}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEffort}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('engineeringBacklog.stats.bugs')}</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bugs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('engineeringBacklog.stats.highPriority')}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highPriority}</div>
            </CardContent>
          </Card>
        </div>

        {/* Board Controls */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('productBacklog.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto">
            <div className="flex space-x-6 min-w-[1000px] h-full pb-4">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  tasks={tasksByColumn[column.id]}
                  emptyLabel={t('engineeringBacklog.dragDrop')}
                  onCardClick={handleEditTask}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeTask ? <TaskCardContent task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>

        <TaskFormDialog
          open={isTaskDialogOpen}
          onClose={() => setIsTaskDialogOpen(false)}
          onSave={handleSaveTask}
          task={editingTask}
        />

        <TaskDateChangeDialog
          open={!!pendingDateChange}
          onOpenChange={(open) => !open && setPendingDateChange(null)}
          task={pendingDateChange?.task || null}
          newEndDate={pendingDateChange?.newDate || null}
          onConfirm={handleConfirmDateChange}
        />
      </div>
    </Layout>
  );
}
