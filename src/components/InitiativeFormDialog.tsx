import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Task, PrioritizationModel } from '@/types';
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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { GeneratePRDDialog } from './ai/GeneratePRDDialog';
import { PRDSection } from '@/services/aiService';
import { toast } from '@/hooks/use-toast';

interface InitiativeFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: Partial<Task>) => void;
    task?: Task | null;
}

type ScaleOption = { value: number; label: string; hint: string };

const IMPACT_SCALE: ScaleOption[] = [
    { value: 1, label: 'Mínimo', hint: 'Quase imperceptível para o usuário' },
    { value: 3, label: 'Baixo', hint: 'Melhoria pontual, poucos usuários afetados' },
    { value: 5, label: 'Médio', hint: 'Melhoria notável para parte da base' },
    { value: 7, label: 'Alto', hint: 'Ganho relevante para a maioria dos usuários' },
    { value: 9, label: 'Muito alto', hint: 'Mudança significativa de comportamento/uso' },
    { value: 10, label: 'Massivo', hint: 'Transforma o produto ou métrica-chave' },
];

const CONFIDENCE_SCALE: ScaleOption[] = [
    { value: 1, label: 'Especulativo (~10%)', hint: 'Suposição, sem dados' },
    { value: 3, label: 'Baixa (~30%)', hint: 'Indícios anedóticos' },
    { value: 5, label: 'Moderada (~50%)', hint: 'Algumas evidências qualitativas' },
    { value: 7, label: 'Alta (~70%)', hint: 'Pesquisa ou dados parciais sustentam' },
    { value: 9, label: 'Muito alta (~90%)', hint: 'Dados quantitativos sólidos' },
    { value: 10, label: 'Certa (100%)', hint: 'Validado por experimento ou cliente pagante' },
];

const EASE_SCALE: ScaleOption[] = [
    { value: 1, label: 'Muito difícil', hint: 'Reescrita ou pesquisa profunda' },
    { value: 3, label: 'Difícil', hint: 'Várias semanas, múltiplas áreas' },
    { value: 5, label: 'Médio', hint: 'Esforço típico de uma sprint' },
    { value: 7, label: 'Fácil', hint: 'Poucos dias, escopo claro' },
    { value: 9, label: 'Muito fácil', hint: 'Mudança pequena e isolada' },
    { value: 10, label: 'Trivial', hint: 'Configuração ou ajuste menor' },
];

const EFFORT_SCALE: ScaleOption[] = [
    { value: 1, label: 'Trivial', hint: 'Horas de trabalho' },
    { value: 2, label: 'Muito pequeno', hint: '1-2 dias' },
    { value: 3, label: 'Pequeno', hint: 'Menos de 1 semana' },
    { value: 5, label: 'Médio', hint: '1-2 semanas (1 sprint)' },
    { value: 7, label: 'Grande', hint: '~1 mês' },
    { value: 9, label: 'Muito grande', hint: '1-2 meses, múltiplos times' },
    { value: 10, label: 'Épico', hint: 'Trimestre ou mais' },
];

const BUSINESS_VALUE_SCALE: ScaleOption[] = [
    { value: 1, label: 'Mínimo', hint: 'Sem impacto direto em receita ou estratégia' },
    { value: 3, label: 'Baixo', hint: 'Ganho operacional pequeno' },
    { value: 5, label: 'Médio', hint: 'Apoia objetivo tático do trimestre' },
    { value: 7, label: 'Alto', hint: 'Liga-se a OKR ou meta de receita' },
    { value: 9, label: 'Muito alto', hint: 'Move métrica-chave do negócio' },
    { value: 10, label: 'Crítico', hint: 'Estratégico, bloqueia outras iniciativas' },
];

