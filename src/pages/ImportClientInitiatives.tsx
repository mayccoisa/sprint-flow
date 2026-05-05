import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLocalData } from '@/hooks/useLocalData';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, CheckCircle2 } from 'lucide-react';
import initiativesData from '@/data/clientInitiatives.json';

type ImportItem = {
    title: string;
    description: string | null;
    task_type: 'Feature' | 'Bug' | 'TechDebt' | 'Spike' | 'Improvement' | 'Deployment';
    priority: 'High' | 'Medium' | 'Low';
    status: string;
    estimate_backend: number | null;
    estimate_frontend: number | null;
    estimate_qa: number | null;
    estimate_design: number | null;
    order_index: number;
    start_date: string | null;
    end_date: string | null;
    product_objective: string | null;
    business_goal: string | null;
    user_impact: string | null;
    has_prototype: boolean;
    prototype_link: string | null;
    area_id: number | null;
    feature_id: number | null;
    requester_name: string | null;
};

const REQUESTERS_SQUAD_NAME = 'Solicitantes (PO)';

const ImportClientInitiatives = () => {
    const { data, addTask, addSquad, addMember, addTaskAssignment } = useLocalData() as any;
    const { toast } = useToast();
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(0);
    const [skipped, setSkipped] = useState(0);
    const [finished, setFinished] = useState(false);

    const items = initiativesData as ImportItem[];
    const total = items.length;

    const existingTitles = useMemo(
        () => new Set(data.tasks.map((t: any) => t.title.trim().toLowerCase())),
        [data.tasks]
    );

    const handleImport = async () => {
        setRunning(true);
        setDone(0);
        setSkipped(0);
        setFinished(false);

        // 1. Ensure requesters squad exists
        let squad = data.squads.find((s: any) => s.name === REQUESTERS_SQUAD_NAME);
        if (!squad) {
            squad = await addSquad({
                name: REQUESTERS_SQUAD_NAME,
                description: 'Solicitantes/POs vindos da importação de iniciativas',
                status: 'Active',
            });
        }
        const squadId = squad.id;

        // 2. Ensure each unique requester is a team member
        const uniqueRequesters = [
            ...new Set(items.map((i) => i.requester_name).filter(Boolean) as string[]),
        ];
        const memberByName = new Map<string, any>();
        for (const m of data.members) {
            memberByName.set(String(m.name).trim().toLowerCase(), m);
        }
        for (const name of uniqueRequesters) {
            const key = name.trim().toLowerCase();
            if (memberByName.has(key)) continue;
            const created = await addMember({
                name,
                squad_id: squadId,
                capacity: 0,
                specialty: 'Backend',
                avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
                status: 'Active',
            });
            memberByName.set(key, created);
        }

        // 3. Create tasks (skip duplicates by title) and link assignments
        const baseOrder = Math.max(...data.tasks.map((t: any) => t.order_index ?? 0), -1) + 1;
        let completed = 0;
        let skippedCount = 0;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (existingTitles.has(item.title.trim().toLowerCase())) {
                skippedCount++;
                setSkipped(skippedCount);
                continue;
            }
            try {
                const { requester_name, ...taskFields } = item;
                const newTask = await addTask({
                    ...taskFields,
                    order_index: baseOrder + i,
                });

                if (requester_name && newTask?.id != null) {
                    const member = memberByName.get(requester_name.trim().toLowerCase());
                    if (member) {
                        await addTaskAssignment({
                            task_id: newTask.id,
                            member_id: member.id,
                        });
                    }
                }
                completed++;
                setDone(completed);
            } catch (err) {
                console.error('Failed to import', item.title, err);
            }
        }

        setRunning(false);
        setFinished(true);
        toast({
            title: 'Importação concluída',
            description: `${completed} criadas, ${skippedCount} ignoradas. Solicitantes: ${uniqueRequesters.length}.`,
        });
    };

    const progress = total > 0 ? Math.round(((done + skipped) / total) * 100) : 0;
    const withDates = items.filter((i) => i.end_date || i.start_date).length;
    const withRequester = items.filter((i) => i.requester_name).length;

    return (
        <Layout>
            <div className="space-y-6 max-w-3xl">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                        <Upload className="h-7 w-7 text-primary" />
                        Importar Iniciativas (CSV WeON)
                    </h1>
                    <p className="text-muted-foreground">
                        Importa em massa as iniciativas mapeadas no CSV de Solicitações de Clientes WeON 2026.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Resumo</CardTitle>
                        <CardDescription>
                            {total} iniciativas serão criadas no workspace atual. Itens com título idêntico a uma
                            iniciativa existente são ignorados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                            <li>{withDates} itens com datas reais (start/end_date) já parseadas de dd/mm/yyyy</li>
                            <li>{withRequester} itens com solicitante — serão criados como members do squad “{REQUESTERS_SQUAD_NAME}” e linkados via task_assignments</li>
                            <li>Status do CSV mapeado para o ciclo do produto</li>
                            <li>Empresa, observações, ticket e estimativa original vão para a descrição</li>
                            <li>Estimativa em horas → <code>estimate_backend</code></li>
                        </ul>

                        {(running || finished) && (
                            <div className="space-y-2">
                                <Progress value={progress} />
                                <p className="text-sm text-muted-foreground">
                                    {done} criadas / {skipped} ignoradas / {total} total
                                </p>
                            </div>
                        )}

                        <Button onClick={handleImport} disabled={running} className="w-full">
                            {running ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...</>
                            ) : finished ? (
                                <><CheckCircle2 className="mr-2 h-4 w-4" /> Importar novamente</>
                            ) : (
                                <><Upload className="mr-2 h-4 w-4" /> Importar {total} iniciativas</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default ImportClientInitiatives;
