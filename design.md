# Sprintflow Wizard — Design System

> Documento de referência para padronização visual e de UX do produto. Toda nova tela ou componente **deve** seguir este guia. Quando houver divergência entre código existente e este documento, este documento prevalece e o código deve ser ajustado progressivamente (ver §12 — Dívidas conhecidas).

---

## 1. Princípios de Design

O Sprintflow Wizard é uma ferramenta profissional de gestão de produto e engenharia. A interface deve transmitir:

1. **Clareza operacional** — usuários (PMs, líderes técnicos, squads) tomam decisões rápidas. Densidade informacional alta, sem ruído visual.
2. **Hierarquia previsível** — toda página segue a mesma estrutura: header → KPIs/contexto → conteúdo principal → ações.
3. **Inspiração Jira / Linear** — paleta sóbria, azul como cor primária, status coloridos com significado consistente, cards com bordas suaves.
4. **Consistência de terminologia** — usar **Initiatives** para o ciclo de Produto e **Tasks/Stories** quando entra em Engenharia (vide [AI_CONTEXT.md](AI_CONTEXT.md)).
5. **i18n por padrão** — toda string visível ao usuário passa por `useTranslation()` (`react-i18next`). Nada hard-coded.

---

## 2. Stack Visual

- **Framework UI**: React + TypeScript + Vite
- **Styling**: Tailwind CSS com design tokens em [src/index.css](src/index.css) (CSS variables HSL)
- **Componentes base**: [shadcn/ui](https://ui.shadcn.com/) — toda primitiva vive em [src/components/ui/](src/components/ui/) (48 primitivas instaladas)
- **Ícones**: [`lucide-react`](https://lucide.dev/) `^0.462.0` — **único** pacote de ícones permitido
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` (padrão atual). `@hello-pangea/dnd` ainda presente em [Backlog.tsx](src/pages/Backlog.tsx) e deve ser migrado (§12).
- **Gráficos**: Recharts (via [src/components/ui/chart.tsx](src/components/ui/chart.tsx))
- **Calendário**: `react-big-calendar` (em [Calendar.tsx](src/pages/Calendar.tsx))
- **Notificações**: `useToast` ([src/hooks/use-toast.ts](src/hooks/use-toast.ts)) e `sonner` (via [src/components/ui/sonner.tsx](src/components/ui/sonner.tsx))
- **Roteamento**: `react-router-dom`
- **Tema**: `next-themes` (suporte a dark mode)
- **i18n**: `react-i18next` + `i18next-browser-languagedetector` ([src/lib/i18n.ts](src/lib/i18n.ts))

> **Regra**: nunca instalar nova lib de UI/ícones/DnD sem atualizar este documento.

---

## 3. Design Tokens

Todos os tokens são variáveis CSS em HSL definidas em [src/index.css](src/index.css) e expostas via Tailwind em [tailwind.config.ts](tailwind.config.ts). **Nunca usar cores hex/rgb hard-coded em componentes** — sempre referenciar via classes Tailwind (`bg-primary`, `text-muted-foreground`, etc.).

### 3.1 Cores semânticas (light mode)

| Token | Uso | HSL |
|---|---|---|
| `background` | Fundo da aplicação | `0 0% 100%` |
| `foreground` | Texto padrão | `222 47% 11%` |
| `card` / `popover` | Superfícies elevadas | `0 0% 100%` |
| `primary` | CTA, links, destaque (Jira blue) | `215 100% 40%` |
| `primary-foreground` | Texto sobre primary | `0 0% 100%` |
| `secondary` / `muted` / `accent` | Superfícies neutras, hover | `210 17% 95%` |
| `muted-foreground` | Texto secundário, labels | `215 14% 46%` |
| `border` / `input` | Divisores, bordas de campo | `214 15% 91%` |
| `destructive` | Ações destrutivas, erros | `0 84% 60%` |
| `ring` | Foco visível | `215 100% 40%` |

### 3.2 Cores de status

| Token | HSL (light) | HSL (dark) | Uso |
|---|---|---|---|
| `status-success` | `145 63% 42%` | `145 63% 49%` | Done, Live, Released, OK |
| `status-warning` | `38 92% 50%` | `38 92% 50%` | Atenção, Beta, Blocked leve |
| `status-danger` | `0 84% 60%` | `0 84% 60%` | Erro, Blocked crítico, Bug |
| `status-info` | `215 100% 40%` | `215 100% 50%` | Em progresso, Discovery, In Sprint |

Disponíveis como `bg-status-*`, `text-status-*`, `border-status-*`.

### 3.3 Cores de especialidade (squads/membros)

| Token | HSL | Especialidade |
|---|---|---|
| `specialty-frontend` | `262 83% 58%` | Frontend (roxo) |
| `specialty-backend` | `142 71% 45%` | Backend (verde) |
| `specialty-qa` | `24 90% 53%` | QA (laranja) |
| `specialty-design` | `280 65% 60%` | Design (magenta) |

> Toda referência a uma especialidade (badge de membro, alocação em sprint, gráfico de capacidade) **deve** usar essas cores — nunca improvisar.

### 3.4 Tema escuro

Ativado via classe `.dark` no `<html>` (gerenciado por `next-themes`). Tokens reescritos em `.dark { ... }` em [src/index.css](src/index.css). **Nunca** condicionar cores via `dark:` literal nos componentes — use os tokens semânticos.

Principais redefinições no dark:
- `background`: `222 47% 11%` · `foreground`: `210 17% 95%`
- `card`: `217 33% 17%` · `border`/`input`: `217 33% 23%`
- `primary`: `215 100% 50%` (mais clara para contraste)

### 3.5 Sidebar tokens

A Tailwind config expõe 8 tokens `sidebar-*` (`sidebar.DEFAULT`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring`). **Hoje as variáveis CSS correspondentes não estão definidas em `index.css`** (dívida técnica — §12). Até serem providas, a Sidebar usa tokens neutros (`bg-card`, `border-border`, `bg-accent`).

### 3.6 Raio, espaçamento e tipografia

- **Radius**: `--radius: 0.5rem` (`rounded-lg`); `rounded-md` = `calc(var(--radius) - 2px)`; `rounded-sm` = `calc(var(--radius) - 4px)`. Botões e inputs → `rounded-md`; cards e dialogs → `rounded-lg`.
- **Espaçamento**: múltiplos de `4px` (escala Tailwind). Padding padrão de página = `p-8`; gap entre seções = `space-y-8`; entre itens de seção = `gap-4`.
- **Container**: `container mx-auto p-8` dentro de `<main>` (já provido pelo `Layout`); breakpoint `2xl = 1400px`, padding lateral `2rem`.
- **Animações**: apenas `accordion-down` / `accordion-up` (0.2s ease-out) configuradas em `tailwind.config.ts`. Plugin `tailwindcss-animate` ativo.
- **Tipografia**:
  - Família: padrão do sistema (sans). Não importar webfonts.
  - Títulos de página: `text-2xl font-semibold tracking-tight`
  - Títulos de seção / card: `text-lg font-semibold` ou `<CardTitle>`
  - Métricas em destaque: `text-2xl font-bold`
  - Texto base: `text-sm`
  - Suporte/legenda: `text-xs text-muted-foreground`

---

## 4. Layout Global

Estrutura sempre orquestrada por [src/components/Layout.tsx](src/components/Layout.tsx):

```
┌───────────────────────────────────────────────────────┐
│ Sidebar (w-64, fixa, h-screen)  │  <main ml-64>       │
│  ├ Logo "Sprint Planner"        │   container mx-auto │
│  ├ WorkspaceSelector            │   p-8               │
│  ├ Nav (grupos colapsáveis)     │   ...children       │
│  └ SettingsDialog               │                     │
└───────────────────────────────────────────────────────┘
```

### 4.1 Sidebar ([src/components/Sidebar.tsx](src/components/Sidebar.tsx))

- Largura fixa `w-64`, `fixed left-0 top-0 h-screen`, fundo `bg-card`, borda `border-r border-border`.
- Header `h-16` com logo `text-xl text-primary` ("Sprint Planner").
- `<WorkspaceSelector />` logo abaixo do header.
- **Grupos** (Product & Strategy, Planning & Execution, Team & Admin) colapsáveis com estado persistido em `localStorage` (`productOpen`, `executionOpen`, `teamOpen`) e indicador `ChevronDown/ChevronRight`.
- Itens: `text-sm font-medium`, ícone `h-5 w-5` à esquerda, subitens com `pl-9`.
  - Hover: `hover:bg-accent hover:text-accent-foreground`
  - Ativo (top-level): `bg-primary text-primary-foreground`
  - Ativo (subitem): `bg-primary/10 text-primary`
- Visibilidade controlada por `hasPermission(feature, 'view')` — todo novo item de menu deve declarar `feature` quando aplicável.
- Rodapé: `<SettingsDialog />`. **Não há toggle de tema na sidebar** — o controle vive dentro de Settings (via `next-themes`).

### 4.2 Padrão de página

Toda nova página segue:

```tsx
<Layout>
  <div className="space-y-8">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('page.title')}</h1>
        <p className="text-muted-foreground">{t('page.subtitle')}</p>
      </div>
      <div className="flex gap-2">{/* ações primárias */}</div>
    </div>

    {/* (opcional) KPIs */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{/* Cards */}</div>

    {/* (opcional) Filtros / abas */}

    {/* Conteúdo principal */}
  </div>
</Layout>
```

Páginas de referência (boas implementações): [Index.tsx](src/pages/Index.tsx), [ProductBacklog.tsx](src/pages/ProductBacklog.tsx).

### 4.3 Responsividade

- Breakpoints Tailwind padrão (`sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1400`).
- Grids de KPI: `grid gap-4 md:grid-cols-2 lg:grid-cols-4`.
- Sidebar desktop é fixa (`md:ml-64` no `<main>`); mobile usa [`<MobileSidebar>`](src/components/MobileSidebar.tsx) que renderiza um header `sticky top-0 h-14` com hamburger, abrindo a navegação dentro de um `<Sheet>` à esquerda. O conteúdo da sidebar vive em `<SidebarContent>` (reutilizado por desktop e mobile); passa-se `onNavigate` para fechar o Sheet ao clicar em um item.

---

## 5. Componentes — Catálogo e Regras de Uso

> **Regra mestra**: importar sempre de `@/components/ui/*`. Nunca instanciar `<button>` HTML cru — use `<Button>`.

Primitivas instaladas (48): `accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input`, `input-otp`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `toggle`, `toggle-group`, `tooltip`.

### 5.1 Button ([src/components/ui/button.tsx](src/components/ui/button.tsx))

| Variant | Uso |
|---|---|
| `default` | Ação primária da tela (1 por contexto) |
| `outline` | Ações secundárias |
| `secondary` | Ações neutras agrupadas |
| `ghost` | Ações em toolbars, dentro de cards |
| `destructive` | Excluir, cancelar com perda de dados |
| `link` | Navegação inline |

Tamanhos: `default` (h-10), `sm` (h-9), `lg` (h-11), `icon` (h-10 w-10 — usar quando o conteúdo for **apenas** um `lucide` icon, sempre com `aria-label`).

Convenções:
- Ícone à esquerda do label: `<Plus className="mr-2 h-4 w-4" />` (size 16 — não usar 20 dentro de botões médios).
- Toda action que dispara mutação deve ter estado de loading (desabilitar botão + opcionalmente trocar label).

### 5.2 Card ([src/components/ui/card.tsx](src/components/ui/card.tsx))

Estrutura canônica:
```tsx
<Card>
  <CardHeader>
    <CardTitle>...</CardTitle>
    <CardDescription>...</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

- **KPI Card**: header com `flex flex-row items-center justify-between space-y-0 pb-2`, título `text-sm font-medium`, ícone `h-4 w-4 text-muted-foreground`, valor `text-2xl font-bold`, descrição `text-xs text-muted-foreground`.
- **Card de destaque** (CTA, atalho): `bg-primary/5 border-primary/20`.

### 5.3 Inputs e Forms

- **Sempre** usar componentes shadcn: `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup`, `Label`, `Form` (react-hook-form).
- Labels acima dos inputs, `text-sm font-medium`.
- Diálogos de criar/editar entidades seguem o padrão `EntityFormDialog` (ex.: `InitiativeFormDialog`, `SprintFormDialog`, `MemberFormDialog`, `SquadFormDialog`).

**Padrão de validação** (aplicar em todo novo form):

```tsx
const form = useForm({ resolver: zodResolver(schema), mode: 'onBlur' });

// Required field
<Label htmlFor="name" required>Name</Label>
<Input id="name" autoFocus error={!!errors.name} {...register('name')} />
{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}

// Submit
<Button type="submit"
  disabled={form.formState.isSubmitting || (form.formState.isSubmitted && !form.formState.isValid)}
>Save</Button>
```

- `mode: 'onBlur'` — feedback aparece quando o usuário sai do campo, não só após submit.
- `<Label required>` — adiciona asterisco vermelho automaticamente.
- `<Input error>` / `<Textarea error>` — borda destrutiva + ring vermelho. Ambos também auto-detectam `aria-invalid` injetado por `<FormControl>` (shadcn `<Form>`), então em forms baseados em `<FormField>`/`<FormControl>`/`<FormMessage>` o styling acontece sem props adicionais — basta usar `<FormLabel required>` e o `<FormMessage />` cuida do texto de erro.
- Submit `disabled` quando `isSubmitting` ou (`isSubmitted && !isValid`) — evita reenvios e sinaliza que falta correção.
- `autoFocus` no primeiro input — usuário começa a digitar imediatamente.

### 5.4 Dialog / AlertDialog / Sheet / Drawer

- **Dialog**: criar/editar entidade complexa (forms longos).
- **AlertDialog**: confirmações destrutivas ou de irreversibilidade ("Promover para Engenharia", "Excluir"). Action principal usa `variant="destructive"` quando aplicável.
- **Sheet**: panel lateral (filtros avançados, detalhes secundários, futuro mobile sidebar).
- **Drawer**: experiências mobile-first (raro hoje).

### 5.5 Tabs

- Usadas para alternar **visões do mesmo dado** (ex.: Kanban × Lista × Timeline em ProductBacklog), **não** para navegação entre páginas — para isso, sidebar.
- Padrão: `<Tabs defaultValue="..."><TabsList><TabsTrigger /></TabsList><TabsContent /></Tabs>`.

### 5.6 Badge

- Status do ciclo de vida: usar cores `status-*`.
- Tipo de initiative (Feature/Bug/TechDebt/Spike): cor consistente — definir mapping em utilitário compartilhado (`src/lib/ui-mappings.ts` — a criar, §11).
- Prioridade: High → `status-danger`, Medium → `status-warning`, Low → `muted`.

### 5.7 Table

- Usar quando a comparação coluna a coluna for o caso de uso primário.
- Header `<TableHeader>` com `text-xs uppercase text-muted-foreground` é aceitável para densidade alta.
- Linhas clicáveis: `hover:bg-muted/50 cursor-pointer`.

### 5.8 Kanban (DnD)

Padrão estabelecido em [ProductBacklog.tsx](src/pages/ProductBacklog.tsx) e [KanbanBoard.tsx](src/components/KanbanBoard.tsx):

- `DndContext` (`@dnd-kit/core`) com `closestCorners`, sensores `Pointer + Keyboard`.
- Coluna = `<Card>` com header (título + contador), lista vertical com `SortableContext` + `verticalListSortingStrategy`.
- `DragOverlay` para feedback visual durante o drag.
- Cards usam `useSortable`; ao arrastar, aplicar `opacity-50` na origem.
- Mudança de coluna = mudança de status no domínio + toast de confirmação.

> [Backlog.tsx](src/pages/Backlog.tsx) ainda usa `@hello-pangea/dnd` — migrar para `@dnd-kit` (§12).

### 5.9 Toast

- Sucesso: `toast({ title })` curto e direto (preferir `useToast` para consistência com Radix).
- Erro: `toast({ variant: 'destructive', title, description })` com explicação acionável.
- `sonner` é aceitável para feedback leve/transiente; **não misturar os dois padrões em uma mesma tela**.
- **Nunca** usar `alert()` / `confirm()` nativos.

### 5.10 Ícones

- Tamanhos canônicos: `h-4 w-4` (inline em botões/labels), `h-5 w-5` (sidebar/menus), `h-6 w-6` (headers de seção opcionais).
- Cor por padrão herda do texto; em estados neutros usar `text-muted-foreground`.
- Ícones semânticos recorrentes (manter consistência):
  - `LayoutDashboard` — Dashboard
  - `Target` — Strategy/Produto
  - `Lightbulb` — Initiative/Discovery
  - `ListTodo` — Backlog
  - `Calendar` — Sprint/Calendário
  - `Package` — Releases/Modules
  - `Users` — Team/Squads
  - `Code2` — Engenharia
  - `Activity` — Métricas/Saúde
  - `Plus` — Criar
  - `Settings` — Configurações

---

## 6. Padrões de Estado

| Estado | Tratamento | Componente canônico |
|---|---|---|
| **Loading** | Skeleton com a forma do conteúdo final. Nunca spinner solto em página inteira. | `<PageSkeleton variant="page \| kpi \| table \| kanban \| cards" />` |
| **Empty** | Card centralizado com ícone (`h-12 w-12 text-muted-foreground`), título, descrição curta, CTA primária. | `<EmptyState icon={...} title description action />` |
| **Confirmação destrutiva** | AlertDialog com título + descrição + action `destructive`. **Nunca** `alert()`/`confirm()` nativos. | `useConfirm()` hook (imperativo) |
| **Error** | `Alert variant="destructive"` no topo da seção afetada + opção de retry. | `<Alert variant="destructive" />` |
| **Permission denied** | Item simplesmente não renderiza (filtragem por `hasPermission`). | — |

Componentes vivem em [src/components/ui-patterns/](src/components/ui-patterns/) e são re-exportados pelo barrel `index.ts`:

```tsx
import { EmptyState, PageSkeleton, useConfirm } from '@/components/ui-patterns';

// Empty
<EmptyState
  icon={Lightbulb}
  title={t('initiatives.emptyTitle')}
  description={t('initiatives.emptyDesc')}
  action={<Button onClick={create}><Plus className="mr-2 h-4 w-4" />New</Button>}
/>

// Loading
{isLoading ? <PageSkeleton variant="kanban" count={4} /> : <Board />}

// Confirm
const confirm = useConfirm();
const ok = await confirm({
  title: t('docs.confirmDeleteTitle'),
  description: t('docs.confirmDeleteDesc'),
  confirmLabel: t('common.delete'),
});
if (ok) doDelete();
```

`<ConfirmProvider>` é montado uma vez em [App.tsx](src/App.tsx); o hook `useConfirm()` funciona em qualquer página descendente.

---

## 7. Acessibilidade

- Todo controle interativo deve ser acessível por teclado (foco visível via `ring`).
- `aria-label` obrigatório em botões só-ícone.
- Contraste mínimo AA — não criar variantes de cor fora dos tokens sem validar contraste.
- Diálogos: focus trap (já provido pelo Radix); fechar com `Esc`.
- DnD: o sensor de teclado já está configurado em `@dnd-kit` — preservá-lo em qualquer novo board.

---

## 8. Internacionalização

- Toda string visível: `const { t } = useTranslation(); t('namespace.key')`.
- Setup em [src/lib/i18n.ts](src/lib/i18n.ts), bundles em [src/locales/en.ts](src/locales/en.ts) e [src/locales/pt.ts](src/locales/pt.ts) — ambos os arquivos devem ter chaves espelhadas.
- Datas: usar `date-fns` com locale apropriado; nunca concatenar strings de data manualmente.
- Pluralização: `t('key', { count })` com chaves `_one`/`_other`.
- 29 arquivos hoje usam `useTranslation()`. Páginas com strings cruas em pt-BR (a corrigir, §12): `Sprints.tsx`, `Releases.tsx`, `Calendar.tsx`, `DocumentationHub.tsx`, `FormsManagement.tsx`, `UsersManagement.tsx`, `SeedData.tsx`, `DocumentEditor.tsx`, `SquadFormDialog.tsx`.

---

## 9. Convenções de Código (UI)

- Utilitário `cn()` ([src/lib/utils.ts](src/lib/utils.ts)) para concatenar classes condicionais — nunca template strings cruas.
- Composição > customização: estender via `className`, não duplicar primitivas.
- Variantes: usar `cva` (já presente em primitivas shadcn) quando criar componente com >2 variações visuais.
- Não criar arquivo CSS por componente — Tailwind apenas. Exceções: animações complexas via `tailwind.config.ts > keyframes`.
- Ordem de imports nos componentes de página: React → libs externas → `@/components/ui` → `@/components/*` → `@/hooks` → `@/types` → `@/utils` → ícones `lucide-react`.
- `App.css` só deve conter resets globais — **resíduos do template Vite (`#646cffaa`, `#61dafbaa`, `#888`) devem ser removidos**.

---

## 10. Anti-padrões (não fazer)

- ❌ Cores hex/rgb hard-coded (`bg-[#1e40af]`, `style={{ color: '#ef4444' }}`).
- ❌ `<button>` HTML puro em vez de `<Button>`.
- ❌ Misturar libs de ícones (heroicons, react-icons) com `lucide-react`.
- ❌ Misturar libs de DnD (`@hello-pangea/dnd` + `@dnd-kit`) — padrão é `@dnd-kit`.
- ❌ Strings hard-coded em português/inglês — sempre `t()`.
- ❌ Cards sem `<CardHeader>`/`<CardContent>` — quebra hierarquia visual.
- ❌ `alert()` / `confirm()` nativos.
- ❌ Margens negativas para "consertar" layout — ajustar a estrutura.
- ❌ Criar nova primitiva quando já existe equivalente em `components/ui/`.
- ❌ Estados de loading com texto "Carregando..." sem skeleton.
- ❌ Usar `dark:` literal nos componentes — usar tokens semânticos.

---

## 11. Roadmap de Adoção

1. **Auditoria por página** — comparar cada arquivo em `src/pages/` (24 páginas) com este guia, listar desvios.
2. **Padronizar headers de página** — garantir o trio `h1 + subtitle + ações` em todas.
3. **Consolidar mapping de cores por status/prioridade/tipo** em `src/lib/ui-mappings.ts` (a criar) — eliminar duplicação espalhada.
4. **Extrair componentes recorrentes**: ✅ `EmptyState`, `PageSkeleton`, `ConfirmDialog/useConfirm` já em [src/components/ui-patterns/](src/components/ui-patterns/). Pendente: `PageHeader`, `KpiCard`, `StatusBadge`, `PriorityBadge`.
5. **Validar contraste e dark mode** em todas as telas.
6. **Mobile**: introduzir Sidebar off-canvas via `Sheet` sem regredir desktop.

---

## 12. Dívidas conhecidas (auditoria 2026-05-04)

Itens identificados que violam este guia. Marcados ✅ os já endereçados nesta rodada; ⏳ pendentes.

| # | Arquivo / Local | Violação | Status |
|---|---|---|---|
| 1 | `tailwind.config.ts` ↔ [src/index.css](src/index.css) | 8 tokens `sidebar-*` referenciados sem variáveis CSS correspondentes | ✅ Variáveis adicionadas em `:root` e `.dark` |
| 2 | [ReleaseFormDialog.tsx](src/components/ReleaseFormDialog.tsx) | 7 hex em `colorPresets` + cor default | ✅ Reclassificado: são valores de **dado** (paleta escolhida pelo usuário e persistida no release), não styling — não viola o guia |
| 3 | [StrategyMap.tsx](src/components/strategy/StrategyMap.tsx) | 11 hex hard-coded em estilos de nodes/edges do React Flow | ✅ Migrado para `hsl(var(--token))` (specialty-frontend, status-success/danger/info, border, muted-foreground, card) — agora reage a dark mode |
| 4 | `src/App.css` | Cores residuais do template Vite | ✅ Arquivo deletado (não era importado em lugar nenhum) |
| 5 | [Backlog.tsx](src/pages/Backlog.tsx) | Usa `@hello-pangea/dnd` em vez de `@dnd-kit` | ✅ Migrado para `@dnd-kit` (PointerSensor + KeyboardSensor + closestCorners + DragOverlay). Pacote `@hello-pangea/dnd` removido do `package.json`. Cores de prioridade/tipo agora usam tokens `status-*` |
| 6 | `alert()` / `confirm()` nativos em vários arquivos | Substituir por toast/AlertDialog | ✅ `alert()` em [SquadFormDialog.tsx](src/components/SquadFormDialog.tsx) → `toast`. Todos 5 `confirm()` nativos ([DocumentationHub](src/pages/DocumentationHub.tsx), [DocumentEditor](src/pages/DocumentEditor.tsx), [FormsManagement](src/pages/FormsManagement.tsx), [UsersManagement](src/pages/UsersManagement.tsx), [SeedData](src/pages/SeedData.tsx)) → `useConfirm()` hook centralizado. Zero uso nativo no código |
| 7 | i18n em arquivos com strings cruas | Extrair para `src/locales/{en,pt}.ts` | ✅ [SquadFormDialog.tsx](src/components/SquadFormDialog.tsx) (namespace `squadForm`) e [Releases.tsx](src/pages/Releases.tsx) (namespace `releases`) migrados. ⏳ Pendente: `Sprints.tsx`, `Calendar.tsx`, `SeedData.tsx` (sem `useTranslation`); revisar strings residuais em `DocumentationHub.tsx`, `FormsManagement.tsx`, `UsersManagement.tsx`, `DocumentEditor.tsx` (já usam i18n parcial) |
| 8 | [Layout.tsx](src/components/Layout.tsx) | `ml-64` fixo no `<main>` quebra mobile | ✅ Mitigado: `<main>` usa `md:ml-64`, padding `p-4 md:p-8`; Sidebar com `hidden md:block`. Off-canvas mobile via `Sheet` ainda pendente |
| 9 | `useToast` × `sonner` | `TaskDateChangeDialog.tsx` e `WorkspaceDialog.tsx` usavam sonner direto | ✅ Migrados para `useToast`. Sonner permanece apenas como `Toaster` global em `App.tsx` |

---

## 13. Auditoria de usabilidade — gargalos mapeados (2026-05-04)

Avaliação contra os princípios das skills `product-design` (em [skills/product-design/](skills/product-design/)) e checklist `ui-visual-validator`. Itens marcados ✅ já endereçados; ⏳ pendentes.

### Críticos (impacto no "first 5 minutes")

| # | Onde | Problema | Status |
|---|---|---|---|
| C1 | [Index.tsx](src/pages/Index.tsx) | Workspace vazio mostra Dashboard com KPIs zerados, sem onboarding guiado | ⏳ Implementar fluxo "Bem-vindo → criar squad → planejar sprint → adicionar iniciativa" |
| C2 | Empty states em texto puro | Sem ilustração nem CTA — usuário não sabe próximo passo | ✅ Componente `<EmptyState>` criado em `ui-patterns/`. Adotado em [Releases.tsx](src/pages/Releases.tsx) e [InitiativesOverview.tsx](src/pages/InitiativesOverview.tsx). ⏳ Adotar em ProductBacklog, Sprints, Squads, Team, Calendar, FormsManagement |
| C3 | ProductBacklog/Sprints/KanbanBoard | Loading silencioso (renderiza vazio enquanto data carrega) | ✅ Componente `<PageSkeleton>` criado com variantes `page \| kpi \| table \| kanban \| cards`. Adotado em [ProductBacklog.tsx](src/pages/ProductBacklog.tsx) (kanban), [Backlog.tsx](src/pages/Backlog.tsx) (kpi+kanban), [InitiativesOverview.tsx](src/pages/InitiativesOverview.tsx) (page), [DocumentationHub.tsx](src/pages/DocumentationHub.tsx) (cards) e [Releases.tsx](src/pages/Releases.tsx) (cards) usando o flag `loading` do `useFirestoreData`. ⏳ Pendente: Sprints, SprintPlanning, Calendar, Squads, Team, FormsManagement, UsersManagement |

### Alta severidade

| # | Onde | Problema | Status |
|---|---|---|---|
| H1 | TaskFormDialog, SprintFormDialog, SquadFormDialog | Validação só após submit, sem indicação visual no input, submit não desabilita | ✅ Primitivas `<Input>`, `<Textarea>`, `<Label>`, `<FormLabel>` em [src/components/ui/](src/components/ui/) ganharam props `error` e `required`. `Input`/`Textarea` auto-detectam `aria-invalid` injetado pelo `<FormControl>` (shadcn `<Form>`) — toda página que usa `<Form>` herda o styling de erro automaticamente. Validação alterada para `mode: 'onBlur'`. Submit fica `disabled` quando o form já foi submetido e está inválido. Asterisco vermelho em required via `<Label required>` ou `<FormLabel required>`. `autoFocus` no primeiro input |
| H2 | DocumentationHub, DocumentEditor, FormsManagement, UsersManagement, SeedData | `window.confirm()` em ações destrutivas | ✅ Hook `useConfirm()` + `<ConfirmProvider>` no App.tsx — todos os 5 lugares migrados |
| H3 | [WorkspaceSelector.tsx](src/components/workspace/WorkspaceSelector.tsx) | Dropdown sem rótulo destacado, troca de workspace pouco descobrível | ✅ Trigger redesenhado: ícone `Building2` em chip `bg-primary/10` à esquerda, label "WORKSPACE" + nome em hierarquia clara, `<Tooltip>` "Switch Workspace" no hover, `aria-label` para a11y |
| H4 | [Layout.tsx](src/components/Layout.tsx) | Mobile sem nenhuma navegação (sidebar `hidden md:block`) | ✅ [`<MobileSidebar>`](src/components/MobileSidebar.tsx) criado com `<Sheet>` off-canvas + botão hamburger. Sidebar refatorada para expor `<SidebarContent onNavigate>` reutilizado em ambos os contextos; o Sheet fecha automaticamente ao navegar |

### Média

| # | Onde | Problema | Sugestão |
|---|---|---|---|
| M1 | [Index.tsx](src/pages/Index.tsx) KPIs | Números crus sem meta/trend ("4" vs "4 of 6 (67%) ↑") | Subtítulo contextual + indicador de tendência |
| M2 | [breadcrumb.tsx](src/components/ui/breadcrumb.tsx) existe, zero uso | Rotas aninhadas (ex.: `/sprints/:id/planning`) sem orientação | Adotar Breadcrumb em SprintPlanning, SprintSummary, ReleaseDetail, DocumentEditor, SquadMembers |
| M3 | InitiativesOverview, FormsManagement, UsersManagement | Sem bulk actions em tabelas | Coluna de checkbox + barra "N selected" com ações |
| M4 | Tabelas em geral | Sem hover/zebra, scan difícil em listas longas | Aplicar `hover:bg-muted/50` em todas `<TableRow>` clicáveis. ✅ Já feito em InitiativesOverview |
| M5 | SprintCard, Index | Datas inconsistentes (`dd/MM/yyyy` vs `toLocaleDateString()`) | Util `formatDate()` em `src/lib/date-utils.ts` |

### Baixa

| # | Onde | Problema | Sugestão |
|---|---|---|---|
| L1 | ProductBacklog, SprintCard | Botões só-ícone sem `aria-label` | Adicionar `aria-label` em todos `Button size="icon"` |
| L2 | Dialogs em geral | Sem `autoFocus` no primeiro input | Adicionar `autoFocus` no campo principal |
| L3 | [Index.tsx](src/pages/Index.tsx) Quick Actions | Hierarquia de botões inconsistente (mistura `outline` com `default`) | Ação primária por contexto = 1 botão `default`, demais `outline` |

> Skills usadas para esta auditoria estão copiadas em [skills/product-design/](skills/product-design/), [skills/ui-ux-designer/](skills/ui-ux-designer/), [skills/ui-skills/](skills/ui-skills/), [skills/ui-visual-validator/](skills/ui-visual-validator/).

---

**Última atualização**: 2026-05-04
