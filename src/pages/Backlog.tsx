import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Search, Filter, AlertCircle, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Task, TaskStatus, TaskPriority, TaskType } from '@/types';
import { TaskFormDialog } from '@/components/TaskFormDialog';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Layout } from '@/components/Layout';

// Mock data for initial state
const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    title: 'Implement Authentication Flow',
    description: 'User login, registration, and password recovery using Supabase Auth.',
    status: 'InSprint', // In Sprint
    priority: 'High',
    task_type: 'Feature',
    estimate_frontend: 5,
    estimate_backend: 8,
    estimate_qa: null,
    estimate_design: null,
    created_at: new Date().toISOString(),
    start_date: '2024-03-20',
    end_date: '2024-03-25',
    order_index: 0,
    product_objective: null,
    business_goal: null,
    user_impact: null,
    has_prototype: false,
    prototype_link: null
  },
  {
    id: 2,
    title: 'Fix Navigation Bug on Mobile',
    description: 'Menu drawer does not close when clicking outside on iOS devices.',
    status: 'Backlog', // Backlog
    priority: 'High',
    task_type: 'Bug',
    estimate_frontend: 3,
    estimate_backend: null,
    estimate_qa: null,
    estimate_design: null,
    created_at: new Date().toISOString(),
    start_date: null,
    end_date: null,
    order_index: 1,
    product_objective: null,
    business_goal: null,
    user_impact: null,
    has_prototype: false,
    prototype_link: null
  },
  {
    id: 3,
    title: 'Design System Documentation',
    description: 'Create usage guidelines for core components.',
    status: 'Done', // Done
    priority: 'Low',
    task_type: 'TechDebt',
    estimate_frontend: null,
    estimate_backend: null,
    estimate_qa: null,
    estimate_design: 5,
    created_at: new Date().toISOString(),
    start_date: null,
    end_date: null,
    order_index: 2,
    product_objective: null,
    business_goal: null,
    user_impact: null,
    has_prototype: false,
    prototype_link: null
  },
  {
    id: 4,
    title: 'API Performance Optimization',
    description: 'Optimize database queries for the dashboard endpoints.',
    status: 'Review', // Review
    priority: 'Medium',
    task_type: 'TechDebt',
    estimate_frontend: null,
    estimate_backend: 5,
    estimate_qa: null,
    estimate_design: null,
    created_at: new Date().toISOString(),
    start_date: null,
    end_date: null,
    order_index: 3,
    product_objective: null,
    business_goal: null,
    user_impact: null,
    has_prototype: false,
    prototype_link: null
  },
  {
    id: 5,
    title: 'User Profile Page',
    description: 'Allow users to update their avatar and personal information.',
    status: 'InSprint', // InSprint
    priority: 'Medium',
    task_type: 'Feature',
    estimate_frontend: 5,
    estimate_backend: 3,
    estimate_qa: null,
    estimate_design: null,
    created_at: new Date().toISOString(),
    start_date: null,
    end_date: null,
    order_index: 4,
    product_objective: null,
    business_goal: null,
    user_impact: null,
    has_prototype: false,
    prototype_link: null
  }
];

