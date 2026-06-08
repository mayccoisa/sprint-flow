import { useEffect, useMemo, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Release, Squad, Sprint, VersionStatus } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const releaseSchema = z.object({
  version_name: z.string().min(1, 'Nome da versão é obrigatório'),
  release_date: z.date({ message: 'Data de lançamento é obrigatória' }),
  squad_id: z.number().nullable().optional(),
  status: z.enum(['Planned', 'InProgress', 'Released', 'Cancelled'] as const),
  description: z.string().max(200, 'Máximo 200 caracteres').nullable().optional(),
  release_notes: z.string().max(1000, 'Máximo 1000 caracteres').nullable().optional(),
  color: z.string().nullable().optional(),
});

type ReleaseFormValues = z.infer<typeof releaseSchema>;

interface ReleaseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (release: Omit<Release, 'id' | 'created_at'>, sprintIds: number[]) => void;
  release?: Release;
  squads: Squad[];
  sprints: Sprint[];
  initialSprintIds?: number[];
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
  sprints,
  initialSprintIds = [],
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

  const [selectedSprintIds, setSelectedSprintIds] = useState<number[]>(initialSprintIds);

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
    setSelectedSprintIds(initialSprintIds);
    // initialSprintIds is intentionally not in deps — only sync when the dialog
    // opens for a different release, to avoid clobbering in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [release, open]);

  const squadId = form.watch('squad_id');

  const availableSprints = useMemo(() => {
    const filtered = squadId ? sprints.filter((s) => s.squad_id === squadId) : sprints;
    return [...filtered].sort(
      (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
  }, [sprints, squadId]);

  const selectedSprints = useMemo(
    () => sprints.filter((s) => selectedSprintIds.includes(s.id)),
    [sprints, selectedSprintIds]
  );

  const toggleSprint = (sprintId: number) => {
    setSelectedSprintIds((prev) =>
      prev.includes(sprintId) ? prev.filter((id) => id !== sprintId) : [...prev, sprintId]
    );
  };

  const onSubmit = (data: ReleaseFormValues) => {
    onSave(
      {
        ...data,
        release_date: format(data.release_date, 'yyyy-MM-dd'),
      } as Omit<Release, 'id' | 'created_at'>,
      selectedSprintIds
    );
    form.reset();
    setSelectedSprintIds([]);
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
          <form onSubmit={form.handleSubmit(onSubmit, (errs) => {
            const first = Object.values(errs)[0] as { message?: string } | undefined;
            toast({
              title: 'Verifique os campos',
              description: first?.message || 'Há campos obrigatórios em falta.',
              variant: 'destructive',
            });
          })} className="space-y-4">
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
                    onValueChange={(value) =>
                      field.onChange(value && value !== 'none' ? parseInt(value) : null)
                    }
                    value={field.value?.toString() || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um squad (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
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

            <FormItem>
              <FormLabel>Sprints vinculadas</FormLabel>
              {selectedSprints.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSprints.map((s) => (
                    <Badge key={s.id} variant="secondary" className="gap-1">
                      {s.name}
                      <button
                        type="button"
                        onClick={() => toggleSprint(s.id)}
                        className="ml-1 rounded-sm hover:bg-muted-foreground/20"
                        aria-label={`Remover ${s.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="max-h-44 overflow-y-auto border rounded-md divide-y">
                {availableSprints.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-3 text-center">
                    {squadId
                      ? 'Nenhuma sprint cadastrada para este squad.'
                      : 'Nenhuma sprint cadastrada.'}
                  </div>
                ) : (
                  availableSprints.map((sprint) => {
                    const checked = selectedSprintIds.includes(sprint.id);
                    return (
                      <label
                        key={sprint.id}
                        className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-accent/40"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleSprint(sprint.id)}
                        />
                        <span className="font-medium truncate flex-1">{sprint.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(sprint.start_date), 'dd MMM', { locale: ptBR })} —{' '}
                          {format(new Date(sprint.end_date), 'dd MMM', { locale: ptBR })}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Selecione as sprints cujo trabalho compõe esta release.
              </p>
            </FormItem>

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
