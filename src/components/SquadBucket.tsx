import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TYPE_LABEL_PT } from '@/utils/initiativeStatus';
import { Users, AlertTriangle, X, GripVertical, Plus, UserCog } from 'lucide-react';
import { Task, TeamMember, MemberSpecialty } from '@/types';

export interface TaskWithSprintTask extends Task {
  sprint_task_id?: number;
}

export interface ParticipantInfo {
  member: TeamMember;
  availability_pct: number;
}

interface SquadBucketProps {
  sprintId: number | null;
  squadName: string;
  members: TeamMember[];
  /** Effective sprint roster (member + availability). Falls back to all active members at 100% when empty. */
  participants?: ParticipantInfo[];
  tasks: TaskWithSprintTask[];
  isCurrent?: boolean;
  onRemove: (taskId: number) => void;
  onCreateSprint?: () => void;
  onOpenRoster?: () => void;
}

const SPECIALTIES: {
  key: MemberSpecialty;
  label: string;
  estimateKey: keyof Task;
  bar: string;
}[] = [
  { key: 'Frontend', label: 'FE', estimateKey: 'estimate_frontend', bar: '[&>div]:bg-blue-500' },
  { key: 'Backend', label: 'BE', estimateKey: 'estimate_backend', bar: '[&>div]:bg-green-500' },
  { key: 'QA', label: 'QA', estimateKey: 'estimate_qa', bar: '[&>div]:bg-purple-500' },
  { key: 'Design', label: 'DS', estimateKey: 'estimate_design', bar: '[&>div]:bg-pink-500' },
];

export const SquadBucket = ({
  sprintId,
  squadName,
  members,
  participants,
  tasks,
  isCurrent,
  onRemove,
  onCreateSprint,
  onOpenRoster,
}: SquadBucketProps) => {
  const hasSprint = sprintId !== null;
  const { isOver, setNodeRef } = useDroppable({
    id: hasSprint ? `squad-${sprintId}` : `squad-empty-${squadName}`,
    disabled: !hasSprint,
  });

  const active = members.filter((m) => m.status === 'Active');

  // Effective roster: explicit participants when provided, otherwise all
  // active squad members at full availability. Filters out anyone at 0%.
  const effective: ParticipantInfo[] = (participants && participants.length > 0
    ? participants
    : active.map((m) => ({ member: m, availability_pct: 100 }))
  ).filter((p) => p.availability_pct > 0);

  const headcount = effective.length;
  const hasReducedRoster =
    !!participants &&
    participants.length > 0 &&
    (participants.some((p) => p.availability_pct < 100) || effective.length < active.length);

  const breakdown = SPECIALTIES.map((s) => {
    const cap = effective
      .filter((p) => p.member.specialty === s.key)
      .reduce((sum, p) => sum + ((p.member.capacity || 0) * p.availability_pct) / 100, 0);
    const used = tasks.reduce(
      (sum, t) => sum + ((t[s.estimateKey] as number | null) || 0),
      0
    );
    const pct = cap > 0 ? Math.round((used / cap) * 100) : used > 0 ? 999 : 0;
    return { ...s, cap: Math.round(cap), used, pct };
  });

  const totalCap = breakdown.reduce((s, b) => s + b.cap, 0);
  const totalUsed = breakdown.reduce((s, b) => s + b.used, 0);
  const totalPct = totalCap > 0 ? Math.round((totalUsed / totalCap) * 100) : 0;
  const overBudget = totalPct > 100 || breakdown.some((b) => b.pct > 100);

  const ringClass = isOver
    ? 'ring-2 ring-primary shadow-lg'
    : isCurrent
    ? 'ring-1 ring-primary/30'
    : '';
  const borderClass = overBudget ? 'border-red-300' : '';

  return (
    <Card
      ref={setNodeRef}
      className={`flex flex-col h-full transition-all ${ringClass} ${borderClass} ${
        !hasSprint ? 'opacity-90' : ''
      }`}
    >
      <CardHeader className="pb-3 space-y-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {squadName}
          </span>
          <span className="flex items-center gap-1.5">
            {overBudget && <AlertTriangle className="h-4 w-4 text-red-500" />}
            <Badge variant="secondary" className="font-normal">
              {headcount}
              {hasReducedRoster && active.length !== headcount ? `/${active.length}` : ''} pessoas
            </Badge>
            {onOpenRoster && hasSprint && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={onOpenRoster}
                aria-label="Editar roster"
              >
                <UserCog className="h-3.5 w-3.5" />
              </Button>
            )}
          </span>
        </CardTitle>

        <div className="space-y-2">
          <div className="flex items-end justify-between text-xs">
            <span className="text-muted-foreground">Capacidade total</span>
            <span
              className={`font-semibold ${
                totalPct > 100
                  ? 'text-red-600'
                  : totalPct >= 85
                  ? 'text-yellow-600'
                  : 'text-foreground'
              }`}
            >
              {totalUsed} / {totalCap || '—'}
              {totalCap > 0 && ` · ${totalPct}%`}
            </span>
          </div>
          <Progress
            value={Math.min(totalPct, 100)}
            className={
              totalPct > 100
                ? '[&>div]:bg-red-500'
                : totalPct >= 85
                ? '[&>div]:bg-yellow-500'
                : '[&>div]:bg-green-500'
            }
          />

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1">
            {breakdown.map((b) => (
              <div key={b.key} className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">{b.label}</span>
                  <span
                    className={
                      b.pct > 100
                        ? 'text-red-600 font-medium'
                        : b.pct >= 85
                        ? 'text-yellow-600 font-medium'
                        : ''
                    }
                  >
                    {b.used}/{b.cap || '—'}
                  </span>
                </div>
                <Progress
                  value={b.cap > 0 ? Math.min(b.pct, 100) : 0}
                  className={`h-1 ${b.pct > 100 ? '[&>div]:bg-red-500' : b.bar}`}
                />
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pt-0">
        <div
          className={`flex-1 space-y-2 min-h-[280px] rounded-md transition-colors ${
            isOver ? 'bg-primary/5' : ''
          }`}
        >
          {!hasSprint ? (
            <div className="flex flex-col items-center justify-center gap-3 h-full min-h-[260px] border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
              <p className="text-xs text-muted-foreground">
                Sem sprint criada para este squad neste ciclo
              </p>
              {onCreateSprint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateSprint}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Criar sprint
                </Button>
              )}
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[260px] border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
              <p className="text-xs text-muted-foreground">
                Arraste tarefas do backlog para este squad
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <SquadTaskCard
                key={task.id}
                task={task}
                fromSprintId={sprintId as number}
                onRemove={onRemove}
              />
            ))
          )}
        </div>

        <div className="pt-3 mt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
          </span>
          <span className="font-medium">{totalUsed} pts</span>
        </div>
      </CardContent>
    </Card>
  );
};

