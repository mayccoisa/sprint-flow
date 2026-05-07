import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
    BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
    ArrowLeft, History, FileText, Target, Trash2, Pencil, Check,
    PlusCircle, Edit3, ArrowRightLeft, MinusCircle, Calendar, User as UserIcon,
    Zap, X, Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalData } from '@/hooks/useLocalData';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/ui-patterns';
import { PageSkeleton } from '@/components/ui-patterns';
import type { Task, TaskAuditLog, TaskStatus, TaskPriority, TaskType, Sprint, SprintTask, UserProfile } from '@/types';
import { getTaskScore } from '@/utils/prioritization';

type ScaleOption = { value: number; label: string; hint: string };

const IMPACT_SCALE: ScaleOption[] = [
    { value: 1, label: 'Mínimo', hint: 'Quase imperceptível para o usuário' },
    { value: 3, label: 'Baixo', hint: 'Melhoria pontual, poucos usuários' },
    { value: 5, label: 'Médio', hint: 'Melhoria notável para parte da base' },
    { value: 7, label: 'Alto', hint: 'Ganho relevante para a maioria' },
    { value: 9, label: 'Muito alto', hint: 'Mudança significativa de uso' },
    { value: 10, label: 'Massivo', hint: 'Transforma o produto / métrica-chave' },
];
const CONFIDENCE_SCALE: ScaleOption[] = [
    { value: 1, label: 'Especulativo (~10%)', hint: 'Suposição, sem dados' },
    { value: 3, label: 'Baixa (~30%)', hint: 'Indícios anedóticos' },
    { value: 5, label: 'Moderada (~50%)', hint: 'Algumas evidências qualitativas' },
    { value: 7, label: 'Alta (~70%)', hint: 'Pesquisa ou dados parciais sustentam' },
    { value: 9, label: 'Muito alta (~90%)', hint: 'Dados quantitativos sólidos' },
    { value: 10, label: 'Certa (100%)', hint: 'Validado por experimento' },
];
const EASE_SCALE: ScaleOption[] = [
    { value: 1, label: 'Muito difícil', hint: 'Reescrita ou pesquisa profunda' },
    { value: 3, label: 'Difícil', hint: 'Várias semanas, múltiplas áreas' },
    { value: 5, label: 'Médio', hint: 'Esforço típico de uma sprint' },
    { value: 7, label: 'Fácil', hint: 'Poucos dias, escopo claro' },
    { value: 9, label: 'Muito fácil', hint: 'Mudança pequena e isolada' },
    { value: 10, label: 'Trivial', hint: 'Configuração ou ajuste menor' },
];
const EFFORT_SCALE: ScaleOption[] = [
    { value: 1, label: 'Trivial', hint: 'Horas de trabalho' },
    { value: 2, label: 'Muito pequeno', hint: '1-2 dias' },
    { value: 3, label: 'Pequeno', hint: 'Menos de 1 semana' },
    { value: 5, label: 'Médio', hint: '1-2 semanas (1 sprint)' },
    { value: 7, label: 'Grande', hint: '~1 mês' },
    { value: 9, label: 'Muito grande', hint: '1-2 meses, múltiplos times' },
    { value: 10, label: 'Épico', hint: 'Trimestre ou mais' },
];
const BUSINESS_VALUE_SCALE: ScaleOption[] = [
    { value: 1, label: 'Mínimo', hint: 'Sem impacto direto em receita ou estratégia' },
    { value: 3, label: 'Baixo', hint: 'Ganho operacional pequeno' },
    { value: 5, label: 'Médio', hint: 'Apoia objetivo tático do trimestre' },
    { value: 7, label: 'Alto', hint: 'Liga-se a OKR ou meta de receita' },
    { value: 9, label: 'Muito alto', hint: 'Move métrica-chave do negócio' },
    { value: 10, label: 'Crítico', hint: 'Estratégico, bloqueia outras' },
];

