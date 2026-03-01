import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Lightbulb, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InitiativeTypeSelectionDialog } from '@/components/InitiativeTypeSelectionDialog';
import { InitiativeFormDialog } from '@/components/InitiativeFormDialog';
import { TaskFormDialog } from '@/components/TaskFormDialog';
import { useToast } from '@/hooks/use-toast';

// Imports (need to add to top of file, doing in separate block usually best but constrained here)
// Assuming imports will be added via multi-replace or separate edits if needed. 
// Wait, replace_file_content replaces a block. I should do a larger replacement or be careful.

// Changing the component body
const InitiativesOverview = () => {
    const { t } = useTranslation();
    const { data, addTask } = useLocalData();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [isEngFormOpen, setIsEngFormOpen] = useState(false);
    const { toast } = useToast();

    const allInitiatives = useMemo(() => {
        return data.tasks.filter((t) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [data.tasks, searchQuery]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Discovery': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Refinement': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ReadyForEng': return 'bg-green-100 text-green-800 border-green-200';
            case 'Backlog': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'InSprint': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Done': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPhase = (status: string) => {
        if (['Discovery', 'Refinement', 'ReadyForEng'].includes(status)) return 'Product';
        if (['Backlog', 'InSprint', 'Review', 'Done'].includes(status)) return 'Engineering';
        return 'Archived';
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
        // Shared save handler
        const maxOrder = Math.max(...data.tasks.map((t) => t.order_index), -1);
        const newTask = {
            ...taskData,
            // Ensure defaults if missing
            status: taskData.status || (isProductFormOpen ? 'Discovery' : 'Backlog'),
            order_index: maxOrder + 1
        };

        addTask(newTask);
        toast({ title: t('common.created', 'Initiative created successfully') });
        setIsProductFormOpen(false);
        setIsEngFormOpen(false);
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                            <Lightbulb className="h-8 w-8 text-primary" />
                            All Initiatives
                        </h1>
                        <p className="text-muted-foreground">
                            Overview of all items across Product and Engineering lifecycles.
                        </p>
                    </div>
                    <Button onClick={() => setIsSelectionOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('initiatives.createNew', 'New Initiative')}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Initiatives List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative flex-1 max-w-sm">
                                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="Filter initiatives..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Lifecycle Phase</TableHead>
                                        <TableHead>Current Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allInitiatives.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                No initiatives found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        allInitiatives.map((task) => (
                                            <TableRow key={task.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{task.title}</span>
                                                        {task.product_objective && (
                                                            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                                                                {task.product_objective}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell><Badge variant="outline">{task.task_type}</Badge></TableCell>
                                                <TableCell><Badge variant="secondary">{task.priority}</Badge></TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal">
                                                        {getPhase(task.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(task.status)} variant="outline">
                                                        {task.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <InitiativeTypeSelectionDialog
                    open={isSelectionOpen}
                    onClose={() => setIsSelectionOpen(false)}
                    onSelectType={handleTypeSelect}
                />

                <InitiativeFormDialog
                    open={isProductFormOpen}
                    onClose={() => setIsProductFormOpen(false)}
                    onSave={handleSaveTask}
                />

                <TaskFormDialog
                    open={isEngFormOpen}
                    onClose={() => setIsEngFormOpen(false)}
                    onSave={handleSaveTask}
                />
            </div>
        </Layout>
    );
};

export default InitiativesOverview;
