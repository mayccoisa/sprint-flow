import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Sprint, SprintStatus, Squad } from '@/types';
import { toast } from '@/hooks/use-toast';

interface SprintFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (sprint: Omit<Sprint, 'id' | 'created_at'>) => void;
  sprint?: Sprint | null;
  squads: Squad[];
}

export const SprintFormDialog = ({ open, onClose, onSave, sprint, squads }: SprintFormDialogProps) => {
  const { t } = useTranslation();

  const sprintFormSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(1, t('sprintForm.errors.nameRequired')),
          squad_id: z.number({ message: t('sprintForm.errors.squadRequired') }),
          start_date: z.date({ message: t('sprintForm.errors.startRequired') }),
          end_date: z.date({ message: t('sprintForm.errors.endRequired') }),
          status: z.enum(['Planning', 'Active', 'Completed', 'Cancelled'] as const),
        })
        .refine((data) => data.end_date > data.start_date, {
          message: t('sprintForm.errors.endAfterStart'),
          path: ['end_date'],
        }),
    [t]
  );

  type SprintFormValues = z.infer<typeof sprintFormSchema>;

  const form = useForm<SprintFormValues>({
    resolver: zodResolver(sprintFormSchema),
    mode: 'onBlur',
    defaultValues: sprint
      ? {
          name: sprint.name,
          squad_id: sprint.squad_id,
          start_date: new Date(sprint.start_date),
          end_date: new Date(sprint.end_date),
          status: sprint.status,
        }
      : {
          status: 'Planning',
        },
  });

  const { errors, isSubmitting, isValid } = form.formState;

  const onSubmit = (data: SprintFormValues) => {
    onSave({
      name: data.name,
      squad_id: data.squad_id,
      start_date: data.start_date.toISOString(),
      end_date: data.end_date.toISOString(),
      status: data.status,
    });
    form.reset();
    onClose();
  };

  const activeSquads = squads.filter((s) => s.status === 'Active');
  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');
  const squadId = form.watch('squad_id');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{sprint ? t('sprintForm.editTitle') : t('sprintForm.createTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit, (errs) => {
          const first = Object.values(errs)[0] as { message?: string } | undefined;
          toast({
            title: t('validation.required'),
            description: first?.message || 'Verifique os campos obrigatórios.',
            variant: 'destructive',
          });
        })} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" required>
              {t('sprintForm.name')}
            </Label>
            <Input
              id="name"
              autoFocus
              placeholder={t('sprintForm.namePlaceholder')}
              error={!!errors.name}
              {...form.register('name')}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="squad_id" required>
              {t('sprintForm.squad')}
            </Label>
            <Select
              value={squadId?.toString()}
              onValueChange={(value) => form.setValue('squad_id', parseInt(value), { shouldValidate: true })}
            >
              <SelectTrigger
                aria-invalid={errors.squad_id ? true : undefined}
                className={cn(errors.squad_id && 'border-destructive focus:ring-destructive')}
              >
                <SelectValue placeholder={t('sprintForm.squadPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {activeSquads.map((squad) => (
                  <SelectItem key={squad.id} value={squad.id.toString()}>
                    {squad.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.squad_id && <p className="text-sm text-destructive">{errors.squad_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label required>{t('sprintForm.startDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    aria-invalid={errors.start_date ? true : undefined}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground',
                      errors.start_date && 'border-destructive'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy') : t('sprintForm.datePlaceholder')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && form.setValue('start_date', date, { shouldValidate: true })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label required>{t('sprintForm.endDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    aria-invalid={errors.end_date ? true : undefined}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground',
                      errors.end_date && 'border-destructive'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy') : t('sprintForm.datePlaceholder')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && form.setValue('end_date', date, { shouldValidate: true })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {errors.end_date && <p className="text-sm text-destructive">{errors.end_date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t('sprintForm.status')}</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(value: SprintStatus) => form.setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('sprintForm.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || (form.formState.isSubmitted && !isValid)}>
              {sprint ? t('sprintForm.save') : t('sprintForm.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
