import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, Code2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface InitiativeTypeSelectionDialogProps {
    open: boolean;
    onClose: () => void;
    onSelectType: (type: 'product' | 'engineering') => void;
}

export const InitiativeTypeSelectionDialog = ({
    open,
    onClose,
    onSelectType,
}: InitiativeTypeSelectionDialogProps) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl text-center pb-4">
                        {t('initiatives.createTitle', 'Where should this initiative start?')}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card
                        className="cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all group relative overflow-hidden"
                        onClick={() => onSelectType('product')}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Lightbulb className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="group-hover:text-primary transition-colors">
                                {t('initiatives.type.product.title', 'Product Backlog')}
                            </CardTitle>
                            <CardDescription>
                                {t('initiatives.type.product.desc', 'Focus on discovery, user impact, and business goals. Perfect for new features or ideas.')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary mt-2">
                                {t('common.select', 'Select')} <ArrowRight className="ml-1 h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all group relative overflow-hidden"
                        onClick={() => onSelectType('engineering')}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Code2 className="h-6 w-6 text-orange-600" />
                            </div>
                            <CardTitle className="group-hover:text-orange-600 transition-colors">
                                {t('initiatives.type.engineering.title', 'Engineering Backlog')}
                            </CardTitle>
                            <CardDescription>
                                {t('initiatives.type.engineering.desc', 'Jump straight to technical implementation, estimates, and tasks. Best for bugs or tech debt.')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm text-muted-foreground group-hover:text-orange-600 mt-2">
                                {t('common.select', 'Select')} <ArrowRight className="ml-1 h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
};
