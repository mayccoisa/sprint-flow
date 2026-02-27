import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InitiativeFormDialog } from '@/components/InitiativeFormDialog';
import { GenerateShapeUpDialog } from '@/components/ai/GenerateShapeUpDialog';
import { useLocalData } from '@/hooks/useLocalData';
import { Task, TaskStatus } from '@/types';
import { Plus, ArrowRight, Target, Users, MoreHorizontal } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

// Sortable Item Component
const SortableTaskCard = ({ task, onClick, onPromote, onShapeUp }: { task: Task; onClick: () => void; onPromote: () => void; onShapeUp: () => void }) => {
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

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 touch-none">
            <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                        <span className="font-medium leading-tight">{task.title}</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onClick}>Edit</DropdownMenuItem>
                                {['Discovery', 'Refinement'].includes(task.status) && (
                                    <DropdownMenuItem onClick={onShapeUp} className="text-violet-600">✨ Shape Up (AI)</DropdownMenuItem>
                                )}
                                {task.status === 'ReadyForEng' && (
                                    <DropdownMenuItem onClick={onPromote} className="text-blue-600">Promote to Eng</DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">{task.task_type}</Badge>
                        <Badge variant="secondary">{task.priority}</Badge>
                        {task.has_prototype && <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">Proto</Badge>}
                    </div>

                    {(task.product_objective || task.user_impact) && (
                        <div className="space-y-1 pt-1 border-t border-border/50">
                            {task.product_objective && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Target className="h-3 w-3" />
                                    <span className="truncate">{task.product_objective}</span>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const ProductBacklog = () => {
    const { t } = useTranslation();
    const { data, addTask, updateTask } = useLocalData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [promoteTaskId, setPromoteTaskId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeId, setActiveId] = useState<number | null>(null);
    const [shapeUpTask, setShapeUpTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const columns: { id: TaskStatus; title: string; color: string }[] = [
        { id: 'Discovery', title: 'Discovery', color: 'bg-purple-50 border-purple-100' },
        { id: 'Refinement', title: 'Refinement', color: 'bg-blue-50 border-blue-100' },
        { id: 'ReadyForEng', title: 'Ready for Eng', color: 'bg-green-50 border-green-100' },
    ];

    const tasks = useMemo(() => {
        return data.tasks.filter(t =>
            ['Discovery', 'Refinement', 'ReadyForEng'].includes(t.status) &&
            t.title.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => a.order_index - b.order_index);
    }, [data.tasks, searchQuery]);

    const handleSave = (taskData: Partial<Task>) => {
        if (editingTask) {
            updateTask(editingTask.id, taskData);
            toast({ title: 'Initiative updated' });
        } else {
            const maxOrder = Math.max(...data.tasks.map((t) => t.order_index), -1);
            addTask({ ...taskData, status: 'Discovery', order_index: maxOrder + 1 } as unknown as Omit<Task, 'id' | 'created_at'>);
            toast({ title: 'Initiative created' });
        }
        setEditingTask(null);
    };

    const handlePromote = () => {
        if (promoteTaskId) {
            updateTask(promoteTaskId, { status: 'Backlog' });
            toast({
                title: 'Promoted to Engineering',
                description: 'The initiative has been moved to the Engineering Backlog.',
            });
            setPromoteTaskId(null);
        }
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

    return (
        <Layout>
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold">Product Backlog</h1>
                        <p className="text-muted-foreground">Manage initiatives and discovery.</p>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-[200px]"
                        />
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Initiative
                        </Button>
                    </div>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden pb-4">
                        {columns.map((col) => {
                            const colTasks = tasks.filter(t => t.status === col.id);
                            return (
                                <div key={col.id} className={cn("rounded-lg flex flex-col h-full max-h-screen", col.color)}>
                                    <div className="p-3 font-semibold border-b border-black/5 flex justify-between items-center bg-white/50 rounded-t-lg">
                                        <span className="flex items-center gap-2">
                                            {col.title}
                                            <Badge variant="outline" className="ml-1 bg-white/50">{colTasks.length}</Badge>
                                        </span>
                                    </div>
                                    <CardContent className="p-3 flex-1 overflow-y-auto min-h-[150px]">
                                        <SortableContext
                                            id={col.id}
                                            items={colTasks.map(t => t.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {colTasks.map(task => (
                                                <SortableTaskCard
                                                    key={task.id}
                                                    task={task}
                                                    onClick={() => { setEditingTask(task); setIsDialogOpen(true); }}
                                                    onPromote={() => setPromoteTaskId(task.id)}
                                                    onShapeUp={() => setShapeUpTask(task)}
                                                />
                                            ))}
                                            {colTasks.length === 0 && (
                                                <div className="text-center py-8 text-black/20 text-sm dashed border-2 border-black/5 rounded-md">
                                                    Drop items here
                                                </div>
                                            )}
                                        </SortableContext>
                                    </CardContent>
                                    {col.id === 'ReadyForEng' && colTasks.length > 0 && (
                                        <div className="p-2 border-t border-black/5 bg-white/30 rounded-b-lg">
                                            <p className="text-xs text-center text-muted-foreground">Ready items can be promoted</p>
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
                        <AlertDialogTitle>Promote to Engineering Backlog?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This item will be moved to the 'Backlog' status and become visible to the engineering team.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePromote}>Promote</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <GenerateShapeUpDialog
                open={!!shapeUpTask}
                onOpenChange={(open) => !open && setShapeUpTask(null)}
                task={shapeUpTask}
            />
        </Layout>
    );
};

export default ProductBacklog;
