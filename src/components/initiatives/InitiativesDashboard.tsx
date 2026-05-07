import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import {
    format, startOfWeek, addWeeks, isAfter, subDays, subMonths, startOfMonth, addMonths, differenceInCalendarDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    ListTodo, Compass, Zap, CheckCircle2, UserX, Clock, ExternalLink,
} from 'lucide-react';
import type { Task, UserProfile, TaskAuditLog, TaskStatus } from '@/types';
import { STATUS_HEX, STATUS_ORDER, STATUS_STYLES, PRODUCT_PHASE_STATUSES, STATUS_LABEL_PT, TYPE_LABEL_PT, TYPE_HEX, TYPE_ORDER } from '@/utils/initiativeStatus';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const STAGNATION_THRESHOLD_DAYS = 14;
const TIMELINE_WEEKS = 26; // ~6 months
const THROUGHPUT_MONTHS = 12;

type Props = {
    tasks: Task[];
    users: UserProfile[];
    auditLogs: TaskAuditLog[];
    onFocusNoRequester: () => void;
};

const isDoneStatusChange = (log: TaskAuditLog) =>
    log.action === 'status_change' &&
    log.changes.some((c) => c.field === 'status' && c.new === 'Done');

const lastStatusChangeAt = (logs: TaskAuditLog[], taskId: number): string | null => {
    let latest: string | null = null;
    for (const l of logs) {
        if (l.task_id !== taskId) continue;
        if (l.action !== 'status_change') continue;
        if (!latest || new Date(l.changed_at).getTime() > new Date(latest).getTime()) {
            latest = l.changed_at;
        }
    }
    return latest;
};