export default function Backlog() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { toast } = useToast();

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const draggedTaskId = parseInt(draggableId.toString());
    const draggedTask = tasks.find((t) => t.id === draggedTaskId);
    if (!draggedTask) return;

    // Create a new array to avoid mutating state directly
    const newTasks = Array.from(tasks);
    const taskIndex = newTasks.findIndex((t) => t.id === draggedTaskId);

    // Update the task status based on the destination column
    const updatedTask = {
      ...newTasks[taskIndex],
      status: destination.droppableId as TaskStatus
    };

    newTasks.splice(taskIndex, 1); // Remove from old position
    // In a real app with order index, we would insert at the new index.
    // For this mock, we just add it back with updated status.
    newTasks.splice(taskIndex, 0, updatedTask); // Put it back (simplified for state update)
    // Actually, to simulate moving between lists, we should just update the status map
    // But since we map by filtering status, updating the status field is enough.

    // Better approach for local state:
    const updatedTasks = tasks.map(t =>
      t.id === draggedTaskId ? { ...t, status: destination.droppableId as TaskStatus } : t
    );

    setTasks(updatedTasks);

    toast({
      title: t('common.saved') || "Saved",
      description: `Task moved to ${destination.droppableId}`,
    });
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'created_at'>) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id ? { ...t, ...taskData } : t
        )
      );
      toast({ title: t('common.updated') || "Updated", description: "Task updated successfully." });
    } else {
      const newTask: Task = {
        id: Date.now(), // Generate numeric ID
        created_at: new Date().toISOString(),
        order_index: 0,
        product_objective: null,
        business_goal: null,
        user_impact: null,
        has_prototype: false,
        prototype_link: null,
        estimate_frontend: null,
        estimate_backend: null,
        estimate_qa: null,
        estimate_design: null,
        start_date: null,
        end_date: null,
        ...taskData,
        status: 'Backlog', // Default to backlog for new tasks
      } as Task;
      setTasks((prev) => [...prev, newTask]);
      toast({ title: t('common.created'), description: "Task created successfully." });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast({ title: t('common.archived'), description: "Task moved to archive." });
  };

  const priorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const typeIcon = (type: TaskType) => {
    switch (type) {
      case 'Feature': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'Bug': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'TechDebt': return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <Circle className="h-4 w-4 text-blue-500" />;
    }
  };

  type ColumnId = 'Backlog' | 'InSprint' | 'Review' | 'Done';

  const columns: { id: ColumnId; title: string }[] = [
    { id: 'Backlog', title: t('engineeringBacklog.columns.backlog') },
    { id: 'InSprint', title: t('engineeringBacklog.columns.inSprint') },
    { id: 'Review', title: t('engineeringBacklog.columns.review') },
    { id: 'Done', title: t('engineeringBacklog.columns.done') },
  ];

  // Statistics
  const stats = useMemo(() => {
    const totalBacklog = tasks.filter(t => t.status === 'Backlog' || t.status === 'InSprint').length;
    const totalEffort = tasks.reduce((acc, t) => acc + (t.estimate_frontend || 0) + (t.estimate_backend || 0), 0);
    const bugs = tasks.filter(t => t.task_type === 'Bug' && t.status !== 'Done').length;
    const highPriority = tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length;

    return { totalBacklog, totalEffort, bugs, highPriority };
  }, [tasks]);

  return (
    <Layout>
      <div className="h-full flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('engineeringBacklog.title')}</h1>
            <p className="text-muted-foreground">{t('engineeringBacklog.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-2">
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-x-auto">
            <div className="flex space-x-6 min-w-[1000px] h-full pb-4">
              {columns.map((column) => (
                <div key={column.id} className="flex-1 min-w-[300px] bg-muted/40 rounded-lg p-4 flex flex-col">
                  <h3 className="font-semibold mb-4 text-sm uppercase text-muted-foreground flex items-center justify-between">
                    {column.title}
                    <Badge variant="secondary" className="ml-2">
                      {tasks.filter(t => t.status === column.id).length}
                    </Badge>
                  </h3>

                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <ScrollArea className="flex-1">
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-3 min-h-[200px]"
                        >
                          {tasks
                            .filter((task) => task.status === column.id)
                            .filter((task) =>
                              task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              task.description?.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                {(provided) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative group"
                                    onClick={() => handleEditTask(task)}
                                  >
                                    <CardHeader className="p-4 space-y-0 pb-2">
                                      <div className="flex justify-between items-start gap-2">
                                        <Badge variant="outline" className={cn("text-[10px] px-1 py-0 h-5", priorityColor(task.priority))}>
                                          {task.priority}
                                        </Badge>
                                        {task.task_type && (
                                          <div title={task.task_type}>
                                            {typeIcon(task.task_type)}
                                          </div>
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
                                        {/* Display effort points sum */}
                                        {(task.estimate_frontend || task.estimate_backend || task.estimate_qa) && (
                                          <span className="flex items-center gap-1">
                                            <Circle className="h-3 w-3" />
                                            {(task.estimate_frontend || 0) + (task.estimate_backend || 0) + (task.estimate_qa || 0)} pts
                                          </span>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                          {tasks.filter(t => t.status === column.id).length === 0 && (
                            <div className="h-24 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                              {t('engineeringBacklog.dragDrop')}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </div>
        </DragDropContext>

        <TaskFormDialog
          open={isTaskDialogOpen}
          onClose={() => setIsTaskDialogOpen(false)}
          onSave={handleSaveTask}
          task={editingTask}
        />
      </div>
    </Layout>
  );
}
