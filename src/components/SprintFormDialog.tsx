import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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

const sprintFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  squad_id: z.number({ message: 'Squad é obrigatório' }),
  start_date: z.date({ message: 'Data de início é obrigatória' }),
  end_date: z.date({ message: 'Data de fim é obrigatória' }),
  status: z.enum(['Planning', 'Active', 'Completed', 'Cancelled'] as const),
}).refine((data) => data.end_date > data.start_date, {
  message: 'Data de fim deve ser posterior à data de início',
  path: ['end_date'],
});

type SprintFormValues = z.infer<typeof sprintFormSchema>;

interface SprintFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (sprint: Omit<Sprint, 'id' | 'created_at'>) => void;
  sprint?: Sprint | null;
  squads: Squad[];
}

export const SprintFormDialog = ({ open, onClose, onSave, sprint, squads }: SprintFormDialogProps) => {
  const form = useForm<SprintFormValues>({
    resolver: zodResolver(sprintFormSchema),
    defaultValues: sprint ? {
      name: sprint.name,
      squad_id: sprint.squad_id,
      start_date: new Date(sprint.start_date),
      end_date: new Date(sprint.end_date),
      status: sprint.status,
    } : {
      status: 'Planning',
    },
  });

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

  const activeSquads = squads.filter(s => s.status === 'Active');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{sprint ? 'Editar Sprint' : 'Nova Sprint'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Sprint</Label>
            <Input
              id="name"
              placeholder="Sprint 24"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="squad_id">Squad</Label>
            <Select
              value={form.watch('squad_id')?.toString()}
              onValueChange={(value) => form.setValue('squad_id', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um squad" />
              </SelectTrigger>
              <SelectContent>
                {activeSquads.map((squad) => (
                  <SelectItem key={squad.id} value={squad.id.toString()}>
                    {squad.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.squad_id && (
              <p className="text-sm text-destructive">{form.formState.errors.squad_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch('start_date') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('start_date') ? format(form.watch('start_date'), 'dd/MM/yyyy') : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('start_date')}
                    onSelect={(date) => date && form.setValue('start_date', date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.start_date && (
                <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch('end_date') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('end_date') ? format(form.watch('end_date'), 'dd/MM/yyyy') : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('end_date')}
                    onSelect={(date) => date && form.setValue('end_date', date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.end_date && (
                <p className="text-sm text-destructive">{form.formState.errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
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
              Cancelar
            </Button>
            <Button type="submit">
              {sprint ? 'Salvar' : 'Criar Sprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
