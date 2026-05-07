import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ShieldCheck, Lock } from 'lucide-react';
import { useLocalData } from '@/hooks/useLocalData';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/ui-patterns';
import type { Role, AppFeature, FeatureAction, FeaturePermission } from '@/types';

const FEATURES: { id: AppFeature; label: string }[] = [
    { id: 'squads', label: 'Squads' },
    { id: 'initiatives', label: 'Iniciativas' },
    { id: 'backlog', label: 'Backlog' },
    { id: 'strategy', label: 'Estratégia' },
    { id: 'sprints', label: 'Sprints' },
    { id: 'releases', label: 'Lançamentos' },
    { id: 'documents', label: 'Documentação' },
    { id: 'forms', label: 'Formulários' },
    { id: 'users', label: 'Usuários' },
];

const ACTIONS: { id: FeatureAction; label: string }[] = [
    { id: 'view', label: 'Visualizar' },
    { id: 'create', label: 'Criar' },
    { id: 'edit', label: 'Editar' },
    { id: 'delete', label: 'Excluir' },
];

const emptyPermissions = (): FeaturePermission =>
    FEATURES.reduce((acc, f) => ({ ...acc, [f.id]: [] }), {} as FeaturePermission);

export function RolesManager() {
    const { data, addRole, updateRole, deleteRole } = useLocalData() as any;
    const { toast } = useToast();
    const confirm = useConfirm();

    const [editing, setEditing] = useState<Role | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [perms, setPerms] = useState<FeaturePermission>(emptyPermissions());
    const [saving, setSaving] = useState(false);

    const usersByRole = useMemo(() => {
        const map = new Map<string, number>();
        data.users.forEach((u: any) => {
            if (u.role_id) map.set(u.role_id, (map.get(u.role_id) || 0) + 1);
        });
        return map;
    }, [data.users]);

    const openNew = () => {
        setEditing(null);
        setName('');
        setDescription('');
        setPerms(emptyPermissions());
        setIsOpen(true);
    };

    const openEdit = (role: Role) => {
        setEditing(role);
        setName(role.name);
        setDescription(role.description || '');
        setPerms({ ...emptyPermissions(), ...role.permissions });
        setIsOpen(true);
    };

    const togglePerm = (feature: AppFeature, action: FeatureAction) => {
        setPerms((prev) => {
            const current = prev[feature] || [];
            const has = current.includes(action);
            let next = has ? current.filter((a) => a !== action) : [...current, action];
            // Granting any non-view action implies view; revoking view drops everything.
            if (!has && action !== 'view' && !next.includes('view')) next.push('view');
            if (has && action === 'view') next = [];
            return { ...prev, [feature]: next };
        });
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast({ title: 'Nome obrigatório', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            if (editing) {
                await updateRole(editing.id, { name: name.trim(), description, permissions: perms });
                toast({ title: 'Cargo atualizado' });
            } else {
                await addRole({ name: name.trim(), description, permissions: perms, is_system: false, is_active: true });
                toast({ title: 'Cargo criado' });
            }
            setIsOpen(false);
        } catch (err: any) {
            toast({ title: 'Erro ao salvar cargo', description: err?.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (role: Role) => {
        const ok = await confirm({
            title: `Excluir cargo "${role.name}"?`,
            description: 'Esta ação não pode ser desfeita.',
            confirmLabel: 'Excluir',
        });
        if (!ok) return;
        try {
            await deleteRole(role.id);
            toast({ title: 'Cargo excluído' });
        } catch (err: any) {
            toast({ title: 'Não foi possível excluir', description: err?.message, variant: 'destructive' });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                    <CardTitle>Cargos</CardTitle>
                    <CardDescription>
                        Defina conjuntos de permissões reutilizáveis. Cada usuário fica atrelado a um cargo.
                    </CardDescription>
                </div>
                <Button onClick={openNew} className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo cargo
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Usuários</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                    Nenhum cargo cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.roles.map((role: Role) => {
                                const count = usersByRole.get(role.id) || 0;
                                return (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{role.name}</span>
                                                {role.is_system && (
                                                    <Badge variant="outline" className="text-[10px] gap-1">
                                                        <Lock className="h-2.5 w-2.5" />
                                                        Sistema
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {role.description || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{count}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => openEdit(role)}
                                            >
                                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                disabled={role.is_system}
                                                onClick={() => handleDelete(role)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                Excluir
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? `Editar cargo · ${editing.name}` : 'Novo cargo'}</DialogTitle>
                        <DialogDescription>
                            Marque o que este cargo pode fazer em cada módulo. Conceder qualquer ação ativa "Visualizar" automaticamente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="role-name">Nome</Label>
                                <Input
                                    id="role-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Comercial, Desenvolvedor, PM"
                                    disabled={editing?.is_system}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role-desc">Descrição (opcional)</Label>
                                <Textarea
                                    id="role-desc"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={1}
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Permissões</Label>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead className="w-[200px]">Módulo</TableHead>
                                            {ACTIONS.map((a) => (
                                                <TableHead key={a.id} className="text-center">{a.label}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {FEATURES.map((f) => (
                                            <TableRow key={f.id}>
                                                <TableCell className="font-medium bg-slate-50/40">{f.label}</TableCell>
                                                {ACTIONS.map((a) => (
                                                    <TableCell key={a.id} className="text-center">
                                                        <Checkbox
                                                            checked={(perms[f.id] || []).includes(a.id)}
                                                            onCheckedChange={() => togglePerm(f.id, a.id)}
                                                            className="data-[state=checked]:bg-violet-600"
                                                        />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)} disabled={saving}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            {saving ? 'Salvando…' : 'Salvar cargo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