const SquadTaskCard = ({
  task,
  fromSprintId,
  onRemove,
}: {
  task: TaskWithSprintTask;
  fromSprintId: number;
  onRemove: (taskId: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { fromSprintId, taskId: task.id },
  });

  const total =
    (task.estimate_frontend || 0) +
    (task.estimate_backend || 0) +
    (task.estimate_qa || 0) +
    (task.estimate_design || 0);

  const typeColors: Record<string, string> = {
    Feature: 'bg-blue-100 text-blue-800 border-blue-200',
    Bug: 'bg-red-100 text-red-800 border-red-200',
    TechDebt: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Spike: 'bg-purple-100 text-purple-800 border-purple-200',
    Improvement: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    Deployment: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`bg-background border rounded-md p-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow group relative ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(task.id);
        }}
      >
        <X className="h-3 w-3" />
      </Button>
      <div className="flex items-start gap-1.5 pr-6">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-snug mb-1.5 line-clamp-2">
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            <Badge
              className={`text-[10px] py-0 px-1.5 ${typeColors[task.task_type] || ''}`}
            >
              {TYPE_LABEL_PT[task.task_type] ?? task.task_type}
            </Badge>
            {task.estimate_frontend ? (
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1 rounded">
                FE {task.estimate_frontend}
              </span>
            ) : null}
            {task.estimate_backend ? (
              <span className="text-[10px] bg-green-50 text-green-700 px-1 rounded">
                BE {task.estimate_backend}
              </span>
            ) : null}
            {task.estimate_qa ? (
              <span className="text-[10px] bg-purple-50 text-purple-700 px-1 rounded">
                QA {task.estimate_qa}
              </span>
            ) : null}
            {task.estimate_design ? (
              <span className="text-[10px] bg-pink-50 text-pink-700 px-1 rounded">
                DS {task.estimate_design}
              </span>
            ) : null}
            {total > 0 && (
              <span className="text-[10px] font-semibold ml-auto">{total}pts</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
