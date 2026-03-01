import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function SeedData() {
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const { toast } = useToast();

  const populateData = async () => {
    setLoading(true);
    try {
      // Check if data already exists
      const { data: existingSquads } = await supabase.from('squads').select('id').limit(1);
      if (existingSquads && existingSquads.length > 0) {
        const proceed = window.confirm('Já existem dados no sistema. Deseja limpar tudo antes de popular?');
        if (proceed) {
          await clearData();
        } else {
          setLoading(false);
          return;
        }
      }

      // 1. Create Squads
      const { data: squads, error: squadsError } = await supabase.from('squads').insert([
        { name: 'Growth', description: 'Squad focado em crescimento de usuários', status: 'Active' },
        { name: 'Platform', description: 'Squad de infraestrutura e plataforma', status: 'Active' },
        { name: 'Design System', description: 'Squad de design system (inativo)', status: 'Inactive' }
      ]).select();

      if (squadsError) throw squadsError;

      const growthSquad = squads.find(s => s.name === 'Growth')!;
      const platformSquad = squads.find(s => s.name === 'Platform')!;
      const designSquad = squads.find(s => s.name === 'Design System')!;

      // 2. Create Team Members
      await supabase.from('team_members').insert([
        // Growth Squad
        { name: 'Ana Silva', squad_id: growthSquad.id, specialty: 'Frontend', capacity: 13, status: 'Active', avatar_url: 'https://ui-avatars.com/api/?name=Ana+Silva' },
        { name: 'Carlos Santos', squad_id: growthSquad.id, specialty: 'Backend', capacity: 13, status: 'Active', avatar_url: 'https://ui-avatars.com/api/?name=Carlos+Santos' },
        { name: 'Marina Costa', squad_id: growthSquad.id, specialty: 'QA', capacity: 8, status: 'Active', avatar_url: 'https://ui-avatars.com/api/?name=Marina+Costa' },
        { name: 'Pedro Oliveira', squad_id: growthSquad.id, specialty: 'Backend', capacity: 13, status: 'Active', avatar_url: 'https://ui-avatars.com/api/?name=Pedro+Oliveira' },
        { name: 'Julia Lima', squad_id: growthSquad.id, specialty: 'Frontend', capacity: 8, status: 'Active', avatar_url: 'https://ui-avatars.com/api/?name=Julia+Lima' },
        // Platform Squad
        { name: 'Roberto Alves', squad_id: platformSquad.id, specialty: 'Backend', capacity: 13, status: 'Active', avatar_url: 'https://ui-avatars.com/api/?name=Roberto+Alves' },
        { name: 'Fernanda Souza', squad_id: platformSquad.id, specialty: 'Frontend', capacity: 13, status: 'Active', avatar_url: 'https://ui-avatars.com/api/?name=Fernanda+Souza' },
        { name: 'Lucas Pereira', squad_id: platformSquad.id, specialty: 'QA', capacity: 5, status: 'Active', avatar_url: 'https://ui-avatars.com/api/?name=Lucas+Pereira' },
        { name: 'Camila Rocha', squad_id: platformSquad.id, specialty: 'Backend', capacity: 13, status: 'Active', avatar_url: 'https://ui-avatars.com/api/?name=Camila+Rocha' },
        { name: 'Bruno Martins', squad_id: platformSquad.id, specialty: 'Frontend', capacity: 8, status: 'Active', avatar_url: 'https://ui-avatars.com/api/?name=Bruno+Martins' },
        // Design System Squad
        { name: 'Beatriz Ferreira', squad_id: designSquad.id, specialty: 'Design', capacity: 8, status: 'Active', avatar_url: 'https://ui-avatars.com/api/?name=Beatriz+Ferreira' },
        { name: 'Ricardo Gomes', squad_id: designSquad.id, specialty: 'Frontend', capacity: 5, status: 'Inactive', avatar_url: 'https://ui-avatars.com/api/?name=Ricardo+Gomes' }
      ]);

      // 3. Create Backlog Tasks
      const { data: tasks } = await supabase.from('tasks').insert([
        // Features
        { title: 'Implementar login social (Google/GitHub)', task_type: 'Feature', priority: 'High', status: 'Backlog', estimate_backend: 8, estimate_frontend: 5, estimate_qa: 3, order_index: 0 },
        { title: 'Dashboard de analytics em tempo real', task_type: 'Feature', priority: 'High', status: 'Backlog', estimate_frontend: 13, estimate_backend: 8, estimate_qa: 5, order_index: 1 },
        { title: 'Sistema de notificações push', task_type: 'Feature', priority: 'Medium', status: 'Backlog', estimate_backend: 13, estimate_frontend: 8, estimate_qa: 3, order_index: 2 },
        { title: 'Exportar relatórios para PDF', task_type: 'Feature', priority: 'Medium', status: 'Backlog', estimate_backend: 5, estimate_frontend: 3, order_index: 3 },
        { title: 'Busca avançada com filtros', task_type: 'Feature', priority: 'Low', status: 'Backlog', estimate_frontend: 8, estimate_backend: 5, estimate_qa: 2, order_index: 4 },
        { title: 'Modo escuro (Dark mode)', task_type: 'Feature', priority: 'Low', status: 'Backlog', estimate_frontend: 5, estimate_design: 3, order_index: 5 },
        { title: 'Integração com Slack', task_type: 'Feature', priority: 'Medium', status: 'Backlog', estimate_backend: 8, estimate_qa: 3, order_index: 6 },
        { title: 'Upload de múltiplos arquivos', task_type: 'Feature', priority: 'Low', status: 'Backlog', estimate_frontend: 5, estimate_backend: 5, estimate_qa: 2, order_index: 7 },
        { title: 'Página de onboarding interativa', task_type: 'Feature', priority: 'Medium', status: 'Backlog', estimate_frontend: 8, estimate_design: 5, estimate_qa: 2, order_index: 8 },
        { title: 'API de webhooks', task_type: 'Feature', priority: 'High', status: 'Backlog', estimate_backend: 8, estimate_qa: 3, order_index: 9 },
        // Bugs
        { title: 'Corrigir erro de autenticação no Safari', task_type: 'Bug', priority: 'High', status: 'Backlog', estimate_frontend: 3, estimate_backend: 2, estimate_qa: 2, order_index: 10 },
        { title: 'Loading infinito na página de relatórios', task_type: 'Bug', priority: 'High', status: 'Backlog', estimate_frontend: 5, estimate_backend: 3, order_index: 11 },
        { title: 'Quebra de layout em mobile (iPhone SE)', task_type: 'Bug', priority: 'Medium', status: 'Backlog', estimate_frontend: 3, estimate_qa: 1, order_index: 12 },
        { title: 'Vazamento de memória no chart', task_type: 'Bug', priority: 'Medium', status: 'Backlog', estimate_frontend: 5, order_index: 13 },
        { title: 'Validação de email não funciona', task_type: 'Bug', priority: 'Low', status: 'Backlog', estimate_frontend: 2, estimate_qa: 1, order_index: 14 },
        // Tech Debt
        { title: 'Refatorar componentes legados React', task_type: 'TechDebt', priority: 'Low', status: 'Backlog', estimate_frontend: 13, order_index: 15 },
        { title: 'Migrar de REST para GraphQL', task_type: 'TechDebt', priority: 'Low', status: 'Backlog', estimate_backend: 21, estimate_frontend: 8, estimate_qa: 5, order_index: 16 },
        { title: 'Atualizar dependências desatualizadas', task_type: 'TechDebt', priority: 'Medium', status: 'Backlog', estimate_frontend: 5, estimate_backend: 5, order_index: 17 },
        // Spikes
        { title: 'Pesquisar soluções de cache distribuído', task_type: 'Spike', priority: 'Medium', status: 'Backlog', estimate_backend: 5, order_index: 18 },
        { title: 'POC: Web Components vs React', task_type: 'Spike', priority: 'Low', status: 'Backlog', estimate_frontend: 8, order_index: 19 }
      ]).select();

      if (!tasks) throw new Error('Failed to create tasks');

      // 4. Create Sprints
      const now = new Date();
      const sprint22Start = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      const sprint22End = new Date(sprint22Start.getTime() + 14 * 24 * 60 * 60 * 1000);
      const sprint23Start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const sprint23End = new Date(sprint23Start.getTime() + 14 * 24 * 60 * 60 * 1000);
      const sprint24Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const sprint24End = new Date(sprint24Start.getTime() + 14 * 24 * 60 * 60 * 1000);
      const sprint25Start = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const sprint25End = new Date(sprint25Start.getTime() + 14 * 24 * 60 * 60 * 1000);

      const { data: sprints } = await supabase.from('sprints').insert([
        { name: 'Sprint 22', squad_id: growthSquad.id, start_date: sprint22Start.toISOString(), end_date: sprint22End.toISOString(), status: 'Completed' },
        { name: 'Sprint 23', squad_id: growthSquad.id, start_date: sprint23Start.toISOString(), end_date: sprint23End.toISOString(), status: 'Completed' },
        { name: 'Sprint 24', squad_id: growthSquad.id, start_date: sprint24Start.toISOString(), end_date: sprint24End.toISOString(), status: 'Active' },
        { name: 'Sprint 23', squad_id: platformSquad.id, start_date: sprint23Start.toISOString(), end_date: sprint23End.toISOString(), status: 'Completed' },
        { name: 'Sprint 24', squad_id: platformSquad.id, start_date: sprint25Start.toISOString(), end_date: sprint25End.toISOString(), status: 'Planning' },
        { name: 'Sprint 25', squad_id: growthSquad.id, start_date: sprint25Start.toISOString(), end_date: sprint25End.toISOString(), status: 'Planning' }
      ]).select();

      if (!sprints) throw new Error('Failed to create sprints');

      // 5. Link tasks to sprints with status
      const sprint22 = sprints.find(s => s.name === 'Sprint 22' && s.squad_id === growthSquad.id)!;
      const sprint23 = sprints.find(s => s.name === 'Sprint 23' && s.squad_id === growthSquad.id)!;
      const sprint24 = sprints.find(s => s.name === 'Sprint 24' && s.squad_id === growthSquad.id)!;
      const sprint24Platform = sprints.find(s => s.name === 'Sprint 24' && s.squad_id === platformSquad.id)!;
      const sprint25 = sprints.find(s => s.name === 'Sprint 25')!;

      // Sprint 22 - All done (40 points)
      await supabase.from('sprint_tasks').insert([
        { sprint_id: sprint22.id, task_id: tasks[0].id, task_status: 'Done', order_index: 0 },
        { sprint_id: sprint22.id, task_id: tasks[1].id, task_status: 'Done', order_index: 1 },
        { sprint_id: sprint22.id, task_id: tasks[2].id, task_status: 'Done', order_index: 2 },
        { sprint_id: sprint22.id, task_id: tasks[3].id, task_status: 'Done', order_index: 3 }
      ]);

      // Sprint 23 - Partial (38/45 points)
      await supabase.from('sprint_tasks').insert([
        { sprint_id: sprint23.id, task_id: tasks[4].id, task_status: 'Done', order_index: 0 },
        { sprint_id: sprint23.id, task_id: tasks[5].id, task_status: 'Done', order_index: 1 },
        { sprint_id: sprint23.id, task_id: tasks[6].id, task_status: 'Done', order_index: 2 },
        { sprint_id: sprint23.id, task_id: tasks[10].id, task_status: 'Todo', order_index: 3 },
        { sprint_id: sprint23.id, task_id: tasks[11].id, task_status: 'Todo', order_index: 4 }
      ]);

      // Sprint 24 - Active (15/42 points done)
      await supabase.from('sprint_tasks').insert([
        { sprint_id: sprint24.id, task_id: tasks[7].id, task_status: 'Done', order_index: 0 },
        { sprint_id: sprint24.id, task_id: tasks[8].id, task_status: 'Done', order_index: 1 },
        { sprint_id: sprint24.id, task_id: tasks[12].id, task_status: 'InProgress', order_index: 2 },
        { sprint_id: sprint24.id, task_id: tasks[13].id, task_status: 'InProgress', order_index: 3 },
        { sprint_id: sprint24.id, task_id: tasks[14].id, task_status: 'Todo', order_index: 4 },
        { sprint_id: sprint24.id, task_id: tasks[15].id, task_status: 'Todo', order_index: 5 }
      ]);

      // Sprint 24 Platform - Planning (30 points)
      await supabase.from('sprint_tasks').insert([
        { sprint_id: sprint24Platform.id, task_id: tasks[16].id, task_status: 'Todo', order_index: 0 },
        { sprint_id: sprint24Platform.id, task_id: tasks[17].id, task_status: 'Todo', order_index: 1 }
      ]);

      // Sprint 25 - Overloaded (65 points - 118%)
      await supabase.from('sprint_tasks').insert([
        { sprint_id: sprint25.id, task_id: tasks[9].id, task_status: 'Todo', order_index: 0 },
        { sprint_id: sprint25.id, task_id: tasks[18].id, task_status: 'Todo', order_index: 1 },
        { sprint_id: sprint25.id, task_id: tasks[19].id, task_status: 'Todo', order_index: 2 }
      ]);

      toast({
        title: 'Sucesso!',
        description: 'Dados de exemplo foram populados com sucesso.',
      });
    } catch (error) {
      console.error('Error populating data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao popular dados de exemplo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearData = async () => {
    if (!confirmClear) {
      toast({
        title: 'Atenção',
        description: 'Por favor, confirme que entende que todos os dados serão removidos.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Delete in order (respecting FKs)
      await supabase.from('task_assignments').delete().neq('id', 0);
      await supabase.from('sprint_tasks').delete().neq('id', 0);
      await supabase.from('sprints').delete().neq('id', 0);
      await supabase.from('tasks').delete().neq('id', 0);
      await supabase.from('team_members').delete().neq('id', 0);
      await supabase.from('squads').delete().neq('id', 0);

      setConfirmClear(false);
      toast({
        title: 'Sucesso!',
        description: 'Todos os dados foram removidos.',
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao limpar dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetComplete = async () => {
    await clearData();
    if (!loading) {
      await populateData();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Administração - Dados de Exemplo</h1>
      <p className="text-muted-foreground mb-8">
        Popule o banco com dados realistas para demonstração ou limpe todos os dados.
      </p>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Popular Dados de Exemplo</CardTitle>
            <CardDescription>
              Cria squads, membros, tarefas e sprints com cenários variados (100% completa, parcial, ativa, sobrecarga).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold mb-2">Será criado:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>3 Squads (Growth, Platform, Design System)</li>
                <li>12 Membros de time (Frontend, Backend, QA, Design)</li>
                <li>20 Tarefas variadas (Features, Bugs, Tech Debt, Spikes)</li>
                <li>6 Sprints (Completadas, Ativa, Planejamento, Sobrecarga)</li>
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
              Remove TODOS os dados do sistema. Esta ação não pode ser desfeita.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="confirm" 
                checked={confirmClear} 
                onCheckedChange={(checked) => setConfirmClear(checked as boolean)}
              />
              <label
                htmlFor="confirm"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
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

        <Card>
          <CardHeader>
            <CardTitle>Reset Completo</CardTitle>
            <CardDescription>
              Limpa todos os dados e popula novamente. Útil para demonstrações repetidas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={resetComplete} 
              disabled={loading || !confirmClear} 
              variant="outline"
              className="w-full"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> : 'Limpar e Popular Novamente'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
