import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useLocalData } from '@/hooks/useLocalData';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ShieldAlert, ShieldCheck, Mail, Calendar, Settings2, UserPlus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import type { UserProfile, UserRole, AppFeature, FeatureAction, FeaturePermission } from '@/types';

export default function UsersManagement() {
    const { data, updateUserRole, updateUserPermissions, inviteUser } = useLocalData();
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const { t } = useTranslation();
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    // Invite state
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteId, setInviteId] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>('Member');
    const [isInviting, setIsInviting] = useState(false);

    const FEATURES: { id: AppFeature; label: string }[] = useMemo(() => [
        { id: 'squads', label: t('usersManagement.features.squads') },
        { id: 'initiatives', label: t('usersManagement.features.initiatives') },
        { id: 'backlog', label: t('usersManagement.features.backlog') },
        { id: 'strategy', label: t('usersManagement.features.strategy') },
        { id: 'sprints', label: t('usersManagement.features.sprints') },
    ], [t]);

    const ACTIONS: { id: FeatureAction; label: string }[] = useMemo(() => [
        { id: 'view', label: t('usersManagement.actions.view') },
        { id: 'create', label: t('usersManagement.actions.create') },
        { id: 'edit', label: t('usersManagement.actions.edit') },
        { id: 'delete', label: t('usersManagement.actions.delete') },
    ], [t]);

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

    const handlePermissionToggle = (feature: AppFeature, action: FeatureAction, currentPermissions: FeaturePermission) => {
        if (!selectedUser) return;

        const newPermissions = { ...currentPermissions };
        const actions = newPermissions[feature] || [];

        if (actions.includes(action)) {
            newPermissions[feature] = actions.filter(a => a !== action);
        } else {
            newPermissions[feature] = [...actions, action];
            // If they can create/edit/delete, they must be able to view
            if (action !== 'view' && !newPermissions[feature]?.includes('view')) {
                newPermissions[feature]?.push('view');
            }
        }

        updateUserPermissions(selectedUser.id, newPermissions);
        // Optimistically update local state for the dialog
        setSelectedUser({ ...selectedUser, permissions: newPermissions });
    };

    const { updateUser, deleteUser } = useLocalData();

    const handleEditUser = (user: UserProfile) => {
        setInviteId(user.id);
        setInviteEmail(user.email);
        setInviteName(user.name || '');
        setInviteRole(user.role);
        setIsInviteOpen(true);
    };

    const handleDeleteUser = async (userId: string) => {
        if (confirm(t('usersManagement.confirmDelete', 'Are you sure you want to delete this user?'))) {
            try {
                await deleteUser(userId);
                toast({ title: t('usersManagement.userDeleted', 'User deleted successfully') });
            } catch (error: any) {
                toast({ title: t('usersManagement.deleteFailed', 'Failed to delete user'), description: error.message, variant: 'destructive' });
            }
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
            if (inviteId) {
                await updateUser(inviteId, {
                    email: inviteEmail.toLowerCase(),
                    name: inviteName || 'Pending Invite',
                    role: inviteRole
                });
                toast({ title: t('usersManagement.userUpdated', 'User updated successfully') });
            } else {
                await inviteUser(inviteEmail, inviteRole, {
                    squads: ['view'],
                    initiatives: ['view'],
                    backlog: ['view'],
                    strategy: ['view'],
                    sprints: ['view'],
                    releases: ['view'],
                }, inviteName);
                toast({ title: t('usersManagement.invitePrepared'), description: t('usersManagement.invitePreparedDesc', { email: inviteEmail, role: inviteRole }) });
            }
            setIsInviteOpen(false);
            setInviteId(null);
            setInviteEmail('');
            setInviteName('');
            setInviteRole('Member');
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
                    <Button onClick={openNewInvite} className="bg-violet-600 hover:bg-violet-700">
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t('usersManagement.inviteUser')}
                    </Button>
                </div>

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
                                    <TableHead className="text-right">{t('usersManagement.table.permissions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.name || t('usersManagement.unnamedUser')}</span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {user.email}
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
                                                disabled={user.id === userProfile.id} // Cannot change own role
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
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            {user.role === 'Admin' ? (
                                                <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">{t('usersManagement.fullAccess')}</Badge>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    onClick={() => setSelectedUser(user)}
                                                >
                                                    <Settings2 className="h-3 w-3 mr-1" />
                                                    {t('usersManagement.configure')}
                                                </Button>
                                            )}
                                            {user.id !== userProfile.id && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-xs"
                                                        onClick={() => handleEditUser(user)}
                                                    >
                                                        {t('usersManagement.actions.edit', 'Edit')}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        {t('usersManagement.actions.delete', 'Delete')}
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Granular Permissions Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('usersManagement.granularPermissions')}</DialogTitle>
                        <DialogDescription>
                            {t('usersManagement.configureAccessFor')} <strong>{selectedUser?.name || selectedUser?.email}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-6 py-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="w-[200px] border-r">{t('usersManagement.featureModule')}</TableHead>
                                        {ACTIONS.map(action => (
                                            <TableHead key={action.id} className="text-center">{action.label}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {FEATURES.map(feature => {
                                        const currentActions = selectedUser.permissions[feature.id] || [];

                                        return (
                                            <TableRow key={feature.id} className="border-b">
                                                <TableCell className="font-medium border-r bg-slate-50/50">
                                                    {feature.label}
                                                </TableCell>
                                                {ACTIONS.map(action => (
                                                    <TableCell key={action.id} className="text-center">
                                                        <Checkbox
                                                            checked={currentActions.includes(action.id)}
                                                            onCheckedChange={() => handlePermissionToggle(feature.id, action.id, selectedUser.permissions)}
                                                            className="data-[state=checked]:bg-violet-600"
                                                        />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            <div className="text-xs text-muted-foreground p-3 bg-blue-50 text-blue-800 rounded-md border border-blue-100 flex gap-2">
                                <ShieldAlert className="h-4 w-4 shrink-0" />
                                <p>{t('usersManagement.noteGranting')}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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
                        </div>

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
