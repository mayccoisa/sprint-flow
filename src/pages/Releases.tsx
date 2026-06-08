import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useLocalData } from '@/hooks/useLocalData';
import { Release } from '@/types';
import { ReleaseFormDialog } from '@/components/ReleaseFormDialog';
import { Plus, Package, Calendar as CalendarIcon, Users } from 'lucide-react';
import { EmptyState, PageSkeleton, PageHeader, StatusBadge } from '@/components/ui-patterns';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export default function Releases() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, loading, addRelease, updateRelease, setReleaseSprints } = useLocalData() as any;
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

  const editingSprintIds = useMemo<number[]>(() => {
    if (!editingRelease) return [];
    return (data.releaseSprints || [])
      .filter((rs: any) => rs.release_id === editingRelease.id)
      .map((rs: any) => rs.sprint_id);
  }, [data.releaseSprints, editingRelease]);

  const handleSaveRelease = async (
    releaseData: Omit<Release, 'id' | 'created_at'>,
    sprintIds: number[]
  ) => {
    let releaseId: number;
    if (editingRelease) {
      await updateRelease(editingRelease.id, releaseData);
      releaseId = editingRelease.id;
    } else {
      const created = await addRelease(releaseData);
      releaseId = created.id;
    }
    await setReleaseSprints(releaseId, sprintIds);
    setIsFormOpen(false);
    setEditingRelease(undefined);
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
        <PageHeader
          icon={Package}
          title={t('releases.title')}
          actions={
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('releases.new')}
            </Button>
          }
        />

        <div className="grid gap-4">
          {releases.map((release) => {
            const squad = squads.find((s: any) => s.id === release.squad_id);

            return (
              <Card
                key={release.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
                onClick={() => navigate(`/releases/${release.id}`)}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-lg font-semibold">
                          {release.version_name}
                        </CardTitle>
                        <StatusBadge kind="release" status={release.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {release.description || t('releases.noDescription')}
                      </p>
                    </div>
                    <div
                      className="w-4 h-4 rounded-full border border-border shrink-0"
                      style={{ backgroundColor: release.color || 'hsl(var(--primary))' }}
                    />
                  </div>
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
                </CardHeader>
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
        sprints={data.sprints || []}
        initialSprintIds={editingSprintIds}
      />
    </Layout>
  );
}
