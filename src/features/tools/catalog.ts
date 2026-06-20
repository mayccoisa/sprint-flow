/**
 * Catálogo das ferramentas integradas ao Sprint Flow.
 * Para adicionar nova ferramenta: criar o componente de config em
 * `src/features/tools/settings/<slug>.tsx` e registrar aqui.
 */
import type { ComponentType } from 'react';
import { AtlassianToolSettings } from './settings/AtlassianToolSettings';

export interface ToolDefinition {
  id: string;
  name: string;
  tagline: string;
  summary: string;
  capabilities: string[];
  whenToUse: string[];
  limitations?: string[];
  category: 'integração' | 'interno';
  SettingsComponent: ComponentType;
}

export const TOOLS_CATALOG: ToolDefinition[] = [
  {
    id: 'atlassian',
    name: 'Jira',
    tagline: 'Integração Jira',
    summary:
      'Conecta o Sprint Flow à sua conta Atlassian via API Token. Permite vincular uma iniciativa a um chamado existente no Jira ou criar um novo issue direto do detalhe da iniciativa.',
    capabilities: [
      'Criar issues no Jira a partir de uma iniciativa, com seleção de projeto, tipo, assignee e sprint.',
      'Vincular uma iniciativa a um chamado já existente no Jira (informando a chave).',
      'Exibir badge clicável com a chave do issue no header da iniciativa.',
    ],
    whenToUse: [
      'Quando uma iniciativa estiver pronta para virar trabalho na engenharia (Story/Task no Jira).',
      'Quando o time precisar rastrear no Jira algo originado aqui no Sprint Flow.',
    ],
    limitations: [
      'Hoje cobre apenas criação e vinculação. Comentários e transições de status não estão incluídos.',
      'Cada usuário conecta a própria conta Atlassian — ações ficam atribuídas ao usuário real.',
    ],
    category: 'integração',
    SettingsComponent: AtlassianToolSettings,
  },
];

export function findTool(id: string | undefined): ToolDefinition | null {
  if (!id) return null;
  return TOOLS_CATALOG.find((t) => t.id === id) ?? null;
}
