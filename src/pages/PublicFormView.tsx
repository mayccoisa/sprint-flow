import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalData } from '@/hooks/useLocalData';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import type { CustomForm, FormSubmission } from '@/types';

export default function PublicFormView() {
    const { t } = useTranslation();
    const { slug } = useParams<{ slug: string }>();
    const { data, addFormSubmission, addTask } = useLocalData();
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [form, setForm] = useState<CustomForm | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (slug && data.forms.length > 0) {
            const foundForm = data.forms.find(f => f.slug === slug);
            if (foundForm && foundForm.is_active) {
                setForm(foundForm);
                // Initialize default values
                const initial: Record<string, any> = {};
                foundForm.fields.forEach(field => {
                    initial[field.id] = '';
                });
                setFormData(initial);
            } else if (foundForm && !foundForm.is_active) {
                // Return null intentionally so it shows Not Found or Inactive
                setForm(null);
            }
        }
    }, [slug, data.forms]);

    if (!form && data.forms.length === 0) {
        return <div className="flex h-screen items-center justify-center p-4"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (!form) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-24">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">{t('forms.public.notFound')}</h1>
                    <p className="text-muted-foreground">{t('forms.public.notFoundDesc')}</p>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-[100%] max-w-md text-center py-12">
                    <CardContent className="space-y-6 flex flex-col items-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold">{t('forms.public.success')}</h2>
                            <p className="text-muted-foreground">
                                {form.destination === 'Product' ? t('forms.public.successProduct') : t('forms.public.successEngineering')}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsSuccess(false);
                                setFormData({});
                            }}
                            className="mt-4"
                        >
                            {t('forms.public.sendNew')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleChange = (fieldId: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    const generateTaskDescription = (submissionData: Record<string, any>): string => {
        let md = `## ${t('forms.public.taskSubtitle')}: ${form.title}\n\n`;
        form.fields.forEach(field => {
            const answer = submissionData[field.id];
            md += `### ${field.label}\n`;
            if (field.type === 'Date' && answer) {
                md += `${format(new Date(answer), 'dd/MM/yyyy')}\n\n`;
            } else {
                md += `${answer || t('forms.public.notAnswered')}\n\n`;
            }
        });
        return md;
    };

    const generateTaskTitle = (submissionData: Record<string, any>): string => {
        // Find the first shortText field to use as subtitle if available
        const firstShortText = form.fields.find(f => f.type === 'ShortText');
        const customContext = firstShortText && submissionData[firstShortText.id]
            ? ` - ${String(submissionData[firstShortText.id]).substring(0, 50)}`
            : '';
        return `${t('forms.public.taskTitlePrefix')}: ${form.title}${customContext}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate required fields
            for (const field of form.fields) {
                if (field.required && !formData[field.id]) {
                    toast({ title: "Validation Error", description: t('forms.public.requiredError', { label: field.label }), variant: 'destructive' });
                    setIsSubmitting(false);
                    return;
                }
            }

            // 1. Create Task based on form destination
            const taskPayload = {
                title: generateTaskTitle(formData),
                description: generateTaskDescription(formData),
                status: form.destination === 'Product' ? 'Discovery' : 'Backlog',
                task_type: form.destination === 'Product' ? 'Feature' : 'Spike', // Default guesses
                priority: 'Medium',
                order_index: 0,
                estimate_frontend: null,
                estimate_backend: null,
                estimate_qa: null,
                estimate_design: null,
                start_date: null,
                end_date: null,
                product_objective: null,
                business_goal: null,
                user_impact: null,
                has_prototype: false,
                prototype_link: null,
                area_id: null,
                feature_id: null,
                workspace_id: form.workspace_id
            };

            const createdTask = await addTask(taskPayload as any);

            // 2. Add Form Submission record linking to task
            const submissionPayload: Omit<FormSubmission, 'id' | 'created_at'> = {
                form_id: form.id,
                workspace_id: form.workspace_id,
                submitted_by: userProfile?.id || undefined,
                data: formData,
                task_id: createdTask.id
            };

            await addFormSubmission(submissionPayload);

            setIsSuccess(true);
        } catch (error: any) {
            toast({ title: t('forms.public.submitError'), description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <Card className="border-t-4 border-t-violet-600 shadow-lg">
                    <CardHeader className="pb-8">
                        <CardTitle className="text-3xl">{form.title}</CardTitle>
                        {form.description && (
                            <CardDescription className="text-base mt-2">
                                {form.description}
                            </CardDescription>
                        )}
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-8">
                            {form.fields.map((field) => (
                                <div key={field.id} className="space-y-3">
                                    <Label className="text-base font-medium">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </Label>

                                    {field.type === 'ShortText' && (
                                        <Input
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                            required={field.required}
                                            placeholder={t('forms.public.placeholderShort')}
                                            className="bg-white"
                                        />
                                    )}

                                    {field.type === 'LongText' && (
                                        <Textarea
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                            required={field.required}
                                            placeholder={t('forms.public.placeholderLong')}
                                            className="bg-white min-h-[100px]"
                                        />
                                    )}

                                    {field.type === 'Selector' && (
                                        <Select
                                            value={formData[field.id] || ''}
                                            onValueChange={(val) => handleChange(field.id, val)}
                                            required={field.required}
                                        >
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder={t('forms.public.selectPlaceholder')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {field.options?.map(opt => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {field.type === 'Date' && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal bg-white",
                                                        !formData[field.id] && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formData[field.id] ? format(new Date(formData[field.id]), "PPP") : <span>{t('forms.public.datePlaceholder')}</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={formData[field.id] ? new Date(formData[field.id]) : undefined}
                                                    onSelect={(date) => handleChange(field.id, date?.toISOString())}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            ))}

                            <div className="pt-6">
                                <Button
                                    type="submit"
                                    className="w-full bg-violet-600 hover:bg-violet-700 text-lg py-6"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                    {isSubmitting ? t('forms.public.submitting') : t('forms.public.submit')}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            </div>
        </div>
    );
}
