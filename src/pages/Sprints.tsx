import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Rocket, Inbox } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/ui-patterns';
import { SprintFormDialog } from '@/components/SprintFormDialog';
import { SprintCard } from '@/components/SprintCard';
import { SprintRosterDialog } from '@/components/SprintRosterDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLocalData } from '@/hooks/useLocalData';
import { useToast } from '@/hooks/use-toast';
import type { Sprint, SprintStatus } from '@/types';
import { useTranslation } from 'react-i18next';

const Sprints = () => {
  const { t } = useTranslation();
  const { data, addSprint, updateSprint, deleteSprint } = useLocalData();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [selectedSquadFilter, setSelectedSquadFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [completingSprint, setCompletingSprint] = useState<Sprint | null>(null);
  const [deletingSprint, setDeletingSprint] = useState<Sprint | null>(null);
  const [rosterSprint, setRosterSprint] = useState<Sprint | null>(null);

  const handleSaveSprint = async (sprintData: Omit<Sprint, 'id' | 'created_at'>) => {
    if (editingSprint) {
      updateSprint(editingSprint.id, sprintData);
      toast({
        title: 'Sprint atualizada',
        description: 'As alterações foram salvas com sucesso.',
      });
      setIsDialogOpen(false);
      setEditingSprint(null);
    } else {
      const created = await addSprint(sprintData);
      toast({
        title: 'Sprint criada',
        description: 'Defina agora quem participa e a capacidade de cada um.',
      });
      setIsDialogOpen(false);
      setEditingSprint(null);
      if (created?.id) setRosterSprint(created as Sprint);
    }
  };

  const handleDeleteSprint = async () => {
    if (!deletingSprint) return;
    try {
      await deleteSprint(deletingSprint.id);
      toast({
        title: 'Sprint excluída',
        description: 'A sprint e seus vínculos foram removidos. As tarefas voltaram para o backlog.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir sprint',
        description: error?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    }
    setDeletingSprint(null);
  };

  const handleCompleteSprint = () => {
    if (completingSprint) {
      updateSprint(completingSprint.id, { status: 'Completed' });
      toast({
        title: 'Sprint finalizada',
        description: 'A sprint foi marcada como completa.',
      });
      setCompletingSprint(null);
    }
  };

  const filteredSprints = useMemo(() => {
    let filtered = data.sprints;

    if (selectedSquadFilter !== 'all') {
      filtered = filtered.filter(s => s.squad_id === parseInt(selectedSquadFilter));
    }

    if (selectedStatusFilter !== 'all') {
      if (selectedStatusFilter === 'active') {
        filtered = filtered.filter(s => s.status === 'Active');
      } else if (selectedStatusFilter === 'upcoming') {
        filtered = filtered.filter(s => s.status === 'Planning');
      } else if (selectedStatusFilter === 'past') {
        filtered = filtered.filter(s => s.status === 'Completed' || s.status === 'Cancelled');
      }
    }

    // Sort: Active first, then Planning, then by start date (most recent)
    return filtered.sort((a, b) => {
      const statusOrder = { Active: 0, Planning: 1, Completed: 2, Cancelled: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    });
  }, [data.sprints, selectedSquadFilter, selectedStatusFilter]);

  const sprintsBySquad = useMemo(() => {
    const grouped: Record<number, Sprint[]> = {};
    filteredSprints.forEach(sprint => {
      if (!grouped[sprint.squad_id]) {
        grouped[sprint.squad_id] = [];
      }
      grouped[sprint.squad_id].push(sprint);
    });
    return grouped;
  }, [filteredSprints]);

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          icon={Rocket}
          title={t('pages.sprints.title')}
          subtitle="Planeje, acompanhe e finalize as sprints dos squads."
          actions={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Sprint
            </Button>
          }
        />

        <div className="flex gap-4">
          <Select value={selectedSquadFilter} onValueChange={setSelectedSquadFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os squads" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os squads</SelectItem>
              {data.squads.map(squad => (
                <SelectItem key={squad.id} value={squad.id.toString()}>
                  {squad.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="upcoming">Próximas (Planning)</SelectItem>
              <SelectItem value="past">Passadas (Completed)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {Object.keys(sprintsBySquad).length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nenhuma sprint criada"
            description="Comece criando a primeira sprint para um dos squads."
            action={
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Sprint
              </Button>
            }
          />
        ) : (
          <div className="space-y-8">
            {Object.entries(sprintsBySquad).map(([squadId, sprints]) => {
              const squad = data.squads.find(s => s.id === parseInt(squadId));
              if (!squad) return null;

              return (
                <div key={squadId} className="space-y-4">
                  <h2 className="text-lg font-semibold">{squad.name}</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sprints.map(sprint => (
                      <SprintCard
                        key={sprint.id}
                        sprint={sprint}
                        tasks={data.tasks}
                        sprintTasks={data.sprintTasks}
                        squadMembers={data.members.filter(m => m.squad_id === sprint.squad_id)}
                        onEdit={() => {
                          setEditingSprint(sprint);
                          setIsDialogOpen(true);
                        }}
                        onComplete={sprint.status === 'Active' ? () => setCompletingSprint(sprint) : undefined}
                        onDelete={() => setDeletingSprint(sprint)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <SprintFormDialog
          open={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingSprint(null);
          }}
          onSave={handleSaveSprint}
          sprint={editingSprint}
          squads={data.squads}
        />

        <SprintRosterDialog
          open={!!rosterSprint}
          onClose={() => setRosterSprint(null)}
          sprint={rosterSprint}
          squadName={
            rosterSprint
              ? data.squads.find((s) => s.id === rosterSprint.squad_id)?.name || ''
              : ''
          }
        />

        <AlertDialog open={!!completingSprint} onOpenChange={() => setCompletingSprint(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar Sprint</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja finalizar a sprint "{completingSprint?.name}"? 
                Esta ação irá marcar a sprint como completa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCompleteSprint}>Finalizar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deletingSprint} onOpenChange={() => setDeletingSprint(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir sprint</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a sprint <strong>{deletingSprint?.name}</strong>?
                Esta ação remove os vínculos com tarefas (que voltam para o backlog), participantes
                e releases. As tarefas em si não são apagadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSprint}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Sprints;
