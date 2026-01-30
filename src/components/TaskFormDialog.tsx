import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Task } from '@/types';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Task, 'id' | 'created_at'>) => void;
  task?: Task | null;
}

export const TaskFormDialog = ({ open, onClose, onSave, task }: TaskFormDialogProps) => {
  const { t } = useTranslation();

  const taskSchema = useMemo(() => z.object({
    title: z.string().min(1, t('validation.required')),
    description: z.string().max(500, t('validation.maxLength', { max: 500 })).optional(),
    task_type: z.enum(['Feature', 'Bug', 'TechDebt', 'Spike'] as const),
    priority: z.enum(['High', 'Medium', 'Low'] as const),
    estimate_frontend: z.number().nullable(),
    estimate_backend: z.number().nullable(),
    estimate_qa: z.number().nullable(),
    estimate_design: z.number().nullable(),
    start_date: z.date().nullable(),
    end_date: z.date().nullable(),
  }).refine(
    (data) => {
      const hasEstimate =
        data.estimate_frontend ||
        data.estimate_backend ||
        data.estimate_qa ||
        data.estimate_design;
      return hasEstimate;
    },
    { message: t('validation.atLeastOneEstimate'), path: ['estimate_frontend'] }
  ), [t]);

  type TaskFormValues = z.infer<typeof taskSchema>;

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
      start_date: null,
      end_date: null,
    },
  });

  const fibonacciOptions = [
    { value: 'null', label: '-' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '5', label: '5' },
    { value: '8', label: '8' },
    { value: '13', label: '13' },
    { value: '21', label: '21' },
  ];

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
        start_date: task.start_date ? new Date(task.start_date) : null,
        end_date: task.end_date ? new Date(task.end_date) : null,
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
        start_date: null,
        end_date: null,
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
      start_date: data.start_date ? format(data.start_date, 'yyyy-MM-dd') : null,
      end_date: data.end_date ? format(data.end_date, 'yyyy-MM-dd') : null,
      product_objective: task?.product_objective || null,
      business_goal: task?.business_goal || null,
      user_impact: task?.user_impact || null,
      has_prototype: task?.has_prototype || false,
      prototype_link: task?.prototype_link || null,
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
          <DialogTitle>{task ? t('taskForm.editTitle') : t('taskForm.newTitle')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção .5: Contexto do Produto (Read-Only) */}
            {(task?.product_objective || task?.business_goal || task?.user_impact) && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-3 border border-border/50">
                <h3 className="font-semibold text-base text-primary flex items-center gap-2">
                  <span className="bg-primary/10 p-1 rounded-full text-primary text-xs">{t('taskForm.productContext.title')}</span>
                </h3>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  {task.product_objective && (
                    <div>
                      <span className="font-semibold text-muted-foreground">{t('taskForm.productContext.objective')}: </span>
                      <span className="text-foreground">{task.product_objective}</span>
                    </div>
                  )}
                  {task.business_goal && (
                    <div>
                      <span className="font-semibold text-muted-foreground">{t('taskForm.productContext.businessGoal')}: </span>
                      <span className="text-foreground">{task.business_goal}</span>
                    </div>
                  )}
                  {task.user_impact && (
                    <div>
                      <span className="font-semibold text-muted-foreground">{t('taskForm.productContext.userImpact')}: </span>
                      <span className="text-foreground">{task.user_impact}</span>
                    </div>
                  )}
                  {task.prototype_link && (
                    <div>
                      <span className="font-semibold text-muted-foreground">{t('taskForm.productContext.prototype')}: </span>
                      <a href={task.prototype_link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                        {t('taskForm.productContext.viewPrototype')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Seção 1: Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t('taskForm.sections.basicInfo')}</h3>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('taskForm.fields.title')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('taskForm.placeholders.title')} />
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
                    <FormLabel>{t('taskForm.fields.description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('taskForm.placeholders.description')}
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
                      <FormLabel>{t('taskForm.fields.type')}</FormLabel>
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
                      <FormLabel>{t('taskForm.fields.priority')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seção 2: Datas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t('taskForm.sections.dates')}</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('taskForm.fields.startDate')}</FormLabel>
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
                                <span>{t('taskForm.placeholders.selectDate')}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
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
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('taskForm.fields.endDate')}</FormLabel>
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
                                <span>{t('taskForm.placeholders.selectDate')}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
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
              </div>
            </div>

            {/* Seção 3: Estimativas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t('taskForm.sections.estimates')}</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimate_frontend"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('taskForm.fields.frontend')}</FormLabel>
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
                      <FormLabel>{t('taskForm.fields.backend')}</FormLabel>
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
                      <FormLabel>{t('taskForm.fields.qa')}</FormLabel>
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
                      <FormLabel>{t('taskForm.fields.design')}</FormLabel>
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
                  {t('taskForm.totalEffort', { points: totalEstimate })}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('common.save')}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
