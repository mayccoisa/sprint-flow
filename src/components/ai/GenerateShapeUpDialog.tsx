import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { shapeUpInitiative } from '@/services/aiService';
import { Loader2, Sparkles, Copy, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import ReactMarkdown from 'react-markdown';
import type { Task } from '@/types';

interface GenerateShapeUpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task | null;
}

export function GenerateShapeUpDialog({ open, onOpenChange, task }: GenerateShapeUpDialogProps) {
    const { toast } = useToast();
    const [apiKey, setApiKey] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPitch, setGeneratedPitch] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    // Initial check for API key
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) setApiKey(storedKey);
    }, []);

    const handleGenerate = async () => {
        if (!task) return;

        if (!apiKey) {
            toast({
                title: 'API Key Required',
                description: 'Please provide your Gemini API key to use the AI assistant.',
                variant: 'destructive',
            });
            return;
        }

        // Save key for future use
        localStorage.setItem('gemini_api_key', apiKey);

        setIsGenerating(true);
        setGeneratedPitch(null);
        setIsCopied(false);

        try {
            // Combine task fields for context
            let context = `Title: ${task.title}\n`;
            if (task.description) context += `Description: ${task.description}\n`;
            if (task.product_objective) context += `Objective: ${task.product_objective}\n`;
            if (task.user_impact) context += `Impact: ${task.user_impact}\n`;

            const pitch = await shapeUpInitiative(task.title, context);
            setGeneratedPitch(pitch);
            toast({
                title: 'Shape Up Pitch Generated',
                description: 'The AI has structured your initiative into a Shape Up pitch.',
            });
        } catch (error: any) {
            console.error('AI Generation Error:', error);
            toast({
                title: 'Generation Failed',
                description: error.message || 'There was an error communicating with the AI service.',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (generatedPitch) {
            navigator.clipboard.writeText(generatedPitch);
            setIsCopied(true);
            toast({ title: 'Copied to clipboard' });
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleReset = () => {
        setGeneratedPitch(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-violet-600" />
                        Shape Up Assistant
                    </DialogTitle>
                    <DialogDescription>
                        Use the Shape Up framework to define the appetite, solution, rabbit holes, and no-gos for "{task?.title}".
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {!localStorage.getItem('gemini_api_key') && !apiKey && (
                        <div className="space-y-2 p-4 bg-slate-50 border rounded-lg">
                            <Label htmlFor="apiKey" className="text-xs font-semibold text-slate-500 uppercase">Gemini API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                placeholder="AIzaSy..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Your key is stored locally in your browser and used only for these requests.</p>
                        </div>
                    )}

                    {!generatedPitch ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                            <div className="bg-violet-100 p-4 rounded-full">
                                <Sparkles className="h-8 w-8 text-violet-600" />
                            </div>
                            <div>
                                <h3 className="font-medium text-lg">Format this Initiative</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                    The AI will analyze the task details and generate a structured pitch to help engineering focus on what matters.
                                </p>
                            </div>
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating || !task}
                                className="bg-violet-600 hover:bg-violet-700 w-full sm:w-auto"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Shaping Pitch...
                                    </>
                                ) : (
                                    'Generate Pitch'
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg border prose prose-sm max-w-none prose-headings:text-violet-900 prose-a:text-violet-600">
                                <ReactMarkdown>{generatedPitch}</ReactMarkdown>
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center">
                                <Button variant="outline" onClick={handleReset}>
                                    Discard & Try Again
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={handleCopy}>
                                        {isCopied ? <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
                                        {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                                    </Button>
                                    <Button onClick={() => onOpenChange(false)}>
                                        Done
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
