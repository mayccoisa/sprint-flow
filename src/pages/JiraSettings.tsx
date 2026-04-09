import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useLocalData } from '@/hooks/useLocalData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { jiraService } from '@/services/jiraService';
import { Settings, History, Link as LinkIcon, AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function JiraSettings() {
  const { data, updateWorkspaceJiraConfig, addJiraSyncLog, syncWithJira } = useLocalData();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Current workspace Jira config
  const config = data.workspaces.find(ws => ws.id === data.workspaces[0]?.id)?.jira_config || {
    url: '',
    email: '',
    apiToken: '',
    isEnabled: false,
    productProjectKey: '',
    productIssueTypes: 'Story',
    engProjectKey: '',
    engIssueTypes: 'Task'
  };

  const [formData, setFormData] = useState(config);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSave = async () => {
    try {
      await updateWorkspaceJiraConfig(formData);
      toast({
        title: "Configurações Salvas",
        description: "As credenciais do Jira foram atualizadas com sucesso.",
      });
      addJiraSyncLog({
        timestamp: new Date().toISOString(),
        jira_key: 'SYSTEM',
        task_title: 'Configurações de Integração',
        action: 'Updated',
        details: 'Configurações de API atualizadas pelo usuário.',
        status: 'Success'
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await jiraService.testConnection(formData);
      toast({
        title: "Conexão Bem-sucedida!",
        description: `Conectado aos projetos ${formData.productProjectKey} e ${formData.engProjectKey} com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Falha na Conexão",
        description: error.message || "Verifique o URL, E-mail e Token de API.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncWithJira();
    setIsSyncing(false);
  };

  const sortedLogs = useMemo(() => {
    return [...data.jiraSyncLogs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [data.jiraSyncLogs]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integração Jira</h1>
          <p className="text-muted-foreground">Configure a conexão bidirecional e acompanhe o histórico de sincronização.</p>
        </div>

        <Tabs defaultValue="config" className="space-y-4">
          <TabsList>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> Configuração
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" /> Histórico de Sincronização
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Credenciais da Atlassian</CardTitle>
                  <CardDescription>Use um Token de API gerado na sua conta Atlassian.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">URL do Jira Cloud</Label>
                    <Input 
                      id="url" 
                      placeholder="https://sua-empresa.atlassian.net" 
                      value={formData.url}
                      onChange={(e) => setFormData({...formData, url: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail do Usuário</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="pm@empresa.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token">Token de API</Label>
                    <Input 
                      id="token" 
                      type="password" 
                      placeholder="Insira o seu token" 
                      value={formData.apiToken}
                      onChange={(e) => setFormData({...formData, apiToken: e.target.value})}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="space-y-0.5">
                      <Label>Habilitar Sincronização</Label>
                      <p className="text-sm text-muted-foreground">Ativa criação automática de tarefas.</p>
                    </div>
                    <Switch 
                      checked={formData.isEnabled}
                      onCheckedChange={(val) => setFormData({...formData, isEnabled: val})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mapeamento de Áreas</CardTitle>
                  <CardDescription>Defina os projetos e tipos de issue para cada área.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 border-l-2 border-primary/20 pl-4 py-1">
                    <h3 className="text-sm font-semibold text-primary">Área de Produto (Backlog de Produto)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prodProject">Chave do Projeto</Label>
                        <Input 
                          id="prodProject" 
                          placeholder="PROD" 
                          className="uppercase"
                          value={formData.productProjectKey}
                          onChange={(e) => setFormData({...formData, productProjectKey: e.target.value.toUpperCase()})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prodIssues">Issue Types</Label>
                        <Input 
                          id="prodIssues" 
                          placeholder="Story, Epic" 
                          value={formData.productIssueTypes}
                          onChange={(e) => setFormData({...formData, productIssueTypes: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-l-2 border-secondary/20 pl-4 py-1">
                    <h3 className="text-sm font-semibold text-secondary">Área de Engenharia (Backlog de Sprints)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="engProject">Chave do Projeto</Label>
                        <Input 
                          id="engProject" 
                          placeholder="ENG" 
                          className="uppercase"
                          value={formData.engProjectKey}
                          onChange={(e) => setFormData({...formData, engProjectKey: e.target.value.toUpperCase()})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="engIssues">Issue Types</Label>
                        <Input 
                          id="engIssues" 
                          placeholder="Task, Bug" 
                          value={formData.engIssueTypes}
                          onChange={(e) => setFormData({...formData, engIssueTypes: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex gap-2">
                    <Button onClick={handleSave} className="flex-1">Salvar Configurações</Button>
                    <Button variant="outline" onClick={handleTest} disabled={isTesting}>
                      {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Testar Conexão"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Log de Atividades</CardTitle>
                  <CardDescription>Acompanhe todas as alterações refletidas nos últimos dias.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleManualSync} disabled={isSyncing}>
                  {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Sincronizar Agora
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horário</TableHead>
                      <TableHead>Tarefa</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{log.task_title}</span>
                            <span className="text-xs text-muted-foreground">{log.jira_key}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate text-sm">
                          {log.details}
                        </TableCell>
                        <TableCell>
                          {log.status === 'Success' ? (
                            <div className="flex items-center text-green-600 gap-1">
                              <CheckCircle2 className="h-4 w-4" /> <span className="text-xs">Sucesso</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600 gap-1">
                              <AlertCircle className="h-4 w-4" /> <span className="text-xs">Erro</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {sortedLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          Nenhum registro de sincronização encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
