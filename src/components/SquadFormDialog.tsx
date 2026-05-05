import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Squad } from '@/types';

interface SquadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description?: string; status: 'Active' | 'Inactive' }) => void;
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
  const { t } = useTranslation();
  const { toast } = useToast();

  const squadSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t('squadForm.errors.nameRequired'))
          .max(100, t('squadForm.errors.nameMax')),
        description: z.string().max(500, t('squadForm.errors.descMax')).optional(),
        status: z.enum(['Active', 'Inactive']),
      }),
    [t]
  );

  type SquadFormData = z.infer<typeof squadSchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isSubmitted, isValid },
  } = useForm<SquadFormData>({
    resolver: zodResolver(squadSchema),
    mode: 'onBlur',
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
      (name) =>
        name.toLowerCase() === trimmedName.toLowerCase() &&
        (!existingSquad || name !== existingSquad.name)
    );

    if (isDuplicate) {
      toast({
        variant: 'destructive',
        title: t('squadForm.duplicateTitle'),
        description: t('squadForm.duplicateDesc'),
      });
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
        <form onSubmit={handleSubmit(handleFormSubmit, (errs) => {
          const first = Object.values(errs)[0] as { message?: string } | undefined;
          toast({
            variant: 'destructive',
            title: t('validation.required'),
            description: first?.message || 'Verifique os campos obrigatórios.',
          });
        })}>
          <DialogHeader>
            <DialogTitle>
              {existingSquad ? t('squadForm.editTitle') : t('squadForm.createTitle')}
            </DialogTitle>
            <DialogDescription>
              {existingSquad ? t('squadForm.editDesc') : t('squadForm.createDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" required>{t('squadForm.name')}</Label>
              <Input
                id="name"
                autoFocus
                placeholder={t('squadForm.namePlaceholder')}
                error={!!errors.name}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('squadForm.description')}</Label>
              <Textarea
                id="description"
                placeholder={t('squadForm.descriptionPlaceholder')}
                rows={3}
                error={!!errors.description}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="status">{t('squadForm.active')}</Label>
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
              {t('squadForm.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || (isSubmitted && !isValid)}>
              {existingSquad ? t('squadForm.saveChanges') : t('squadForm.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