const ScaleSelect = ({
    value,
    onChange,
    options,
}: {
    value: number | undefined;
    onChange: (v: number) => void;
    options: ScaleOption[];
}) => (
    <Select
        value={value ? String(value) : undefined}
        onValueChange={(v) => onChange(parseInt(v))}
    >
        <FormControl>
            <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
        </FormControl>
        <SelectContent>
            {options.map(opt => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                    <div className="flex flex-col items-start">
                        <span className="font-medium">{opt.value} — {opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.hint}</span>
                    </div>
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
);

export const InitiativeFormDialog = ({ open, onClose, onSave, task }: InitiativeFormDialogProps) => {
    const { t } = useTranslation();
    const { data: localData } = useLocalData();
    const [isAIOpen, setIsAIOpen] = useState(false);

    const initiativeSchema = useMemo(() => z.object({
        title: z.string().min(1, t('validation.required')),
        description: z.string().optional(),
        product_objective: z.string().optional(),
        business_goal: z.string().optional(),
        user_impact: z.string().optional(),
        task_type: z.enum(['Feature', 'Bug', 'TechDebt', 'Spike', 'Improvement', 'Deployment'] as const),
        priority: z.enum(['High', 'Medium', 'Low'] as const),
        has_prototype: z.boolean(),
        prototype_link: z.string().optional(),
        feature_id: z.string().optional(),
        prioritization_model: z.enum(['ICE', 'RICE', 'BRICE'] as const).optional(),
        ice_impact: z.number().min(0).max(10).optional(),
        ice_confidence: z.number().min(0).max(10).optional(),
        ice_ease: z.number().min(0).max(10).optional(),
        rice_reach: z.number().min(0).optional(),
        rice_impact: z.number().min(0).max(10).optional(),
        rice_confidence: z.number().min(0).max(10).optional(),
        rice_effort: z.number().min(0).optional(),
        brice_business_value: z.number().min(0).optional(),
        brice_reach: z.number().min(0).optional(),
        brice_impact: z.number().min(0).max(10).optional(),
        brice_confidence: z.number().min(0).max(10).optional(),
        brice_effort: z.number().min(0).optional(),
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
            prioritization_model: 'ICE',
            ice_impact: 0,
            ice_confidence: 0,
            ice_ease: 0,
            rice_reach: 0,
            rice_impact: 0,
            rice_confidence: 0,
            rice_effort: 0,
            brice_business_value: 0,
            brice_reach: 0,
            brice_impact: 0,
            brice_confidence: 0,
            brice_effort: 0,
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
                prioritization_model: task.prioritization_model || 'ICE',
                ice_impact: task.ice_impact ?? 0,
                ice_confidence: task.ice_confidence ?? 0,
                ice_ease: task.ice_ease ?? 0,
                rice_reach: task.rice_reach ?? 0,
                rice_impact: task.rice_impact ?? 0,
                rice_confidence: task.rice_confidence ?? 0,
                rice_effort: task.rice_effort ?? 0,
                brice_business_value: task.brice_business_value ?? 0,
                brice_reach: task.brice_reach ?? 0,
                brice_impact: task.brice_impact ?? 0,
                brice_confidence: task.brice_confidence ?? 0,
                brice_effort: task.brice_effort ?? 0,
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
                prioritization_model: 'ICE',
                ice_impact: 0,
                ice_confidence: 0,
                ice_ease: 0,
                rice_reach: 0,
                rice_impact: 0,
                rice_confidence: 0,
                rice_effort: 0,
                brice_business_value: 0,
                brice_reach: 0,
                brice_impact: 0,
                brice_confidence: 0,
                brice_effort: 0,
            });
        }
    }, [task, form, open]);

    const onSubmit = (data: InitiativeFormValues) => {
        onSave({
            ...data,
            description: data.description || null,
            product_objective: data.product_objective || null,
            business_goal: data.business_goal || null,
            user_impact: data.user_impact || null,
            prototype_link: data.prototype_link || null,
            // Default engineering values
            estimate_frontend: task?.estimate_frontend ?? null,
            estimate_backend: task?.estimate_backend ?? null,
            estimate_qa: task?.estimate_qa ?? null,
            estimate_design: task?.estimate_design ?? null,
            status: task?.status || 'Discovery', // Default to Discovery for new initiatives
            order_index: task?.order_index ?? 0,
            feature_id: data.feature_id ? parseInt(data.feature_id) : null,
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
                    <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                        const firstError = Object.values(errors)[0] as { message?: string } | undefined;
                        toast({
                            title: t('validation.required'),
                            description: firstError?.message || 'Verifique os campos obrigatórios.',
                            variant: 'destructive',
                        });
                    })} className="space-y-6">

                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="general">{t('initiativeForm.tabs.general')}</TabsTrigger>
                                <TabsTrigger value="details">{t('initiativeForm.tabs.details')}</TabsTrigger>
                                <TabsTrigger value="prioritization">{t('prioritization.title')}</TabsTrigger>
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
                                                                    <SelectItem value="Improvement">Melhoria</SelectItem>
                                                                    <SelectItem value="Bug">Bug</SelectItem>
                                                                    <SelectItem value="Deployment">Implantação</SelectItem>
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
                                    <div className="space-y-5">
                                        <FormField
                                            control={form.control}
                                            name="user_impact"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('initiativeForm.fields.userImpact')}</FormLabel>
                                                    <FormControl>
                                                        <Textarea {...field} placeholder={t('initiativeForm.placeholders.userImpact')} rows={2} />
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

                                        {/* Product Context */}
                                        <div className="space-y-3 border-t pt-4">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{t('initiativeForm.productContext')}</h3>
                                            <FormField
                                                control={form.control}
                                                name="feature_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('initiativeForm.fields.feature')}</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger><SelectValue placeholder={t('initiativeForm.placeholders.selectFeature')} /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                {localData.productModules.map(module => {
                                                                    const features = localData.productFeatures.filter(f => f.module_id === module.id);
                                                                    if (features.length === 0) return null;
                                                                    return (
                                                                        <SelectGroup key={module.id}>
                                                                            <SelectLabel>{module.name}</SelectLabel>
                                                                            {features.map(feature => (
                                                                                <SelectItem key={feature.id} value={String(feature.id)} className="pl-6">
                                                                                    {feature.name}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectGroup>
                                                                    );
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Discovery Status */}
                                        <div className="space-y-3 border-t pt-4">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{t('initiativeForm.sections.discovery')}</h3>

                                            <FormField
                                                control={form.control}
                                                name="has_prototype"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border px-3 py-2">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="!m-0 cursor-pointer">
                                                            {t('initiativeForm.fields.hasPrototype')}
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />

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

                            {/* TAB 3: PRIORITIZATION */}
                            <TabsContent value="prioritization" className="space-y-4 pt-4">
                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="prioritization_model"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('prioritization.model')}</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="ICE">ICE</SelectItem>
                                                            <SelectItem value="RICE">RICE</SelectItem>
                                                            <SelectItem value="BRICE">BRICE</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {form.watch('prioritization_model') === 'ICE' && (
                                            <div className="grid grid-cols-3 gap-4 border p-4 rounded-lg bg-slate-50/50">
                                                <FormField
                                                    control={form.control}
                                                    name="ice_impact"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('prioritization.metrics.impact')}</FormLabel>
                                                            <ScaleSelect value={field.value} onChange={field.onChange} options={IMPACT_SCALE} />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="ice_confidence"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('prioritization.metrics.confidence')}</FormLabel>
                                                            <ScaleSelect value={field.value} onChange={field.onChange} options={CONFIDENCE_SCALE} />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="ice_ease"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('prioritization.metrics.ease')}</FormLabel>
                                                            <ScaleSelect value={field.value} onChange={field.onChange} options={EASE_SCALE} />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}

                                        {form.watch('prioritization_model') === 'RICE' && (
                                            <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50/50">
                                                <FormField
                                                    control={form.control}
                                                    name="rice_reach"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('prioritization.metrics.reach')}</FormLabel>
                                                            <FormControl><Input type="number" min={0} placeholder="Nº de usuários/clientes por trimestre" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                                                            <FormDescription>Quantas pessoas serão impactadas no período (ex: por trimestre).</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="rice_impact"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('prioritization.metrics.impact')}</FormLabel>
                                                            <ScaleSelect value={field.value} onChange={field.onChange} options={IMPACT_SCALE} />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="rice_confidence"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('prioritization.metrics.confidence')}</FormLabel>
                                                            <ScaleSelect value={field.value} onChange={field.onChange} options={CONFIDENCE_SCALE} />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="rice_effort"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('prioritization.metrics.effort')}</FormLabel>
                                                            <ScaleSelect value={field.value} onChange={field.onChange} options={EFFORT_SCALE} />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}

                                        {form.watch('prioritization_model') === 'BRICE' && (
                                            <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50/50">
                                                <FormField
                                                    control={form.control}
                                                    name="brice_business_value"
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-2">
                                                            <FormLabel>{t('prioritization.metrics.businessValue')}</FormLabel>
                                                            <ScaleSelect value={field.value} onChange={field.onChange} options={BUSINESS_VALUE_SCALE} />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="brice_reach"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('prioritization.metrics.reach')}</FormLabel>
                                                            <FormControl><Input type="number" min={0} placeholder="Nº de usuários/clientes por trimestre" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                                                            <FormDescription>Quantas pessoas serão impactadas no período.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="brice_impact"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('prioritization.metrics.impact')}</FormLabel>
                                                            <ScaleSelect value={field.value} onChange={field.onChange} options={IMPACT_SCALE} />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="brice_confidence"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('prioritization.metrics.confidence')}</FormLabel>
                                                            <ScaleSelect value={field.value} onChange={field.onChange} options={CONFIDENCE_SCALE} />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="brice_effort"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('prioritization.metrics.effort')}</FormLabel>
                                                            <ScaleSelect value={field.value} onChange={field.onChange} options={EFFORT_SCALE} />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
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
