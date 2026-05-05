import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle } from 'lucide-react';
import { TeamMember, MemberSpecialty } from '@/types';

interface SprintTaskWithEstimates {
  estimate_frontend: number | null;
  estimate_backend: number | null;
  estimate_qa: number | null;
  estimate_design: number | null;
}

interface CapacityPanelProps {
  members: TeamMember[];
  sprintTasks: SprintTaskWithEstimates[];
  squadName: string;
}

const SPECIALTIES: { key: MemberSpecialty; label: string; estimateKey: keyof SprintTaskWithEstimates; color: string }[] = [
  { key: 'Frontend', label: 'Front-end', estimateKey: 'estimate_frontend', color: 'bg-blue-500' },
  { key: 'Backend', label: 'Back-end', estimateKey: 'estimate_backend', color: 'bg-green-500' },
  { key: 'QA', label: 'QA', estimateKey: 'estimate_qa', color: 'bg-purple-500' },
  { key: 'Design', label: 'Design', estimateKey: 'estimate_design', color: 'bg-pink-500' },
];

export const CapacityPanel = ({ members, sprintTasks, squadName }: CapacityPanelProps) => {
  const activeMembers = members.filter((m) => m.status === 'Active');

  const breakdown = SPECIALTIES.map((s) => {
    const capacity = activeMembers
      .filter((m) => m.specialty === s.key)
      .reduce((sum, m) => sum + (m.capacity || 0), 0);
    const used = sprintTasks.reduce(
      (sum, t) => sum + ((t[s.estimateKey] as number | null) || 0),
      0
    );
    const pct = capacity > 0 ? Math.round((used / capacity) * 100) : used > 0 ? 999 : 0;
    return { ...s, capacity, used, pct };
  });

  const totalCapacity = breakdown.reduce((s, b) => s + b.capacity, 0);
  const totalUsed = breakdown.reduce((s, b) => s + b.used, 0);
  const totalPct = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

  const overallTone =
    totalPct > 100 ? 'text-red-600' : totalPct >= 85 ? 'text-yellow-600' : 'text-green-600';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Capacidade · {squadName}
          </span>
          <Badge variant="secondary">{activeMembers.length} pessoas</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-end justify-between mb-1">
            <span className="text-xs text-muted-foreground">Total da sprint</span>
            <span className={`text-sm font-semibold ${overallTone}`}>
              {totalUsed} / {totalCapacity || '—'} pts
              {totalCapacity > 0 && ` · ${totalPct}%`}
            </span>
          </div>
          <Progress
            value={Math.min(totalPct, 100)}
            className={totalPct > 100 ? '[&>div]:bg-red-500' : totalPct >= 85 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}
          />
          {totalPct > 100 && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Capacidade excedida
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2 border-t">
          {breakdown.map((b) => {
            const tone =
              b.capacity === 0 && b.used === 0
                ? 'text-muted-foreground'
                : b.pct > 100
                ? 'text-red-600'
                : b.pct >= 85
                ? 'text-yellow-600'
                : 'text-foreground';
            return (
              <div key={b.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{b.label}</span>
                  <span className={tone}>
                    {b.used} / {b.capacity || '—'}
                    {b.capacity > 0 && ` · ${Math.min(b.pct, 999)}%`}
                  </span>
                </div>
                <Progress
                  value={b.capacity > 0 ? Math.min(b.pct, 100) : 0}
                  className={
                    b.pct > 100
                      ? '[&>div]:bg-red-500'
                      : b.pct >= 85
                      ? '[&>div]:bg-yellow-500'
                      : `[&>div]:${b.color}`
                  }
                />
                {b.capacity === 0 && b.used > 0 && (
                  <p className="text-[11px] text-red-600 mt-0.5">
                    Sem membros de {b.label} no squad
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
