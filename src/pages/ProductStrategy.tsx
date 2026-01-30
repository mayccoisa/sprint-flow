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
    LayoutDashboard
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

export default function ProductStrategy() {
    const { t } = useTranslation();
    const { data } = useLocalData();
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: subDays(new Date(), 30),
        to: new Date()
    });
    const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);

    // --- Data Processing ---

    // 1. KPI Cards Data
    const areaKPIs = useMemo(() => {
        return data.productAreas.map(area => {
            // Find latest metrics
            const areaMetrics = data.areaMetrics.filter(m => m.area_id === area.id);
            const bugCount = areaMetrics.find(m => m.metric_type === 'bug_count')?.value || 0;
            const usageRate = areaMetrics.find(m => m.metric_type === 'usage_rate')?.value || 0;

            return {
                ...area,
                bugCount,
                usageRate
            };
        });
    }, [data.productAreas, data.areaMetrics]);

    // 2. Charts Data (Pain vs Cure)
    const chartData = useMemo(() => {
        return data.productAreas.map(area => {
            // Bugs (Pain) - Sum of bug metrics in range (Simulated for demo as latest * random factor for range)
            const bugs = data.areaMetrics
                .filter(m => m.area_id === area.id && m.metric_type === 'bug_count')
                .reduce((sum, m) => sum + m.value, 0); // Simplified accumulation

            // Done Initiatives (Cure)
            const doneTasks = data.tasks.filter(t =>
                t.area_id === area.id &&
                t.status === 'Done' &&
                t.end_date &&
                isAfter(new Date(t.end_date), dateRange.from)
            ).length;

            return {
                name: area.name,
                bugs: bugs,
                delivered: doneTasks
            };
        });
    }, [data.productAreas, data.areaMetrics, data.tasks, dateRange]);

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
            // Filter by area if selected
            (selectedAreaId ? t.area_id === selectedAreaId : true) &&
            // Filter by date range (created or updated in range)
            isAfter(new Date(t.created_at), dateRange.from)
        );

        // Sort by Area then Priority
        return filtered.sort((a, b) => {
            const areaA = data.productAreas.find(area => area.id === a.area_id)?.name || 'Z';
            const areaB = data.productAreas.find(area => area.id === b.area_id)?.name || 'Z';
            return areaA.localeCompare(areaB);
        });
    }, [data.tasks, selectedAreaId, dateRange, data.productAreas]);

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
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <LayoutDashboard className="h-8 w-8 text-violet-600" />
                            Strategy & Product Health
                        </h1>
                        <p className="text-muted-foreground">
                            Strategic X-Ray: Tech health vs Investment efforts.
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
                                        <span>Pick a date</span>
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

                        <Button className="bg-violet-600 hover:bg-violet-700">
                            <Plus className="mr-2 h-4 w-4" /> New Report
                        </Button>
                    </div>
                </div>

                {/* Row 1: Area Health Grid (KPIs) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {areaKPIs.map(area => {
                        const Icon = IconMap[area.icon] || Activity;
                        const isSelected = selectedAreaId === area.id;

                        return (
                            <Card
                                key={area.id}
                                className={cn(
                                    "cursor-pointer transition-all border-2",
                                    isSelected ? "border-violet-600 bg-violet-50/50 shadow-md" : "border-transparent hover:border-violet-200"
                                )}
                                onClick={() => setSelectedAreaId(isSelected ? null : area.id)}
                            >
                                <CardContent className="p-4 pt-5 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-lg bg-primary/10", isSelected && "bg-violet-200")}>
                                                <Icon className="h-5 w-5 text-violet-700" />
                                            </div>
                                            <span className="font-semibold text-lg">{area.name}</span>
                                        </div>
                                        {area.bugCount > 0 && (
                                            <Badge variant="destructive" className="rounded-full px-2">
                                                {area.bugCount} bugs
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Health Score</span>
                                            <span className="font-medium">{area.health_score}%</span>
                                        </div>
                                        <Progress value={area.health_score} className={cn("h-2", "[&>.bg-primary]:" + getSuccessColor(area.health_score).replace('bg-', 'bg-'))} />
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                                            <TrendingUp className="h-3 w-3 mr-1" /> {area.usageRate}% usage
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
                            <CardTitle>Pain vs. Cure Analysis</CardTitle>
                            <CardDescription>Comparing volume of reported issues (Red) vs. capabilities delivered (Violet)</CardDescription>
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
                                        <Bar dataKey="bugs" name="Bugs reported" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        <Bar dataKey="delivered" name="Initiatives Done" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Effort Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Effort Distribution</CardTitle>
                            <CardDescription>Where are we spending time?</CardDescription>
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
                        <CardTitle>Tactical Snapshot</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Area</TableHead>
                                    <TableHead>Impact</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initiatives.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No initiatives found in this period.
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
                                                    {area ? (
                                                        <Badge variant="secondary" className="bg-slate-100">
                                                            {area.name}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {/* Simulated Impact vs Realized */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-violet-500" style={{ width: `${Math.random() * 100}%` }} />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">Est.</span>
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
            </div>
        </Layout>
    );
}
