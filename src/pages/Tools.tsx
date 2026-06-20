import { useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { TOOLS_CATALOG, findTool } from '@/features/tools/catalog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings2 } from 'lucide-react';

export default function ToolsPage() {
  const [activeId, setActiveId] = useState<string>(TOOLS_CATALOG[0]?.id ?? '');
  const active = useMemo(() => findTool(activeId), [activeId]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Ferramentas
          </h1>
          <p className="text-muted-foreground">
            Conecte serviços externos ao Sprint Flow. Cada usuário gerencia suas próprias credenciais.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <aside className="space-y-1">
            {TOOLS_CATALOG.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveId(tool.id)}
                className={`w-full text-left rounded-lg px-3 py-2 transition-colors ${
                  activeId === tool.id
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'hover:bg-accent'
                }`}
              >
                <div className="text-sm font-semibold">{tool.name}</div>
                <div className="text-xs text-muted-foreground">{tool.tagline}</div>
              </button>
            ))}
          </aside>

          {active && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{active.name}</CardTitle>
                  <CardDescription>{active.summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <section>
                    <h4 className="mb-2 text-[13px] font-medium text-muted-foreground">
                      O que faz
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                      {active.capabilities.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h4 className="mb-2 text-[13px] font-medium text-muted-foreground">
                      Quando usar
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                      {active.whenToUse.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </section>
                  {active.limitations && (
                    <section>
                      <h4 className="mb-2 text-[13px] font-medium text-muted-foreground">
                        Limitações
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                        {active.limitations.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuração</CardTitle>
                </CardHeader>
                <CardContent>
                  <active.SettingsComponent />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
