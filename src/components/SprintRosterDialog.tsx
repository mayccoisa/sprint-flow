import { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLocalData } from '@/hooks/useLocalData';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import type { Sprint, TeamMember, MemberSpecialty } from '@/types';

interface SprintRosterDialogProps {
    open: boolean;
    onClose: () => void;
    sprint: Sprint | null;
    squadName: string;
}

interface DraftEntry {
    member_id: number;
    in: boolean;
    availability_pct: number;
    notes: string;
    isGuest: boolean;
}

const SPECIALTY_LABEL: Record<MemberSpecialty, string> = {
    Frontend: 'Front-end',
    Backend: 'Back-end',
    QA: 'QA',
    Design: 'Design',
};

export function SprintRosterDialog({ open, onClose, sprint, squadName }: SprintRosterDialogProps) {
    const { t } = useTranslation();
    const { data, upsertSprintParticipant, removeSprintParticipant, seedSprintRoster } = useLocalData() as any;
    const { toast } = useToast();
    const [drafts, setDrafts] = useState<Record<number, DraftEntry>>({});
    const [guestPickerValue, setGuestPickerValue] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const squadActiveMembers: TeamMember[] = useMemo(() => {
        if (!sprint) return [];
        return data.members.filter(
            (m: TeamMember) => m.squad_id === sprint.squad_id && m.status === 'Active'
        );
    }, [data.members, sprint]);

    const existingParticipants = useMemo(() => {
        if (!sprint) return [];
        return data.sprintParticipants.filter((p: any) => p.sprint_id === sprint.id);
    }, [data.sprintParticipants, sprint]);

    // Initialize drafts when the dialog opens or the sprint changes.
    useEffect(() => {
        if (!open || !sprint) return;
        const next: Record<number, DraftEntry> = {};
        const hasParticipants = existingParticipants.length > 0;

        // Squad members start checked (full availability) when no roster exists yet,
        // otherwise they reflect the stored entry (or unchecked when missing).
        squadActiveMembers.forEach((m) => {
            const existing = existingParticipants.find((p: any) => p.member_id === m.id);
            next[m.id] = {
                member_id: m.id,
                in: hasParticipants ? !!existing : true,
                availability_pct: existing?.availability_pct ?? 100,
                notes: existing?.notes ?? '',
                isGuest: false,
            };
        });

        // Guest members already in the roster (belong to other squads).
        existingParticipants
            .filter((p: any) => !squadActiveMembers.some((m) => m.id === p.member_id))
            .forEach((p: any) => {
                next[p.member_id] = {
                    member_id: p.member_id,
                    in: true,
                    availability_pct: p.availability_pct,
                    notes: p.notes ?? '',
                    isGuest: true,
                };
            });

        setDrafts(next);
        setGuestPickerValue('');
    }, [open, sprint, squadActiveMembers, existingParticipants]);

    if (!sprint) return null;

    const memberById = (id: number) => data.members.find((m: TeamMember) => m.id === id);

    const guestCandidates: TeamMember[] = data.members.filter((m: TeamMember) => {
        if (m.status !== 'Active') return false;
        if (m.squad_id === sprint.squad_id) return false;
        return !drafts[m.id];
    });

    const updateDraft = (memberId: number, patch: Partial<DraftEntry>) => {
        setDrafts((prev) => ({ ...prev, [memberId]: { ...prev[memberId], ...patch } }));
    };

    const addGuest = (memberId: number) => {
        const member = memberById(memberId);
        if (!member) return;
        setDrafts((prev) => ({
            ...prev,
            [memberId]: {
                member_id: memberId,
                in: true,
                availability_pct: 100,
                notes: '',
                isGuest: true,
            },
        }));
        setGuestPickerValue('');
    };

    const removeGuest = (memberId: number) => {
        setDrafts((prev) => {
            const { [memberId]: _, ...rest } = prev;
            return rest;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Make sure default roster is materialized at least once so future
            // edits see the explicit list.
            const currentMemberIds = squadActiveMembers.map((m) => m.id);
            if (existingParticipants.length === 0) {
                await seedSprintRoster(sprint.id, currentMemberIds);
            }

            await Promise.all(
                Object.values(drafts).map(async (d) => {
                    if (d.in) {
                        await upsertSprintParticipant(sprint.id, d.member_id, d.availability_pct, d.notes || null);
                    } else {
                        await removeSprintParticipant(sprint.id, d.member_id);
                    }
                })
            );

            toast({ title: t('sprintRoster.saved', 'Roster atualizado') });
            onClose();
        } catch (err: any) {
            toast({
                title: t('common.error', 'Erro'),
                description: err?.message,
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const draftEntries = Object.values(drafts);
    const inCount = draftEntries.filter((d) => d.in).length;
    const totalCapacity = draftEntries
        .filter((d) => d.in)
        .reduce((sum, d) => {
            const m = memberById(d.member_id);
            return sum + (((m?.capacity || 0) * d.availability_pct) / 100);
        }, 0);

    const renderRow = (entry: DraftEntry) => {
        const member = memberById(entry.member_id);
        if (!member) return null;
        return (
            <div key={entry.member_id} className="flex items-start gap-3 rounded-md border p-3">
                <Checkbox
                    checked={entry.in}
                    onCheckedChange={(v) => updateDraft(entry.member_id, { in: v === true })}
                    className="mt-0.5"
                />
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium truncate">{member.name}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {SPECIALTY_LABEL[member.specialty] || member.specialty}
                            </Badge>
                            {entry.isGuest && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {t('sprintRoster.guest', 'Convidado')}
                                </Badge>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {entry.in
                                ? `${Math.round(((member.capacity || 0) * entry.availability_pct) / 100)} pts`
                                : '—'}
                        </span>
                    </div>
                    {entry.in && (
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
                            <div className="flex items-center gap-3">
                                <Slider
                                    min={0}
                                    max={100}
                                    step={10}
                                    value={[entry.availability_pct]}
                                    onValueChange={(v) =>
                                        updateDraft(entry.member_id, { availability_pct: v[0] ?? 100 })
                                    }
                                    className="flex-1"
                                />
                                <span className="text-xs font-semibold tabular-nums w-10 text-right">
                                    {entry.availability_pct}%
                                </span>
                            </div>
                            <Input
                                value={entry.notes}
                                onChange={(e) => updateDraft(entry.member_id, { notes: e.target.value })}
                                placeholder={t('sprintRoster.notesPlaceholder', 'Motivo (férias, alocado em…)')}
                                className="h-8 text-xs sm:w-56"
                            />
                        </div>
                    )}
                    {entry.isGuest && !entry.in && (
                        <button
                            type="button"
                            onClick={() => removeGuest(entry.member_id)}
                            className="text-[11px] text-muted-foreground hover:text-destructive"
                        >
                            {t('sprintRoster.removeGuest', 'Remover convidado')}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {t('sprintRoster.title', 'Roster da Sprint')} · {squadName}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'sprintRoster.description',
                            'Marque quem participa desta sprint e ajuste a disponibilidade (férias, alocação parcial). A capacidade da sprint é recalculada automaticamente.'
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-md bg-muted/40 p-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                        {t('sprintRoster.headcount', 'Pessoas na sprint')}
                    </span>
                    <span className="font-semibold tabular-nums">
                        {inCount} · {Math.round(totalCapacity)} pts efetivos
                    </span>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('sprintRoster.squadMembers', 'Membros do squad')}
                    </h3>
                    {draftEntries.filter((d) => !d.isGuest).length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">
                            {t('sprintRoster.noSquadMembers', 'Squad sem membros ativos.')}
                        </p>
                    ) : (
                        draftEntries.filter((d) => !d.isGuest).map(renderRow)
                    )}
                </div>

                <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('sprintRoster.guests', 'Convidados de outros squads')}
                    </h3>
                    {draftEntries.filter((d) => d.isGuest).map(renderRow)}

                    {guestCandidates.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                            <Select value={guestPickerValue} onValueChange={(v) => addGuest(Number(v))}>
                                <SelectTrigger className="h-9 text-sm flex-1">
                                    <SelectValue
                                        placeholder={t('sprintRoster.addGuestPlaceholder', 'Adicionar convidado…')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {guestCandidates.map((m) => {
                                        const squad = data.squads.find((s: any) => s.id === m.squad_id);
                                        return (
                                            <SelectItem key={m.id} value={String(m.id)}>
                                                {m.name} · {squad?.name || '—'}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        {t('common.cancel', 'Cancelar')}
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? t('common.saving', 'Salvando…') : t('common.save', 'Salvar')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
