import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Release, Task, Squad } from '@/types';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function ReleaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [release, setRelease] = useState<Release | null>(null);
  const [squad, setSquad] = useState<Squad | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isAddTasksOpen, setIsAddTasksOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    const [releaseRes, releaseTasksRes, allTasksRes] = await Promise.all([
      supabase.from('releases').select('*').eq('id', parseInt(id)).single(),
      supabase
        .from('release_tasks')
        .select('task_id')
        .eq('release_id', parseInt(id)),
      supabase.from('tasks').select('*'),
    ]);

    if (releaseRes.data) {
      setRelease(releaseRes.data);
      
      if (releaseRes.data.squad_id) {
        const squadRes = await supabase
          .from('squads')
          .select('*')
          .eq('id', releaseRes.data.squad_id)
          .single();
        if (squadRes.data) setSquad(squadRes.data);
      }
    }

    if (allTasksRes.data) {
      setAllTasks(allTasksRes.data);
      
      if (releaseTasksRes.data) {
        const taskIds = releaseTasksRes.data.map(rt => rt.task_id);
        const releaseTasks = allTasksRes.data.filter(t => taskIds.includes(t.id));
        setTasks(releaseTasks);
      }
    }
  };

  const handleAddTasks = async () => {
    if (!id || selectedTaskIds.length === 0) return;

    const inserts = selectedTaskIds.map(taskId => ({
      release_id: parseInt(id),
      task_id: taskId,
    }));

    const { error } = await supabase.from('release_tasks').insert(inserts);

    if (error) {
      toast({
        title: 'Erro ao adicionar tarefas',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Tarefas adicionadas',
        description: `${selectedTaskIds.length} tarefa(s) adicionada(s) à release`,
      });
      setIsAddTasksOpen(false);
      setSelectedTaskIds([]);
      loadData();
    }
  };

  const handleRemoveTask = async (taskId: number) => {
    if (!id) return;

    await supabase
      .from('release_tasks')
      .delete()
      .eq('release_id', parseInt(id))
      .eq('task_id', taskId);

    toast({
      title: 'Tarefa removida',
      description: 'Tarefa removida da release',
    });
    loadData();
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return { done: 0, total: 0, percentage: 0 };
    const done = tasks.filter(t => t.status === 'Done').length;
    return {
      done,
      total: tasks.length,
      percentage: Math.round((done / tasks.length) * 100),
    };
  };

  const calculatePoints = () => {
    return tasks.reduce((sum, task) => {
      return sum + 
        (task.estimate_frontend || 0) +
        (task.estimate_backend || 0) +
        (task.estimate_qa || 0) +
        (task.estimate_design || 0);
    }, 0);
  };

  const filteredAllTasks = allTasks.filter(task => {
    const alreadyInRelease = tasks.some(t => t.id === task.id);
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    return !alreadyInRelease && matchesSearch;
  });

  const progress = calculateProgress();
  const totalPoints = calculatePoints();

  if (!release) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/releases')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{release.version_name}</h1>
          <Badge>{release.status}</Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Total de Tarefas</div>
            <div className="text-2xl font-semibold tracking-tight">{tasks.length}</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Pontos Totais</div>
            <div className="text-2xl font-semibold tracking-tight">{totalPoints}</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Progresso</div>
            <div className="text-2xl font-semibold tracking-tight">
              {progress.done}/{progress.total} ({progress.percentage}%)
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informações</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Data de Lançamento:</span>
              <span>{format(new Date(release.release_date), 'dd/MM/yyyy')}</span>
            </div>
            {squad && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Squad:</span>
                <span>{squad.name}</span>
              </div>
            )}
            {release.description && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground">Descrição:</span>
                <span>{release.description}</span>
              </div>
            )}
            {release.release_notes && (
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground">Release Notes:</span>
                <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                  {release.release_notes}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tarefas Incluídas</h2>
            <Button onClick={() => setIsAddTasksOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Tarefas
            </Button>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{task.title}</span>
                    <Badge variant="outline">{task.task_type}</Badge>
                    <Badge>{task.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(task.estimate_frontend || 0) + 
                     (task.estimate_backend || 0) + 
                     (task.estimate_qa || 0) + 
                     (task.estimate_design || 0)} pontos
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTask(task.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma tarefa adicionada ainda.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={isAddTasksOpen} onOpenChange={setIsAddTasksOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Tarefas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="space-y-2">
              {filteredAllTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedTaskIds.includes(task.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTaskIds([...selectedTaskIds, task.id]);
                      } else {
                        setSelectedTaskIds(selectedTaskIds.filter(id => id !== task.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline" className="text-xs">{task.task_type}</Badge>
                      <Badge className="text-xs">{task.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddTasksOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddTasks} disabled={selectedTaskIds.length === 0}>
                Adicionar {selectedTaskIds.length} selecionada(s)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