import { STATUS_STYLES, PRIORITY_LABEL_PT, STATUS_LABEL_PT, STATUS_DOT, PRIORITY_DOT, TYPE_DOT } from '@/utils/initiativeStatus';

const STATUS_LABEL = STATUS_LABEL_PT;

const FIELD_LABELS: Record<string, string> = {
    title: 'Título',
    description: 'Descrição',
    status: 'Status',
    priority: 'Prioridade',
    task_type: 'Tipo',
    product_objective: 'Objetivo',
    business_goal: 'Meta de negócio',
    user_impact: 'Impacto no usuário',
    has_prototype: 'Tem protótipo',
    prototype_link: 'Link do protótipo',
    feature_id: 'Feature',
    area_id: 'Área',
    estimate_frontend: 'Estimativa Front',
    estimate_backend: 'Estimativa Back',
    estimate_qa: 'Estimativa QA',
    estimate_design: 'Estimativa Design',
    start_date: 'Data início',
    end_date: 'Data fim',
    prioritization_model: 'Modelo de priorização',
    ice_impact: 'ICE · Impacto',
    ice_confidence: 'ICE · Confiança',
    ice_ease: 'ICE · Facilidade',
    rice_reach: 'RICE · Alcance',
    rice_impact: 'RICE · Impacto',
    rice_confidence: 'RICE · Confiança',
    rice_effort: 'RICE · Esforço',
    brice_business_value: 'BRICE · Valor',
    brice_reach: 'BRICE · Alcance',
    brice_impact: 'BRICE · Impacto',
    brice_confidence: 'BRICE · Confiança',
    brice_effort: 'BRICE · Esforço',
};

const ACTION_META = {
    create: { icon: PlusCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'criou' },
    update: { icon: Edit3, color: 'text-blue-600', bg: 'bg-blue-50', label: 'editou' },
    status_change: { icon: ArrowRightLeft, color: 'text-amber-600', bg: 'bg-amber-50', label: 'mudou status' },
    delete: { icon: MinusCircle, color: 'text-rose-600', bg: 'bg-rose-50', label: 'excluiu' },
} as const;

const formatValue = (val: unknown): string => {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
};

const InitiativeDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data, loading, updateTask, deleteTask, addSprintTask, removeSprintTask } = useLocalData() as any;
    const { toast } = useToast();
    const confirm = useConfirm();

    const taskId = id ? parseInt(id) : NaN;
    const task = useMemo<Task | undefined>(
        () => data.tasks.find((t: Task) => t.id === taskId),
        [data.tasks, taskId],
    );

    const [titleDraft, setTitleDraft] = useState('');
    const [editingTitle, setEditingTitle] = useState(false);
    const [draft, setDraft] = useState<Partial<Task>>({});

    useEffect(() => {
        setTitleDraft(task?.title ?? '');
    }, [task?.title]);

    // Reset pending edits when navigating to a different initiative.
    useEffect(() => {
        setDraft({});
    }, [taskId]);

    const auditLogs: TaskAuditLog[] = useMemo(
        () =>
            (data.taskAuditLogs as TaskAuditLog[])
                .filter((l) => l.task_id === taskId)
                .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()),
        [data.taskAuditLogs, taskId],
    );

    if (loading) return <Layout><PageSkeleton variant="page" /></Layout>;

    if (!task) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                    <h1 className="text-xl font-semibold">Iniciativa não encontrada</h1>
                    <p className="text-muted-foreground">Talvez tenha sido excluída.</p>
                    <Button onClick={() => navigate('/initiatives')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para iniciativas
                    </Button>
                </div>
            </Layout>
        );
    }

    const createdAt = new Date(task.created_at);
    const doneLog = auditLogs.find(
        (l) => l.action === 'status_change' && l.changes.some((c) => c.field === 'status' && c.new === 'Done'),
    );
    const completedAt = doneLog ? new Date(doneLog.changed_at) : null;

    const effective: Task = { ...task, ...draft };
    const dirty = Object.keys(draft).length > 0;
    const score = effective.prioritization_model
        ? getTaskScore(effective, effective.prioritization_model)
        : null;

    const currentSprintTask: SprintTask | undefined = (data.sprintTasks as SprintTask[])
        .find((st) => st.task_id === task.id);
    const currentSprint: Sprint | undefined = currentSprintTask
        ? (data.sprints as Sprint[]).find((s) => s.id === currentSprintTask.sprint_id)
        : undefined;
    const selectableSprints: Sprint[] = (data.sprints as Sprint[])
        .filter((s) => s.status === 'Planning' || s.status === 'Active')
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

    const handleAssignSprint = async (sprintIdStr: string) => {
        const sprintId = parseInt(sprintIdStr);
        if (currentSprintTask) {
            await removeSprintTask(currentSprintTask.sprint_id, task.id);
        }
        const sprintTasksInTarget = (data.sprintTasks as SprintTask[]).filter((st) => st.sprint_id === sprintId);
        const maxOrder = sprintTasksInTarget.reduce((m, st) => Math.max(m, st.order_index ?? 0), -1);
        await addSprintTask({
            sprint_id: sprintId,
            task_id: task.id,
            order_index: maxOrder + 1,
            task_status: 'Todo',
        });
        const sprintName = (data.sprints as Sprint[]).find((s) => s.id === sprintId)?.name ?? '';
        toast({ title: 'Iniciativa vinculada à sprint', description: sprintName });
    };

    const handleRemoveFromSprint = async () => {
        if (!currentSprintTask) return;
        await removeSprintTask(currentSprintTask.sprint_id, task.id);
        toast({ title: 'Iniciativa desvinculada da sprint' });
    };

    const handleField = <K extends keyof Task>(field: K, value: Task[K]) => {
        setDraft((d) => {
            const next = { ...d };
            if (task[field] === value) {
                delete next[field];
            } else {
                next[field] = value;
            }
            return next;
        });
    };

    const handleSaveAll = async () => {
        if (!dirty) return;
        await updateTask(task.id, draft);
        setDraft({});
        toast({ title: 'Iniciativa atualizada' });
    };

    const handleDiscard = () => setDraft({});

    const handleSaveTitle = () => {
        const trimmed = titleDraft.trim();
        if (!trimmed) {
            setTitleDraft(effective.title);
            setEditingTitle(false);
            return;
        }
        handleField('title', trimmed as any);
        setEditingTitle(false);
    };

    const handleDelete = async () => {
        const ok = await confirm({
            title: 'Excluir iniciativa?',
            description: task.title,
            confirmLabel: 'Excluir',
        });
        if (!ok) return;
        await deleteTask(task.id);
        toast({ title: 'Iniciativa excluída' });
        navigate('/initiatives');
    };

    return (
        <Layout>
            <div className="space-y-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/initiatives">Iniciativas</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="truncate max-w-[400px]">{effective.title}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                        {editingTitle ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={titleDraft}
                                    onChange={(e) => setTitleDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle();
                                        if (e.key === 'Escape') {
                                            setTitleDraft(effective.title);
                                            setEditingTitle(false);
                                        }
                                    }}
                                    autoFocus
                                    className="h-10 text-2xl font-semibold tracking-tight"
                                />
                                <Button size="icon" variant="ghost" onClick={handleSaveTitle}>
                                    <Check className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setTitleDraft(effective.title);
                                    setEditingTitle(true);
                                }}
                                className="group flex items-center gap-2 text-left"
                            >
                                <h1 className="text-2xl font-semibold tracking-tight">{effective.title}</h1>
                                <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                            </button>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge
                                variant="outline"
                                className={cn(
                                    'font-medium border-0 ring-1 px-2 py-0.5',
                                    STATUS_STYLES[effective.status] ?? 'bg-slate-50 text-slate-700 ring-slate-200',
                                )}
                            >
                                {STATUS_LABEL[effective.status] ?? effective.status}
                            </Badge>
                            <span>·</span>
                            <span>{effective.task_type}</span>
                            <span>·</span>
                            <span>Prioridade {PRIORITY_LABEL_PT[effective.priority] ?? effective.priority}</span>
                            {score !== null && score > 0 && (
                                <>
                                    <span>·</span>
                                    <span>Score {Number.isInteger(score) ? score : score.toFixed(2)}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate('/initiatives')}>
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Voltar
                        </Button>
                        {dirty && (
                            <>
                                <Button variant="outline" size="sm" onClick={handleDiscard}>
                                    Descartar
                                </Button>
                                <Button size="sm" onClick={handleSaveAll}>
                                    <Save className="h-4 w-4 mr-1" />
                                    Salvar alterações
                                </Button>
                            </>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                        </Button>
                    </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList>
                            <TabsTrigger value="overview">
                                <FileText className="h-3.5 w-3.5 mr-1.5" />
                                Visão geral
                            </TabsTrigger>
                            <TabsTrigger value="history">
                                <History className="h-3.5 w-3.5 mr-1.5" />
                                Histórico
                                {auditLogs.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 h-4 px-1.5 text-[10px] tabular-nums">
                                        {auditLogs.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6 pt-4">
                            {/* Funcionalidade */}
                            <Card>
                                <CardContent className="space-y-5 p-6">
                                    <header className="flex items-center gap-2 pb-1 border-b">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <h3 className="text-sm font-semibold">Funcionalidade</h3>
                                    </header>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
                                        <Textarea
                                            value={effective.description ?? ''}
                                            onChange={(e) => handleField('description', (e.target.value || null) as any)}
                                            placeholder="Descreva o contexto, escopo e premissas…"
                                            rows={4}
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Objetivo (Por quê?)</Label>
                                            <Textarea
                                                value={effective.product_objective ?? ''}
                                                onChange={(e) => handleField('product_objective', (e.target.value || null) as any)}
                                                rows={3}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Meta de negócio / KPI</Label>
                                            <Textarea
                                                value={effective.business_goal ?? ''}
                                                onChange={(e) => handleField('business_goal', (e.target.value || null) as any)}
                                                rows={3}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Impacto no usuário</Label>
                                        <Textarea
                                            value={effective.user_impact ?? ''}
                                            onChange={(e) => handleField('user_impact', (e.target.value || null) as any)}
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Estimativa técnica */}
                            <Card>
                                <CardContent className="space-y-4 p-6">
                                    <header className="flex items-center gap-2 pb-1 border-b">
                                        <Target className="h-4 w-4 text-muted-foreground" />
                                        <h3 className="text-sm font-semibold">Estimativa técnica</h3>
                                        <span className="text-xs text-muted-foreground ml-auto">Pontos por área</span>
                                    </header>
                                    <div className="grid gap-3 sm:grid-cols-4">
                                        {(['estimate_frontend', 'estimate_backend', 'estimate_qa', 'estimate_design'] as const).map((field) => (
                                            <div key={field} className="space-y-2">
                                                <Label className="text-xs">{FIELD_LABELS[field]}</Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={(effective[field] as number | null) ?? ''}
                                                    onChange={(e) => {
                                                        const v = e.target.value === '' ? null : Number(e.target.value);
                                                        handleField(field, v as any);
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Priorização */}
                            <Card>
                                <CardContent className="space-y-6 p-6">
                                    <header className="flex items-center gap-2 pb-1 border-b">
                                        <Target className="h-4 w-4 text-muted-foreground" />
                                        <h3 className="text-sm font-semibold">Priorização</h3>
                                    </header>
                                    <div className="flex flex-wrap items-end justify-between gap-4">
                                        <div className="space-y-2 max-w-xs flex-1">
                                            <Label>Modelo</Label>
                                            <Select
                                                value={effective.prioritization_model ?? ''}
                                                onValueChange={(v) => handleField('prioritization_model', v as any)}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ICE">ICE</SelectItem>
                                                    <SelectItem value="RICE">RICE</SelectItem>
                                                    <SelectItem value="BRICE">BRICE</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="rounded-md border bg-muted/30 px-4 py-3 text-right">
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score atual</div>
                                            <div className="text-2xl font-bold tabular-nums">
                                                {score && score > 0 ? (Number.isInteger(score) ? score : score.toFixed(2)) : '—'}
                                            </div>
                                        </div>
                                    </div>

                                    {!effective.prioritization_model && (
                                        <p className="text-sm text-muted-foreground italic">
                                            Selecione um modelo para preencher as pontuações.
                                        </p>
                                    )}

                                    {effective.prioritization_model === 'ICE' && (
                                        <div className="grid gap-4 sm:grid-cols-3 rounded-lg border bg-muted/20 p-4">
                                            <ScaleField
                                                label="Impacto"
                                                value={effective.ice_impact ?? null}
                                                options={IMPACT_SCALE}
                                                onChange={(v) => handleField('ice_impact', v as any)}
                                            />
                                            <ScaleField
                                                label="Confiança"
                                                value={effective.ice_confidence ?? null}
                                                options={CONFIDENCE_SCALE}
                                                onChange={(v) => handleField('ice_confidence', v as any)}
                                            />
                                            <ScaleField
                                                label="Facilidade"
                                                value={effective.ice_ease ?? null}
                                                options={EASE_SCALE}
                                                onChange={(v) => handleField('ice_ease', v as any)}
                                            />
                                        </div>
                                    )}

                                    {effective.prioritization_model === 'RICE' && (
                                        <div className="grid gap-4 sm:grid-cols-2 rounded-lg border bg-muted/20 p-4">
                                            <NumberField
                                                label="Alcance"
                                                hint="Quantas pessoas serão impactadas no período (ex: por trimestre)."
                                                value={effective.rice_reach ?? null}
                                                onChange={(v) => handleField('rice_reach', v as any)}
                                            />
                                            <ScaleField
                                                label="Impacto"
                                                value={effective.rice_impact ?? null}
                                                options={IMPACT_SCALE}
                                                onChange={(v) => handleField('rice_impact', v as any)}
                                            />
                                            <ScaleField
                                                label="Confiança"
                                                value={effective.rice_confidence ?? null}
                                                options={CONFIDENCE_SCALE}
                                                onChange={(v) => handleField('rice_confidence', v as any)}
                                            />
                                            <ScaleField
                                                label="Esforço"
                                                value={effective.rice_effort ?? null}
                                                options={EFFORT_SCALE}
                                                onChange={(v) => handleField('rice_effort', v as any)}
                                            />
                                        </div>
                                    )}

                                    {effective.prioritization_model === 'BRICE' && (
                                        <div className="grid gap-4 sm:grid-cols-2 rounded-lg border bg-muted/20 p-4">
                                            <div className="sm:col-span-2">
                                                <ScaleField
                                                    label="Valor de negócio"
                                                    value={effective.brice_business_value ?? null}
                                                    options={BUSINESS_VALUE_SCALE}
                                                    onChange={(v) => handleField('brice_business_value', v as any)}
                                                />
                                            </div>
                                            <NumberField
                                                label="Alcance"
                                                hint="Quantas pessoas serão impactadas no período."
                                                value={effective.brice_reach ?? null}
                                                onChange={(v) => handleField('brice_reach', v as any)}
                                            />
                                            <ScaleField
                                                label="Impacto"
                                                value={effective.brice_impact ?? null}
                                                options={IMPACT_SCALE}
                                                onChange={(v) => handleField('brice_impact', v as any)}
                                            />
                                            <ScaleField
                                                label="Confiança"
                                                value={effective.brice_confidence ?? null}
                                                options={CONFIDENCE_SCALE}
                                                onChange={(v) => handleField('brice_confidence', v as any)}
                                            />
                                            <ScaleField
                                                label="Esforço"
                                                value={effective.brice_effort ?? null}
                                                options={EFFORT_SCALE}
                                                onChange={(v) => handleField('brice_effort', v as any)}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="pt-4">
                            <Card>
                                <CardContent className="p-0">
                                    {auditLogs.length === 0 ? (
                                        <div className="p-8 text-center text-sm text-muted-foreground">
                                            Sem alterações registradas ainda.
                                        </div>
                                    ) : (
                                        <ol className="divide-y">
                                            {auditLogs.map((log) => {
                                                const meta = ACTION_META[log.action];
                                                const Icon = meta.icon;
                                                return (
                                                    <li key={log.id} className="p-4 flex gap-3">
                                                        <span className={cn('h-8 w-8 shrink-0 rounded-full flex items-center justify-center', meta.bg, meta.color)}>
                                                            <Icon className="h-4 w-4" />
                                                        </span>
                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                                                <span className="text-sm font-medium">
                                                                    {log.changed_by_name || 'Sistema'}
                                                                </span>
                                                                <span className="text-sm text-muted-foreground">{meta.label}</span>
                                                                <span className="text-xs text-muted-foreground" title={format(new Date(log.changed_at), 'dd/MM/yyyy HH:mm:ss')}>
                                                                    · {formatDistanceToNow(new Date(log.changed_at), { locale: ptBR, addSuffix: true })}
                                                                </span>
                                                            </div>
                                                            {log.summary && (
                                                                <p className="text-sm text-muted-foreground">{log.summary}</p>
                                                            )}
                                                            {log.changes.length > 0 && (
                                                                <ul className="text-xs space-y-1 mt-1">
                                                                    {log.changes.slice(0, 8).map((c, idx) => (
                                                                        <li key={idx} className="flex flex-wrap items-center gap-1.5">
                                                                            <span className="font-medium text-foreground">
                                                                                {FIELD_LABELS[c.field] ?? c.field}:
                                                                            </span>
                                                                            <span className="text-muted-foreground line-through max-w-[200px] truncate">
                                                                                {formatValue(c.old)}
                                                                            </span>
                                                                            <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                                                                            <span className="text-foreground max-w-[260px] truncate">
                                                                                {formatValue(c.new)}
                                                                            </span>
                                                                        </li>
                                                                    ))}
                                                                    {log.changes.length > 8 && (
                                                                        <li className="text-muted-foreground italic">
                                                                            + {log.changes.length - 8} alteração(ões)
                                                                        </li>
                                                                    )}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <aside className="space-y-4">
                        <Card>
                            <CardContent className="p-4 space-y-4 text-sm">
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
                                    <Select value={effective.status} onValueChange={(v) => handleField('status', v as TaskStatus)}>
                                        <SelectTrigger className="h-9 mt-1.5"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    <span className="inline-flex items-center gap-2">
                                                        <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[s] ?? 'bg-slate-400')} />
                                                        {STATUS_LABEL[s]}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Prioridade</Label>
                                    <Select value={effective.priority} onValueChange={(v) => handleField('priority', v as TaskPriority)}>
                                        <SelectTrigger className="h-9 mt-1.5"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {(['High', 'Medium', 'Low'] as TaskPriority[]).map((p) => (
                                                <SelectItem key={p} value={p}>
                                                    <span className="inline-flex items-center gap-2">
                                                        <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[p] ?? 'bg-slate-400')} />
                                                        {PRIORITY_LABEL_PT[p] ?? p}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo</Label>
                                    <Select value={effective.task_type} onValueChange={(v) => handleField('task_type', v as TaskType)}>
                                        <SelectTrigger className="h-9 mt-1.5"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {([
                                                ['Feature', 'Feature'],
                                                ['Improvement', 'Melhoria'],
                                                ['Bug', 'Bug'],
                                                ['Deployment', 'Implantação'],
                                                ['TechDebt', 'Tech Debt'],
                                                ['Spike', 'Spike'],
                                            ] as [TaskType, string][]).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    <span className="inline-flex items-center gap-2">
                                                        <span className={cn('h-2 w-2 rounded-full', TYPE_DOT[value] ?? 'bg-slate-400')} />
                                                        {label}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                                    <UserIcon className="h-3.5 w-3.5" />
                                    <span>Solicitante</span>
                                </div>
                                <Select
                                    value={effective.requester_id ?? '__none__'}
                                    onValueChange={(v) => handleField('requester_id', v === '__none__' ? null : v)}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Selecionar usuário…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">— Sem solicitante —</SelectItem>
                                        {((data.users as UserProfile[]) ?? [])
                                            .slice()
                                            .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email))
                                            .map((u) => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.name ?? u.email}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                                    <Zap className="h-3.5 w-3.5" />
                                    <span>Sprint</span>
                                </div>
                                {currentSprint ? (
                                    <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
                                        <Link
                                            to={`/sprints/${currentSprint.id}/planning`}
                                            className="font-medium text-foreground hover:underline truncate"
                                        >
                                            {currentSprint.name}
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0"
                                            onClick={handleRemoveFromSprint}
                                            title="Desvincular da sprint"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Não vinculada a uma sprint.</p>
                                )}
                                <Select value="" onValueChange={handleAssignSprint}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder={currentSprint ? 'Mover para outra sprint…' : 'Vincular a uma sprint…'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectableSprints.length === 0 ? (
                                            <div className="px-3 py-2 text-xs text-muted-foreground">
                                                Nenhuma sprint em planejamento ou ativa.
                                            </div>
                                        ) : (
                                            selectableSprints
                                                .filter((s) => s.id !== currentSprint?.id)
                                                .map((s) => (
                                                    <SelectItem key={s.id} value={String(s.id)}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 space-y-3 text-xs">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Criada em</span>
                                </div>
                                <div className="text-sm font-medium">
                                    {format(createdAt, 'dd MMM yyyy', { locale: ptBR })}
                                    <span className="text-muted-foreground font-normal ml-1">
                                        ({formatDistanceToNow(createdAt, { locale: ptBR, addSuffix: true })})
                                    </span>
                                </div>

                                {completedAt && (
                                    <>
                                        <div className="flex items-center gap-2 text-muted-foreground pt-2 border-t">
                                            <Check className="h-3.5 w-3.5" />
                                            <span>Concluída em</span>
                                        </div>
                                        <div className="text-sm font-medium">
                                            {format(completedAt, 'dd MMM yyyy', { locale: ptBR })}
                                            <span className="text-muted-foreground font-normal ml-1">
                                                ({formatDistanceToNow(completedAt, { locale: ptBR, addSuffix: true })})
                                            </span>
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center gap-2 text-muted-foreground pt-2 border-t">
                                    <UserIcon className="h-3.5 w-3.5" />
                                    <span>Última alteração</span>
                                </div>
                                <div className="text-sm">
                                    {auditLogs[0] ? (
                                        <>
                                            {auditLogs[0].changed_by_name || 'Sistema'}
                                            <span className="text-muted-foreground block text-xs">
                                                {formatDistanceToNow(new Date(auditLogs[0].changed_at), { locale: ptBR, addSuffix: true })}
                                            </span>
                                        </>
                                    ) : '—'}
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </Layout>
    );
};

const ScaleField = ({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: number | null;
    options: ScaleOption[];
    onChange: (value: number) => void;
}) => (
    <div className="space-y-2">
        <Label className="text-xs">{label}</Label>
        <Select
            value={value ? String(value) : ''}
            onValueChange={(v) => onChange(parseInt(v))}
        >
            <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
            <SelectContent>
                {options.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                        <div className="flex flex-col items-start">
                            <span className="font-medium">{opt.value} — {opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.hint}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);

const NumberField = ({
    label,
    hint,
    value,
    onChange,
}: {
    label: string;
    hint?: string;
    value: number | null;
    onChange: (value: number | null) => void;
}) => (
    <div className="space-y-2">
        <Label className="text-xs">{label}</Label>
        <Input
            type="number"
            min={0}
            defaultValue={value ?? ''}
            onBlur={(e) => {
                const v = e.target.value === '' ? null : Number(e.target.value);
                onChange(v);
            }}
        />
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
);

export default InitiativeDetail;
