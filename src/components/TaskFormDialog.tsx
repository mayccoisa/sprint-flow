import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Task, TaskType, TaskPriority } from '@/types';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  task_type: z.enum(['Feature', 'Bug', 'TechDebt', 'Spike'] as const),
  priority: z.enum(['High', 'Medium', 'Low'] as const),
  estimate_frontend: z.number().nullable(),
  estimate_backend: z.number().nullable(),
  estimate_qa: z.number().nullable(),
  estimate_design: z.number().nullable(),
}).refine(
  (data) => {
    const hasEstimate =
      data.estimate_frontend ||
      data.estimate_backend ||
      data.estimate_qa ||
      data.estimate_design;
    return hasEstimate;
  },
  { message: 'Pelo menos uma estimativa deve ser preenchida', path: ['estimate_frontend'] }
);

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Task, 'id' | 'created_at'>) => void;
  task?: Task | null;
}

const fibonacciOptions = [
  { value: 'null', label: 'Vazio' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '5', label: '5' },
  { value: '8', label: '8' },
  { value: '13', label: '13' },
  { value: '21', label: '21' },
];

export const TaskFormDialog = ({ open, onClose, onSave, task }: TaskFormDialogProps) => {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      task_type: 'Feature',
      priority: 'Medium',
      estimate_frontend: null,
      estimate_backend: null,
      estimate_qa: null,
      estimate_design: null,
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        task_type: task.task_type,
        priority: task.priority,
        estimate_frontend: task.estimate_frontend,
        estimate_backend: task.estimate_backend,
        estimate_qa: task.estimate_qa,
        estimate_design: task.estimate_design,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        task_type: 'Feature',
        priority: 'Medium',
        estimate_frontend: null,
        estimate_backend: null,
        estimate_qa: null,
        estimate_design: null,
      });
    }
  }, [task, form, open]);

  const onSubmit = (data: TaskFormValues) => {
    onSave({
      title: data.title,
      description: data.description || null,
      task_type: data.task_type,
      priority: data.priority,
      estimate_frontend: data.estimate_frontend || null,
      estimate_backend: data.estimate_backend || null,
      estimate_qa: data.estimate_qa || null,
      estimate_design: data.estimate_design || null,
      status: task?.status || 'Backlog',
      order_index: task?.order_index || 0,
    });
    form.reset();
    onClose();
  };

  const watchedEstimates = form.watch([
    'estimate_frontend',
    'estimate_backend',
    'estimate_qa',
    'estimate_design',
  ]);

  const totalEstimate = watchedEstimates.reduce(
    (sum, val) => sum + (val || 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção 1: Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informações Básicas</h3>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Digite o título da tarefa" />
                    </FormControl>
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
                        {...field}
                        placeholder="Digite a descrição (opcional)"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="task_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Feature">Feature</SelectItem>
                          <SelectItem value="Bug">Bug</SelectItem>
                          <SelectItem value="TechDebt">Tech Debt</SelectItem>
                          <SelectItem value="Spike">Spike</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="High">Alta</SelectItem>
                          <SelectItem value="Medium">Média</SelectItem>
                          <SelectItem value="Low">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seção 2: Estimativas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Estimativas por Especialidade</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimate_frontend"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frontend</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === 'null' ? null : parseInt(value))
                        }
                        value={field.value?.toString() || 'null'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fibonacciOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
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
                  name="estimate_backend"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Backend</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === 'null' ? null : parseInt(value))
                        }
                        value={field.value?.toString() || 'null'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fibonacciOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
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
                  name="estimate_qa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>QA</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === 'null' ? null : parseInt(value))
                        }
                        value={field.value?.toString() || 'null'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fibonacciOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
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
                  name="estimate_design"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Design</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === 'null' ? null : parseInt(value))
                        }
                        value={field.value?.toString() || 'null'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fibonacciOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-lg font-semibold">
                  Esforço Total: {totalEstimate} pontos
                </p>
              </div>
            </div>

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
};
