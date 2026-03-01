import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Lightbulb, Activity, Code2, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocalData } from '@/hooks/useLocalData';
import { useTranslation } from 'react-i18next';


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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>
    </Layout>
  );
};

export default Index;
