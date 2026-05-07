import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { useLocalData } from '@/hooks/useLocalData';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { InitiativesDashboard } from '@/components/initiatives/InitiativesDashboard';
import { useTranslation } from 'react-i18next';
import { Lightbulb, Search, Plus, SlidersHorizontal, MoreHorizontal, Pencil, Trash2, X, User as UserIcon, BarChart3, List as ListIcon, Filter } from 'lucide-react';
import { TYPE_DOT, STATUS_ORDER, TYPE_LABEL_PT } from '@/utils/initiativeStatus';
import type { TaskStatus, TaskType, TaskPriority } from '@/types';
import { Button } from '@/components/ui/button';
import { InitiativeTypeSelectionDialog } from '@/components/InitiativeTypeSelectionDialog';
import { InitiativeFormDialog } from '@/components/InitiativeFormDialog';
import { TaskFormDialog } from '@/components/TaskFormDialog';
import { useToast } from '@/hooks/use-toast';
import { EmptyState, PageSkeleton, useConfirm } from '@/components/ui-patterns';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getTaskScore } from '@/utils/prioritization';

import {
    PRIORITY_DOT,
    PRIORITY_LABEL_PT,
    STATUS_DOT,
    STATUS_STYLES,
    STATUS_LABEL_PT,
    PRODUCT_PHASE_STATUSES,
    ENG_PHASE_STATUSES,
} from '@/utils/initiativeStatus';

type ColumnKey =
    | 'type' | 'priority' | 'phase' | 'status' | 'created' | 'effort'
    | 'model' | 'score'
    | 'ice_impact' | 'ice_confidence' | 'ice_ease'
    | 'rice_reach' | 'rice_impact' | 'rice_confidence' | 'rice_effort'
    | 'brice_business_value' | 'brice_reach' | 'brice_impact' | 'brice_confidence' | 'brice_effort';

interface ColumnDef {
    key: ColumnKey;
    defaultLabel: string;
    i18nKey: string;
    defaultVisible: boolean;
    group: 'general' | 'ice' | 'rice' | 'brice';
    numeric?: boolean;
}

const COLUMN_DEFS: ColumnDef[] = [
    { key: 'type', defaultLabel: 'Tipo', i18nKey: 'initiatives.table.type', defaultVisible: true, group: 'general' },
    { key: 'priority', defaultLabel: 'Prioridade', i18nKey: 'initiatives.table.priority', defaultVisible: true, group: 'general' },
    { key: 'phase', defaultLabel: 'Fase do Ciclo', i18nKey: 'initiatives.table.phase', defaultVisible: true, group: 'general' },
    { key: 'status', defaultLabel: 'Status', i18nKey: 'initiatives.table.status', defaultVisible: true, group: 'general' },
    { key: 'created', defaultLabel: 'Criado em', i18nKey: 'initiatives.table.created', defaultVisible: false, group: 'general' },
    { key: 'effort', defaultLabel: 'Esforço', i18nKey: 'initiatives.table.effort', defaultVisible: false, group: 'general', numeric: true },
    { key: 'model', defaultLabel: 'Modelo', i18nKey: 'initiatives.table.model', defaultVisible: false, group: 'general' },
    { key: 'score', defaultLabel: 'Score', i18nKey: 'initiatives.table.score', defaultVisible: false, group: 'general', numeric: true },

    { key: 'ice_impact', defaultLabel: 'ICE · Impacto', i18nKey: 'initiatives.table.iceImpact', defaultVisible: false, group: 'ice', numeric: true },
    { key: 'ice_confidence', defaultLabel: 'ICE · Confiança', i18nKey: 'initiatives.table.iceConfidence', defaultVisible: false, group: 'ice', numeric: true },
    { key: 'ice_ease', defaultLabel: 'ICE · Facilidade', i18nKey: 'initiatives.table.iceEase', defaultVisible: false, group: 'ice', numeric: true },

    { key: 'rice_reach', defaultLabel: 'RICE · Alcance', i18nKey: 'initiatives.table.riceReach', defaultVisible: false, group: 'rice', numeric: true },
    { key: 'rice_impact', defaultLabel: 'RICE · Impacto', i18nKey: 'initiatives.table.riceImpact', defaultVisible: false, group: 'rice', numeric: true },
    { key: 'rice_confidence', defaultLabel: 'RICE · Confiança', i18nKey: 'initiatives.table.riceConfidence', defaultVisible: false, group: 'rice', numeric: true },
    { key: 'rice_effort', defaultLabel: 'RICE · Esforço', i18nKey: 'initiatives.table.riceEffort', defaultVisible: false, group: 'rice', numeric: true },

    { key: 'brice_business_value', defaultLabel: 'BRICE · Valor', i18nKey: 'initiatives.table.briceBv', defaultVisible: false, group: 'brice', numeric: true },
    { key: 'brice_reach', defaultLabel: 'BRICE · Alcance', i18nKey: 'initiatives.table.briceReach', defaultVisible: false, group: 'brice', numeric: true },
    { key: 'brice_impact', defaultLabel: 'BRICE · Impacto', i18nKey: 'initiatives.table.briceImpact', defaultVisible: false, group: 'brice', numeric: true },
    { key: 'brice_confidence', defaultLabel: 'BRICE · Confiança', i18nKey: 'initiatives.table.briceConfidence', defaultVisible: false, group: 'brice', numeric: true },
    { key: 'brice_effort', defaultLabel: 'BRICE · Esforço', i18nKey: 'initiatives.table.briceEffort', defaultVisible: false, group: 'brice', numeric: true },
];

