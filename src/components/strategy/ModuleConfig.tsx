import { useState } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Layers, Server, Box } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useTranslation } from 'react-i18next';

export function ModuleConfig() {
    const { t } = useTranslation();
    const {
        data,
        addProductModule,
        addProductService,
        addProductFeature,
        addServiceDependency
    } = useLocalData();

    const [newModuleName, setNewModuleName] = useState('');
    const [newServiceName, setNewServiceName] = useState('');
    const [newFeatureName, setNewFeatureName] = useState('');
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

    const handleAddModule = () => {
        if (!newModuleName) return;
        addProductModule({
            name: newModuleName,
            description: '',
            area_id: 1 // Default to first area for now
        });
        setNewModuleName('');
    };

    const handleAddService = () => {
        if (!newServiceName) return;
        addProductService({
            name: newServiceName,
            description: '',
            type: 'Internal'
        });
        setNewServiceName('');
    };

    const handleAddFeature = (moduleId: number) => {
        // In a real app, we'd handle this input per module or dialog. 
        // For this quick config, we'll assume the input is for the currently Expanded item, 
        // but Accordion UI makes that tricky without controlled state.
        // Let's simplify: A Global "Add Feature" but linked to a selected module? 
        // Better: Input inside the map loop? No, component state is messy.
        // Let's use a simple prompt for now or just a "Quick Add" at the bottom of the list.

        // Actually, let's just put the input inside the accordion content.
        // We'll trust the user to type in the right box.
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Modules & Features Column */}
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-violet-600" />
                        {t('productModules.title')}
                    </CardTitle>
                    <CardDescription>{t('productModules.modulesDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Add Module */}
                    <div className="flex gap-2">
                        <Input
                            placeholder={t('productModules.newModulePlaceholder')}
                            value={newModuleName}
                            onChange={(e) => setNewModuleName(e.target.value)}
                        />
                        <Button onClick={handleAddModule} size="sm"><Plus className="h-4 w-4" /></Button>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        {data.productModules.map(module => (
                            <AccordionItem key={module.id} value={`item-${module.id}`}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Box className="h-4 w-4 text-violet-500" />
                                        <span>{module.name}</span>
                                        <Badge variant="outline" className="ml-2 text-xs font-normal">
                                            {data.productFeatures.filter(f => f.module_id === module.id).length} {t('productModules.features').toLowerCase()}
                                        </Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-6 space-y-3">
                                    <div className="space-y-2">
                                        {data.productFeatures
                                            .filter(f => f.module_id === module.id)
                                            .map(feature => (
                                                <div key={feature.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border text-sm">
                                                    <span>{feature.name}</span>
                                                    <Badge variant="secondary" className="text-[10px]">{feature.status}</Badge>
                                                </div>
                                            ))
                                        }
                                    </div>
                                    <div className="pt-2 border-t flex gap-2">
                                        <Input
                                            placeholder={t('productModules.addFeature') + "..."}
                                            className="h-8 text-xs"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    addProductFeature({
                                                        name: e.currentTarget.value,
                                                        description: '',
                                                        module_id: module.id,
                                                        status: 'Concept'
                                                    });
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                        />
                                        <Button size="sm" variant="ghost" className="h-8 px-2" title={t('productModules.pressEnterToAdd')}><Plus className="h-3 w-3" /></Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            {/* Services Column */}
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-emerald-600" />
                        {t('productModules.coreServices')}
                    </CardTitle>
                    <CardDescription>{t('productModules.coreServicesDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Add Service */}
                    <div className="flex gap-2">
                        <Input
                            placeholder={t('productModules.serviceNamePlaceholder')}
                            value={newServiceName}
                            onChange={(e) => setNewServiceName(e.target.value)}
                        />
                        <Button onClick={handleAddService} size="sm"><Plus className="h-4 w-4" /></Button>
                    </div>

                    <div className="space-y-3">
                        {data.productServices.map(service => (
                            <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-md ${service.type === 'Database' ? 'bg-blue-100 text-blue-700' :
                                        service.type === 'External' ? 'bg-red-100 text-red-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        <Server className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{service.name}</p>
                                        <p className="text-xs text-muted-foreground">{service.type}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
