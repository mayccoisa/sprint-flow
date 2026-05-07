import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Lightbulb, Activity, Code2, Plus, ClipboardList, Inbox } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocalData } from '@/hooks/useLocalData';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FORMS_LAST_SEEN_KEY = 'sprintflow_dashboard_forms_last_seen';

const Index = () => {
  const { data } = useLocalData();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // KPI: Active Sprints
  const activeSprint = data.sprints.find(s => s.status === 'Active');

  // KPI: Backlog Health
  const discoveryTasks = data.tasks.filter(t => t.status === 'Discovery').length;
  const readyTasks = data.tasks.filter(t => t.status === 'ReadyForEng').length;
  const engineeringTasks = data.tasks.filter(t => t.status === 'Backlog' || t.status === 'InSprint').length;

  // KPI: Strategy Health
  const healthyModules = data.productModules.filter(m => m.health_score >= 80).length;
  const totalModules = data.productModules.length;

  // Form submissions panel
  const [lastSeen, setLastSeen] = useState<string | null>(() => {
    try { return localStorage.getItem(FORMS_LAST_SEEN_KEY); } catch { return null; }
  });

  const submissions = useMemo(() => {
    return [...(data.formSubmissions || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [data.formSubmissions]);

  const newCount = useMemo(() => {
    if (!lastSeen) return submissions.length;
    const ts = new Date(lastSeen).getTime();
    return submissions.filter((s) => new Date(s.created_at).getTime() > ts).length;
  }, [submissions, lastSeen]);

  const markSeen = () => {
    const now = new Date().toISOString();
    try { localStorage.setItem(FORMS_LAST_SEEN_KEY, now); } catch { /* noop */ }
    setLastSeen(now);
  };

  // First-time visitors should not see every historical submission as "new":
  // if there are submissions but no lastSeen recorded, mark now silently after
  // a moment so the badge represents truly new arrivals from now on.
  useEffect(() => {
    if (lastSeen || submissions.length === 0) return;
    const id = setTimeout(markSeen, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formNameById = (formId: string) =>
    data.forms.find((f) => f.id === formId)?.title || 'Formulário removido';
  const taskById = (taskId?: number | null) =>
    taskId ? data.tasks.find((t) => t.id === taskId) : undefined;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight tracking-tight">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.activeSprint')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSprint ? activeSprint.name : t('dashboard.noActiveSprint')}</div>
              <p className="text-xs text-muted-foreground">
                {activeSprint
                  ? t('dashboard.daysRemaining', { days: new Date(activeSprint.end_date!).getDate() - new Date().getDate() })
                  : t('dashboard.planNextSprint')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.discoveryQueue')}</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{discoveryTasks}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.ideasInDiscovery')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.engineeringReady')}</CardTitle>
              <Code2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{readyTasks}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.readyForDev')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.strategyHealth')}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthyModules}/{totalModules}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.modulesScore')}</p>
            </CardContent>
          </Card>

          <Card
            className={newCount > 0 ? 'border-violet-200 bg-violet-50/40' : ''}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novas solicitações</CardTitle>
              <ClipboardList className={`h-4 w-4 ${newCount > 0 ? 'text-violet-600' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{newCount}</div>
                {newCount > 0 && (
                  <Badge variant="outline" className="bg-violet-100 text-violet-700 border-violet-200 text-[10px]">
                    novo{newCount === 1 ? '' : 's'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {submissions.length} no total · via formulário
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Shortcuts & Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" /> {t('dashboard.quickActions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button onClick={() => navigate('/initiatives?new=true')} className="w-full justify-start" variant="outline">
                <Lightbulb className="mr-2 h-4 w-4" /> {t('dashboard.newInitiative')}
              </Button>
              <Button onClick={() => navigate('/sprints')} className="w-full justify-start" variant="outline">
                <Calendar className="mr-2 h-4 w-4" /> {t('dashboard.planSprint')}
              </Button>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
              <CardDescription>{t('dashboard.latestUpdates')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {data.tasks.slice(-3).reverse().map(task => (
                  <div key={task.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      {task.task_type === 'Feature' ? <Lightbulb className="h-4 w-4 text-yellow-500" /> : <Code2 className="h-4 w-4 text-blue-500" />}
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.status}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(task.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {data.tasks.length === 0 && <p className="text-sm text-muted-foreground">{t('dashboard.noActivity')}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form submissions inbox */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Solicitações via formulário
                {newCount > 0 && (
                  <Badge className="bg-violet-600 hover:bg-violet-600">{newCount} novas</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Cada envio vira uma iniciativa em Discovery (Produto) ou Backlog (Engenharia).
              </CardDescription>
            </div>
            {newCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markSeen}>
                Marcar como lidas
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma solicitação recebida ainda. Compartilhe o link público de algum formulário para começar.
              </p>
            ) : (
              <ul className="divide-y">
                {submissions.slice(0, 5).map((sub) => {
                  const isNew = !lastSeen || new Date(sub.created_at).getTime() > new Date(lastSeen).getTime();
                  const task = taskById(sub.task_id ?? null);
                  return (
                    <li key={sub.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          {isNew && <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" aria-label="nova" />}
                          <span className="text-sm font-medium truncate">
                            {formNameById(sub.form_id)}
                          </span>
                        </div>
                        {task && (
                          <p className="text-xs text-muted-foreground truncate">
                            → {task.title}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(sub.created_at), { locale: ptBR, addSuffix: true })}
                        </span>
                        {task && (
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/initiatives/${task.id}`}>Abrir</Link>
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Index;
