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
import { useTranslation } from 'react-i18next';

export default function Squads() {
  const { t } = useTranslation();
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
          title: t('pages.squads.squadUpdated'),
          description: t('pages.squads.squadUpdatedDesc'),
        });
      } else {
        await addSquad({
          name: formData.name,
          description: formData.description || null,
          status: formData.status,
        });
        toast({
          title: t('pages.squads.squadCreated'),
          description: t('pages.squads.squadCreatedDesc'),
        });
      }
      setEditingSquad(undefined);
    } catch (error) {
      console.error('Error saving squad:', error);
      toast({
        title: t('pages.squads.saveError'),
        description: t('pages.squads.saveErrorDesc'),
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
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('pages.squads.title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('pages.squads.subtitle')}</p>
          </div>
          <Button onClick={handleNewSquad}>
            <Plus className="mr-2 h-4 w-4" />
            {t('pages.squads.newSquad')}
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive">{t('pages.squads.showInactive')}</Label>
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
                {showInactive ? t('pages.squads.emptyTitleAll') : t('pages.squads.emptyTitle')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {showInactive ? t('pages.squads.emptyDescAll') : t('pages.squads.emptyDesc')}
              </p>
              <Button className="mt-4" onClick={handleNewSquad}>
                <Plus className="mr-2 h-4 w-4" />
                {t('pages.squads.createSquad')}
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
