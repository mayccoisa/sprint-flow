import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { SprintFormDialog } from '@/components/SprintFormDialog';
import { SprintCard } from '@/components/SprintCard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLocalData } from '@/hooks/useLocalData';
import { useToast } from '@/hooks/use-toast';
import type { Sprint, SprintStatus } from '@/types';

const Sprints = () => {
  const { data, addSprint, updateSprint } = useLocalData();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [selectedSquadFilter, setSelectedSquadFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [completingSprint, setCompletingSprint] = useState<Sprint | null>(null);

  const handleSaveSprint = (sprintData: Omit<Sprint, 'id' | 'created_at'>) => {
    if (editingSprint) {
      updateSprint(editingSprint.id, sprintData);
      toast({
        title: 'Sprint atualizada',
        description: 'As alterações foram salvas com sucesso.',
      });
    } else {
      addSprint(sprintData);
      toast({
        title: 'Sprint criada',
        description: 'Nova sprint criada com sucesso.',
      });
    }
    setIsDialogOpen(false);
    setEditingSprint(null);
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sprints</h1>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Sprint
          </Button>
        </div>

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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">
              Nenhuma sprint criada. Crie a primeira!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(sprintsBySquad).map(([squadId, sprints]) => {
              const squad = data.squads.find(s => s.id === parseInt(squadId));
              if (!squad) return null;

              return (
                <div key={squadId} className="space-y-4">
                  <h2 className="text-2xl font-semibold">{squad.name}</h2>
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
      </div>
    </Layout>
  );
};

export default Sprints;
