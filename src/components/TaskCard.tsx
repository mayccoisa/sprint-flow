import { Task } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Archive } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onArchive: (taskId: number) => void;
}

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

export const TaskCard = ({ task, onEdit, onArchive }: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalEstimate =
    (task.estimate_frontend || 0) +
    (task.estimate_backend || 0) +
    (task.estimate_qa || 0) +
    (task.estimate_design || 0);

  const hasEstimates = totalEstimate > 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-3 hover:shadow-md transition-shadow cursor-move"
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex gap-2">
            <Badge className={typeColors[task.task_type]}>{task.task_type}</Badge>
            <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onArchive(task.id);
              }}
            >
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-2">{task.title}</h3>

        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {hasEstimates ? (
          <div className="flex flex-wrap gap-2 items-center">
            {task.estimate_frontend && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Frontend: {task.estimate_frontend}
              </Badge>
            )}
            {task.estimate_backend && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Backend: {task.estimate_backend}
              </Badge>
            )}
            {task.estimate_qa && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                QA: {task.estimate_qa}
              </Badge>
            )}
            {task.estimate_design && (
              <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                Design: {task.estimate_design}
              </Badge>
            )}
            <Badge variant="secondary" className="ml-auto font-semibold">
              Total: {totalEstimate} pts
            </Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sem estimativa</p>
        )}
      </CardContent>
    </Card>
  );
};
