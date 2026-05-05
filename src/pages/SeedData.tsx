import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useLocalData } from '@/hooks/useLocalData';
import { Loader2 } from 'lucide-react';
import { useConfirm } from '@/components/ui-patterns';

export default function SeedData() {
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const { toast } = useToast();
  const confirm = useConfirm();
  const {
    data,
    addSquad,
    addMember,
    addTask,
    addSprint,
    addSprintTask,
    deleteSquad,
    deleteMember,
    deleteTask,
    deleteSprint,
  } = useLocalData() as any;

  const populateData = async () => {
    setLoading(true);
    try {
      if (data.squads.length > 0) {
        const proceed = await confirm({
          title: 'Dados já existem',
          description: 'Já existem dados no workspace atual. Deseja limpar tudo antes de popular?',
          confirmLabel: 'Limpar e popular',
        });
        if (proceed) {
          await clearDataInternal();
        } else {
          setLoading(false);
          return;
        }
      }

      // 1. Squads
      const growth = await addSquad({ name: 'Growth', description: 'Squad focado em crescimento de usuários', status: 'Active' });
      const platform = await addSquad({ name: 'Platform', description: 'Squad de infraestrutura e plataforma', status: 'Active' });
      const design = await addSquad({ name: 'Design System', description: 'Squad de design system (inativo)', status: 'Inactive' });

      // 2. Members
      const members = [
        { name: 'Ana Silva', squad_id: growth.id, specialty: 'Frontend', capacity: 13 },
        { name: 'Carlos Santos', squad_id: growth.id, specialty: 'Backend', capacity: 13 },
        { name: 'Marina Costa', squad_id: growth.id, specialty: 'QA', capacity: 8 },
        { name: 'Roberto Alves', squad_id: platform.id, specialty: 'Backend', capacity: 13 },
        { name: 'Fernanda Souza', squad_id: platform.id, specialty: 'Frontend', capacity: 13 },
        { name: 'Beatriz Ferreira', squad_id: design.id, specialty: 'Design', capacity: 8 },
      ];
      for (const m of members) {
        await addMember({
          ...m,
          status: 'Active',
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`,
        });
      }

      // 3. Tasks
      const taskDefs = [
        { title: 'Implementar login social', task_type: 'Feature', priority: 'High', status: 'Backlog', estimate_backend: 8, estimate_frontend: 5 },
        { title: 'Dashboard de analytics', task_type: 'Feature', priority: 'High', status: 'Backlog', estimate_frontend: 13, estimate_backend: 8 },
        { title: 'Sistema de notificações', task_type: 'Feature', priority: 'Medium', status: 'Discovery', estimate_backend: 13 },
        { title: 'Exportar relatórios PDF', task_type: 'Feature', priority: 'Medium', status: 'Refinement', estimate_backend: 5 },
        { title: 'Modo escuro', task_type: 'Feature', priority: 'Low', status: 'ReadyForEng', estimate_frontend: 5 },
        { title: 'Bug login Safari', task_type: 'Bug', priority: 'High', status: 'Backlog', estimate_frontend: 3 },
        { title: 'Refatorar componentes', task_type: 'TechDebt', priority: 'Low', status: 'Backlog', estimate_frontend: 13 },
      ];
      const createdTasks: any[] = [];
      for (let i = 0; i < taskDefs.length; i++) {
        const t = await addTask({
          ...taskDefs[i],
          description: null,
          estimate_qa: null,
          estimate_design: null,
          order_index: i,
          start_date: null,
          end_date: null,
          product_objective: null,
          business_goal: null,
          user_impact: null,
          has_prototype: false,
          prototype_link: null,
          area_id: null,
          feature_id: null,
        } as any);
        createdTasks.push(t);
      }

      // 4. Sprints
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      const sprint1 = await addSprint({
        name: 'Sprint 1',
        squad_id: growth.id,
        start_date: new Date(now - 14 * day).toISOString(),
        end_date: new Date(now).toISOString(),
        status: 'Completed',
      });
      const sprint2 = await addSprint({
        name: 'Sprint 2',
        squad_id: growth.id,
        start_date: new Date(now).toISOString(),
        end_date: new Date(now + 14 * day).toISOString(),
        status: 'Active',
      });

      // 5. Sprint tasks
      await addSprintTask({ sprint_id: sprint1.id, task_id: createdTasks[0].id, task_status: 'Done', order_index: 0 });
      await addSprintTask({ sprint_id: sprint2.id, task_id: createdTasks[1].id, task_status: 'InProgress', order_index: 0 });

      toast({ title: 'Sucesso!', description: 'Dados de exemplo populados.' });
    } catch (error: any) {
      console.error('Error populating data:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Falha ao popular dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearDataInternal = async () => {
    // Delete in dependency order
    for (const st of [...data.sprintTasks]) {
      // sprintTasks have id; reuse generic delete via sprint hook isn't exposed for sprint_tasks generically.
      // Use removeSprintTask is async by sprintId+taskId; here easier: delete via deleteSprint cascading
    }
    for (const s of [...data.sprints]) await deleteSprint(s.id);
    for (const t of [...data.tasks]) await deleteTask(t.id);
    for (const m of [...data.members]) await deleteMember(m.id);
    for (const sq of [...data.squads]) await deleteSquad(sq.id);
  };

  const clearData = async () => {
    if (!confirmClear) {
      toast({
        title: 'Atenção',
        description: 'Confirme que entende que todos os dados serão removidos.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      await clearDataInternal();
      setConfirmClear(false);
      toast({ title: 'Sucesso!', description: 'Todos os dados do workspace foram removidos.' });
    } catch (error: any) {
      console.error('Error clearing data:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Falha ao limpar dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Administração - Dados de Exemplo</h1>
        <p className="text-muted-foreground mb-8">
          Popule o workspace atual com dados realistas para demonstração ou limpe tudo.
        </p>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Popular Dados de Exemplo</CardTitle>
              <CardDescription>
                Cria squads, membros, tarefas e sprints no workspace atual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold mb-2">Será criado:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>3 Squads (Growth, Platform, Design System)</li>
                  <li>6 Membros de time</li>
                  <li>7 Tarefas variadas (Features, Bugs, Tech Debt)</li>
                  <li>2 Sprints (Completada e Ativa)</li>
                </ul>
              </div>
              <Button onClick={populateData} disabled={loading} className="w-full">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Populando...</> : 'Popular Dados de Exemplo'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limpar Dados</CardTitle>
              <CardDescription>
                Remove TODOS os dados do workspace atual. Esta ação não pode ser desfeita.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm"
                  checked={confirmClear}
                  onCheckedChange={(checked) => setConfirmClear(checked as boolean)}
                />
                <label htmlFor="confirm" className="text-sm font-medium leading-none">
                  Entendo que TODOS os dados serão removidos permanentemente
                </label>
              </div>
              <Button
                onClick={clearData}
                disabled={loading || !confirmClear}
                variant="destructive"
                className="w-full"
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Limpando...</> : 'Limpar Todos os Dados'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
