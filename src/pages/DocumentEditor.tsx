import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useLocalData } from '@/hooks/useLocalData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, FileText, Clock, LayoutTemplate, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function DocumentEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data, updateDocument, deleteDocument } = useLocalData();
    const { toast } = useToast();
    const { t } = useTranslation();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('write');

    const document = data.documents?.find(d => d.id === Number(id));

    useEffect(() => {
        if (document) {
            setTitle(document.title);
            setContent(document.content);
        }
    }, [document]);

    if (!document) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <FileText className="h-16 w-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">{t('docs.notFound', 'Document not found')}</h2>
                    <Button variant="outline" onClick={() => navigate('/docs')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('docs.backToHub', 'Back to Documentation Hub')}
                    </Button>
                </div>
            </Layout>
        );
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateDocument(document.id, {
                title,
                content,
            });
            toast({ title: t('common.saved', 'Saved successfully') });
        } catch (error: any) {
            toast({ title: t('common.error', 'Error'), description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm(t('docs.confirmDelete', 'Are you sure you want to delete this document?'))) {
            try {
                await deleteDocument(document.id);
                toast({ title: t('docs.deleted', 'Document deleted') });
                navigate('/docs');
            } catch (error: any) {
                toast({ title: t('docs.deleteError', 'Failed to delete'), description: error.message, variant: 'destructive' });
            }
        }
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/docs')} className="shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-2xl font-bold border-transparent hover:border-slate-200 focus:border-violet-500 focus:ring-violet-500 bg-transparent px-2 -ml-2 h-auto py-1 max-w-xl"
                        />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mr-4 hidden md:flex">
                            <Clock className="h-4 w-4" />
                            {t('docs.lastUpdated', 'Last updated:')} {format(new Date(document.updated_at), 'MMM d, h:mm a')}
                        </div>

                        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
                            <Trash className="h-4 w-4 mr-2" />
                            {t('common.delete', 'Delete')}
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving || (title === document.title && content === document.content)} className="bg-violet-600 hover:bg-violet-700">
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                        </Button>
                    </div>
                </div>

                {/* Editor / Preview Area */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full w-full">
                        <div className="border-b border-slate-200 px-4 py-2 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <TabsList className="bg-slate-200/50">
                                <TabsTrigger value="write" className="data-[state=active]:bg-white">{t('docs.write', 'Write')}</TabsTrigger>
                                <TabsTrigger value="preview" className="data-[state=active]:bg-white">{t('docs.preview', 'Preview')}</TabsTrigger>
                            </TabsList>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md">
                                <LayoutTemplate className="h-3.5 w-3.5" />
                                {document.type} Markdown
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-hidden relative">
                            <TabsContent value="write" className="h-full m-0 data-[state=inactive]:hidden border-0">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={t('docs.editorPlaceholder', 'Start writing your document using Markdown...')}
                                    className="w-full h-full p-6 resize-none focus:outline-none focus:ring-0 border-0 font-mono text-sm leading-relaxed text-slate-800"
                                    spellCheck="false"
                                />
                            </TabsContent>

                            <TabsContent value="preview" className="h-full m-0 data-[state=inactive]:hidden overflow-y-auto">
                                <div className="p-8 max-w-4xl mx-auto prose prose-slate prose-violet max-w-none">
                                    {content ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {content}
                                        </ReactMarkdown>
                                    ) : (
                                        <div className="text-center text-slate-400 italic mt-20">
                                            {t('docs.emptyPreview', 'Nothing to preview. Switch to the Write tab to add content.')}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </Layout>
    );
}
