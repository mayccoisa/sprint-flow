import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useLocalData } from '@/hooks/useLocalData';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ShieldAlert, ShieldCheck, Mail, Calendar, UserPlus, Loader2, AlertTriangle, Send, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/components/ui-patterns';
import { RolesManager } from '@/components/users/RolesManager';
import { ImportRequestersDialog } from '@/components/users/ImportRequestersDialog';
import type { UserProfile, UserRole, Role } from '@/types';

export default function UsersManagement() {
    const { data, updateUserRole, inviteUser, assignRoleToUser, sendInviteForUser } = useLocalData() as any;
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const { t } = useTranslation();
    const confirm = useConfirm();

    // Invite state
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteId, setInviteId] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>('Member');
    const [inviteRoleId, setInviteRoleId] = useState<string>('');
    const [isInviting, setIsInviting] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const roles: Role[] = data.roles || [];
    const usersWithoutRole = data.users.filter((u: UserProfile) => !u.role_id && u.role !== 'Admin');

    // Ensure only Admins can view this
    if (userProfile?.role !== 'Admin') {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                    <ShieldAlert className="h-16 w-16 text-red-500" />
                    <h1 className="text-2xl font-bold">{t('usersManagement.accessDenied')}</h1>
                    <p className="text-muted-foreground">{t('usersManagement.accessDeniedDesc')}</p>
                </div>
            </Layout>
        );
    }

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        updateUserRole(userId, newRole);
        toast({ title: t('usersManagement.roleUpdated'), description: t('usersManagement.roleChangedTo', { role: newRole }) });
    };

    const handleAssignRole = async (userId: string, roleId: string) => {
        await assignRoleToUser(userId, roleId || null);
        toast({ title: 'Cargo atribuído' });
    };

    const { updateUser, deleteUser } = useLocalData() as any;

    const handleEditUser = (user: UserProfile) => {
        setInviteId(user.id);
        setInviteEmail(user.email);
        setInviteName(user.name || '');
        setInviteRole(user.role);
        setInviteRoleId(user.role_id || '');
        setIsInviteOpen(true);
    };

    const handleDeleteUser = async (userId: string) => {
        const ok = await confirm({
            title: t('usersManagement.confirmDeleteTitle', 'Delete user?'),
            description: t('usersManagement.confirmDelete', 'This user will lose access to the workspace. This action cannot be undone.'),
            confirmLabel: t('common.delete', 'Delete'),
        });
        if (!ok) return;
        try {
            await deleteUser(userId);
            toast({ title: t('usersManagement.userDeleted', 'User deleted successfully') });
        } catch (error: any) {
            toast({ title: t('usersManagement.deleteFailed', 'Failed to delete user'), description: error.message, variant: 'destructive' });
        }
    };

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();

        // Simple check if user already exists
        const existingUser = data.users.find(u => u.email.toLowerCase() === inviteEmail.toLowerCase() && u.id !== inviteId);
        if (existingUser && !existingUser.id.startsWith('invite_')) {
            toast({ title: t('usersManagement.userExists'), description: t('usersManagement.userExistsDesc'), variant: 'destructive' });
            return;
        }

        setIsInviting(true);
        try {
            // Permissions come from the assigned role; the legacy per-user matrix
            // is left empty on new invites.
            const rolePerms = roles.find((r) => r.id === inviteRoleId)?.permissions || {};

            if (inviteId) {
                await updateUser(inviteId, {
                    email: inviteEmail.toLowerCase(),
                    name: inviteName || 'Pending Invite',
                    role: inviteRole,
                    role_id: inviteRoleId || null,
                });
                toast({ title: t('usersManagement.userUpdated', 'User updated successfully') });
            } else {
                const created = await inviteUser(inviteEmail, inviteRole, rolePerms, inviteName);
                if (inviteRoleId && created?.id) {
                    await assignRoleToUser(created.id, inviteRoleId);
                }
                toast({ title: t('usersManagement.invitePrepared'), description: t('usersManagement.invitePreparedDesc', { email: inviteEmail, role: inviteRole }) });
            }
            setIsInviteOpen(false);
            setInviteId(null);
            setInviteEmail('');
            setInviteName('');
            setInviteRole('Member');
            setInviteRoleId('');
        } catch (error: any) {
            toast({ title: inviteId ? t('usersManagement.updateFailed', 'Failed to update user') : t('usersManagement.inviteFailed'), description: error.message, variant: 'destructive' });
        } finally {
            setIsInviting(false);
        }
    };

    const openNewInvite = () => {
        setInviteId(null);
        setInviteEmail('');
        setInviteName('');
        setInviteRole('Member');
        setInviteRoleId('');
        setIsInviteOpen(true);
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">{t('usersManagement.title')}</h1>
                        <p className="text-muted-foreground">{t('usersManagement.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                            <Download className="h-4 w-4 mr-2" />
                            Importar solicitantes
                        </Button>
                        <Button onClick={openNewInvite} className="bg-violet-600 hover:bg-violet-700">
                            <UserPlus className="h-4 w-4 mr-2" />
                            {t('usersManagement.inviteUser')}
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="users" className="w-full">
                    <TabsList>
                        <TabsTrigger value="users">{t('usersManagement.tabs.users', 'Usuários')}</TabsTrigger>
                        <TabsTrigger value="roles">{t('usersManagement.tabs.roles', 'Cargos')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="space-y-4">
                        {usersWithoutRole.length > 0 && (
                            <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-amber-900">
                                    <strong>{usersWithoutRole.length}</strong> usuário(s) sem cargo atribuído usam o esquema antigo de permissões. Atribua um cargo na tabela abaixo para migrá-los.
                                </div>
                            </div>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('usersManagement.registeredUsers')}</CardTitle>
                                <CardDescription>{t('usersManagement.totalUsers', { count: data.users.length })}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('usersManagement.table.user')}</TableHead>
                                            <TableHead>{t('usersManagement.table.joined')}</TableHead>
                                            <TableHead>{t('usersManagement.table.role')}</TableHead>
                                            <TableHead>{t('usersManagement.table.cargo', 'Cargo')}</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.users.map((user: UserProfile) => {
                                            const isAdmin = user.role === 'Admin';
                                            const userRole = roles.find((r) => r.id === user.role_id);
                                            return (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{user.name || t('usersManagement.unnamedUser')}</span>
                                                                {user.id.startsWith('draft_') && (
                                                                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                                                                        Rascunho
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {user.email || <em className="italic">sem email</em>}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(user.created_at), 'MMM d, yyyy')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={user.role}
                                                            onValueChange={(val: UserRole) => handleRoleChange(user.id, val)}
                                                            disabled={user.id === userProfile.id}
                                                        >
                                                            <SelectTrigger className="w-[130px] h-8 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Admin">
                                                                    <div className="flex items-center gap-2">
                                                                        <ShieldCheck className="h-3 w-3 text-violet-600" />
                                                                        <span className="font-semibold text-violet-700">{t('usersManagement.admin')}</span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="Member">{t('usersManagement.member')}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        {isAdmin ? (
                                                            <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                                                                {t('usersManagement.fullAccess')}
                                                            </Badge>
                                                        ) : (
                                                            <Select
                                                                value={user.role_id || ''}
                                                                onValueChange={(val) => handleAssignRole(user.id, val)}
                                                            >
                                                                <SelectTrigger className="w-[180px] h-8 text-xs">
                                                                    <SelectValue placeholder={userRole ? userRole.name : 'Sem cargo'} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {roles.map((r) => (
                                                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-1">
                                                        {user.id !== userProfile.id && (
                                                            <>
                                                                {(user.id.startsWith('draft_') || user.id.startsWith('invite_')) && user.email && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 text-xs text-violet-700 hover:text-violet-800 hover:bg-violet-50"
                                                                        onClick={async () => {
                                                                            try {
                                                                                await sendInviteForUser(user.id);
                                                                                toast({ title: 'Convite enviado', description: user.email });
                                                                            } catch (err: any) {
                                                                                toast({ title: 'Falha ao enviar', description: err?.message, variant: 'destructive' });
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Send className="h-3 w-3 mr-1" />
                                                                        Enviar convite
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-xs"
                                                                    onClick={() => handleEditUser(user)}
                                                                >
                                                                    Editar
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                >
                                                                    Excluir
                                                                </Button>
                                                            </>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="roles">
                        <RolesManager />
                    </TabsContent>
                </Tabs>
            </div>

            <ImportRequestersDialog open={isImportOpen} onClose={() => setIsImportOpen(false)} />

            {/* Invite User Dialog */}
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{inviteId ? t('usersManagement.editUser', 'Edit User') : t('usersManagement.inviteNewUser')}</DialogTitle>
                        <DialogDescription>
                            {inviteId ? t('usersManagement.editUserDesc', 'Update user details.') : t('usersManagement.preProvisionRole')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleInviteUser} className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="inviteName">{t('usersManagement.nameAddress', 'Name')}</Label>
                            <Input
                                id="inviteName"
                                type="text"
                                placeholder={t('usersManagement.namePlaceholder', 'Enter user name')}
                                value={inviteName}
                                onChange={(e) => setInviteName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="inviteEmail">{t('usersManagement.emailAddress')}</Label>
                            <Input
                                id="inviteEmail"
                                type="email"
                                required
                                placeholder={t('usersManagement.emailPlaceholder')}
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="inviteRole">{t('usersManagement.initialRole')}</Label>
                            <Select value={inviteRole} onValueChange={(val: UserRole) => setInviteRole(val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Member">{t('usersManagement.member')}</SelectItem>
                                    <SelectItem value="Admin">{t('usersManagement.admin')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Admin libera tudo. Membro segue o cargo abaixo.
                            </p>
                        </div>

                        {inviteRole === 'Member' && (
                            <div className="space-y-2">
                                <Label htmlFor="inviteRoleId">Cargo</Label>
                                <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um cargo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.length === 0 ? (
                                            <div className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum cargo cadastrado</div>
                                        ) : (
                                            roles.map((r) => (
                                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)} disabled={isInviting}>{t('usersManagement.cancel')}</Button>
                            <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isInviting}>
                                {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                {inviteId ? t('common.save', 'Save') : t('usersManagement.prepareInvitation')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
