import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Task } from '@/types';
import { useLocalData } from '@/hooks/useLocalData';
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
    FormDescription,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { GeneratePRDDialog } from './ai/GeneratePRDDialog';
import { PRDSection } from '@/services/aiService';

interface InitiativeFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: Partial<Task>) => void;
    task?: Task | null;
}

export const InitiativeFormDialog = ({ open, onClose, onSave, task }: InitiativeFormDialogProps) => {
    const { t } = useTranslation();
    const { data: localData } = useLocalData();
    const [isAIOpen, setIsAIOpen] = useState(false);

    const initiativeSchema = useMemo(() => z.object({
        title: z.string().min(1, t('validation.required')),
        description: z.string().optional(),
        product_objective: z.string().min(1, t('validation.required')),
        business_goal: z.string().min(1, t('validation.required')),
        user_impact: z.string().min(1, t('validation.required')),
        task_type: z.enum(['Feature', 'Bug', 'TechDebt', 'Spike'] as const),
        priority: z.enum(['High', 'Medium', 'Low'] as const),
        has_prototype: z.boolean(),
        prototype_link: z.string().optional(),
        feature_id: z.string().min(1, t('validation.required')),
    }), [t]);

    type InitiativeFormValues = z.infer<typeof initiativeSchema>;

    const form = useForm<InitiativeFormValues>({
        resolver: zodResolver(initiativeSchema),
        defaultValues: {
            title: '',
            description: '',
            product_objective: '',
            business_goal: '',
            user_impact: '',
            task_type: 'Feature',
            priority: 'Medium',
            has_prototype: false,
            prototype_link: '',
            feature_id: '',
        },
    });

    useEffect(() => {
        if (task) {
            form.reset({
                title: task.title,
                description: task.description || '',
                product_objective: task.product_objective || '',
                business_goal: task.business_goal || '',
                user_impact: task.user_impact || '',
                task_type: task.task_type,
                priority: task.priority,
                has_prototype: task.has_prototype || false,
                prototype_link: task.prototype_link || '',
                feature_id: task.feature_id ? String(task.feature_id) : '',
            });
        } else {
            form.reset({
                title: '',
                description: '',
                product_objective: '',
                business_goal: '',
                user_impact: '',
                task_type: 'Feature',
                priority: 'Medium',
                has_prototype: false,
                prototype_link: '',
                feature_id: '',
            });
        }
    }, [task, form, open]);

    const onSubmit = (data: InitiativeFormValues) => {
        onSave({
            ...data,
            description: data.description || null,
            prototype_link: data.prototype_link || null,
            // Default engineering values
            estimate_frontend: task?.estimate_frontend || null,
            estimate_backend: task?.estimate_backend || null,
            estimate_qa: task?.estimate_qa || null,
            estimate_design: task?.estimate_design || null,
            status: task?.status || 'Discovery', // Default to Discovery for new initiatives
            order_index: task?.order_index || 0,
            feature_id: parseInt(data.feature_id),
        });
        form.reset();
        onClose();
    };

    const handleAIGenerated = (data: PRDSection) => {
        form.setValue('title', data.title);
        form.setValue('product_objective', data.product_objective);
        form.setValue('business_goal', data.business_goal);
        form.setValue('user_impact', data.user_impact);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader className="flex flex-row justify-between items-center pr-8">
                    <DialogTitle>{task ? t('initiativeForm.editTitle') : t('initiativeForm.newTitle')}</DialogTitle>
                    {!task && (
                        <Button variant="outline" size="sm" onClick={() => setIsAIOpen(true)} className="gap-2 text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100">
                            <Sparkles className="h-4 w-4" />
                            Draft with Agent
                        </Button>
                    )}
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="general">{t('initiativeForm.tabs.general')}</TabsTrigger>
                                <TabsTrigger value="details">{t('initiativeForm.tabs.details')}</TabsTrigger>
                            </TabsList>

                            {/* TAB 1: GENERAL */}
                            <TabsContent value="general" className="space-y-4 pt-4">
                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-4">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-lg">{t('initiativeForm.sections.whatWhy')}</h3>

                                            <FormField
                                                control={form.control}
                                                name="title"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('initiativeForm.fields.title')}</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder={t('initiativeForm.placeholders.title')} />
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
                                                            <FormLabel>{t('initiativeForm.fields.type')}</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                                                            <FormLabel>{t('initiativeForm.fields.priority')}</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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

                                            <FormField
                                                control={form.control}
                                                name="product_objective"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('initiativeForm.fields.objective')}</FormLabel>
                                                        <FormControl>
                                                            <Textarea {...field} placeholder={t('initiativeForm.placeholders.objective')} rows={3} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            {/* TAB 2: DETAILS */}
                            <TabsContent value="details" className="space-y-4 pt-4">
                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="user_impact"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('initiativeForm.fields.userImpact')}</FormLabel>
                                                        <FormControl>
                                                            <Textarea {...field} placeholder={t('initiativeForm.placeholders.userImpact')} rows={3} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="business_goal"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('initiativeForm.fields.businessGoal')}</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder={t('initiativeForm.placeholders.businessGoal')} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Product Context */}
                                        <div className="space-y-4 border-t pt-4">
                                            <h3 className="font-semibold text-lg">{t('initiativeForm.productContext')}</h3>
                                            <FormField
                                                control={form.control}
                                                name="feature_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('initiativeForm.fields.feature')}</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger><SelectValue placeholder={t('initiativeForm.placeholders.selectFeature')} /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                {localData.productModules.map(module => (
                                                                    <div key={module.id}>
                                                                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                                                            {module.name}
                                                                        </div>
                                                                        {localData.productFeatures
                                                                            .filter(f => f.module_id === module.id)
                                                                            .map(feature => (
                                                                                <SelectItem key={feature.id} value={String(feature.id)} className="pl-6">
                                                                                    {feature.name}
                                                                                </SelectItem>
                                                                            ))
                                                                        }
                                                                    </div>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Discovery Status */}
                                        <div className="space-y-4 border-t pt-4">
                                            <h3 className="font-semibold text-lg">{t('initiativeForm.sections.discovery')}</h3>

                                            <div className="flex items-center space-x-2">
                                                <FormField
                                                    control={form.control}
                                                    name="has_prototype"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 w-full">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel>
                                                                    {t('initiativeForm.fields.hasPrototype')}
                                                                </FormLabel>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {form.watch('has_prototype') && (
                                                <FormField
                                                    control={form.control}
                                                    name="prototype_link"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('initiativeForm.fields.prototypeLink')}</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} placeholder={t('initiativeForm.placeholders.prototypeLink')} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-2 border-t pt-4">
                            <Button type="button" variant="outline" onClick={onClose}>
                                {t('initiativeForm.cancel')}
                            </Button>
                            <Button type="submit">{t('initiativeForm.save')}</Button>
                        </div>
                    </form>
                </Form>
                <GeneratePRDDialog
                    open={isAIOpen}
                    onOpenChange={setIsAIOpen}
                    onGenerated={handleAIGenerated}
                />
            </DialogContent>
        </Dialog >
    );
};