const GROUP_LABELS: Record<ColumnDef['group'], { defaultLabel: string; i18nKey: string }> = {
    general: { defaultLabel: 'Geral', i18nKey: 'initiatives.columnGroups.general' },
    ice: { defaultLabel: 'ICE', i18nKey: 'initiatives.columnGroups.ice' },
    rice: { defaultLabel: 'RICE', i18nKey: 'initiatives.columnGroups.rice' },
    brice: { defaultLabel: 'BRICE', i18nKey: 'initiatives.columnGroups.brice' },
};

const COLUMNS_STORAGE_KEY = 'sprintflow_initiatives_columns_v2';

const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || value === 0 || Number.isNaN(value)) return '—';
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

const loadVisibleColumns = (): Record<ColumnKey, boolean> => {
    const fallback = COLUMN_DEFS.reduce((acc, c) => {
        acc[c.key] = c.defaultVisible;
        return acc;
    }, {} as Record<ColumnKey, boolean>);
    try {
        const raw = localStorage.getItem(COLUMNS_STORAGE_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as Partial<Record<ColumnKey, boolean>>;
        return { ...fallback, ...parsed };
    } catch {
        return fallback;
    }
};

const taskEffort = (task: any): number =>
    (task.estimate_frontend || 0) +
    (task.estimate_backend || 0) +
    (task.estimate_qa || 0) +
    (task.estimate_design || 0);

const InitiativesOverview = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data, loading, addTask, updateTask, deleteTask } = useLocalData() as any;
    const [searchQuery, setSearchQuery] = useState('');
    const [requesterFilter, setRequesterFilter] = useState<string>(() => {
        try {
            return sessionStorage.getItem('initiatives.requesterFilter') ?? 'all';
        } catch {
            return 'all';
        }
    });
    const [statusFilter, setStatusFilter] = useState<TaskStatus[]>(() => {
        try {
            const raw = sessionStorage.getItem('initiatives.statusFilter');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });
    const [typeFilter, setTypeFilter] = useState<TaskType[]>(() => {
        try {
            const raw = sessionStorage.getItem('initiatives.typeFilter');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>(() => {
        try {
            const raw = sessionStorage.getItem('initiatives.priorityFilter');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });
    const [activeTab, setActiveTab] = useState<'list' | 'dashboard'>(() => {
        try {
            const v = sessionStorage.getItem('initiatives.activeTab');
            return v === 'dashboard' ? 'dashboard' : 'list';
        } catch {
            return 'list';
        }
    });
    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [isEngFormOpen, setIsEngFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(loadVisibleColumns);
    const { toast } = useToast();
    const confirm = useConfirm();

    useEffect(() => {
        try {
            localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(visibleColumns));
        } catch {
            // localStorage unavailable; ignore.
        }
    }, [visibleColumns]);

    useEffect(() => {
        try {
            sessionStorage.setItem('initiatives.requesterFilter', requesterFilter);
        } catch {
            // sessionStorage unavailable; ignore.
        }
    }, [requesterFilter]);

    useEffect(() => {
        try {
            sessionStorage.setItem('initiatives.activeTab', activeTab);
        } catch {
            // sessionStorage unavailable; ignore.
        }
    }, [activeTab]);

    useEffect(() => {
        try { sessionStorage.setItem('initiatives.statusFilter', JSON.stringify(statusFilter)); } catch { /* ignore */ }
    }, [statusFilter]);
    useEffect(() => {
        try { sessionStorage.setItem('initiatives.typeFilter', JSON.stringify(typeFilter)); } catch { /* ignore */ }
    }, [typeFilter]);
    useEffect(() => {
        try { sessionStorage.setItem('initiatives.priorityFilter', JSON.stringify(priorityFilter)); } catch { /* ignore */ }
    }, [priorityFilter]);

    const activeFilterCount =
        (requesterFilter !== 'all' ? 1 : 0) +
        (statusFilter.length > 0 ? 1 : 0) +
        (typeFilter.length > 0 ? 1 : 0) +
        (priorityFilter.length > 0 ? 1 : 0);

    const toggleInArray = <T,>(arr: T[], value: T): T[] =>
        arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];

    const clearAllFilters = () => {
        setStatusFilter([]);
        setTypeFilter([]);
        setPriorityFilter([]);
        setRequesterFilter('all');
    };

    const allInitiatives = useMemo(() => {
        return data.tasks.filter((t: any) => {
            if (!t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (requesterFilter === '__none__') {
                if (t.requester_id) return false;
            } else if (requesterFilter !== 'all' && t.requester_id !== requesterFilter) {
                return false;
            }
            if (statusFilter.length > 0 && !statusFilter.includes(t.status)) return false;
            if (typeFilter.length > 0 && !typeFilter.includes(t.task_type)) return false;
            if (priorityFilter.length > 0 && !priorityFilter.includes(t.priority)) return false;
            return true;
        }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [data.tasks, searchQuery, requesterFilter, statusFilter, typeFilter, priorityFilter]);

    // Drop selection ids that no longer match the filtered list.
    useEffect(() => {
        if (selectedIds.size === 0) return;
        const visibleIds = new Set(allInitiatives.map((t: any) => t.id));
        let changed = false;
        const next = new Set<number>();
        selectedIds.forEach((id) => {
            if (visibleIds.has(id)) next.add(id);
            else changed = true;
        });
        if (changed) setSelectedIds(next);
    }, [allInitiatives, selectedIds]);

    const getPhase = (status: string) => {
        if ((PRODUCT_PHASE_STATUSES as string[]).includes(status)) return t('initiatives.phases.product');
        if ((ENG_PHASE_STATUSES as string[]).includes(status)) return t('initiatives.phases.engineering');
        return t('initiatives.phases.archived');
    };

    const handleTypeSelect = (type: 'product' | 'engineering') => {
        setIsSelectionOpen(false);
        if (type === 'product') {
            setIsProductFormOpen(true);
        } else {
            setIsEngFormOpen(true);
        }
    };

    const handleSaveTask = (taskData: any) => {
        if (editingTask) {
            updateTask(editingTask.id, taskData);
            toast({ title: t('common.updated') });
        } else {
            const maxOrder = Math.max(...data.tasks.map((t: any) => t.order_index), -1);
            const newTask = {
                ...taskData,
                status: taskData.status || (isProductFormOpen ? 'Discovery' : 'Backlog'),
                order_index: maxOrder + 1
            };
            addTask(newTask);
            toast({ title: t('common.created') });
        }
        setEditingTask(null);
        setIsProductFormOpen(false);
        setIsEngFormOpen(false);
    };

    // Edição agora acontece na página de detalhe (auditável). Mantemos o nome
    // openEditor para minimizar diff dos call sites.
    const openEditor = (task: any) => {
        navigate(`/initiatives/${task.id}`);
    };

    const handleRowClick = (task: any, e: React.MouseEvent) => {
        // Ignore clicks coming from interactive controls within the row.
        const target = e.target as HTMLElement;
        if (target.closest('[data-row-control]')) return;
        openEditor(task);
    };

    const toggleId = (id: number, checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    };

    const toggleAll = (checked: boolean) => {
        if (checked) setSelectedIds(new Set(allInitiatives.map((t: any) => t.id)));
        else setSelectedIds(new Set());
    };

    const allSelected = allInitiatives.length > 0 && selectedIds.size === allInitiatives.length;
    const someSelected = selectedIds.size > 0 && !allSelected;

    const handleBulkDelete = async () => {
        const ok = await confirm({
            title: t('initiatives.bulkDeleteTitle', 'Excluir iniciativas selecionadas?'),
            description: t('initiatives.bulkDeleteDesc', `Esta ação removerá ${selectedIds.size} iniciativa(s). Não pode ser desfeita.`),
            confirmLabel: t('common.delete', 'Excluir'),
        });
        if (!ok) return;
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((id) => deleteTask(id)));
        setSelectedIds(new Set());
        toast({ title: t('common.deleted', 'Removido'), description: `${ids.length} iniciativa(s)` });
    };

    const handleBulkEdit = () => {
        const id = Array.from(selectedIds)[0];
        const task = allInitiatives.find((t: any) => t.id === id);
        if (task) openEditor(task);
    };

    const handleBulkSetRequester = async (requesterId: string | null) => {
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((id) => updateTask(id, { requester_id: requesterId } as any)));
        const userName = requesterId
            ? ((data.users as any[]) ?? []).find((u: any) => u.id === requesterId)?.name
                ?? ((data.users as any[]) ?? []).find((u: any) => u.id === requesterId)?.email
                ?? '—'
            : t('initiatives.noRequester', 'Sem solicitante');
        setSelectedIds(new Set());
        toast({
            title: t('initiatives.bulkRequesterApplied', 'Solicitante atualizado'),
            description: `${ids.length} iniciativa(s) → ${userName}`,
        });
    };

    const renderColumnLabel = (def: ColumnDef) => t(def.i18nKey, def.defaultLabel);

    const renderCell = (def: ColumnDef, task: any) => {
        switch (def.key) {
            case 'type':
                return (
                    <span data-row-control onClick={(e) => e.stopPropagation()}>
                        <Select
                            value={task.task_type}
                            onValueChange={(v) => updateTask(task.id, { task_type: v } as any)}
                        >
                            <SelectTrigger className="h-7 px-2 border-transparent hover:border-input focus:border-input bg-transparent text-sm w-auto min-w-[110px] gap-1.5">
                                <span className="inline-flex items-center gap-2">
                                    <span className={cn('h-1.5 w-1.5 rounded-full', TYPE_DOT[task.task_type] ?? 'bg-slate-400')} />
                                    {TYPE_LABEL_PT[task.task_type] ?? task.task_type}
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                {([
                                    ['Feature', TYPE_LABEL_PT.Feature],
                                    ['Improvement', TYPE_LABEL_PT.Improvement],
                                    ['Bug', TYPE_LABEL_PT.Bug],
                                    ['Deployment', TYPE_LABEL_PT.Deployment],
                                    ['TechDebt', TYPE_LABEL_PT.TechDebt],
                                    ['Spike', TYPE_LABEL_PT.Spike],
                                ] as [string, string][]).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        <span className="inline-flex items-center gap-2">
                                            <span className={cn('h-2 w-2 rounded-full', TYPE_DOT[value] ?? 'bg-slate-400')} />
                                            {label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </span>
                );
            case 'priority':
                return (
                    <span data-row-control onClick={(e) => e.stopPropagation()}>
                        <Select
                            value={task.priority}
                            onValueChange={(v) => updateTask(task.id, { priority: v } as any)}
                        >
                            <SelectTrigger className="h-7 px-2 border-transparent hover:border-input focus:border-input bg-transparent text-sm w-auto min-w-[90px] gap-1.5">
                                <span className="inline-flex items-center gap-2">
                                    <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[task.priority] ?? 'bg-slate-300')} />
                                    {PRIORITY_LABEL_PT[task.priority] ?? task.priority}
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                {(['High', 'Medium', 'Low'] as const).map((p) => (
                                    <SelectItem key={p} value={p}>
                                        <span className="inline-flex items-center gap-2">
                                            <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[p] ?? 'bg-slate-400')} />
                                            {PRIORITY_LABEL_PT[p] ?? p}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </span>
                );
            case 'phase':
                return <span className="text-sm text-muted-foreground">{getPhase(task.status)}</span>;
            case 'status':
                return (
                    <span data-row-control onClick={(e) => e.stopPropagation()}>
                        <Select
                            value={task.status}
                            onValueChange={(v) => updateTask(task.id, { status: v } as any)}
                        >
                            <SelectTrigger
                                className={cn(
                                    'h-7 px-2 border-transparent hover:opacity-80 focus:border-input text-[11px] font-medium ring-1 w-auto min-w-[120px] gap-1.5',
                                    STATUS_STYLES[task.status] ?? 'bg-slate-50 text-slate-700 ring-slate-200',
                                )}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[task.status] ?? 'bg-slate-400')} />
                                    {STATUS_LABEL_PT[task.status] ?? task.status}
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_ORDER.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        <span className="inline-flex items-center gap-2">
                                            <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[s] ?? 'bg-slate-400')} />
                                            {STATUS_LABEL_PT[s] ?? s}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </span>
                );
            case 'created':
                return (
                    <span className="text-sm text-muted-foreground">
                        {task.created_at ? format(new Date(task.created_at), 'dd MMM yyyy') : '—'}
                    </span>
                );
            case 'effort':
                return <span className="text-sm text-foreground tabular-nums">{taskEffort(task) || '—'}</span>;
            case 'model':
                return <span className="text-sm text-muted-foreground">{task.prioritization_model || '—'}</span>;
            case 'score': {
                const score = task.prioritization_model ? getTaskScore(task, task.prioritization_model) : 0;
                return <span className="text-sm font-medium text-foreground tabular-nums">{formatNumber(score)}</span>;
            }
            default:
                return <span className="text-sm text-muted-foreground tabular-nums">{formatNumber(task[def.key])}</span>;
        }
    };

    const visibleColumnDefs = COLUMN_DEFS.filter((d) => visibleColumns[d.key]);

    if (loading) {
        return (
            <Layout>
                <PageSkeleton variant="page" />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8 pb-24">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            {t('initiatives.title')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('initiatives.subtitle')}
                        </p>
                    </div>
                    <Button size="sm" onClick={() => setIsSelectionOpen(true)} className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        {t('initiatives.createNew', 'New Initiative')}
                    </Button>
                </header>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'dashboard')}>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            className="pl-9 h-9 bg-transparent"
                            placeholder={t('initiatives.filterPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={requesterFilter} onValueChange={setRequesterFilter}>
                        <SelectTrigger className="h-9 w-56">
                            <SelectValue placeholder={t('initiatives.filterByRequester', 'Solicitante')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {t('initiatives.allRequesters', 'Todos os solicitantes')}
                            </SelectItem>
                            <SelectItem value="__none__">
                                {t('initiatives.noRequester', 'Sem solicitante')}
                            </SelectItem>
                            {(((data.users as any[]) ?? [])
                                .slice()
                                .sort((a: any, b: any) => (a.name ?? a.email).localeCompare(b.name ?? b.email))
                            ).map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>
                                    {u.name ?? u.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 h-9">
                                <Filter className="h-3.5 w-3.5" />
                                {t('initiatives.filters', 'Filtros')}
                                {activeFilterCount > 0 && (
                                    <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px] tabular-nums">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-72 p-0">
                            <div className="flex items-center justify-between px-3 py-2 border-b">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {t('initiatives.filters', 'Filtros')}
                                </span>
                                {activeFilterCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={clearAllFilters}
                                    >
                                        {t('common.clearAll', 'Limpar')}
                                    </Button>
                                )}
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
                                <div>
                                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                                        {t('initiatives.table.status', 'Status')}
                                    </p>
                                    <div className="space-y-1.5">
                                        {STATUS_ORDER.map((s) => (
                                            <label key={s} className="flex items-center gap-2 cursor-pointer">
                                                <Checkbox
                                                    checked={statusFilter.includes(s)}
                                                    onCheckedChange={() => setStatusFilter((prev) => toggleInArray(prev, s))}
                                                />
                                                <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[s] ?? 'bg-slate-400')} />
                                                <span className="text-sm">{STATUS_LABEL_PT[s] ?? s}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                                        {t('initiatives.table.type', 'Tipo')}
                                    </p>
                                    <div className="space-y-1.5">
                                        {([
                                            ['Feature', 'Feature'],
                                            ['Improvement', 'Melhoria'],
                                            ['Bug', 'Bug'],
                                            ['Deployment', 'Implantação'],
                                            ['TechDebt', 'Tech Debt'],
                                            ['Spike', 'Spike'],
                                        ] as [TaskType, string][]).map(([value, label]) => (
                                            <label key={value} className="flex items-center gap-2 cursor-pointer">
                                                <Checkbox
                                                    checked={typeFilter.includes(value)}
                                                    onCheckedChange={() => setTypeFilter((prev) => toggleInArray(prev, value))}
                                                />
                                                <span className={cn('h-2 w-2 rounded-full', TYPE_DOT[value] ?? 'bg-slate-400')} />
                                                <span className="text-sm">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                                        {t('initiatives.table.priority', 'Prioridade')}
                                    </p>
                                    <div className="space-y-1.5">
                                        {(['High', 'Medium', 'Low'] as TaskPriority[]).map((p) => (
                                            <label key={p} className="flex items-center gap-2 cursor-pointer">
                                                <Checkbox
                                                    checked={priorityFilter.includes(p)}
                                                    onCheckedChange={() => setPriorityFilter((prev) => toggleInArray(prev, p))}
                                                />
                                                <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[p] ?? 'bg-slate-400')} />
                                                <span className="text-sm">{PRIORITY_LABEL_PT[p] ?? p}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 h-9">
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                {t('initiatives.columns', 'Colunas')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 max-h-[70vh] overflow-y-auto">
                            <DropdownMenuLabel>
                                {t('initiatives.toggleColumns', 'Mostrar colunas')}
                            </DropdownMenuLabel>
                            {(['general', 'ice', 'rice', 'brice'] as ColumnDef['group'][]).map((group) => {
                                const items = COLUMN_DEFS.filter((d) => d.group === group);
                                return (
                                    <div key={group}>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                            {t(GROUP_LABELS[group].i18nKey, GROUP_LABELS[group].defaultLabel)}
                                        </DropdownMenuLabel>
                                        {items.map((def) => (
                                            <DropdownMenuCheckboxItem
                                                key={def.key}
                                                checked={visibleColumns[def.key]}
                                                onCheckedChange={(checked) =>
                                                    setVisibleColumns((prev) => ({ ...prev, [def.key]: checked }))
                                                }
                                                onSelect={(e) => e.preventDefault()}
                                            >
                                                {renderColumnLabel(def)}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </div>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {allInitiatives.length} {allInitiatives.length === 1 ? 'item' : 'itens'}
                    </span>
                    <TabsList className="ml-auto">
                        <TabsTrigger value="list" className="gap-1.5">
                            <ListIcon className="h-3.5 w-3.5" />
                            {t('initiatives.tabs.list', 'Lista')}
                        </TabsTrigger>
                        <TabsTrigger value="dashboard" className="gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5" />
                            {t('initiatives.tabs.dashboard', 'Dashboard')}
                        </TabsTrigger>
                    </TabsList>
                </div>

                    <TabsContent value="dashboard" className="pt-4">
                        <InitiativesDashboard
                            tasks={allInitiatives}
                            users={(data.users as any[]) ?? []}
                            auditLogs={(data.taskAuditLogs as any[]) ?? []}
                            onFocusNoRequester={() => {
                                setRequesterFilter('__none__');
                                setActiveTab('list');
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="list" className="pt-4">

                {allInitiatives.length === 0 ? (
                    <EmptyState
                        icon={Lightbulb}
                        title={t('initiatives.emptyTitle', 'No initiatives yet')}
                        description={t(
                            'initiatives.emptyDesc',
                            'Capture an idea, problem or opportunity to start your discovery and engineering pipeline.'
                        )}
                        action={
                            <Button onClick={() => setIsSelectionOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('initiatives.createNew', 'New Initiative')}
                            </Button>
                        }
                    />
                ) : (
                    <div className="rounded-lg border border-border/60 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border/60 bg-muted/30">
                                    <TableHead className="h-10 w-12 pl-4">
                                        <Checkbox
                                            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                            onCheckedChange={(v) => toggleAll(v === true)}
                                            aria-label="select all"
                                        />
                                    </TableHead>
                                    <TableHead className="h-10 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                        {t('initiatives.table.title')}
                                    </TableHead>
                                    {visibleColumnDefs.map((def) => (
                                        <TableHead
                                            key={def.key}
                                            className={cn(
                                                'h-10 text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap',
                                                def.numeric ? 'text-right w-28 pr-4' : 'w-32'
                                            )}
                                        >
                                            {renderColumnLabel(def)}
                                        </TableHead>
                                    ))}
                                    <TableHead className="h-10 w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allInitiatives.map((task: any) => {
                                    const isSelected = selectedIds.has(task.id);
                                    return (
                                        <TableRow
                                            key={task.id}
                                            data-state={isSelected ? 'selected' : undefined}
                                            className={cn(
                                                'border-border/40 transition-colors hover:bg-muted/40 relative',
                                                isSelected && 'bg-primary/5 hover:bg-primary/10'
                                            )}
                                        >
                                            <TableCell className="py-3 pl-4 relative">
                                                {isSelected && (
                                                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
                                                )}
                                                <span data-row-control>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={(v) => toggleId(task.id, v === true)}
                                                        aria-label={`select ${task.title}`}
                                                    />
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditor(task)}
                                                    className="flex flex-col gap-0.5 min-w-0 text-left cursor-pointer group"
                                                >
                                                    <span className="text-sm font-medium text-foreground line-clamp-1 group-hover:underline">{task.title}</span>
                                                    {task.product_objective && (
                                                        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[480px]">
                                                            {task.product_objective}
                                                        </span>
                                                    )}
                                                </button>
                                            </TableCell>
                                            {visibleColumnDefs.map((def) => (
                                                <TableCell
                                                    key={def.key}
                                                    className={cn('py-3', def.numeric && 'text-right pr-4')}
                                                >
                                                    {renderCell(def, task)}
                                                </TableCell>
                                            ))}
                                            <TableCell className="py-3 pr-2 text-right">
                                                <span data-row-control>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                                aria-label="row actions"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem onClick={() => openEditor(task)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                {t('common.edit', 'Editar')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={async () => {
                                                                    const ok = await confirm({
                                                                        title: t('initiatives.deleteTitle', 'Excluir iniciativa?'),
                                                                        description: task.title,
                                                                        confirmLabel: t('common.delete', 'Excluir'),
                                                                    });
                                                                    if (ok) {
                                                                        await deleteTask(task.id);
                                                                        toast({ title: t('common.deleted', 'Removido') });
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                {t('common.delete', 'Excluir')}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
                    </TabsContent>
                </Tabs>

                <InitiativeTypeSelectionDialog
                    open={isSelectionOpen}
                    onClose={() => setIsSelectionOpen(false)}
                    onSelectType={handleTypeSelect}
                />

                <InitiativeFormDialog
                    open={isProductFormOpen}
                    onClose={() => { setIsProductFormOpen(false); setEditingTask(null); }}
                    onSave={handleSaveTask}
                    task={editingTask}
                />

                <TaskFormDialog
                    open={isEngFormOpen}
                    onClose={() => { setIsEngFormOpen(false); setEditingTask(null); }}
                    onSave={handleSaveTask}
                    task={editingTask}
                />
            </div>

            {activeTab === 'list' && selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900 text-white shadow-2xl shadow-slate-900/30 pl-2 pr-2 py-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
                        onClick={() => setSelectedIds(new Set())}
                        aria-label="clear selection"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 pl-1 pr-3">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/15 px-2 text-xs font-semibold tabular-nums">
                            {selectedIds.size}
                        </span>
                        <span className="text-sm text-slate-200">
                            {t('initiatives.itemsSelected', 'iniciativas selecionadas')}
                        </span>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    {selectedIds.size === 1 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full text-slate-100 hover:text-white hover:bg-white/10 gap-1.5"
                            onClick={handleBulkEdit}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            {t('common.edit', 'Editar')}
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-full text-slate-100 hover:text-white hover:bg-white/10 gap-1.5"
                            >
                                <UserIcon className="h-3.5 w-3.5" />
                                {t('initiatives.bulkSetRequester', 'Definir solicitante')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 max-h-[60vh] overflow-y-auto">
                            <DropdownMenuLabel>
                                {t('initiatives.bulkSetRequesterLabel', 'Vincular a um usuário')}
                            </DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => handleBulkSetRequester(null)}>
                                <span className="text-muted-foreground">
                                    {t('initiatives.noRequester', 'Sem solicitante')}
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(((data.users as any[]) ?? [])
                                .slice()
                                .sort((a: any, b: any) => (a.name ?? a.email).localeCompare(b.name ?? b.email))
                            ).map((u: any) => (
                                <DropdownMenuItem
                                    key={u.id}
                                    onSelect={() => handleBulkSetRequester(u.id)}
                                >
                                    {u.name ?? u.email}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full bg-rose-500 text-white hover:bg-rose-600 hover:text-white gap-1.5"
                        onClick={handleBulkDelete}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('common.delete', 'Excluir')}
                    </Button>
                </div>
            )}
        </Layout>
    );
};

export default InitiativesOverview;
