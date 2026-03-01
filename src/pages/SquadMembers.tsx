import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Edit, UserX, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MemberFormDialog } from '@/components/MemberFormDialog';
import { useLocalData } from '@/hooks/useLocalData';
import { toast } from '@/hooks/use-toast';
import type { TeamMember, MemberSpecialty } from '@/types';

const SPECIALTY_COLORS: Record<MemberSpecialty, string> = {
  Frontend: 'bg-specialty-frontend/10 text-specialty-frontend border-specialty-frontend/20',
  Backend: 'bg-specialty-backend/10 text-specialty-backend border-specialty-backend/20',
  QA: 'bg-specialty-qa/10 text-specialty-qa border-specialty-qa/20',
  Design: 'bg-specialty-design/10 text-specialty-design border-specialty-design/20',
};

export default function SquadMembers() {
  const { id } = useParams<{ id: string }>();
  const squadId = parseInt(id || '0');
  const { data, addMember, updateMember } = useLocalData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>();
  const [showInactive, setShowInactive] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [deactivatingMember, setDeactivatingMember] = useState<TeamMember | null>(null);

  const squad = data.squads.find(s => s.id === squadId);

  const filteredMembers = useMemo(() => {
    let members = data.members.filter(m => m.squad_id === squadId);

    if (!showInactive) {
      members = members.filter(m => m.status === 'Active');
    }

    if (specialtyFilter !== 'all') {
      members = members.filter(m => m.specialty === specialtyFilter);
    }

    return members;
  }, [data.members, squadId, showInactive, specialtyFilter]);

  const stats = useMemo(() => {
    const activeMembers = data.members.filter(m => m.squad_id === squadId && m.status === 'Active');
    const totalCapacity = activeMembers.reduce((sum, m) => sum + m.capacity, 0);

    const bySpecialty: Record<MemberSpecialty, number> = {
      Frontend: 0,
      Backend: 0,
      QA: 0,
      Design: 0,
    };

    activeMembers.forEach(m => {
      bySpecialty[m.specialty]++;
    });

    return {
      totalMembers: activeMembers.length,
      totalCapacity,
      bySpecialty,
    };
  }, [data.members, squadId]);

  const handleSubmit = (formData: any) => {
    if (editingMember) {
      updateMember(editingMember.id, formData);
      toast({
        title: 'Member updated',
        description: 'Team member has been updated successfully.',
      });
    } else {
      addMember({
        ...formData,
        avatar_url: formData.avatar_url || null,
      });
      toast({
        title: 'Member added',
        description: 'New team member has been added successfully.',
      });
    }
    setEditingMember(undefined);
  };

  const handleDeactivate = (member: TeamMember) => {
    setDeactivatingMember(member);
  };

  const confirmDeactivate = () => {
    if (deactivatingMember) {
      updateMember(deactivatingMember.id, { status: 'Inactive' });
      toast({
        title: 'Member deactivated',
        description: `${deactivatingMember.name} has been deactivated.`,
      });
      setDeactivatingMember(null);
    }
  };

  if (!squad) {
    return (
      <Layout>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Squad not found</h1>
          <Link to="/squads" className="text-primary hover:underline">
            Back to Squads
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/squads" className="hover:text-foreground">Squads</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{squad.name}</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Members</span>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{squad.name} - Members</h1>
            <p className="mt-2 text-muted-foreground">Manage team members and their capacity</p>
          </div>
          <Button onClick={() => { setEditingMember(undefined); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCapacity} pts</div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">By Specialty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {Object.entries(stats.bySpecialty).map(([spec, count]) => (
                  <div key={spec} className="flex items-center gap-2">
                    <Badge variant="outline" className={SPECIALTY_COLORS[spec as MemberSpecialty]}>
                      {spec}
                    </Badge>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive-members"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive-members">Show inactive</Label>
          </div>

          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              <SelectItem value="Frontend">Frontend</SelectItem>
              <SelectItem value="Backend">Backend</SelectItem>
              <SelectItem value="QA">QA</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredMembers.length > 0 ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                          {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={SPECIALTY_COLORS[member.specialty]}>
                        {member.specialty}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{member.capacity} pts/sprint</TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingMember(member); setDialogOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {member.status === 'Active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeactivate(member)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No members found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first team member to get started.
              </p>
              <Button className="mt-4" onClick={() => { setEditingMember(undefined); setDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>
          </div>
        )}

        <MemberFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          existingMember={editingMember}
          squads={data.squads}
          users={data.users}
          preselectedSquadId={squadId}
        />

        <AlertDialog open={!!deactivatingMember} onOpenChange={() => setDeactivatingMember(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate Team Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to deactivate {deactivatingMember?.name}? They will no longer be included in capacity calculations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeactivate}>Deactivate</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
