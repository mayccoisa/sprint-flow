import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generatePRD, PRDSection } from '@/services/aiService';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerated: (data: PRDSection) => void;
}

export const GeneratePRDDialog = ({ open, onOpenChange, onGenerated }: Props) => {
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!topic) return;

        if (apiKey) {
            localStorage.setItem('gemini_api_key', apiKey);
        }

        setIsGenerating(true);
        try {
            const result = await generatePRD(topic);
            onGenerated(result);
            onOpenChange(false);
            setTopic('');
            toast({ title: 'PRD Generated!', description: 'Fields have been populated.' });
        } catch (err: any) {
            toast({ title: 'Generation Failed', description: err.message, variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        Generate PRD with AI
                    </DialogTitle>
                    <DialogDescription>
                        Describe what you want to build, and the PM Agent will structure it into a PRD.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {!localStorage.getItem('gemini_api_key') && !import.meta.env.VITE_GEMINI_API_KEY && (
                        <div className="space-y-2">
                            <Label>Gemini API Key</Label>
                            <Input
                                type="password"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                            />
                            <p className="text-xs text-muted-foreground">Stored locally in your browser.</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Feature Description</Label>
                        <Textarea
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            placeholder="e.g. A notification center for power users"
                            className="h-24"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>Cancel</Button>
                    <Button onClick={handleGenerate} disabled={!topic || isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
