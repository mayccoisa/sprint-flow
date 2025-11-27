import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Release, Squad, VersionStatus } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const releaseSchema = z.object({
  version_name: z.string().min(1, 'Nome da versão é obrigatório'),
  release_date: z.date({ message: 'Data de lançamento é obrigatória' }),
  squad_id: z.number().nullable(),
  status: z.enum(['Planned', 'InProgress', 'Released', 'Cancelled'] as const),
  description: z.string().max(200, 'Máximo 200 caracteres').nullable(),
  release_notes: z.string().max(1000, 'Máximo 1000 caracteres').nullable(),
  color: z.string().nullable(),
});

type ReleaseFormValues = z.infer<typeof releaseSchema>;

interface ReleaseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (release: Omit<Release, 'id' | 'created_at'>) => void;
  release?: Release;
  squads: Squad[];
}

const colorPresets = [
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Laranja', value: '#f59e0b' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Roxo', value: '#8b5cf6' },
];

export function ReleaseFormDialog({
  open,
  onClose,
  onSave,
  release,
  squads,
}: ReleaseFormDialogProps) {
  const form = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseSchema),
    defaultValues: {
      version_name: '',
      release_date: new Date(),
      squad_id: null,
      status: 'Planned',
      description: null,
      release_notes: null,
      color: '#6366f1',
    },
  });

  useEffect(() => {
    if (release) {
      form.reset({
        version_name: release.version_name,
        release_date: new Date(release.release_date),
        squad_id: release.squad_id,
        status: release.status as VersionStatus,
        description: release.description,
        release_notes: release.release_notes,
        color: release.color,
      });
    } else {
      form.reset({
        version_name: '',
        release_date: new Date(),
        squad_id: null,
        status: 'Planned',
        description: null,
        release_notes: null,
        color: '#6366f1',
      });
    }
  }, [release, form, open]);

  const onSubmit = (data: ReleaseFormValues) => {
    onSave({
      ...data,
      release_date: format(data.release_date, 'yyyy-MM-dd'),
    } as Omit<Release, 'id' | 'created_at'>);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {release ? 'Editar Release' : 'Nova Release'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="version_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Versão*</FormLabel>
                  <FormControl>
                    <Input placeholder="v1.0.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="release_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Lançamento*</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy')
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="squad_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Squad</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                    value={field.value?.toString() || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um squad (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {squads.map((squad) => (
                        <SelectItem key={squad.id} value={squad.id.toString()}>
                          {squad.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Planned">Planejada</SelectItem>
                      <SelectItem value="InProgress">Em Progresso</SelectItem>
                      <SelectItem value="Released">Lançada</SelectItem>
                      <SelectItem value="Cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição da release..."
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="release_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Release Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Changelog, notas da versão..."
                      className="resize-none h-24"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <div className="flex gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          field.value === preset.value
                            ? 'border-primary scale-110'
                            : 'border-transparent'
                        )}
                        style={{ backgroundColor: preset.value }}
                        onClick={() => field.onChange(preset.value)}
                        title={preset.name}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
