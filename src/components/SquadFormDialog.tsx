import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Squad } from '@/types';

const squadSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  status: z.enum(['Active', 'Inactive']),
});

type SquadFormData = z.infer<typeof squadSchema>;

interface SquadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SquadFormData) => void;
  existingSquad?: Squad;
  existingNames: string[];
}

export const SquadFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  existingSquad,
  existingNames,
}: SquadFormDialogProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SquadFormData>({
    resolver: zodResolver(squadSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'Active',
    },
  });

  useEffect(() => {
    if (existingSquad) {
      reset({
        name: existingSquad.name,
        description: existingSquad.description || '',
        status: existingSquad.status,
      });
    } else {
      reset({
        name: '',
        description: '',
        status: 'Active',
      });
    }
  }, [existingSquad, reset, open]);

  const handleFormSubmit = (data: SquadFormData) => {
    const trimmedName = data.name.trim();
    const isDuplicate = existingNames.some(
      name => name.toLowerCase() === trimmedName.toLowerCase() && 
      (!existingSquad || name !== existingSquad.name)
    );

    if (isDuplicate) {
      alert('A squad with this name already exists');
      return;
    }

    onSubmit({
      ...data,
      name: trimmedName,
      description: data.description?.trim() || '',
    });
    onOpenChange(false);
  };

  const isActive = watch('status') === 'Active';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {existingSquad ? 'Edit Squad' : 'Create New Squad'}
            </DialogTitle>
            <DialogDescription>
              {existingSquad
                ? 'Update your squad information.'
                : 'Add a new development team to your organization.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Squad Name</Label>
              <Input
                id="name"
                placeholder="e.g., Growth Team"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this squad focus on?"
                rows={3}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
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
              {existingSquad ? 'Save Changes' : 'Create Squad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
