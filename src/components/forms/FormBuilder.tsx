import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, GripVertical, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CustomForm, FormDestination, FormField, FormFieldType } from '@/types';

interface FormBuilderProps {
    initialData: CustomForm | null;
    onSave: (data: Omit<CustomForm, 'id' | 'created_at'>) => void;
    onCancel: () => void;
}

export default function FormBuilder({ initialData, onSave, onCancel }: FormBuilderProps) {
    const { t } = useTranslation();
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [slug, setSlug] = useState(initialData?.slug || '');
    const [destination, setDestination] = useState<FormDestination>(initialData?.destination || 'Product');
    const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
    const [fields, setFields] = useState<FormField[]>(initialData?.fields || [
        { id: '1', label: t('forms.builder.formTitle', 'Title'), type: 'ShortText', required: true, order: 0 },
        { id: '2', label: t('forms.builder.description', 'Description'), type: 'LongText', required: true, order: 1 }
    ]);

    const handleAddField = () => {
        const newField: FormField = {
            id: String(Date.now()),
            label: t('forms.builder.newQuestion', 'New Question'),
            type: 'ShortText',
            required: false,
            order: fields.length
        };
        setFields([...fields, newField]);
    };

    const handleRemoveField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const handleUpdateField = (id: string, key: keyof FormField, value: any) => {
        setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    const generateSlug = (text: string) => {
        if (!text) return '';
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
        if (!initialData?.slug && !slug) {
            setSlug(generateSlug(e.target.value));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            title,
            description,
            slug: slug || generateSlug(title),
            destination,
            is_active: isActive,
            fields: fields.map((f, i) => ({ ...f, order: i }))
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">{t('forms.builder.formTitle')}</Label>
                                <Input id="title" required value={title} onChange={handleTitleChange} placeholder={t('forms.builder.formTitlePlaceholder')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">{t('forms.builder.description')} <span className="text-muted-foreground text-xs">{t('forms.builder.descriptionOptional')}</span></Label>
                                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder={t('forms.builder.descriptionPlaceholder')} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">{t('forms.builder.fieldsTitle')}</h3>
                            <Button type="button" variant="outline" onClick={handleAddField} size="sm">
                                <Plus className="h-4 w-4 mr-2" /> {t('forms.builder.addField')}
                            </Button>
                        </div>

                        {fields.map((field, index) => (
                            <Card key={field.id} className="relative group">
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="h-5 w-5" />
                                </div>
                                <CardContent className="p-4 pl-10 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                                    <div className="flex-1 space-y-2 w-full">
                                        <Label>{t('forms.builder.questionLabel')}</Label>
                                        <Input value={field.label} onChange={e => handleUpdateField(field.id, 'label', e.target.value)} required />
                                    </div>
                                    <div className="w-full sm:w-48 space-y-2">
                                        <Label>{t('forms.builder.type')}</Label>
                                        <Select value={field.type} onValueChange={(val: FormFieldType) => handleUpdateField(field.id, 'type', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ShortText">{t('forms.builder.types.shortText')}</SelectItem>
                                                <SelectItem value="LongText">{t('forms.builder.types.longText')}</SelectItem>
                                                <SelectItem value="Date">{t('forms.builder.types.date')}</SelectItem>
                                                <SelectItem value="Selector">{t('forms.builder.types.selector')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-4 pb-2">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`req-${field.id}`}
                                                checked={field.required}
                                                onCheckedChange={val => handleUpdateField(field.id, 'required', val)}
                                            />
                                            <Label htmlFor={`req-${field.id}`} className="text-sm font-normal">{t('forms.builder.required')}</Label>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleRemoveField(field.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>

                                {field.type === 'Selector' && (
                                    <CardContent className="pt-0 pl-10 pb-4">
                                        <Label className="text-xs text-muted-foreground mb-2 block">{t('forms.builder.options')}</Label>
                                        <Input
                                            placeholder={t('forms.builder.optionsPlaceholder')}
                                            value={field.options?.join(', ') || ''}
                                            onChange={e => handleUpdateField(field.id, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                        />
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="slug">{t('forms.builder.slug')}</Label>
                                <Input id="slug" value={slug} onChange={e => setSlug(generateSlug(e.target.value))} required placeholder={t('forms.builder.slugPlaceholder')} />
                                <p className="text-xs text-muted-foreground break-all">
                                    /{slug || 'form-url'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>{t('forms.builder.destination')}</Label>
                                <Select value={destination} onValueChange={setDestination as any}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Product">{t('forms.builder.destinations.product')}</SelectItem>
                                        <SelectItem value="Engineering">{t('forms.builder.destinations.engineering')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {t('forms.builder.destinationDesc')}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <div className="space-y-0.5">
                                    <Label>{t('forms.builder.active')}</Label>
                                    <p className="text-xs text-muted-foreground">{t('forms.builder.activeDesc')}</p>
                                </div>
                                <Switch checked={isActive} onCheckedChange={setIsActive} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>{t('common.cancel')}</Button>
                        <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700">{t('forms.builder.saveForm')}</Button>
                    </div>
                </div>
            </div>
        </form>
    );
}
