import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Edit, ListTodo, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import type { Sprint, Task, SprintTask, TeamMember } from '@/types';
import { cn } from '@/lib/utils';

interface SprintCardProps {
  sprint: Sprint;
  tasks: Task[];
  sprintTasks: SprintTask[];
  squadMembers: TeamMember[];
  onEdit: () => void;
  onComplete?: () => void;
}

export const SprintCard = ({ sprint, tasks, sprintTasks, squadMembers, onEdit, onComplete }: SprintCardProps) => {
  const sprintTaskIds = sprintTasks.filter(st => st.sprint_id === sprint.id).map(st => st.task_id);
  const sprintTasksData = tasks.filter(t => sprintTaskIds.includes(t.id));
  
  const totalPoints = sprintTasksData.reduce((sum, task) => {
    return sum + (task.estimate_frontend || 0) + (task.estimate_backend || 0) + 
           (task.estimate_qa || 0) + (task.estimate_design || 0);
  }, 0);

  const squadCapacity = squadMembers
    .filter(m => m.status === 'Active')
    .reduce((sum, m) => sum + m.capacity, 0);

  const capacityPercentage = squadCapacity > 0 ? (totalPoints / squadCapacity) * 100 : 0;

  const getStatusColor = (status: Sprint['status']) => {
    switch (status) {
      case 'Planning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const getProgressColor = () => {
    if (capacityPercentage <= 100) return 'bg-green-500';
    if (capacityPercentage <= 110) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow",
      sprint.status === 'Planning' && "border-l-4 border-l-yellow-500",
      sprint.status === 'Active' && "border-l-4 border-l-green-500",
      sprint.status === 'Completed' && "border-l-4 border-l-gray-500",
      sprint.status === 'Cancelled' && "border-l-4 border-l-red-500"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{sprint.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(sprint.start_date), 'dd/MM')} - {format(new Date(sprint.end_date), 'dd/MM/yyyy')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(sprint.status)}>
              {sprint.status}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
            <span>{sprintTasksData.length} tarefas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{totalPoints} pontos alocados</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Capacidade</span>
            <span className={cn(
              "font-medium",
              capacityPercentage > 110 && "text-red-600",
              capacityPercentage > 100 && capacityPercentage <= 110 && "text-yellow-600",
              capacityPercentage <= 100 && "text-green-600"
            )}>
              {totalPoints}/{squadCapacity} pontos ({Math.round(capacityPercentage)}%)
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div 
              className={cn("h-full transition-all", getProgressColor())}
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button asChild className="flex-1">
            <Link to={`/sprints/${sprint.id}/planning`}>
              Planejar Sprint
            </Link>
          </Button>
          {sprint.status === 'Active' && onComplete && (
            <Button variant="outline" onClick={onComplete} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Finalizar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
