import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { SquadCard } from '@/components/SquadCard';
import { SquadFormDialog } from '@/components/SquadFormDialog';
import { useLocalData } from '@/hooks/useLocalData';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import type { Squad } from '@/types';

export default function Squads() {
  const { data, addSquad, updateSquad } = useLocalData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Squad | undefined>();
  const [showInactive, setShowInactive] = useState(false);

  const filteredSquads = showInactive
    ? data.squads
    : data.squads.filter(s => s.status === 'Active');

  const getMemberCount = (squadId: number) => {
    return data.members.filter(m => m.squad_id === squadId && m.status === 'Active').length;
  };

  const handleSubmit = async (formData: { name: string; description?: string; status: 'Active' | 'Inactive' }) => {
    try {
      if (editingSquad) {
        await updateSquad(editingSquad.id, formData);
        toast({
          title: 'Squad updated',
          description: 'Squad has been updated successfully.',
        });
      } else {
        await addSquad({
          name: formData.name,
          description: formData.description || null,
          status: formData.status,
        });
        toast({
          title: 'Squad created',
          description: 'New squad has been created successfully.',
        });
      }
      setEditingSquad(undefined);
    } catch (error) {
      console.error('Error saving squad:', error);
      toast({
        title: 'Error',
        description: 'Failed to save squad. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (squad: Squad) => {
    setEditingSquad(squad);
    setDialogOpen(true);
  };

  const handleNewSquad = () => {
    setEditingSquad(undefined);
    setDialogOpen(true);
  };

  return (
    <Layout>
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Squads</h1>
            <p className="mt-2 text-muted-foreground">Manage your development teams</p>
          </div>
          <Button onClick={handleNewSquad}>
            <Plus className="mr-2 h-4 w-4" />
            New Squad
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive">Show inactive squads</Label>
        </div>

        {filteredSquads.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSquads.map((squad) => (
              <SquadCard
                key={squad.id}
                squad={squad}
                memberCount={getMemberCount(squad.id)}
                onEdit={() => handleEdit(squad)}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {showInactive ? 'No squads found' : 'No active squads'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {showInactive
                  ? 'Get started by creating your first squad.'
                  : 'Create a new squad or enable "Show inactive squads".'}
              </p>
              <Button className="mt-4" onClick={handleNewSquad}>
                <Plus className="mr-2 h-4 w-4" />
                Create Squad
              </Button>
            </div>
          </div>
        )}

        <SquadFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          existingSquad={editingSquad}
          existingNames={data.squads.map(s => s.name)}
        />
      </div>
    </Layout>
  );
}
