import { useState, useMemo } from 'react';
import { Plus, Edit, UserX, Search } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MemberFormDialog } from '@/components/MemberFormDialog';
import { useLocalData } from '@/hooks/useLocalData';
import { toast } from '@/hooks/use-toast';
import type { TeamMember, MemberSpecialty } from '@/types';
import { useTranslation } from 'react-i18next';

const SPECIALTY_COLORS: Record<MemberSpecialty, string> = {
  Frontend: 'bg-specialty-frontend/10 text-specialty-frontend border-specialty-frontend/20',
  Backend: 'bg-specialty-backend/10 text-specialty-backend border-specialty-backend/20',
  QA: 'bg-specialty-qa/10 text-specialty-qa border-specialty-qa/20',
  Design: 'bg-specialty-design/10 text-specialty-design border-specialty-design/20',
};

type SortField = 'name' | 'capacity';
type SortOrder = 'asc' | 'desc';

export default function Team() {
  const { t } = useTranslation();
  const { data, addMember, updateMember } = useLocalData();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>();
  const [showInactive, setShowInactive] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [squadFilter, setSquadFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [deactivatingMember, setDeactivatingMember] = useState<TeamMember | null>(null);

  const filteredMembers = useMemo(() => {
    let members = [...data.members];
    
    if (!showInactive) {
      members = members.filter(m => m.status === 'Active');
    }
    
    if (specialtyFilter !== 'all') {
      members = members.filter(m => m.specialty === specialtyFilter);
    }
    
    if (squadFilter !== 'all') {
      members = members.filter(m => m.squad_id === parseInt(squadFilter));
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      members = members.filter(m => m.name.toLowerCase().includes(query));
    }
    
    members.sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortOrder === 'asc'
          ? a.capacity - b.capacity
          : b.capacity - a.capacity;
      }
    });
    
    return members;
  }, [data.members, showInactive, specialtyFilter, squadFilter, searchQuery, sortField, sortOrder]);

  const stats = useMemo(() => {
    const activeMembers = data.members.filter(m => m.status === 'Active');
    const totalCapacity = activeMembers.reduce((sum, m) => sum + m.capacity, 0);
    
    const bySpecialty: Record<MemberSpecialty, number> = {
      Frontend: 0,
      Backend: 0,
      QA: 0,
      Design: 0,
    };
    
    const bySquad: Record<number, number> = {};
    
    activeMembers.forEach(m => {
      bySpecialty[m.specialty]++;
      bySquad[m.squad_id] = (bySquad[m.squad_id] || 0) + 1;
    });
    
    return {
      totalMembers: activeMembers.length,
      totalCapacity,
      bySpecialty,
      bySquad,
    };
  }, [data.members]);

  const handleSubmit = (formData: any) => {
    if (editingMember) {
      updateMember(editingMember.id, formData);
      toast({ title: t('common.updated') });
    } else {
      addMember({
        ...formData,
        avatar_url: formData.avatar_url || null,
      });
      toast({ title: t('common.created') });
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
        title: t('pages.squadMembers.memberDeactivated'),
        description: t('pages.squadMembers.memberDeactivatedDesc', { name: deactivatingMember.name }),
      });
      setDeactivatingMember(null);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSquadName = (squadId: number) => {
    return data.squads.find(s => s.id === squadId)?.name || t('pages.team.unknownSquad');
  };

  return (
    <Layout>
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('pages.team.title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('pages.team.subtitle')}</p>
          </div>
          <Button onClick={() => { setEditingMember(undefined); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            {t('pages.team.addMember')}
          </Button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('pages.team.statTotalMembers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('pages.team.statTotalCapacity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCapacity} pts</div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('pages.team.statDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
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
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('pages.team.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={squadFilter} onValueChange={setSquadFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pages.team.allSquads')}</SelectItem>
              {data.squads.filter(s => s.status === 'Active').map((squad) => (
                <SelectItem key={squad.id} value={squad.id.toString()}>
                  {squad.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pages.team.allSpecialties')}</SelectItem>
              <SelectItem value="Frontend">Frontend</SelectItem>
              <SelectItem value="Backend">Backend</SelectItem>
              <SelectItem value="QA">QA</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive-all"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive-all">{t('pages.team.showInactive')}</Label>
          </div>
        </div>

        {filteredMembers.length > 0 ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleSort('name')}
                  >
                    {t('pages.team.tableMember')} {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>{t('pages.team.tableSquad')}</TableHead>
                  <TableHead>{t('pages.team.tableSpecialty')}</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleSort('capacity')}
                  >
                    {t('pages.team.tableCapacity')} {sortField === 'capacity' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>{t('pages.team.tableStatus')}</TableHead>
                  <TableHead className="text-right">{t('pages.team.tableActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow 
                    key={member.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => { setEditingMember(member); setDialogOpen(true); }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                          {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getSquadName(member.squad_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={SPECIALTY_COLORS[member.specialty]}>
                        {member.specialty}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{member.capacity} pts</TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
              <h3 className="text-lg font-semibold">{t('pages.squadMembers.emptyTitle')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('pages.squadMembers.emptyDesc')}
              </p>
              {!searchQuery && specialtyFilter === 'all' && squadFilter === 'all' && (
                <Button className="mt-4" onClick={() => { setEditingMember(undefined); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('pages.team.addMember')}
                </Button>
              )}
            </div>
          </div>
        )}

        <MemberFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          existingMember={editingMember}
          squads={data.squads}
        />

        <AlertDialog open={!!deactivatingMember} onOpenChange={() => setDeactivatingMember(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('pages.squadMembers.deactivateTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('pages.squadMembers.deactivateDesc', { name: deactivatingMember?.name || '' })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeactivate}>{t('pages.squadMembers.deactivate')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
