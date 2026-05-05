import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { useLocalData } from '@/hooks/useLocalData';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { Lightbulb, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InitiativeTypeSelectionDialog } from '@/components/InitiativeTypeSelectionDialog';
import { InitiativeFormDialog } from '@/components/InitiativeFormDialog';
import { TaskFormDialog } from '@/components/TaskFormDialog';
import { useToast } from '@/hooks/use-toast';
import { EmptyState, PageSkeleton } from '@/components/ui-patterns';
import { cn } from '@/lib/utils';

const PRIORITY_DOT: Record<string, string> = {
    High: 'bg-rose-500',
    Medium: 'bg-amber-500',
    Low: 'bg-slate-400',
};

const STATUS_STYLES: Record<string, string> = {
    Discovery: 'bg-violet-50 text-violet-700 ring-violet-200',
    Refinement: 'bg-blue-50 text-blue-700 ring-blue-200',
    ReadyForEng: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Backlog: 'bg-slate-50 text-slate-700 ring-slate-200',
    InSprint: 'bg-amber-50 text-amber-700 ring-amber-200',
    Review: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    Done: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
};

const InitiativesOverview = () => {
    const { t } = useTranslation();
    const { data, loading, addTask, updateTask } = useLocalData() as any;
    const [searchQuery, setSearchQuery] = useState('');
    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [isEngFormOpen, setIsEngFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const { toast } = useToast();

    const allInitiatives = useMemo(() => {
        return data.tasks.filter((t) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [data.tasks, searchQuery]);

    const getPhase = (status: string) => {
        if (['Discovery', 'Refinement', 'ReadyForEng'].includes(status)) return t('initiatives.phases.product');
        if (['Backlog', 'InSprint', 'Review', 'Done'].includes(status)) return t('initiatives.phases.engineering');
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

    const handleRowClick = (task: any) => {
        const isProductPhase = ['Discovery', 'Refinement', 'ReadyForEng'].includes(task.status);
        setEditingTask(task);
        if (isProductPhase) {
            setIsProductFormOpen(true);
        } else {
            setIsEngFormOpen(true);
        }
    };

    if (loading) {
        return (
            <Layout>
                <PageSkeleton variant="page" />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8">
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
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {allInitiatives.length} {allInitiatives.length === 1 ? 'item' : 'itens'}
                    </span>
                </div>

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
                    <div className="border-y border-border/60">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border/60">
                                    <TableHead className="h-9 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('initiatives.table.title')}</TableHead>
                                    <TableHead className="h-9 text-[11px] font-medium uppercase tracking-wider text-muted-foreground w-28">{t('initiatives.table.type')}</TableHead>
                                    <TableHead className="h-9 text-[11px] font-medium uppercase tracking-wider text-muted-foreground w-28">{t('initiatives.table.priority')}</TableHead>
                                    <TableHead className="h-9 text-[11px] font-medium uppercase tracking-wider text-muted-foreground w-28">{t('initiatives.table.phase')}</TableHead>
                                    <TableHead className="h-9 text-[11px] font-medium uppercase tracking-wider text-muted-foreground w-32">{t('initiatives.table.status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allInitiatives.map((task) => (
                                    <TableRow
                                        key={task.id}
                                        onClick={() => handleRowClick(task)}
                                        className="cursor-pointer border-border/40 transition-colors hover:bg-muted/40"
                                    >
                                        <TableCell className="py-3">
                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <span className="text-sm font-medium text-foreground line-clamp-1">{task.title}</span>
                                                {task.product_objective && (
                                                    <span className="text-xs text-muted-foreground line-clamp-1 max-w-[480px]">
                                                        {task.product_objective}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 text-sm text-muted-foreground">
                                            {task.task_type}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <span className="inline-flex items-center gap-2 text-sm text-foreground">
                                                <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[task.priority] ?? 'bg-slate-300')} />
                                                {task.priority}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 text-sm text-muted-foreground">
                                            {getPhase(task.status)}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'font-medium border-0 ring-1 px-2 py-0.5 text-[11px]',
                                                    STATUS_STYLES[task.status] ?? 'bg-slate-50 text-slate-700 ring-slate-200'
                                                )}
                                            >
                                                {task.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

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
        </Layout>
    );
};

export default InitiativesOverview;
