import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TeamMember, MemberSpecialty, Squad } from '@/types';

const memberSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  squad_id: z.number().min(1, 'Squad is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  specialty: z.enum(['Frontend', 'Backend', 'QA', 'Design']),
  avatar_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive']),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MemberFormData) => void;
  existingMember?: TeamMember;
  squads: Squad[];
  preselectedSquadId?: number;
}

const CAPACITY_SUGGESTIONS = [5, 8, 13, 21];

const SPECIALTY_COLORS: Record<MemberSpecialty, string> = {
  Frontend: 'text-specialty-frontend',
  Backend: 'text-specialty-backend',
  QA: 'text-specialty-qa',
  Design: 'text-specialty-design',
};

export const MemberFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  existingMember,
  squads,
  preselectedSquadId,
}: MemberFormDialogProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: '',
      squad_id: preselectedSquadId || 0,
      capacity: 13,
      specialty: 'Frontend',
      avatar_url: '',
      status: 'Active',
    },
  });

  useEffect(() => {
    if (existingMember) {
      reset({
        name: existingMember.name,
        squad_id: existingMember.squad_id,
        capacity: existingMember.capacity,
        specialty: existingMember.specialty,
        avatar_url: existingMember.avatar_url || '',
        status: existingMember.status,
      });
    } else {
      reset({
        name: '',
        squad_id: preselectedSquadId || (squads.length > 0 ? squads[0].id : 0),
        capacity: 13,
        specialty: 'Frontend',
        avatar_url: '',
        status: 'Active',
      });
    }
  }, [existingMember, preselectedSquadId, squads, reset, open]);

  const handleFormSubmit = (data: MemberFormData) => {
    onSubmit({
      ...data,
      name: data.name.trim(),
      avatar_url: data.avatar_url?.trim() || '',
    });
    onOpenChange(false);
  };

  const isActive = watch('status') === 'Active';
  const currentCapacity = watch('capacity');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {existingMember ? 'Edit Team Member' : 'Add Team Member'}
            </DialogTitle>
            <DialogDescription>
              {existingMember
                ? 'Update team member information.'
                : 'Add a new member to your team.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., John Doe"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="squad">Squad</Label>
              <Select
                value={watch('squad_id')?.toString()}
                onValueChange={(value) => setValue('squad_id', parseInt(value))}
              >
                <SelectTrigger id="squad">
                  <SelectValue placeholder="Select a squad" />
                </SelectTrigger>
                <SelectContent>
                  {squads.filter(s => s.status === 'Active').map((squad) => (
                    <SelectItem key={squad.id} value={squad.id.toString()}>
                      {squad.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.squad_id && (
                <p className="text-sm text-destructive">{errors.squad_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Select
                value={watch('specialty')}
                onValueChange={(value: MemberSpecialty) => setValue('specialty', value)}
              >
                <SelectTrigger id="specialty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['Frontend', 'Backend', 'QA', 'Design'] as const).map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      <span className={SPECIALTY_COLORS[spec]}>{spec}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialty && (
                <p className="text-sm text-destructive">{errors.specialty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (points per sprint)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                {...register('capacity', { valueAsNumber: true })}
              />
              <div className="flex gap-2">
                {CAPACITY_SUGGESTIONS.map((cap) => (
                  <Button
                    key={cap}
                    type="button"
                    variant={currentCapacity === cap ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setValue('capacity', cap)}
                  >
                    {cap}
                  </Button>
                ))}
              </div>
              {errors.capacity && (
                <p className="text-sm text-destructive">{errors.capacity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL (optional)</Label>
              <Input
                id="avatar"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                {...register('avatar_url')}
              />
              {errors.avatar_url && (
                <p className="text-sm text-destructive">{errors.avatar_url.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="status">Active</Label>
              <Switch
                id="status"
                checked={isActive}
                onCheckedChange={(checked) =>
                  setValue('status', checked ? 'Active' : 'Inactive')
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {existingMember ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
