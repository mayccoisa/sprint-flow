import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Task } from '@/types';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

interface TaskWithStatus extends Task {
  sprint_task_id?: number;
  task_status?: 'Todo' | 'InProgress' | 'Done' | 'Blocked';
}

interface KanbanBoardProps {
  tasks: TaskWithStatus[];
  onStatusChange: (taskId: number, newStatus: 'Todo' | 'InProgress' | 'Done' | 'Blocked') => Promise<void>;
  onRemove: (taskId: number) => void;
}

const columnConfig = [
  { id: 'Todo', title: '📋 To Do', bgColor: 'bg-muted/30' },
  { id: 'InProgress', title: '🚀 In Progress', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  { id: 'Done', title: '✅ Done', bgColor: 'bg-green-50 dark:bg-green-950/30' },
  { id: 'Blocked', title: '🚫 Blocked', bgColor: 'bg-red-50 dark:bg-red-950/30' },
];

export const KanbanBoard = ({ tasks, onStatusChange, onRemove }: KanbanBoardProps) => {
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as number;
    const newStatus = over.id as 'Todo' | 'InProgress' | 'Done' | 'Blocked';

    const task = tasks.find((t) => t.id === taskId);
    if (task && task.task_status !== newStatus) {
      await onStatusChange(taskId, newStatus);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.task_status === status);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCorners}
    >
      <div className="grid grid-cols-4 gap-4">
        {columnConfig.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            bgColor={column.bgColor}
            tasks={getTasksByStatus(column.id)}
            onRemove={onRemove}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
};

const KanbanColumn = ({
  id,
  title,
  bgColor,
  tasks,
  onRemove,
}: {
  id: string;
  title: string;
  bgColor: string;
  tasks: TaskWithStatus[];
  onRemove: (taskId: number) => void;
}) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <Card className={bgColor}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={setNodeRef} className="space-y-2 min-h-[400px]">
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Arraste tarefas aqui
            </p>
          ) : (
            tasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onRemove={onRemove}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const DraggableTaskCard = ({
  task,
  onRemove,
}: {
  task: TaskWithStatus;
  onRemove: (taskId: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onRemove={onRemove} />
    </div>
  );
};

const TaskCard = ({
  task,
  isDragging,
  onRemove,
}: {
  task: TaskWithStatus;
  isDragging?: boolean;
  onRemove?: (taskId: number) => void;
}) => {
  const typeColors: Record<string, string> = {
    Feature: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
    Bug: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300',
    TechDebt: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
    Spike: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
  };

  const priorityColors: Record<string, string> = {
    High: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
    Low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  };

  const totalEstimate =
    (task.estimate_frontend || 0) +
    (task.estimate_backend || 0) +
    (task.estimate_qa || 0) +
    (task.estimate_design || 0);

  return (
    <div
      className={`bg-background border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md relative group ${
        isDragging ? 'shadow-xl scale-105' : ''
      }`}
    >
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(task.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      <h4 className="font-medium text-sm mb-2 pr-6">{task.title}</h4>
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
          <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded">
            FE: {task.estimate_frontend}
          </span>
        ) : null}
        {task.estimate_backend ? (
          <span className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-1.5 py-0.5 rounded">
            BE: {task.estimate_backend}
          </span>
        ) : null}
        {task.estimate_qa ? (
          <span className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded">
            QA: {task.estimate_qa}
          </span>
        ) : null}
        {task.estimate_design ? (
          <span className="bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 px-1.5 py-0.5 rounded">
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
  );
};
