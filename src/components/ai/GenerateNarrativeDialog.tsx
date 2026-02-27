import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateNarrative } from '@/services/aiService';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const GenerateNarrativeDialog = ({ open, onOpenChange }: Props) => {
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [narrative, setNarrative] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!topic) return;

        if (apiKey) {
            localStorage.setItem('gemini_api_key', apiKey);
        }

        setIsGenerating(true);
        try {
            const result = await generateNarrative(topic);
            setNarrative(result);
            toast({ title: 'Narrative Crafted!' });
        } catch (err: any) {
            toast({ title: 'Generation Failed', description: err.message, variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (narrative) {
            navigator.clipboard.writeText(narrative);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-violet-500" />
                        Craft Strategic Narrative
                    </DialogTitle>
                    <DialogDescription>
                        Use the Andy Raskin framework to build a powerful narrative for your product.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 overflow-y-auto">
                    {!localStorage.getItem('gemini_api_key') && !import.meta.env.VITE_GEMINI_API_KEY && (
                        <div className="space-y-2">
                            <Label>Gemini API Key</Label>
                            <Input
                                type="password"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                            />
                        </div>
                    )}

                    {!narrative ? (
                        <div className="space-y-2">
                            <Label>Product or Initiative Description</Label>
                            <Textarea
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                placeholder="e.g. A new collaboration tool for remote designers..."
                                className="h-24"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Generated Narrative</h3>
                                <Button size="sm" variant="outline" onClick={copyToClipboard} className="h-8 gap-2">
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                            <ScrollArea className="h-[40vh] border rounded-md p-4 bg-muted/30">
                                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                    {narrative}
                                </div>
                            </ScrollArea>
                            <Button variant="ghost" className="w-full mt-2" onClick={() => setNarrative(null)}>
                                Draft Another
                            </Button>
                        </div>
                    )}
                </div>

                {!narrative && (
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>Cancel</Button>
                        <Button onClick={handleGenerate} disabled={!topic || isGenerating} className="bg-violet-600 hover:bg-violet-700">
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};
