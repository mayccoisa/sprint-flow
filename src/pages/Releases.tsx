import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Release, Squad } from '@/types';
import { ReleaseFormDialog } from '@/components/ReleaseFormDialog';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

export default function Releases() {
  const navigate = useNavigate();
  const [releases, setReleases] = useState<Release[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | undefined>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [releasesRes, squadsRes] = await Promise.all([
      supabase.from('releases').select('*').order('release_date', { ascending: true }),
      supabase.from('squads').select('*'),
    ]);

    if (releasesRes.data) setReleases(releasesRes.data);
    if (squadsRes.data) setSquads(squadsRes.data);
  };

  const handleSaveRelease = async (releaseData: Omit<Release, 'id' | 'created_at'>) => {
    if (editingRelease) {
      await supabase
        .from('releases')
        .update(releaseData)
        .eq('id', editingRelease.id);
    } else {
      await supabase
        .from('releases')
        .insert(releaseData);
    }
    
    loadData();
    setIsFormOpen(false);
    setEditingRelease(undefined);
  };

  const statusColors: Record<string, string> = {
    'Planned': 'bg-muted',
    'InProgress': 'bg-primary',
    'Released': 'bg-green-500',
    'Cancelled': 'bg-destructive',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">📦 Releases</h1>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Release
          </Button>
        </div>

        <div className="grid gap-4">
          {releases.map((release) => {
            const squad = squads.find(s => s.id === release.squad_id);
            
            return (
              <Card
                key={release.id}
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/releases/${release.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{release.version_name}</h3>
                      <Badge className={statusColors[release.status]}>
                        {release.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {release.description || 'Sem descrição'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>📅 {format(new Date(release.release_date), 'dd/MM/yyyy')}</span>
                      {squad && <span>👥 {squad.name}</span>}
                    </div>
                  </div>
                  
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: release.color || '#6366f1' }}
                  />
                </div>
              </Card>
            );
          })}

          {releases.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma release criada ainda.
            </div>
          )}
        </div>
      </div>

      <ReleaseFormDialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRelease(undefined);
        }}
        onSave={handleSaveRelease}
        release={editingRelease}
        squads={squads}
      />
    </Layout>
  );
}
