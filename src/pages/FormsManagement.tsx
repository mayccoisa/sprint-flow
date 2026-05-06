import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useLocalData } from '@/hooks/useLocalData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, ExternalLink, Settings2, Trash2, ArrowLeft, Share2, Globe, Lock, Copy, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { CustomForm } from '@/types';
import FormBuilder from '@/components/forms/FormBuilder';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/components/ui-patterns';

export default function FormsManagement() {
    const { t } = useTranslation();
    const { data, addForm, updateForm, deleteForm } = useLocalData();
    const { toast } = useToast();
    const confirm = useConfirm();
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
        const ok = await confirm({
            title: t('forms.management.confirmDeleteTitle', 'Delete form?'),
            description: t('forms.management.confirmDelete'),
            confirmLabel: t('common.delete', 'Delete'),
        });
        if (!ok) return;
        try {
            await deleteForm(id);
            toast({ title: t('forms.management.deleted') });
        } catch (error: any) {
            toast({ title: t('forms.management.deleteFailed'), description: error.message, variant: 'destructive' });
        }
    };

    const handleTogglePublic = async (form: CustomForm, value: boolean) => {
        try {
            await updateForm(form.id, { is_active: value });
            toast({
                title: value ? t('forms.management.published', 'Formulário público') : t('forms.management.unpublished', 'Formulário privado'),
                description: value
                    ? t('forms.management.publishedDesc', 'Qualquer pessoa com o link pode preencher.')
                    : t('forms.management.unpublishedDesc', 'O link público foi desativado.'),
            });
        } catch (error: any) {
            toast({ title: t('forms.management.saveFailed'), description: error.message, variant: 'destructive' });
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
                                                    <SharePopover form={form} onToggle={handleTogglePublic} />
                                                    <Button variant="ghost" size="sm" asChild title="Abrir formulário">
                                                        <Link to={`/f/${form.slug}`} target="_blank">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditForm(form)} title="Editar">
                                                        <Settings2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteForm(form.id)} title="Excluir">
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

function SharePopover({ form, onToggle }: { form: CustomForm; onToggle: (form: CustomForm, value: boolean) => void }) {
    const [copied, setCopied] = useState(false);
    const isPublic = form.is_active;
    const shareUrl = `${window.location.origin}/f/${form.slug}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            // ignore
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" title="Compartilhar" className="gap-1.5">
                    {isPublic ? (
                        <Globe className="h-4 w-4 text-emerald-600" />
                    ) : (
                        <Share2 className="h-4 w-4" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[360px]" align="end">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            {isPublic ? (
                                <>
                                    <Globe className="h-4 w-4 text-emerald-600" />
                                    Formulário público
                                </>
                            ) : (
                                <>
                                    <Lock className="h-4 w-4" />
                                    Formulário privado
                                </>
                            )}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isPublic
                                ? 'Qualquer pessoa com o link pode preencher e enviar este formulário.'
                                : 'Ative para gerar um link público que pode ser compartilhado.'}
                        </p>
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="space-y-0.5">
                            <Label htmlFor={`public-${form.id}`} className="text-sm font-medium cursor-pointer">
                                Tornar público
                            </Label>
                            <p className="text-[11px] text-muted-foreground">
                                {isPublic ? 'Acesso liberado por link' : 'Não aceita respostas'}
                            </p>
                        </div>
                        <Switch
                            id={`public-${form.id}`}
                            checked={isPublic}
                            onCheckedChange={(v) => onToggle(form, v)}
                        />
                    </div>

                    {isPublic && (
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Link de compartilhamento</Label>
                            <div className="flex gap-2">
                                <Input readOnly value={shareUrl} className="text-xs h-9 font-mono" />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-9 w-9 shrink-0"
                                    onClick={handleCopy}
                                    title="Copiar link"
                                >
                                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Desabilite o toggle a qualquer momento para revogar o acesso.
                            </p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
