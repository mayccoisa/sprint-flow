import { useEffect, useMemo, useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocalData } from '@/hooks/useLocalData';
import { useToast } from '@/hooks/use-toast';
import type { Squad, TeamMember, Role, UserProfile } from '@/types';
import { UserPlus, Loader2 } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
}

export function ImportRequestersDialog({ open, onClose }: Props) {
    const { data, createDraftUser } = useLocalData() as any;
    const { toast } = useToast();

    const squads: Squad[] = data.squads || [];
    const members: TeamMember[] = data.members || [];
    const users: UserProfile[] = data.users || [];
    const roles: Role[] = data.roles || [];

    // Default squad = primeiro cujo nome contém "solicit".
    const defaultSquadId = useMemo(() => {
        const match = squads.find((s) => /solicit/i.test(s.name));
        return match ? String(match.id) : '';
    }, [squads]);

    // Default cargo = primeiro cujo nome contém "comercial".
    const defaultRoleId = useMemo(() => {
        const match = roles.find((r) => /comercial/i.test(r.name));
        return match ? match.id : '';
    }, [roles]);

    const [squadId, setSquadId] = useState<string>('');
    const [roleId, setRoleId] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setSquadId(defaultSquadId);
        setRoleId(defaultRoleId);
    }, [open, defaultSquadId, defaultRoleId]);

    // Membros candidatos: do squad escolhido, ativos, cujo nome ainda não vira
    // um usuário existente (match case-insensitive em name). Quem já tem
    // user equivalente é mostrado mas vem desmarcado.
    const candidates = useMemo(() => {
        if (!squadId) return [] as { member: TeamMember; existing?: UserProfile }[];
        const sid = parseInt(squadId);
        const userByName = new Map<string, UserProfile>();
        users.forEach((u) => {
            if (u.name) userByName.set(u.name.trim().toLowerCase(), u);
        });
        return members
            .filter((m) => m.squad_id === sid)
            .map((member) => ({
                member,
                existing: userByName.get(member.name.trim().toLowerCase()),
            }))
            .sort((a, b) => a.member.name.localeCompare(b.member.name));
    }, [squadId, members, users]);

    // Reset seleção quando os candidatos mudam: marca por padrão só os que
    // não têm usuário equivalente.
    useEffect(() => {
        const next = new Set<number>();
        candidates.forEach((c) => {
            if (!c.existing) next.add(c.member.id);
        });
        setSelectedIds(next);
    }, [candidates]);

    const toggle = (id: number, on: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (on) next.add(id); else next.delete(id);
            return next;
        });
    };

    const allOn = candidates.length > 0 && selectedIds.size === candidates.length;
    const toggleAll = (on: boolean) => {
        setSelectedIds(on ? new Set(candidates.map((c) => c.member.id)) : new Set());
    };

    const handleImport = async () => {
        if (!roleId) {
            toast({ title: 'Selecione um cargo', variant: 'destructive' });
            return;
        }
        const toCreate = candidates.filter((c) => selectedIds.has(c.member.id));
        if (toCreate.length === 0) {
            toast({ title: 'Nenhum solicitante selecionado' });
            return;
        }
        setImporting(true);
        try {
            await Promise.all(toCreate.map((c) => createDraftUser(c.member.name, roleId, 'Member')));
            toast({
                title: `${toCreate.length} usuário(s) criado(s)`,
                description: 'Adicione o email de cada um e envie o convite quando estiver pronto.',
            });
            onClose();
        } catch (err: any) {
            toast({ title: 'Falha ao importar', description: err?.message, variant: 'destructive' });
        } finally {
            setImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Importar solicitantes como usuários</DialogTitle>
                    <DialogDescription>
                        Cria um usuário rascunho (sem email) para cada membro do squad selecionado, vinculado ao cargo escolhido. Depois você abre cada usuário, adiciona o email e dispara o convite.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Squad de origem</Label>
                            <Select value={squadId} onValueChange={setSquadId}>
                                <SelectTrigger><SelectValue placeholder="Selecione o squad" /></SelectTrigger>
                                <SelectContent>
                                    {squads.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Cargo</Label>
                            <Select value={roleId} onValueChange={setRoleId}>
                                <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                                <SelectContent>
                                    {roles.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {squadId && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                    Membros encontrados
                                </Label>
                                <button
                                    type="button"
                                    onClick={() => toggleAll(!allOn)}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {allOn ? 'Desmarcar todos' : 'Selecionar todos'}
                                </button>
                            </div>

                            <ScrollArea className="max-h-72 rounded-md border">
                                {candidates.length === 0 ? (
                                    <div className="p-4 text-sm text-muted-foreground italic">
                                        Nenhum membro neste squad.
                                    </div>
                                ) : (
                                    <ul className="divide-y">
                                        {candidates.map(({ member, existing }) => (
                                            <li key={member.id} className="flex items-center gap-3 px-3 py-2">
                                                <Checkbox
                                                    checked={selectedIds.has(member.id)}
                                                    onCheckedChange={(v) => toggle(member.id, v === true)}
                                                    disabled={!!existing}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{member.name}</div>
                                                    {existing && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Já existe usuário · ignorado
                                                        </div>
                                                    )}
                                                </div>
                                                {existing && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        Existente
                                                    </Badge>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </ScrollArea>
                            <p className="text-[11px] text-muted-foreground">
                                {selectedIds.size} de {candidates.length} selecionado(s).
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={importing}>Cancelar</Button>
                    <Button onClick={handleImport} disabled={importing || selectedIds.size === 0 || !roleId}>
                        {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                        Criar como rascunho
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
