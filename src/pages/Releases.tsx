import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useLocalData } from '@/hooks/useLocalData';
import { Release } from '@/types';
import { ReleaseFormDialog } from '@/components/ReleaseFormDialog';
import { Plus, Package, Calendar as CalendarIcon, Users } from 'lucide-react';
import { EmptyState, PageSkeleton } from '@/components/ui-patterns';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

export default function Releases() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, loading, addRelease, updateRelease } = useLocalData() as any;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | undefined>();

  const releases = useMemo<Release[]>(
    () =>
      [...(data.releases || [])].sort(
        (a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
      ),
    [data.releases]
  );
  const squads = data.squads;

  const handleSaveRelease = async (releaseData: Omit<Release, 'id' | 'created_at'>) => {
    if (editingRelease) {
      await updateRelease(editingRelease.id, releaseData);
    } else {
      await addRelease(releaseData);
    }
    setIsFormOpen(false);
    setEditingRelease(undefined);
  };

  const statusColors: Record<string, string> = {
    Planned: 'bg-muted text-muted-foreground',
    InProgress: 'bg-status-info text-white',
    Released: 'bg-status-success text-white',
    Cancelled: 'bg-destructive text-destructive-foreground',
  };

  if (loading) {
    return (
      <Layout>
        <PageSkeleton variant="cards" count={4} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">{t('releases.title')}</h1>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('releases.new')}
          </Button>
        </div>

        <div className="grid gap-4">
          {releases.map((release) => {
            const squad = squads.find((s: any) => s.id === release.squad_id);

            return (
              <Card
                key={release.id}
                className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
                onClick={() => navigate(`/releases/${release.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{release.version_name}</h3>
                      <Badge className={statusColors[release.status]}>
                        {t(`releases.statuses.${release.status}`, release.status)}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {release.description || t('releases.noDescription')}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {format(new Date(release.release_date), 'dd/MM/yyyy')}
                      </span>
                      {squad && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {squad.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: release.color || 'hsl(var(--primary))' }}
                  />
                </div>
              </Card>
            );
          })}

          {releases.length === 0 && (
            <EmptyState
              icon={Package}
              title={t('releases.empty')}
              description={t('releases.emptyDesc', 'Plan and ship a release to track delivery milestones.')}
              action={
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('releases.new')}
                </Button>
              }
            />
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
