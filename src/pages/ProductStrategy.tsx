import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useLocalData } from '@/hooks/useLocalData';
import { useTranslation } from 'react-i18next';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    Calendar as CalendarIcon,
    Wallet,
    CheckSquare,
    Timer,
    Activity,
    Plus,
    AlertCircle,
    TrendingUp,
    LayoutDashboard,
    Sparkles
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StrategyMap } from "@/components/strategy/StrategyMap";
import { ModuleConfig } from "@/components/strategy/ModuleConfig";
import { GenerateNarrativeDialog } from '@/components/ai/GenerateNarrativeDialog';

export default function ProductStrategy() {
    const { t } = useTranslation();
    const { data } = useLocalData();
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: subDays(new Date(), 30),
        to: new Date()
    });
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
    const [isAIOpen, setIsAIOpen] = useState(false);

    // --- Data Processing ---

    // 1. KPI Cards Data
    const moduleKPIs = useMemo(() => {
        return data.productModules.map(module => {
            // Find latest metrics
            const metrics = data.moduleMetrics.filter(m => m.module_id === module.id);
            const bugCount = metrics.find(m => m.metric_type === 'bug_count')?.value || 0;
            const usageRate = metrics.find(m => m.metric_type === 'usage_rate')?.value || 0;

            return {
                ...module,
                bugCount,
                usageRate
            };
        });
    }, [data.productModules, data.moduleMetrics]);

    // 2. Charts Data (Pain vs Cure)
    const chartData = useMemo(() => {
        return data.productModules.map(module => {
            // Bugs (Pain)
            const bugs = data.moduleMetrics
                .filter(m => m.module_id === module.id && m.metric_type === 'bug_count')
                .reduce((sum, m) => sum + m.value, 0);

            // Done Initiatives (Cure)
            // Linked via Feature -> Module
            const doneTasks = data.tasks.filter(t => {
                if (t.status !== 'Done') return false;
                if (t.end_date && !isAfter(new Date(t.end_date), dateRange.from)) return false;

                // Check linkage
                if (t.feature_id) {
                    const feature = data.productFeatures.find(f => f.id === t.feature_id);
                    return feature?.module_id === module.id;
                }
                return false;
            }).length;

            return {
                name: module.name,
                bugs: bugs,
                delivered: doneTasks
            };
        });
    }, [data.productModules, data.moduleMetrics, data.tasks, data.productFeatures, dateRange]);

    // 3. Effort Distribution Data
    const effortData = useMemo(() => {
        const tasksInPeriod = data.tasks.filter(t =>
            t.status === 'Done' || t.status === 'InSprint' // Consider "Work in Progress + Done"
            // Filter by date if needed, but for effort overview usually current snapshot is fine or period based
        );

        const distribution = tasksInPeriod.reduce((acc, task) => {
            acc[task.task_type] = (acc[task.task_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.keys(distribution).map(type => ({
            name: type,
            value: distribution[type]
        }));
    }, [data.tasks]);

    // 4. Tactical Table Data
    const initiatives = useMemo(() => {
        let filtered = data.tasks.filter(t =>
            // Filter by date range
            isAfter(new Date(t.created_at), dateRange.from)
        );

        // Filter by module if selected
        if (selectedModuleId) {
            filtered = filtered.filter(t => {
                if (t.feature_id) {
                    const feature = data.productFeatures.find(f => f.id === t.feature_id);
                    return feature?.module_id === selectedModuleId;
                }
                return false;
            });
        }

        // Sort by Module then Priority
        return filtered.sort((a, b) => {
            const getModuleName = (taskId: number, featureId: number | null) => {
                if (!featureId) return 'Z';
                const f = data.productFeatures.find(feat => feat.id === featureId);
                if (!f) return 'Z';
                const m = data.productModules.find(mod => mod.id === f.module_id);
                return m?.name || 'Z';
            };

            const modA = getModuleName(a.id, a.feature_id);
            const modB = getModuleName(b.id, b.feature_id);
            return modA.localeCompare(modB);
        });
    }, [data.tasks, selectedModuleId, dateRange, data.productModules, data.productFeatures]);

    // --- Helpers ---
    const getSuccessColor = (score: number) => {
        if (score >= 75) return 'bg-emerald-500';
        if (score >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const IconMap: Record<string, any> = {
        'Wallet': Wallet,
        'CheckSquare': CheckSquare,
        'Timer': Timer,
        'Activity': Activity
    };

    const COLORS = ['#8b5cf6', '#ef4444', '#f59e0b', '#10b981']; // Violet, Red, Amber, Emerald

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                            <LayoutDashboard className="h-8 w-8 text-violet-600" />
                            {t('productStrategy.title')}
                        </h1>
                        <p className="text-muted-foreground">
                            {t('productStrategy.subtitle')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[240px] pl-3 text-left font-normal justify-start">
                                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                                {format(dateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>{t('productStrategy.pickDate')}</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={(range: any) => setDateRange(range || { from: new Date(), to: new Date() })}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>

                        <Button variant="outline" onClick={() => setIsAIOpen(true)} className="gap-2 text-violet-600 border-violet-200 bg-violet-50/50 hover:bg-violet-100">
                            <Sparkles className="h-4 w-4" /> Draft Narrative
                        </Button>

                        <Button className="bg-violet-600 hover:bg-violet-700">
                            <Plus className="mr-2 h-4 w-4" /> {t('productStrategy.newReport')}
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="snapshot" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="snapshot">{t('productStrategy.tabs.kpi')}</TabsTrigger>
                        <TabsTrigger value="architecture">{t('productStrategy.tabs.architecture')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="snapshot" className="space-y-6">
                        {/* Row 1: Module Health Grid (KPIs) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {moduleKPIs.map(module => {
                                // Default icon or map lookup if string
                                const Icon = module.icon && IconMap[module.icon] ? IconMap[module.icon] : Activity;
                                const isSelected = selectedModuleId === module.id;
                                const healthScore = module.health_score || 0;

                                return (
                                    <Card
                                        key={module.id}
                                        className={cn(
                                            "cursor-pointer transition-all border-2",
                                            isSelected ? "border-violet-600 bg-violet-50/50 shadow-md" : "border-transparent hover:border-violet-200"
                                        )}
                                        onClick={() => setSelectedModuleId(isSelected ? null : module.id)}
                                    >
                                        <CardContent className="p-4 pt-5 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("p-2 rounded-lg bg-primary/10", isSelected && "bg-violet-200")}>
                                                        <Icon className="h-5 w-5 text-violet-700" />
                                                    </div>
                                                    <span className="font-semibold text-lg">{module.name}</span>
                                                </div>
                                                {module.bugCount > 0 && (
                                                    <Badge variant="destructive" className="rounded-full px-2">
                                                        {module.bugCount} bugs
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{t('productStrategy.kpi.healthScore')}</span>
                                                    <span className="font-medium">{healthScore}%</span>
                                                </div>
                                                <Progress value={healthScore} className={cn("h-2", "[&>.bg-primary]:" + getSuccessColor(healthScore).replace('bg-', 'bg-'))} />
                                            </div>

                                            <div className="flex items-center gap-2 pt-1">
                                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                                                    <TrendingUp className="h-3 w-3 mr-1" /> {module.usageRate}% {t('productStrategy.kpi.usage')}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Row 2: Charts X-Ray */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Scatter/Bar Chart: Pain vs Cure */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>{t('productStrategy.charts.painVsCure.title')}</CardTitle>
                                    <CardDescription>{t('productStrategy.charts.painVsCure.description')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                                                />
                                                <Legend />
                                                <Bar dataKey="bugs" name={t('productStrategy.charts.painVsCure.bugsReported')} fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                                <Bar dataKey="delivered" name={t('productStrategy.charts.painVsCure.initiativesDone')} fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Effort Distribution */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('productStrategy.charts.effort.title')}</CardTitle>
                                    <CardDescription>{t('productStrategy.charts.effort.description')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={effortData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {effortData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend layout="vertical" verticalAlign="bottom" align="center" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Row 3: Tactical Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('productStrategy.table.title')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('productStrategy.table.columns.type')}</TableHead>
                                            <TableHead>{t('productStrategy.table.columns.title')}</TableHead>
                                            <TableHead>{t('productStrategy.table.columns.module')}</TableHead>
                                            <TableHead>{t('productStrategy.table.columns.impact')}</TableHead>
                                            <TableHead className="text-right">{t('productStrategy.table.columns.status')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {initiatives.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    {t('productStrategy.table.empty')}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            initiatives.map(task => {
                                                const area = data.productAreas.find(a => a.id === task.area_id);
                                                return (
                                                    <TableRow key={task.id}>
                                                        <TableCell>
                                                            <Badge variant="outline">{task.task_type}</Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {task.title}
                                                            {task.user_impact && (
                                                                <p className="text-xs text-muted-foreground truncate max-w-[300px] mt-1">{task.user_impact}</p>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {(() => {
                                                                if (!task.feature_id) return <span className="text-muted-foreground">-</span>;
                                                                const feature = data.productFeatures.find(f => f.id === task.feature_id);
                                                                const module = feature ? data.productModules.find(m => m.id === feature.module_id) : null;

                                                                return module ? (
                                                                    <Badge variant="secondary" className="bg-slate-100">
                                                                        {module.name}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-muted-foreground">-</span>
                                                                );
                                                            })()}
                                                        </TableCell>
                                                        <TableCell>
                                                            {/* Simulated Impact vs Realized */}
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-violet-500" style={{ width: `${Math.random() * 100}%` }} />
                                                                </div>
                                                                <span className="text-xs text-muted-foreground">{t('productStrategy.table.estimated')}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge className={cn(
                                                                task.status === 'Done' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
                                                            )}>
                                                                {task.status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="architecture" className="space-y-6">
                        <StrategyMap />
                        <ModuleConfig />
                    </TabsContent>
                </Tabs>

                <GenerateNarrativeDialog open={isAIOpen} onOpenChange={setIsAIOpen} />
            </div>
        </Layout>
    );
}
