import { useState } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import { ProductModule, ProductFeature, ProductService, ServiceDependency } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Box, Layers, Database, Globe, Server } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useTranslation } from 'react-i18next';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const ProductModules = () => {
    const {
        data,
        addProductModule,
        addProductService,
        addProductFeature,
        deleteProductModule,
        deleteProductFeature,
        deleteProductService,
    } = useLocalData();
    const { t } = useTranslation();

    const [newModuleName, setNewModuleName] = useState('');
    const [newModuleDesc, setNewModuleDesc] = useState('');

    // Feature Form State
    const [featureName, setFeatureName] = useState('');
    const [featureDesc, setFeatureDesc] = useState('');
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');

    // Service Form State
    const [serviceName, setServiceName] = useState('');
    const [serviceType, setServiceType] = useState<string>('Internal');

    // Deletion State
    const [deletingItem, setDeletingItem] = useState<{ type: 'module' | 'feature' | 'service', id: number, name: string } | null>(null);

    const checkDelete = (type: 'module' | 'feature' | 'service', id: number, name: string) => {
        setDeletingItem({ type, id, name });
    };

    const confirmDelete = () => {
        if (!deletingItem) return;
        if (deletingItem.type === 'module') deleteProductModule(deletingItem.id);
        if (deletingItem.type === 'feature') deleteProductFeature(deletingItem.id);
        if (deletingItem.type === 'service') deleteProductService(deletingItem.id);
        setDeletingItem(null);
    };

    const handleAddModule = () => {
        if (!newModuleName) return;
        addProductModule({
            name: newModuleName,
            description: newModuleDesc,
            area_id: 1, // Default area for now
            icon: 'Box',
            health_score: 100 // Default new modules to healthy
        });
        setNewModuleName('');
        setNewModuleDesc('');
    };

    const handleAddFeature = (moduleId: number) => {
        if (!featureName) return;
        addProductFeature({
            name: featureName,
            description: featureDesc,
            module_id: moduleId,
            status: 'Concept'
        });
        setFeatureName('');
        setFeatureDesc('');
        setSelectedModuleId('');
    };

    const handleAddService = () => {
        if (!serviceName) return;
        addProductService({
            name: serviceName,
            description: '',
            type: serviceType as any
        });
        setServiceName('');
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight tracking-tight">{t('productModules.title')}</h1>
                    <p className="text-muted-foreground">{t('productModules.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Modules & Features Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Box className="h-5 w-5 text-primary" />
                                    {t('productModules.modules')}
                                </CardTitle>
                                <CardDescription>{t('productModules.modulesDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* New Module Input */}
                                <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder={t('productModules.newModulePlaceholder')}
                                            value={newModuleName}
                                            onChange={(e) => setNewModuleName(e.target.value)}
                                        />
                                        <Button onClick={handleAddModule} disabled={!newModuleName}>
                                            <Plus className="h-4 w-4 mr-2" /> {t('productModules.addModule')}
                                        </Button>
                                    </div>
                                    <Textarea
                                        placeholder={t('productModules.descPlaceholder')}
                                        value={newModuleDesc}
                                        onChange={(e) => setNewModuleDesc(e.target.value)}
                                        className="h-20"
                                    />
                                </div>

                                {/* Modules List */}
                                <Accordion type="single" collapsible className="w-full">
                                    {data.productModules.map(module => (
                                        <AccordionItem key={module.id} value={`module-${module.id}`}>
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold text-lg">{module.name}</span>
                                                    <Badge variant="outline">{t('productModules.featuresCount', { count: data.productFeatures.filter(f => f.module_id === module.id).length })}</Badge>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        checkDelete('module', module.id, module.name);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 space-y-4">
                                                <p className="text-sm text-muted-foreground">{module.description}</p>

                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-sm flex items-center gap-2">
                                                        <Layers className="h-4 w-4" /> {t('productModules.features')}
                                                    </h4>

                                                    {/* List Features */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {data.productFeatures.filter(f => f.module_id === module.id).map(feature => (
                                                            <div key={feature.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                                                                <div>
                                                                    <div className="font-medium">{feature.name}</div>
                                                                    <div className="text-xs text-muted-foreground">{feature.status}</div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => checkDelete('feature', feature.id, feature.name)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Add Feature Form */}
                                                    <div className="mt-4 pt-4 border-t">
                                                        <div className="space-y-3">
                                                            {selectedModuleId === String(module.id) ? (
                                                                <>
                                                                    <Input
                                                                        placeholder={t('productModules.newFeaturePlaceholder')}
                                                                        value={featureName}
                                                                        onChange={(e) => setFeatureName(e.target.value)}
                                                                        autoFocus
                                                                    />
                                                                    <Input
                                                                        placeholder={t('productModules.featureDescPlaceholder')}
                                                                        value={featureDesc}
                                                                        onChange={(e) => setFeatureDesc(e.target.value)}
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleAddFeature(module.id)}
                                                                            disabled={!featureName}
                                                                        >
                                                                            {t('productModules.addFeature')}
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => {
                                                                                setSelectedModuleId('');
                                                                                setFeatureName('');
                                                                            }}
                                                                        >
                                                                            {t('common.cancel')}
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-full justify-start text-muted-foreground"
                                                                    onClick={() => setSelectedModuleId(String(module.id))}
                                                                >
                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                    {t('productModules.addFeature')}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Services Column */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="h-5 w-5 text-primary" />
                                    {t('productModules.services')}
                                </CardTitle>
                                <CardDescription>{t('productModules.servicesDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <Input
                                        placeholder={t('productModules.serviceNamePlaceholder')}
                                        value={serviceName}
                                        onChange={(e) => setServiceName(e.target.value)}
                                    />
                                    <Select value={serviceType} onValueChange={setServiceType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('productModules.typePlaceholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Internal">{t('productModules.types.internal')}</SelectItem>
                                            <SelectItem value="External">{t('productModules.types.external')}</SelectItem>
                                            <SelectItem value="Database">{t('productModules.types.database')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button className="w-full" onClick={handleAddService} disabled={!serviceName}>
                                        {t('productModules.addService')}
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {data.productServices.map(service => (
                                        <div key={service.id} className="flex items-center justify-between p-3 border rounded-md">
                                            <div className="space-y-1">
                                                <div className="font-medium">{service.name}</div>
                                                <Badge variant="secondary" className="text-xs">
                                                    {service.type}
                                                </Badge>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => checkDelete('service', service.id, service.name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>

            <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('productModules.delete.title', { type: deletingItem ? t(`productModules.delete.${deletingItem.type}`) : '' })}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('productModules.delete.description', { name: deletingItem?.name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('productModules.delete.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                            {t('productModules.delete.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Layout >
    );
};
