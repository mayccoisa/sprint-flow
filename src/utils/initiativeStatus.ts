import type { TaskStatus } from '@/types';

/**
 * Canonical PT-BR labels for initiative statuses. "Discovery" and "Backlog"
 * stay in English by product decision; everything else is Portuguese.
 * Single source of truth — used by every page that displays a status.
 */
export const STATUS_LABEL_PT: Record<string, string> = {
    Discovery: 'Discovery',
    ProductBacklog: 'Backlog de Produto',
    Prototyping: 'Prototipação',
    Refinement: 'Refinamento',
    ReadyForEng: 'Documentado',
    Backlog: 'Backlog',
    InSprint: 'Em Sprint',
    Review: 'Revisão',
    Done: 'Concluído',
    Archived: 'Arquivado',
};

export const PRIORITY_DOT: Record<string, string> = {
    High: 'bg-rose-500',
    Medium: 'bg-amber-500',
    Low: 'bg-slate-400',
};

export const TYPE_DOT: Record<string, string> = {
    Feature: 'bg-blue-500',
    Improvement: 'bg-cyan-500',
    Bug: 'bg-rose-500',
    Deployment: 'bg-slate-500',
    TechDebt: 'bg-amber-500',
    Spike: 'bg-violet-500',
};

export const TYPE_LABEL_PT: Record<string, string> = {
    Feature: 'Funcionalidade',
    Improvement: 'Melhoria',
    Bug: 'Bug',
    Deployment: 'Implantação',
    TechDebt: 'Débito técnico',
    Spike: 'Spike',
};

export const TYPE_HEX: Record<string, string> = {
    Feature: '#3b82f6',
    Improvement: '#06b6d4',
    Bug: '#f43f5e',
    Deployment: '#64748b',
    TechDebt: '#f59e0b',
    Spike: '#8b5cf6',
};

export const TYPE_ORDER: string[] = [
    'Feature',
    'Improvement',
    'Bug',
    'Deployment',
    'TechDebt',
    'Spike',
];

export const PRIORITY_LABEL_PT: Record<string, string> = {
    High: 'Alta',
    Medium: 'Média',
    Low: 'Baixa',
};

export const STATUS_STYLES: Record<string, string> = {
    Discovery: 'bg-violet-50 text-violet-700 ring-violet-200',
    ProductBacklog: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
    Prototyping: 'bg-pink-50 text-pink-700 ring-pink-200',
    Refinement: 'bg-blue-50 text-blue-700 ring-blue-200',
    ReadyForEng: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Backlog: 'bg-slate-50 text-slate-700 ring-slate-200',
    InSprint: 'bg-amber-50 text-amber-700 ring-amber-200',
    Review: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    Done: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
};

export const STATUS_DOT: Record<string, string> = {
    Discovery: 'bg-violet-500',
    ProductBacklog: 'bg-fuchsia-500',
    Prototyping: 'bg-pink-500',
    Refinement: 'bg-blue-500',
    ReadyForEng: 'bg-emerald-500',
    Backlog: 'bg-slate-400',
    InSprint: 'bg-amber-500',
    Review: 'bg-indigo-500',
    Done: 'bg-emerald-600',
};

/** Hex chart-friendly colors aligned with STATUS_STYLES (for recharts <Bar fill>). */
export const STATUS_HEX: Record<string, string> = {
    Discovery: '#8b5cf6',
    ProductBacklog: '#d946ef',
    Prototyping: '#ec4899',
    Refinement: '#3b82f6',
    ReadyForEng: '#10b981',
    Backlog: '#94a3b8',
    InSprint: '#f59e0b',
    Review: '#6366f1',
    Done: '#059669',
    Archived: '#cbd5e1',
};

export const STATUS_ORDER: TaskStatus[] = [
    'ProductBacklog',
    'Refinement',
    'Discovery',
    'Prototyping',
    'ReadyForEng',
    'Backlog',
    'InSprint',
    'Review',
    'Done',
    'Archived',
];

export const PRODUCT_PHASE_STATUSES: TaskStatus[] = [
    'ProductBacklog',
    'Refinement',
    'Discovery',
    'Prototyping',
    'ReadyForEng',
];

export const ENG_PHASE_STATUSES: TaskStatus[] = [
    'Backlog',
    'InSprint',
    'Review',
    'Done',
];

export type InitiativePhase = 'product' | 'engineering' | 'archived';

export const getPhaseKey = (status: string): InitiativePhase => {
    if ((PRODUCT_PHASE_STATUSES as string[]).includes(status)) return 'product';
    if ((ENG_PHASE_STATUSES as string[]).includes(status)) return 'engineering';
    return 'archived';
};