export const InitiativesDashboard = ({ tasks, users, auditLogs, onFocusNoRequester }: Props) => {
    const { t } = useTranslation();

    const userById = useMemo(() => {
        const m = new Map<string, UserProfile>();
        users.forEach((u) => m.set(u.id, u));
        return m;
    }, [users]);

    const userLabel = (id?: string | null) => {
        if (!id) return t('initiatives.dashboard.noRequester', 'Sem solicitante');
        const u = userById.get(id);
        return u?.name ?? u?.email ?? id;
    };

    // === KPIs ===
    const total = tasks.length;
    const inDiscovery = tasks.filter((tk) =>
        (PRODUCT_PHASE_STATUSES as string[]).includes(tk.status),
    ).length;
    const inSprint = tasks.filter((tk) => ['InSprint', 'Review'].includes(tk.status)).length;
    const noRequester = tasks.filter((tk) => !tk.requester_id).length;

    const taskIdSet = useMemo(() => new Set(tasks.map((tk) => tk.id)), [tasks]);
    const thirtyDaysAgo = subDays(new Date(), 30);
    const doneLast30 = useMemo(
        () =>
            auditLogs.filter(
                (l) =>
                    isDoneStatusChange(l) &&
                    taskIdSet.has(l.task_id) &&
                    isAfter(new Date(l.changed_at), thirtyDaysAgo),
            ).length,
        [auditLogs, taskIdSet, thirtyDaysAgo],
    );

    // === Solicitante × Status|Tipo (stacked bar) ===
    const [requesterGroupBy, setRequesterGroupBy] = useState<'status' | 'type'>('status');

    const requesterBreakdown = useMemo(() => {
        const counts = new Map<string, Record<string, number> & { __total: number }>();
        tasks.forEach((tk) => {
            const key = tk.requester_id ?? '__none__';
            const entry = counts.get(key) ?? ({ __total: 0 } as any);
            const segmentKey = requesterGroupBy === 'status' ? tk.status : tk.task_type;
            entry[segmentKey] = (entry[segmentKey] ?? 0) + 1;
            entry.__total = (entry.__total ?? 0) + 1;
            counts.set(key, entry);
        });
        return Array.from(counts.entries())
            .map(([key, val]) => {
                const label = key === '__none__'
                    ? t('initiatives.dashboard.noRequester', 'Sem solicitante')
                    : userLabel(key);
                return {
                    key,
                    label,
                    labelWithTotal: `${label} · ${val.__total}`,
                    ...val,
                };
            })
            .sort((a, b) => b.__total - a.__total)
            .slice(0, 10);
    }, [tasks, t, userById, requesterGroupBy]);

    const segmentOrder = requesterGroupBy === 'status' ? STATUS_ORDER : TYPE_ORDER;
    const segmentHex = requesterGroupBy === 'status' ? STATUS_HEX : TYPE_HEX;
    const segmentLabel = requesterGroupBy === 'status' ? STATUS_LABEL_PT : TYPE_LABEL_PT;

    // === Timeline de criação (semanal, últimas 26 semanas) ===
    const timelineData = useMemo(() => {
        const start = startOfWeek(subDays(new Date(), TIMELINE_WEEKS * 7), { weekStartsOn: 1 });
        const buckets: { weekKey: string; label: string; count: number }[] = [];
        for (let i = 0; i < TIMELINE_WEEKS; i++) {
            const wkStart = addWeeks(start, i);
            buckets.push({
                weekKey: wkStart.toISOString(),
                label: format(wkStart, 'dd/MM'),
                count: 0,
            });
        }
        const indexByWeek = new Map(buckets.map((b, i) => [b.weekKey, i]));
        tasks.forEach((tk) => {
            const created = new Date(tk.created_at);
            const wkStart = startOfWeek(created, { weekStartsOn: 1 });
            const idx = indexByWeek.get(wkStart.toISOString());
            if (idx !== undefined) buckets[idx].count += 1;
        });
        return buckets;
    }, [tasks]);

    // === Estagnadas ===
    const stagnant = useMemo(() => {
        const now = new Date();
        return tasks
            .filter((tk) => tk.status !== 'Done' && tk.status !== 'Archived')
            .map((tk) => {
                const last = lastStatusChangeAt(auditLogs, tk.id);
                const since = last ? new Date(last) : new Date(tk.created_at);
                return { task: tk, days: differenceInCalendarDays(now, since) };
            })
            .filter((x) => x.days > STAGNATION_THRESHOLD_DAYS)
            .sort((a, b) => b.days - a.days)
            .slice(0, 10);
    }, [tasks, auditLogs]);

    // === Throughput mensal ===
    const throughput = useMemo(() => {
        const start = startOfMonth(subMonths(new Date(), THROUGHPUT_MONTHS - 1));
        const buckets: { monthKey: string; label: string; count: number }[] = [];
        for (let i = 0; i < THROUGHPUT_MONTHS; i++) {
            const m = addMonths(start, i);
            buckets.push({
                monthKey: m.toISOString(),
                label: format(m, 'MMM/yy', { locale: ptBR }),
                count: 0,
            });
        }
        const idxByMonth = new Map(buckets.map((b, i) => [b.monthKey, i]));
        auditLogs.forEach((l) => {
            if (!isDoneStatusChange(l)) return;
            if (!taskIdSet.has(l.task_id)) return;
            const m = startOfMonth(new Date(l.changed_at));
            const idx = idxByMonth.get(m.toISOString());
            if (idx !== undefined) buckets[idx].count += 1;
        });
        return buckets;
    }, [auditLogs, taskIdSet]);

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <KpiCard
                    icon={ListTodo}
                    label={t('initiatives.dashboard.kpi.total', 'Total')}
                    value={total}
                />
                <KpiCard
                    icon={Compass}
                    label={t('initiatives.dashboard.kpi.discovery', 'Em discovery')}
                    value={inDiscovery}
                />
                <KpiCard
                    icon={Zap}
                    label={t('initiatives.dashboard.kpi.inSprint', 'Em sprint')}
                    value={inSprint}
                />
                <KpiCard
                    icon={CheckCircle2}
                    label={t('initiatives.dashboard.kpi.done30', 'Concluídas 30d')}
                    value={doneLast30}
                />
                <KpiCard
                    icon={UserX}
                    label={t('initiatives.dashboard.kpi.noRequester', 'Sem solicitante')}
                    value={noRequester}
                    accent={noRequester > 0 ? 'amber' : undefined}
                    onClick={noRequester > 0 ? onFocusNoRequester : undefined}
                />
            </div>

            {/* Status × Solicitante — destaque, linha cheia */}
            <Card>
                <CardContent className="p-5 space-y-3">
                    <header className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <h3 className="text-sm font-semibold">
                                {t('initiatives.dashboard.charts.byRequester', 'Solicitações por usuário')}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {requesterGroupBy === 'status'
                                    ? t('initiatives.dashboard.charts.byRequesterHintStatus', 'Top 10 — empilhado por status, total ao lado do nome')
                                    : t('initiatives.dashboard.charts.byRequesterHintType', 'Top 10 — empilhado por tipo, total ao lado do nome')}
                            </p>
                        </div>
                        <ToggleGroup
                            type="single"
                            size="sm"
                            value={requesterGroupBy}
                            onValueChange={(v) => v && setRequesterGroupBy(v as 'status' | 'type')}
                            className="border rounded-md"
                        >
                            <ToggleGroupItem value="status" className="text-xs h-7 px-3">
                                {t('initiatives.dashboard.charts.groupByStatus', 'Por status')}
                            </ToggleGroupItem>
                            <ToggleGroupItem value="type" className="text-xs h-7 px-3">
                                {t('initiatives.dashboard.charts.groupByType', 'Por tipo')}
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </header>
                    {requesterBreakdown.length === 0 ? (
                        <EmptyChart label={t('initiatives.dashboard.empty', 'Sem dados no filtro atual')} />
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={Math.max(280, requesterBreakdown.length * 44)}>
                                <BarChart
                                    data={requesterBreakdown}
                                    layout="vertical"
                                    margin={{ left: 8, right: 56, top: 4, bottom: 4 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <YAxis
                                        type="category"
                                        dataKey="labelWithTotal"
                                        width={220}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip
                                        formatter={(value: number, name: string) => [value, name]}
                                        labelFormatter={(label: string) => label}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    {segmentOrder.map((s, idx) => (
                                        <Bar key={s} dataKey={s} stackId="a" fill={segmentHex[s]} name={segmentLabel[s] ?? s}>
                                            {idx === segmentOrder.length - 1 && (
                                                <LabelList
                                                    dataKey="__total"
                                                    position="right"
                                                    style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
                                                />
                                            )}
                                        </Bar>
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>

                            {/* Tabela resumo abaixo do gráfico, com números exatos por status */}
                            <div className="overflow-x-auto border-t pt-3">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-muted-foreground">
                                            <th className="py-1.5 pr-3 font-medium">
                                                {t('initiatives.dashboard.charts.user', 'Usuário')}
                                            </th>
                                            <th className="py-1.5 px-2 font-medium text-right tabular-nums">
                                                {t('initiatives.dashboard.charts.total', 'Total')}
                                            </th>
                                            {segmentOrder.filter((s) =>
                                                requesterBreakdown.some((r) => (r as any)[s])
                                            ).map((s) => (
                                                <th
                                                    key={s}
                                                    className="py-1.5 px-2 font-medium text-right tabular-nums"
                                                >
                                                    {segmentLabel[s] ?? s}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requesterBreakdown.map((r) => (
                                            <tr key={r.key} className="border-t border-border/50">
                                                <td className="py-1.5 pr-3 truncate max-w-[200px]">
                                                    {r.label}
                                                </td>
                                                <td className="py-1.5 px-2 text-right font-semibold tabular-nums">
                                                    {r.__total}
                                                </td>
                                                {segmentOrder.filter((s) =>
                                                    requesterBreakdown.some((rr) => (rr as any)[s])
                                                ).map((s) => (
                                                    <td
                                                        key={s}
                                                        className="py-1.5 px-2 text-right tabular-nums text-muted-foreground"
                                                    >
                                                        {(r as any)[s] ?? 0}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Timeline */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <header>
                            <h3 className="text-sm font-semibold">
                                {t('initiatives.dashboard.charts.timeline', 'Linha do tempo de criação')}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {t('initiatives.dashboard.charts.timelineHint', 'Iniciativas criadas por semana (últimos 6 meses)')}
                            </p>
                        </header>
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={timelineData} margin={{ left: 0, right: 12 }}>
                                <defs>
                                    <linearGradient id="initCreateGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={3} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#initCreateGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Throughput */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <header>
                            <h3 className="text-sm font-semibold">
                                {t('initiatives.dashboard.throughput.title', 'Throughput mensal')}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {t('initiatives.dashboard.throughput.hint', 'Iniciativas concluídas por mês')}
                            </p>
                        </header>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={throughput} margin={{ left: 0, right: 12 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#10b981">
                                    {throughput.map((_, i) => (
                                        <Cell key={i} fill="#10b981" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div>
                {/* Estagnadas */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <header className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <div>
                                <h3 className="text-sm font-semibold">
                                    {t('initiatives.dashboard.stagnation.title', 'Iniciativas estagnadas')}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {t(
                                        'initiatives.dashboard.stagnation.hint',
                                        `Sem mudança de status há mais de ${STAGNATION_THRESHOLD_DAYS} dias`,
                                        { days: STAGNATION_THRESHOLD_DAYS },
                                    )}
                                </p>
                            </div>
                        </header>
                        {stagnant.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic py-6 text-center">
                                {t('initiatives.dashboard.stagnation.empty', 'Nenhuma iniciativa estagnada — tudo fluindo.')}
                            </p>
                        ) : (
                            <ul className="divide-y divide-border/60">
                                {stagnant.map(({ task, days }) => (
                                    <li key={task.id} className="py-2 flex items-start gap-3">
                                        <Link
                                            to={`/initiatives/${task.id}`}
                                            className="flex-1 min-w-0 hover:underline"
                                        >
                                            <span className="block text-sm truncate">{task.title}</span>
                                            <span className="text-[11px] text-muted-foreground">
                                                {userLabel(task.requester_id)}
                                            </span>
                                        </Link>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'font-medium border-0 ring-1 px-2 py-0.5 text-[10px] shrink-0',
                                                STATUS_STYLES[task.status] ?? 'bg-slate-50 text-slate-700 ring-slate-200',
                                            )}
                                        >
                                            {STATUS_LABEL_PT[task.status] ?? task.status}
                                        </Badge>
                                        <span className="text-xs font-medium tabular-nums w-14 text-right shrink-0">
                                            {days}d
                                        </span>
                                        <Link
                                            to={`/initiatives/${task.id}`}
                                            className="text-muted-foreground hover:text-foreground shrink-0"
                                            title={t('initiatives.dashboard.openInitiative', 'Abrir iniciativa')}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const KpiCard = ({
    icon: Icon,
    label,
    value,
    accent,
    onClick,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    accent?: 'amber';
    onClick?: () => void;
}) => {
    const accentClass = accent === 'amber' ? 'border-amber-200 bg-amber-50/50' : '';
    const Inner = (
        <Card className={cn('transition-shadow', accentClass, onClick && 'hover:shadow-md cursor-pointer')}>
            <CardContent className="p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className={cn('h-3.5 w-3.5', accent === 'amber' && 'text-amber-600')} />
                    <span className="text-[11px] uppercase tracking-wider">{label}</span>
                </div>
                <div
                    className={cn(
                        'text-2xl font-semibold tabular-nums',
                        accent === 'amber' && 'text-amber-700',
                    )}
                >
                    {value}
                </div>
            </CardContent>
        </Card>
    );
    if (onClick) {
        return (
            <button type="button" onClick={onClick} className="text-left">
                {Inner}
            </button>
        );
    }
    return Inner;
};

const EmptyChart = ({ label }: { label: string }) => (
    <div className="h-48 flex items-center justify-center text-sm text-muted-foreground italic">
        {label}
    </div>
);

export default InitiativesDashboard;
