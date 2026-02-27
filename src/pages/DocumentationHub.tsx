import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useLocalData } from '@/hooks/useLocalData';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FileText, Search, Clock, File, MoreVertical, Edit, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { documentTemplates } from '@/data/documentTemplates';
import type { ProductDocument, DocumentType } from '@/types';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DocumentationHub() {
    const { data, addDocument, deleteDocument } = useLocalData();
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [newDocTitle, setNewDocTitle] = useState('');

    // Filter documents
    const filteredDocs = useMemo(() => {
        return data.documents?.filter(doc =>
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.type.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()) || [];
    }, [data.documents, searchQuery]);

    const handleCreateDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;

        let initialContent = '';
        let docType: DocumentType = 'Custom';

        if (selectedTemplate && selectedTemplate !== 'blank') {
            const template = documentTemplates.find(t => t.id === selectedTemplate);
            if (template) {
                initialContent = template.content;
                docType = template.type;
            }
        }

        try {
            const newDoc = await addDocument({
                title: newDocTitle || 'Untitled Document',
                type: docType,
                content: initialContent,
                author_id: userProfile.id,
                status: 'Draft',
                tags: []
            });

            toast({ title: t('docs.created', 'Document created successfully') });
            setIsCreateOpen(false);
            navigate(`/docs/${newDoc.id}`);
        } catch (error: any) {
            toast({ title: t('docs.createError', 'Failed to create document'), description: error.message, variant: 'destructive' });
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm(t('docs.confirmDelete', 'Are you sure you want to delete this document?'))) {
            try {
                await deleteDocument(id);
                toast({ title: t('docs.deleted', 'Document deleted') });
            } catch (error: any) {
                toast({ title: t('docs.deleteError', 'Failed to delete'), description: error.message, variant: 'destructive' });
            }
        }
    };

    const getTemplateIcon = (iconName?: string) => {
        switch (iconName) {
            case 'FileText': return <FileText className="h-5 w-5 text-violet-600" />;
            case 'Target': return <FileText className="h-5 w-5 text-blue-600" />; // Fallbacks for lucide string mapping without dynamic import
            case 'Megaphone': return <FileText className="h-5 w-5 text-amber-600" />;
            case 'Code': return <FileText className="h-5 w-5 text-slate-600" />;
            case 'User': return <FileText className="h-5 w-5 text-emerald-600" />;
            case 'MessageSquare': return <FileText className="h-5 w-5 text-pink-600" />;
            default: return <File className="h-5 w-5 text-muted-foreground" />;
        }
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{t('docs.title', 'Documentation Hub')}</h1>
                        <p className="text-muted-foreground">{t('docs.subtitle', 'Create, manage, and discover product documentation.')}</p>
                    </div>
                    <Button onClick={() => {
                        setNewDocTitle('');
                        setSelectedTemplate('blank');
                        setIsCreateOpen(true);
                    }} className="bg-violet-600 hover:bg-violet-700">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('docs.new', 'New Document')}
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('docs.searchPlaceholder', 'Search documents...')}
                        className="pl-9 max-w-md bg-white border-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredDocs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredDocs.map(doc => (
                            <Card
                                key={doc.id}
                                className="group hover:border-violet-300 transition-colors flex flex-col h-full cursor-pointer"
                                onClick={() => navigate(`/docs/${doc.id}`)}
                            >
                                <CardContent className="p-5 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-violet-100 transition-colors">
                                            <FileText className="h-6 w-6 text-slate-600 group-hover:text-violet-600" />
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/docs/${doc.id}`); }}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    {t('common.edit', 'Edit')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                                >
                                                    <Trash className="h-4 w-4 mr-2" />
                                                    {t('common.delete', 'Delete')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg line-clamp-2 mb-1 group-hover:text-violet-700 transition-colors">
                                            {doc.title}
                                        </h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 mb-3">
                                            {doc.type}
                                        </span>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(doc.updated_at), 'MMM d, yyyy')}
                                        </div>
                                        <span>{doc.status}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                        <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-1">{t('docs.emptyTitle', 'No documents found')}</h3>
                        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                            {t('docs.emptyDesc', 'Get started by creating a new product document or using one of our predefined templates.')}
                        </p>
                        <Button onClick={() => {
                            setNewDocTitle('');
                            setSelectedTemplate('blank');
                            setIsCreateOpen(true);
                        }} className="bg-violet-600 hover:bg-violet-700">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('docs.new', 'New Document')}
                        </Button>
                    </div>
                )}

                {/* Create Document Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>{t('docs.createTitle', 'Create New Document')}</DialogTitle>
                            <DialogDescription>
                                {t('docs.createDesc', 'Start from scratch or choose a template to begin writing.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateDocument} className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">{t('docs.docTitle', 'Document Title')}</Label>
                                <Input
                                    id="title"
                                    placeholder={t('docs.titlePlaceholder', 'e.g., Q3 Payment Gateway PRD')}
                                    value={newDocTitle}
                                    onChange={(e) => setNewDocTitle(e.target.value)}
                                    className="text-lg py-6"
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <Label>{t('docs.templates', 'Select a Template')}</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
                                    <div
                                        className={cn(
                                            "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4",
                                            selectedTemplate === 'blank'
                                                ? "border-violet-600 bg-violet-50/50"
                                                : "border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                                        )}
                                        onClick={() => setSelectedTemplate('blank')}
                                    >
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <File className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 mb-1">{t('docs.blankDoc', 'Blank Document')}</h4>
                                            <p className="text-sm text-slate-500 line-clamp-2">{t('docs.blankDesc', 'Start from scratch with an empty canvas.')}</p>
                                        </div>
                                    </div>

                                    {documentTemplates.map(template => (
                                        <div
                                            key={template.id}
                                            className={cn(
                                                "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4",
                                                selectedTemplate === template.id
                                                    ? "border-violet-600 bg-violet-50/50"
                                                    : "border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                                            )}
                                            onClick={() => setSelectedTemplate(template.id)}
                                        >
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                {getTemplateIcon(template.icon)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">{template.title}</h4>
                                                <p className="text-sm text-slate-500 line-clamp-2">{template.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <DialogFooter className="pt-4 border-t border-slate-100">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={!newDocTitle.trim() || !selectedTemplate}>
                                    {t('docs.createBtn', 'Create Document')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}
