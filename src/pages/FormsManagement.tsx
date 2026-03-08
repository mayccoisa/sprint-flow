import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useLocalData } from '@/hooks/useLocalData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, ExternalLink, Settings2, Trash2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { CustomForm } from '@/types';
import FormBuilder from '@/components/forms/FormBuilder';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function FormsManagement() {
    const { t } = useTranslation();
    const { data, addForm, updateForm, deleteForm } = useLocalData();
    const { toast } = useToast();
    const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateNew = () => {
        setIsCreating(true);
        setEditingForm(null);
    };

    const handleEditForm = (form: CustomForm) => {
        setEditingForm(form);
        setIsCreating(true);
    };

    const handleDeleteForm = async (id: string) => {
        if (confirm(t('forms.management.confirmDelete'))) {
            try {
                await deleteForm(id);
                toast({ title: t('forms.management.deleted') });
            } catch (error: any) {
                toast({ title: t('forms.management.deleteFailed'), description: error.message, variant: 'destructive' });
            }
        }
    };

    const handleSaveForm = async (formData: Omit<CustomForm, 'id' | 'created_at'>) => {
        try {
            if (editingForm) {
                await updateForm(editingForm.id, formData);
                toast({ title: t('forms.management.saved') });
            } else {
                await addForm(formData);
                toast({ title: t('forms.management.saved') });
            }
            setIsCreating(false);
            setEditingForm(null);
        } catch (error: any) {
            toast({ title: t('forms.management.saveFailed'), description: error.message, variant: 'destructive' });
        }
    };

    if (isCreating) {
        return (
            <Layout>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {editingForm ? t('forms.builder.editTitle') : t('forms.builder.newTitle')}
                            </h1>
                            <p className="text-muted-foreground">{t('forms.builder.subtitle')}</p>
                        </div>
                    </div>

                    <FormBuilder
                        initialData={editingForm}
                        onSave={handleSaveForm}
                        onCancel={() => setIsCreating(false)}
                    />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">{t('forms.management.title')}</h1>
                        <p className="text-muted-foreground">{t('forms.management.subtitle')}</p>
                    </div>
                    <Button onClick={handleCreateNew} className="bg-violet-600 hover:bg-violet-700">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('forms.management.newForm')}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('forms.management.activeForms')}</CardTitle>
                        <CardDescription>{t('forms.management.activeFormsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.forms.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground space-y-4">
                                <FileText className="h-12 w-12 mx-auto opacity-20" />
                                <p>{t('forms.management.noForms')}</p>
                                <Button variant="outline" onClick={handleCreateNew}>{t('forms.management.createFirst')}</Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('forms.management.table.name')}</TableHead>
                                        <TableHead>{t('forms.management.table.destination')}</TableHead>
                                        <TableHead>{t('forms.management.table.status')}</TableHead>
                                        <TableHead>{t('forms.management.table.created')}</TableHead>
                                        <TableHead className="text-right">{t('forms.management.table.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.forms.map((form) => (
                                        <TableRow key={form.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{form.title}</span>
                                                    <span className="text-xs text-muted-foreground">/{form.slug}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={form.destination === 'Product' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
                                                    {form.destination}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={form.is_active ? 'default' : 'secondary'} className={form.is_active ? 'bg-violet-600' : ''}>
                                                    {form.is_active ? t('forms.management.badges.active') : t('forms.management.badges.draft')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {format(new Date(form.created_at || new Date()), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link to={`/f/${form.slug}`} target="_blank">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditForm(form)}>
                                                        <Settings2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteForm(form.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
