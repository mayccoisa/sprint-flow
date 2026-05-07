import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { InitiativeFormDialog } from '@/components/InitiativeFormDialog';
import { GenerateShapeUpDialog } from '@/components/ai/GenerateShapeUpDialog';
import { useLocalData } from '@/hooks/useLocalData';
import { Task, TaskStatus } from '@/types';
import { Plus, ArrowRight, Target, Users, MoreHorizontal, BarChart2, LayoutList, Columns, RefreshCw, Search, Lightbulb, FileCheck2, Sparkles, ListChecks } from 'lucide-react';
import { TYPE_LABEL_PT, PRIORITY_LABEL_PT } from '@/utils/initiativeStatus';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getTaskScore } from '@/utils/prioritization';
import { PrioritizationModel } from '@/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { PageSkeleton } from '@/components/ui-patterns';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TaskDateChangeDialog } from '@/components/TaskDateChangeDialog';

// Sortable Item Component
const DroppableColumn = ({ id, children }: { id: TaskStatus; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={cn(
                'flex-1 overflow-y-auto min-h-[150px] rounded-md transition-colors',
                isOver && 'ring-2 ring-primary/40',
            )}
        >
            {children}
        </div>
    );
};

const SortableTaskCard = ({
    task, 
    onClick, 
    onPromote, 
    onShapeUp, 
    activeModel 
}: { 
    task: Task; 
    onClick: () => void; 
    onPromote: () => void; 
    onShapeUp: () => void;
    activeModel: PrioritizationModel;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const score = getTaskScore(task, activeModel);

    const { t } = useTranslation();

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 touch-none">
            <Card
                onClick={onClick}
                className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
            >
                <CardContent className="p-3 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                        <span className="text-sm font-medium leading-tight">{task.title}</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 -mr-1 shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={onClick}>{t('common.edit')}</DropdownMenuItem>
                                {['Discovery', 'ProductBacklog', 'Prototyping', 'Refinement'].includes(task.status) && (
                                    <DropdownMenuItem onClick={onShapeUp} className="text-violet-600">✨ Shape Up (AI)</DropdownMenuItem>
                                )}
                                {task.status === 'ReadyForEng' && (
                                    <DropdownMenuItem onClick={onPromote} className="text-blue-600">{t('productBacklog.promote')}</DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-xs">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5">{TYPE_LABEL_PT[task.task_type] ?? task.task_type}</Badge>
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-5">{PRIORITY_LABEL_PT[task.priority] ?? task.priority}</Badge>
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] py-0 px-1.5 h-5">
                            {activeModel}: {score.toFixed(1)}
                        </Badge>
                        {task.has_prototype && <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 text-[10px] py-0 px-1.5 h-5">Proto</Badge>}
                    </div>

                    {task.product_objective && (
                        <div className="pt-1 border-t border-border/50">
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Target className="h-3 w-3 shrink-0" />
                                <span className="truncate">{task.product_objective}</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const ProductBacklog = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data, loading, addTask, updateTask, syncWithJira, addTaskDateChange } = useLocalData() as any;
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [promoteTaskId, setPromoteTaskId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeId, setActiveId] = useState<number | null>(null);
    const [shapeUpTask, setShapeUpTask] = useState<Task | null>(null);
    const [activeModel, setActiveModel] = useState<PrioritizationModel>('ICE');
    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
    const [pendingDateChange, setPendingDateChange] = useState<{ task: Task; newDate: string; data: Partial<Task> } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const columns: { id: TaskStatus; title: string; color: string }[] = [
        { id: 'ProductBacklog', title: t('productBacklog.columns.productBacklog', 'Backlog de Produto'), color: 'bg-fuchsia-50 border-fuchsia-100' },
        { id: 'Refinement', title: t('productBacklog.columns.refinement', 'Refinamento'), color: 'bg-blue-50 border-blue-100' },
        { id: 'Discovery', title: t('productBacklog.columns.discovery', 'Discovery'), color: 'bg-purple-50 border-purple-100' },
        { id: 'Prototyping', title: t('productBacklog.columns.prototyping', 'Prototipação'), color: 'bg-pink-50 border-pink-100' },
        { id: 'ReadyForEng', title: t('productBacklog.columns.readyForEng', 'Documentado'), color: 'bg-green-50 border-green-100' },
    ];

    const productTasks = useMemo(() =>
        data.tasks.filter((t: Task) =>
            ['Discovery', 'ProductBacklog', 'Prototyping', 'Refinement', 'ReadyForEng'].includes(t.status),
        ),
    [data.tasks]);

    const stats = useMemo(() => {
        const total = productTasks.length;
        const inProductBacklog = productTasks.filter((t: Task) => t.status === 'ProductBacklog').length;
        const inRefinement = productTasks.filter((t: Task) => t.status === 'Refinement').length;
        const ready = productTasks.filter((t: Task) => t.status === 'ReadyForEng').length;
        return { total, inProductBacklog, inRefinement, ready };
    }, [productTasks]);

    const tasks = useMemo(() => {
        return productTasks.filter((t: Task) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => {
            const scoreA = getTaskScore(a, activeModel);
            const scoreB = getTaskScore(b, activeModel);

            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }

            return a.order_index - b.order_index;
        });
    }, [productTasks, searchQuery, activeModel]);

    const getModelFields = () => {
        switch (activeModel) {
            case 'ICE':
                return [
                    { key: 'ice_impact', label: t('prioritization.metrics.impact') },
                    { key: 'ice_confidence', label: t('prioritization.metrics.confidence') },
                    { key: 'ice_ease', label: t('prioritization.metrics.ease') },
                ] as { key: keyof Task; label: string }[];
            case 'RICE':
                return [
                    { key: 'rice_reach', label: t('prioritization.metrics.reach') },
                    { key: 'rice_impact', label: t('prioritization.metrics.impact') },
                    { key: 'rice_confidence', label: t('prioritization.metrics.confidence') },
                    { key: 'rice_effort', label: t('prioritization.metrics.effort') },
                ] as { key: keyof Task; label: string }[];
            case 'BRICE':
                return [
                    { key: 'brice_business_value', label: t('prioritization.metrics.businessValue') },
                    { key: 'brice_reach', label: t('prioritization.metrics.reach') },
                    { key: 'brice_impact', label: t('prioritization.metrics.impact') },
                    { key: 'brice_confidence', label: t('prioritization.metrics.confidence') },
                    { key: 'brice_effort', label: t('prioritization.metrics.effort') },
                ] as { key: keyof Task; label: string }[];
            default:
                return [] as { key: keyof Task; label: string }[];
        }
    };

    const modelFields = getModelFields();

    const handleSave = (taskData: Partial<Task>) => {
        if (editingTask) {
            // Check if end_date has changed
            if (taskData.end_date && taskData.end_date !== editingTask.end_date) {
                setPendingDateChange({
                    task: editingTask,
                    newDate: taskData.end_date,
                    data: taskData
                });
                return;
            }
            updateTask(editingTask.id, taskData);
            toast({ title: t('common.updated') });
        } else {
            const maxOrder = Math.max(...data.tasks.map((t) => t.order_index), -1);
            addTask({ ...taskData, status: 'Discovery', order_index: maxOrder + 1 } as unknown as Omit<Task, 'id' | 'created_at'>);
            toast({ title: t('common.created') });
        }
        setEditingTask(null);
    };

    const handleConfirmDateChange = async (reason: string) => {
        if (!pendingDateChange) return;

        const { task, data: taskData } = pendingDateChange;

        // 1. Add the tracking record
        await addTaskDateChange({
            task_id: task.id,
            workspace_id: task.workspace_id || "1", // Defaulting to "1" if not present
            old_end_date: task.end_date || "",
            new_end_date: pendingDateChange.newDate,
            reason: reason,
        });

        // 2. Update the task
        updateTask(task.id, taskData);
        
        toast({ title: 'Initiative updated with deadline justification' });
        setPendingDateChange(null);
        setEditingTask(null);
    };

    const handlePromote = () => {
        if (promoteTaskId) {
            updateTask(promoteTaskId, { status: 'Backlog' });
            toast({
                title: 'Promoted to Engineering',
                description: 'The initiative has been moved to the Engineering Backlog.',
            });
        }
    };

    const handleJiraSync = async () => {
        setIsSyncing(true);
        await syncWithJira();
        setIsSyncing(false);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as number;
        const overId = over.id as number | string;

        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        // Message to avoid complexity: 
        // Logic for reordering within list vs moving between lists.
        // For simple Kanban: Check if 'over' is one of the container IDs (status) OR another item.

        // Find which container (status) we dropped into
        let newStatus: TaskStatus | undefined;
        let newOrderIndex = activeTask.order_index;

        if (columns.some(col => col.id === overId)) {
            // Dropped on a column container directly
            newStatus = overId as TaskStatus;
            // append to end? or keep index.
        } else {
            // Dropped on another item
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                newStatus = overTask.status;
                // We should technically calculate the new index here
                // but for MVP status change is key.
            }
        }

        if (newStatus && newStatus !== activeTask.status) {
            updateTask(activeId, { status: newStatus });
        }
    };

    if (loading) {
        return (
            <Layout>
                <PageSkeleton variant="kanban" count={3} />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">{t('pages.productBacklog.heading')}</h1>
                        <p className="text-muted-foreground">{t('productBacklog.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'table')} className="w-auto">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="kanban" className="flex items-center gap-2">
                                    <Columns className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t('productBacklog.kanban')}</span>
                                </TabsTrigger>
                                <TabsTrigger value="table" className="flex items-center gap-2">
                                    <LayoutList className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t('productBacklog.table')}</span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 border rounded-md px-3 h-10 bg-background">
                                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                                <Select value={activeModel} onValueChange={(v) => setActiveModel(v as PrioritizationModel)}>
                                    <SelectTrigger className="border-0 focus:ring-0 w-[100px] h-8 p-0">
                                        <SelectValue placeholder="Model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ICE">ICE</SelectItem>
                                        <SelectItem value="RICE">RICE</SelectItem>
                                        <SelectItem value="BRICE">BRICE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" onClick={handleJiraSync} disabled={isSyncing}>
                                <RefreshCw className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")} />
                                Sincronizar Jira
                            </Button>
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('productBacklog.newInitiative')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards (compactos) */}
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 shrink-0">
                    <Card>
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t('productBacklog.stats.total', 'Total em produto')}</p>
                                <p className="text-lg font-semibold tabular-nums">{stats.total}</p>
                            </div>
                            <ListChecks className="h-4 w-4 text-muted-foreground" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t('productBacklog.stats.productBacklog', 'Backlog de Produto')}</p>
                                <p className="text-lg font-semibold tabular-nums">{stats.inProductBacklog}</p>
                            </div>
                            <Lightbulb className="h-4 w-4 text-muted-foreground" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t('productBacklog.stats.inRefinement', 'Em refinamento')}</p>
                                <p className="text-lg font-semibold tabular-nums">{stats.inRefinement}</p>
                            </div>
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t('productBacklog.stats.documented', 'Documentado')}</p>
                                <p className="text-lg font-semibold tabular-nums">{stats.ready}</p>
                            </div>
                            <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </div>

                {/* Search bar */}
                <div className="flex items-center space-x-2 shrink-0">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('productBacklog.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                {viewMode === 'kanban' ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex gap-4 h-full overflow-x-auto overflow-y-hidden pb-4">
                            {columns.map((col) => {
                                const colTasks = tasks.filter(t => t.status === col.id);
                                return (
                                    <div key={col.id} className={cn("rounded-lg flex flex-col h-full w-[280px] flex-shrink-0", col.color)}>
                                        <div className="p-3 font-semibold border-b border-black/5 flex justify-between items-center bg-white/50 rounded-t-lg">
                                            <span className="flex items-center gap-2">
                                                {col.title}
                                                <Badge variant="outline" className="ml-1 bg-white/50">{colTasks.length}</Badge>
                                            </span>
                                        </div>
                                        <DroppableColumn id={col.id}>
                                            <div className="p-3">
                                                <SortableContext
                                                    id={col.id}
                                                    items={colTasks.map(t => t.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {colTasks.map(task => (
                                                        <SortableTaskCard
                                                            key={task.id}
                                                            task={task}
                                                            activeModel={activeModel}
                                                            onClick={() => navigate(`/initiatives/${task.id}`)}
                                                            onPromote={() => setPromoteTaskId(task.id)}
                                                            onShapeUp={() => setShapeUpTask(task)}
                                                        />
                                                    ))}
                                                    {colTasks.length === 0 && (
                                                        <div className="text-center py-8 text-black/20 text-sm dashed border-2 border-black/5 rounded-md">
                                                            {t('engineeringBacklog.dragDrop')}
                                                        </div>
                                                    )}
                                                </SortableContext>
                                            </div>
                                        </DroppableColumn>
                                        {col.id === 'ReadyForEng' && colTasks.length > 0 && (
                                            <div className="p-2 border-t border-black/5 bg-white/30 rounded-b-lg">
                                                <p className="text-xs text-center text-muted-foreground">{t('productBacklog.readyMsg')}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <DragOverlay>
                            {activeId ? (
                                <Card className="opacity-80 rotate-2 cursor-grabbing w-[300px]">
                                    <CardContent className="p-4">
                                        Dragging...
                                    </CardContent>
                                </Card>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                ) : (
                    <div className="border rounded-lg bg-white overflow-hidden flex-1 flex flex-col">
                        <div className="overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="w-[30%] font-semibold">{t('productBacklog.tableHeaders.title')}</TableHead>
                                            <TableHead className="w-[12%] font-semibold">{t('productBacklog.tableHeaders.status')}</TableHead>
                                            <TableHead className="w-[8%] font-semibold">{t('productBacklog.tableHeaders.priority')}</TableHead>
                                            <TableHead className="w-[8%] font-semibold">{t('productBacklog.tableHeaders.type')}</TableHead>
                                            {modelFields.map(field => (
                                                <TableHead key={field.key} className="font-semibold text-center whitespace-nowrap">{field.label}</TableHead>
                                            ))}
                                            <TableHead className="w-[10%] font-semibold text-right">{t('productBacklog.tableHeaders.score')}</TableHead>
                                            <TableHead className="w-[10%] text-right"></TableHead>
                                        </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.map((task) => {
                                        const score = getTaskScore(task, activeModel);
                                        const statusColor = columns.find(c => c.id === task.status)?.color || '';
                                        
                                        return (
                                            <TableRow key={task.id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{task.title}</span>
                                                        {task.product_objective && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Target className="h-3 w-3" /> {task.product_objective}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn("font-normal border-none", statusColor.replace('bg-', 'bg-').replace('border-', 'text-').replace('50', '200').replace('100', '700'))}>
                                                        {columns.find(c => c.id === task.status)?.title ?? task.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal">{PRIORITY_LABEL_PT[task.priority] ?? task.priority}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">{TYPE_LABEL_PT[task.task_type] ?? task.task_type}</span>
                                                </TableCell>
                                                {modelFields.map(field => (
                                                    <TableCell key={field.key} className="text-center font-medium tabular-nums">
                                                        {task[field.key] || '-'}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-right">
                                                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                                        {score.toFixed(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => navigate(`/initiatives/${task.id}`)}>{t('common.edit')}</DropdownMenuItem>
                                                            {['Discovery', 'ProductBacklog', 'Prototyping', 'Refinement'].includes(task.status) && (
                                                                <DropdownMenuItem onClick={() => setShapeUpTask(task)} className="text-violet-600">✨ Shape Up (AI)</DropdownMenuItem>
                                                            )}
                                                            {task.status === 'ReadyForEng' && (
                                                                <DropdownMenuItem onClick={() => setPromoteTaskId(task.id)} className="text-blue-600">{t('productBacklog.promote')}</DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {tasks.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                                {t('initiatives.table.empty')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>

            <InitiativeFormDialog
                open={isDialogOpen}
                onClose={() => { setIsDialogOpen(false); setEditingTask(null); }}
                onSave={handleSave}
                task={editingTask}
            />

            <AlertDialog open={!!promoteTaskId} onOpenChange={() => setPromoteTaskId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('productBacklog.promoteConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('productBacklog.promoteConfirmDesc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePromote}>{t('productBacklog.promote')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <GenerateShapeUpDialog
                open={!!shapeUpTask}
                onOpenChange={(open) => !open && setShapeUpTask(null)}
                task={shapeUpTask}
            />

            <TaskDateChangeDialog
                open={!!pendingDateChange}
                onOpenChange={(open) => !open && setPendingDateChange(null)}
                task={pendingDateChange?.task || null}
                newEndDate={pendingDateChange?.newDate || null}
                onConfirm={handleConfirmDateChange}
            />
        </Layout>
    );
};

export default ProductBacklog;
