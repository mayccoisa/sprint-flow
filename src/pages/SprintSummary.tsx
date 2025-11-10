import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Task, Sprint, Squad } from '@/types';
import { format } from 'date-fns';
import { ArrowLeft, Download } from 'lucide-react';

interface SprintWithSquad extends Sprint {
  squad: Squad;
}

interface TaskWithStatus extends Task {
  task_status?: 'Todo' | 'InProgress' | 'Done' | 'Blocked';
}

const SprintSummary = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [sprint, setSprint] = useState<SprintWithSquad | null>(null);
  const [sprintTasks, setSprintTasks] = useState<TaskWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

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
        .eq('id', parseInt(id))
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

      // Check if sprint is completed
      if (sprintData.status !== 'Completed') {
        toast({
          title: 'Sprint ainda não foi completada',
          description: 'O resumo está disponível apenas para sprints completadas',
          variant: 'destructive',
        });
        navigate(`/sprints/${id}/planning`);
        return;
      }

      setSprint(sprintData as any);

      // Load sprint tasks
      const { data: sprintTasksData, error: sprintTasksError } = await supabase
        .from('sprint_tasks')
        .select(`
          id,
          order_index,
          task_status,
          task:tasks(*)
        `)
        .eq('sprint_id', parseInt(id))
        .order('order_index');

      if (sprintTasksError) throw sprintTasksError;

      const tasksWithStatus = (sprintTasksData || []).map((st: any) => ({
        ...st.task,
        task_status: st.task_status || 'Todo',
      }));

      setSprintTasks(tasksWithStatus as TaskWithStatus[]);
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

  // Calculate metrics
  const totalPlannedPoints = sprintTasks.reduce(
    (sum, task) =>
      sum +
      (task.estimate_frontend || 0) +
      (task.estimate_backend || 0) +
      (task.estimate_qa || 0) +
      (task.estimate_design || 0),
    0
  );

  const completedPoints = sprintTasks
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

  const totalTasks = sprintTasks.length;
  const completedTasks = sprintTasks.filter((task) => task.task_status === 'Done').length;

  const completionPercentage = totalPlannedPoints > 0
    ? Math.round((completedPoints / totalPlannedPoints) * 100)
    : 0;

  // Calculate by specialty
  const specialties = [
    { key: 'frontend', label: 'Frontend' },
    { key: 'backend', label: 'Backend' },
    { key: 'qa', label: 'QA' },
    { key: 'design', label: 'Design' },
  ];

  const specialtyMetrics = specialties.map((specialty) => {
    const estimateKey = `estimate_${specialty.key}` as keyof Task;
    const planned = sprintTasks.reduce((sum, task) => sum + (Number(task[estimateKey]) || 0), 0);
    const completed = sprintTasks
      .filter((task) => task.task_status === 'Done')
      .reduce((sum, task) => sum + (Number(task[estimateKey]) || 0), 0);
    const percentage = planned > 0 ? Math.round((completed / planned) * 100) : 0;

    return {
      name: specialty.label,
      planned,
      completed,
      percentage,
    };
  });

  // Group tasks by status
  const tasksByStatus = {
    Done: sprintTasks.filter((t) => t.task_status === 'Done'),
    InProgress: sprintTasks.filter((t) => t.task_status === 'InProgress'),
    Todo: sprintTasks.filter((t) => t.task_status === 'Todo'),
    Blocked: sprintTasks.filter((t) => t.task_status === 'Blocked'),
  };

  const successRate = completionPercentage >= 90;

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
            <BreadcrumbPage>Resumo</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {sprint.name} - {sprint.squad.name}
              </h1>
              <Badge
                className={
                  successRate
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                }
              >
                {successRate ? 'Sucesso' : 'Parcial'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {format(new Date(sprint.start_date), 'dd/MM/yyyy')} -{' '}
              {format(new Date(sprint.end_date), 'dd/MM/yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/sprints')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar (em breve)
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Pontos Planejados</p>
                <p className="text-3xl font-bold text-primary">{totalPlannedPoints}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Pontos Completados</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {completedPoints}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{completionPercentage}% do planejado</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Tarefas Planejadas</p>
                <p className="text-3xl font-bold">{totalTasks}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Tarefas Completadas</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {completedTasks}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-4">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Velocidade da Sprint</p>
                <p className="text-4xl font-bold text-primary">{completedPoints} pontos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use esta velocidade para estimar próximas sprints
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Specialty Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Breakdown por Especialidade</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Especialidade</TableHead>
                  <TableHead className="text-right">Planejado</TableHead>
                  <TableHead className="text-right">Completado</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specialtyMetrics.map((metric) => (
                  <TableRow key={metric.name}>
                    <TableCell className="font-medium">{metric.name}</TableCell>
                    <TableCell className="text-right">{metric.planned}</TableCell>
                    <TableCell className="text-right">{metric.completed}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={metric.percentage >= 90 ? 'default' : 'secondary'}
                        className={
                          metric.percentage >= 90
                            ? 'bg-green-100 text-green-800'
                            : metric.percentage >= 70
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {metric.percentage}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas da Sprint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(tasksByStatus).map(([status, tasks]) => {
              if (tasks.length === 0) return null;

              const statusLabels: Record<string, { label: string; color: string }> = {
                Done: { label: '✅ Concluídas', color: 'text-green-600 dark:text-green-400' },
                InProgress: { label: '🚀 Em Progresso', color: 'text-blue-600 dark:text-blue-400' },
                Todo: { label: '📋 A Fazer', color: 'text-muted-foreground' },
                Blocked: { label: '🚫 Bloqueadas', color: 'text-red-600 dark:text-red-400' },
              };

              return (
                <div key={status}>
                  <h3 className={`font-semibold mb-2 ${statusLabels[status].color}`}>
                    {statusLabels[status].label} ({tasks.length})
                  </h3>
                  <div className="space-y-2">
                    {tasks.map((task) => {
                      const totalEstimate =
                        (task.estimate_frontend || 0) +
                        (task.estimate_backend || 0) +
                        (task.estimate_qa || 0) +
                        (task.estimate_design || 0);

                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{task.title}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {task.task_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{totalEstimate} pts</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SprintSummary;
