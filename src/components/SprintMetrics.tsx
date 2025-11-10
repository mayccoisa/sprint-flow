import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Task } from '@/types';
import { differenceInDays, parseISO } from 'date-fns';

interface TaskWithStatus extends Task {
  task_status?: 'Todo' | 'InProgress' | 'Done' | 'Blocked';
}

interface SprintMetricsProps {
  tasks: TaskWithStatus[];
  startDate: string;
  endDate: string;
  status: string;
}

export const SprintMetrics = ({ tasks, startDate, endDate, status }: SprintMetricsProps) => {
  // Calculate total points
  const totalPlannedPoints = tasks.reduce(
    (sum, task) =>
      sum +
      (task.estimate_frontend || 0) +
      (task.estimate_backend || 0) +
      (task.estimate_qa || 0) +
      (task.estimate_design || 0),
    0
  );

  // Calculate completed points
  const completedPoints = tasks
    .filter((task) => task.task_status === 'Done')
    .reduce(
      (sum, task) =>
        sum +
        (task.estimate_frontend || 0) +
        (task.estimate_backend || 0) +
        (task.estimate_qa || 0) +
        (task.estimate_design || 0),
      0
    );

  // Calculate tasks count
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.task_status === 'Done').length;

  // Calculate percentage
  const completionPercentage = totalPlannedPoints > 0 
    ? Math.round((completedPoints / totalPlannedPoints) * 100)
    : 0;

  // Calculate days remaining
  const today = new Date();
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const daysRemaining = differenceInDays(end, today);
  const totalDays = differenceInDays(end, start);
  const daysElapsed = Math.max(0, totalDays - daysRemaining);

  // Calculate by specialty
  const specialties = ['frontend', 'backend', 'qa', 'design'] as const;
  const specialtyMetrics = specialties.map((specialty) => {
    const estimateKey = `estimate_${specialty}` as keyof Task;
    const planned = tasks.reduce((sum, task) => sum + (Number(task[estimateKey]) || 0), 0);
    const completed = tasks
      .filter((task) => task.task_status === 'Done')
      .reduce((sum, task) => sum + (Number(task[estimateKey]) || 0), 0);
    const percentage = planned > 0 ? Math.round((completed / planned) * 100) : 0;

    return {
      name: specialty.charAt(0).toUpperCase() + specialty.slice(1),
      planned,
      completed,
      percentage,
    };
  });

  // Calculate velocity (points per day)
  const velocity = daysElapsed > 0 ? (completedPoints / daysElapsed).toFixed(1) : '0';
  const projectedCompletion = daysRemaining > 0 
    ? Math.round(completedPoints + (parseFloat(velocity) * daysRemaining))
    : completedPoints;

  const isBehindSchedule = projectedCompletion < totalPlannedPoints && daysRemaining > 0;

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📈 Progresso da Sprint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Points Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Pontos Completados</span>
              <span className="text-2xl font-bold text-primary">
                {completedPoints} / {totalPlannedPoints}
              </span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground mt-1">{completionPercentage}% completo</p>
          </div>

          {/* Tasks Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tarefas Completadas</span>
              <span className="text-lg font-bold">
                {completedTasks} / {totalTasks}
              </span>
            </div>
            <Progress 
              value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0} 
              className="h-2" 
            />
          </div>

          {/* Days Remaining */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dias Restantes</span>
              <Badge variant={daysRemaining > 0 ? 'default' : 'secondary'}>
                {daysRemaining > 0 ? `${daysRemaining} dias` : 'Sprint finalizada'}
              </Badge>
            </div>
          </div>

          {/* Velocity */}
          {status === 'Active' && daysElapsed > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Velocidade</span>
                <span className="text-lg font-bold">{velocity} pts/dia</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Projeção de conclusão</span>
                <span className={`text-sm font-medium ${isBehindSchedule ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
                  {projectedCompletion} pts
                </span>
              </div>
              {isBehindSchedule && (
                <p className="text-xs text-destructive mt-2">
                  ⚠️ Ritmo abaixo do esperado
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specialty Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Por Especialidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {specialtyMetrics.map((specialty) => (
            <div key={specialty.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{specialty.name}</span>
                <span className="text-sm">
                  {specialty.completed} / {specialty.planned} pts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={specialty.percentage} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {specialty.percentage}%
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
