import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Loader2,
  Search,
  ChevronRight,
  AlertCircle,
  Link as LinkIcon,
  Plus,
  ExternalLink,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { cn } from '@/lib/utils';
import {
  jiraApi,
  createJiraIssueFromInitiativeFn,
  searchJiraIssuesFn,
  type JiraIssueRow,
} from './callableApi';
import { JiraIcon } from './JiraIcon';
import { useUserSettings } from '@/features/settings/useUserSettings';
import type {
  JiraProject,
  JiraIssueType,
  JiraUser,
  JiraSprint,
} from '@maycon/atlassian-ui';

interface Props {
  open: boolean;
  onClose: () => void;
  initialTitle: string;
  initialDescription: string;
  onLinked: (result: { issueKey: string; issueUrl: string; created: boolean }) => void | Promise<void>;
}

type Tab = 'link' | 'create';

const DEFAULT_TYPE_PRIORITY = ['Story', 'Task', 'Epic', 'Bug'];

function translateError(err: unknown): string {
  if (err instanceof FirebaseError) {
    const code = err.code.replace(/^functions\//, '');
    const msg = err.message;
    if (code === 'internal' && (!msg || msg === 'internal' || msg === 'INTERNAL')) {
      return 'A função no servidor não respondeu. Verifique o deploy.';
    }
    return msg || `Erro: ${code}`;
  }
  return err instanceof Error ? err.message : String(err);
}

export function JiraConnectDialog({ open, onClose, initialTitle, initialDescription, onLinked }: Props) {
  const { atlassian } = useUserSettings();

  // ===== Projeto (compartilhado entre tabs) =====
  const [projects, setProjects] = useState<JiraProject[] | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectKey, setProjectKey] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [projectPickerOpen, setProjectPickerOpen] = useState(true);

  // ===== Aba ativa =====
  const [tab, setTab] = useState<Tab>('link');

  // ===== Issue types (para ambos: filtro na aba link, escolha na aba create) =====
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[] | null>(null);
  const [issueTypesError, setIssueTypesError] = useState<string | null>(null);
  const [createIssueType, setCreateIssueType] = useState('');
  const [linkIssueTypeFilter, setLinkIssueTypeFilter] = useState<string>(''); // '' = todos
  const [linkAssigneeFilter, setLinkAssigneeFilter] = useState<string>(''); // '' = todos, 'unassigned' especial

  // ===== Aba LINK =====
  const [linkQuery, setLinkQuery] = useState('');
  const [linkResults, setLinkResults] = useState<JiraIssueRow[] | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // ===== Aba CREATE =====
  const cleanDescription = useMemo(
    () => initialDescription.replace(/^\s*#\s+[^\n]*\n+/, '').trim(),
    [initialDescription],
  );
  const [summary, setSummary] = useState(initialTitle);
  const [users, setUsers] = useState<JiraUser[] | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState('');
  const [sprints, setSprints] = useState<JiraSprint[] | null>(null);
  const [sprintId, setSprintId] = useState<number | ''>('');
  const [labels, setLabels] = useState('');

  // ===== Submit state =====
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ key: string; url: string; created: boolean } | null>(null);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setProjects(null);
    setProjectsError(null);
    setProjectKey('');
    setProjectFilter('');
    setProjectPickerOpen(true);
    setTab('link');
    setIssueTypes(null);
    setIssueTypesError(null);
    setCreateIssueType('');
    setLinkIssueTypeFilter('');
    setLinkAssigneeFilter('');
    setLinkQuery('');
    setLinkResults(null);
    setLinkError(null);
    setSummary(initialTitle);
    setUsers(null);
    setUsersError(null);
    setAssigneeId('');
    setSprints(null);
    setSprintId('');
    setLabels('');
    setSubmitting(false);
    setSubmitError(null);
    setSuccess(null);

    let cancelled = false;
    jiraApi
      .listProjects()
      .then((res) => {
        if (!cancelled) setProjects(res.projects);
      })
      .catch((err) => {
        if (!cancelled) {
          setProjectsError(translateError(err));
          setProjects([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, initialTitle]);

  // Quando o projeto muda: carrega tipos, usuários, sprints, e busca inicial
  useEffect(() => {
    if (!projectKey) {
      setIssueTypes(null);
      setUsers(null);
      setSprints(null);
      setLinkResults(null);
      return;
    }
    let cancelled = false;

    setIssueTypes(null);
    setIssueTypesError(null);
    jiraApi
      .listIssueTypes({ projectKey })
      .then((res) => {
        if (cancelled) return;
        const types = res.issueTypes.filter((t) => !t.subtask);
        setIssueTypes(types);
        const def = DEFAULT_TYPE_PRIORITY.map((n) => types.find((t) => t.name === n)).find(Boolean);
        setCreateIssueType(def?.name ?? types[0]?.name ?? '');
      })
      .catch((err) => {
        if (!cancelled) {
          setIssueTypesError(translateError(err));
          setIssueTypes([]);
        }
      });

    setUsers(null);
    setUsersError(null);
    jiraApi
      .listAssignableUsers({ projectKey })
      .then((res) => {
        if (cancelled) return;
        setUsers(res.users);
        const userEmail = atlassian.email?.toLowerCase();
        const me =
          (userEmail && res.users.find((u) => u.emailAddress?.toLowerCase() === userEmail)) || null;
        if (me) setAssigneeId(me.accountId);
      })
      .catch((err) => {
        if (!cancelled) {
          setUsersError(translateError(err));
          setUsers([]);
        }
      });

    setSprints(null);
    jiraApi
      .listSprints?.({ projectKey })
      .then((res) => {
        if (!cancelled) setSprints(res.sprints);
      })
      .catch(() => {
        if (!cancelled) setSprints([]);
      });

    return () => {
      cancelled = true;
    };
  }, [projectKey, atlassian.email]);

  // Disparo de busca na aba link (debounce simples)
  useEffect(() => {
    if (!projectKey || tab !== 'link') return;
    let cancelled = false;
    setLinkLoading(true);
    setLinkError(null);
    const t = window.setTimeout(async () => {
      try {
        const res = await searchJiraIssuesFn({
          projectKey,
          query: linkQuery.trim() || undefined,
          issueType: linkIssueTypeFilter || undefined,
          assigneeAccountId: linkAssigneeFilter || undefined,
          excludeClosedSprints: true,
          maxResults: 25,
        });
        if (!cancelled) setLinkResults(res.data.issues);
      } catch (err) {
        if (!cancelled) {
          setLinkError(translateError(err));
          setLinkResults([]);
        }
      } finally {
        if (!cancelled) setLinkLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [projectKey, tab, linkQuery, linkIssueTypeFilter, linkAssigneeFilter]);

  const filteredProjects = useMemo(() => {
    if (!projects) return null;
    const q = projectFilter.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) => p.key.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    );
  }, [projects, projectFilter]);

  const selectedProject = useMemo(
    () => projects?.find((p) => p.key === projectKey) ?? null,
    [projects, projectKey],
  );

  const handleLinkExisting = async (issue: JiraIssueRow) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onLinked({ issueKey: issue.key, issueUrl: issue.url, created: false });
      setSuccess({ key: issue.key, url: issue.url, created: false });
    } catch (err) {
      setSubmitError(translateError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!projectKey || !createIssueType || !summary.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await createJiraIssueFromInitiativeFn({
        projectKey,
        issueType: createIssueType,
        summary: summary.trim(),
        description: cleanDescription,
        labels: labels.split(',').map((l) => l.trim()).filter(Boolean),
        assigneeAccountId: assigneeId || undefined,
        sprintId: typeof sprintId === 'number' ? sprintId : undefined,
      });
      const result = { key: res.data.issueKey, url: res.data.issueUrl, created: true };
      await onLinked({ issueKey: result.key, issueUrl: result.url, created: true });
      setSuccess(result);
    } catch (err) {
      setSubmitError(translateError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Esc fecha
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-50">
              <JiraIcon size={16} />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-bold text-slate-900">Conectar ao Jira</h2>
              <p className="text-[11px] font-medium text-slate-500">
                Vincule esta iniciativa a um chamado existente ou crie um novo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </header>

        {/* Success view */}
        {success ? (
          <div className="flex-1 px-6 py-10 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="mb-1 text-base font-bold text-slate-900">
              {success.created ? 'Issue criado e vinculado' : 'Iniciativa vinculada'}
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              <span className="font-mono font-semibold text-slate-700">{success.key}</span>
            </p>
            <div className="flex items-center justify-center gap-2">
              <a
                href={success.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Abrir no Jira <ExternalLink size={12} />
              </a>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
              >
                Pronto
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Project picker (compartilhado) */}
            <div className="border-b border-slate-100 px-6 py-4">
              <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
                Quadro (projeto Jira)
              </label>

              {projectsError && (
                <div className="mb-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle size={13} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                  {projectsError}
                </div>
              )}
              {!projects && !projectsError && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-500">
                  <Loader2 size={13} className="animate-spin" /> Carregando projetos…
                </div>
              )}

              {selectedProject && !projectPickerOpen && (
                <button
                  type="button"
                  onClick={() => setProjectPickerOpen(true)}
                  className="group flex w-full items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-left transition-colors hover:bg-sky-100"
                >
                  {selectedProject.avatarUrl ? (
                    <img src={selectedProject.avatarUrl} alt="" className="h-6 w-6 rounded" />
                  ) : (
                    <div className="grid h-6 w-6 place-items-center rounded bg-sky-200 text-[10px] font-bold text-sky-800">
                      {selectedProject.key.slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-1 leading-tight">
                    <div className="text-sm font-bold text-sky-900">{selectedProject.name}</div>
                    <div className="font-mono text-[10px] text-sky-700">{selectedProject.key}</div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 opacity-0 group-hover:opacity-100">
                    Trocar
                  </span>
                  <ChevronRight size={13} strokeWidth={2.5} className="text-sky-500" />
                </button>
              )}

              {projects && projects.length > 0 && projectPickerOpen && (
                <>
                  <div className="relative mb-2">
                    <Search
                      size={12}
                      strokeWidth={2.5}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      autoFocus
                      value={projectFilter}
                      onChange={(e) => setProjectFilter(e.target.value)}
                      placeholder="Filtrar por nome ou chave…"
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-100">
                    {filteredProjects?.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-slate-400">Nenhum match.</p>
                    ) : (
                      filteredProjects?.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => {
                            setProjectKey(p.key);
                            setProjectPickerOpen(false);
                            setProjectFilter('');
                          }}
                          className={`flex w-full items-center gap-2 border-b border-slate-50 px-3 py-2 text-left text-xs transition-colors last:border-b-0 ${
                            projectKey === p.key ? 'bg-sky-50 text-sky-800' : 'hover:bg-slate-50'
                          }`}
                        >
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt="" className="h-5 w-5 rounded" />
                          ) : (
                            <div className="grid h-5 w-5 place-items-center rounded bg-slate-200 text-[9px] font-bold text-slate-600">
                              {p.key.slice(0, 2)}
                            </div>
                          )}
                          <span className="flex-1 truncate font-bold text-slate-800">{p.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{p.key}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}

              {projects && projects.length === 0 && !projectsError && (
                <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Nenhum projeto Jira visível para sua conta.
                </p>
              )}
            </div>

            {/* Tabs + conteúdo */}
            {selectedProject && !projectPickerOpen && (
              <>
                <div className="flex gap-1 border-b border-slate-100 px-6 pt-3">
                  <button
                    onClick={() => setTab('link')}
                    className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-bold transition-colors ${
                      tab === 'link'
                        ? 'border-b-2 border-sky-600 text-sky-700'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <LinkIcon size={12} strokeWidth={2.5} />
                    Vincular existente
                  </button>
                  <button
                    onClick={() => setTab('create')}
                    className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-bold transition-colors ${
                      tab === 'create'
                        ? 'border-b-2 border-sky-600 text-sky-700'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Plus size={12} strokeWidth={2.5} />
                    Criar novo
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {tab === 'link' && (
                    <div className="space-y-3">
                      {/* Filtros */}
                      <div className="space-y-2">
                        <div className="relative">
                          <Search
                            size={12}
                            strokeWidth={2.5}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            value={linkQuery}
                            onChange={(e) => setLinkQuery(e.target.value)}
                            placeholder="Buscar por título ou chave (ex: PROJ-123)…"
                            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={linkIssueTypeFilter}
                            onChange={(e) => setLinkIssueTypeFilter(e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs font-medium focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                            disabled={!issueTypes || issueTypes.length === 0}
                          >
                            <option value="">Todos os tipos</option>
                            {issueTypes?.map((t) => (
                              <option key={t.id} value={t.name}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={linkAssigneeFilter}
                            onChange={(e) => setLinkAssigneeFilter(e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs font-medium focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                            disabled={!users || users.length === 0}
                          >
                            <option value="">Todos os responsáveis</option>
                            <option value="unassigned">Sem responsável</option>
                            {users?.map((u) => (
                              <option key={u.accountId} value={u.accountId}>
                                {u.displayName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Mostrando apenas chamados em backlog ou sprints ativas/futuras.
                        </p>
                      </div>

                      {/* Resultados */}
                      {linkError && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                          <AlertCircle size={13} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                          {linkError}
                        </div>
                      )}
                      {linkLoading && (
                        <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
                          <Loader2 size={13} className="animate-spin" /> Buscando…
                        </div>
                      )}
                      {!linkLoading && linkResults && linkResults.length === 0 && (
                        <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-center text-xs text-slate-500">
                          Nenhum chamado encontrado neste projeto com esses filtros.
                        </p>
                      )}
                      {!linkLoading && linkResults && linkResults.length > 0 && (
                        <div className="rounded-lg border border-slate-100 overflow-hidden">
                          {linkResults.map((iss) => (
                            <button
                              key={iss.key}
                              onClick={() => handleLinkExisting(iss)}
                              disabled={submitting}
                              className="flex w-full items-start gap-3 border-b border-slate-50 px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-sky-50 disabled:opacity-50"
                            >
                              <span className="mt-0.5 font-mono text-[10px] font-bold text-sky-700 min-w-[64px]">
                                {iss.key}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="truncate text-xs font-semibold text-slate-800">
                                  {iss.summary || '(sem título)'}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold">
                                    {iss.issueType}
                                  </span>
                                  <span>{iss.status}</span>
                                  {iss.sprintName && (
                                    <span
                                      className={cn(
                                        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold',
                                        iss.sprintState === 'active'
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : iss.sprintState === 'future'
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'bg-slate-100 text-slate-600',
                                      )}
                                      title={
                                        iss.sprintState === 'active'
                                          ? 'Sprint ativa'
                                          : iss.sprintState === 'future'
                                            ? 'Sprint futura'
                                            : 'Sprint'
                                      }
                                    >
                                      <CalendarClock size={9} strokeWidth={2.5} />
                                      {iss.sprintName}
                                    </span>
                                  )}
                                  {!iss.sprintName && (
                                    <span className="rounded bg-slate-50 px-1.5 py-0.5 text-slate-500">
                                      Backlog
                                    </span>
                                  )}
                                  {iss.assignee ? (
                                    <span className="inline-flex items-center gap-1">
                                      {iss.assigneeAvatarUrl && (
                                        <img
                                          src={iss.assigneeAvatarUrl}
                                          alt=""
                                          className="h-3.5 w-3.5 rounded-full"
                                        />
                                      )}
                                      {iss.assignee}
                                    </span>
                                  ) : (
                                    <span className="italic text-slate-400">Sem responsável</span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight size={13} className="mt-1 text-slate-400 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {tab === 'create' && (
                    <div className="space-y-4">
                      {/* Issue type */}
                      <div>
                        <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
                          Tipo de issue
                        </label>
                        {!issueTypes && !issueTypesError && (
                          <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
                            <Loader2 size={13} className="animate-spin" /> Carregando…
                          </div>
                        )}
                        {issueTypesError && (
                          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                            <AlertCircle size={13} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                            {issueTypesError}
                          </div>
                        )}
                        {issueTypes && issueTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {issueTypes.map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setCreateIssueType(t.name)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                                  createIssueType === t.name
                                    ? 'bg-sky-600 text-white shadow-sm'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {t.iconUrl && <img src={t.iconUrl} alt="" className="h-3.5 w-3.5" />}
                                {t.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <div>
                        <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
                          Resumo
                        </label>
                        <input
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                          placeholder="Título do chamado"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        />
                      </div>

                      {/* Assignee */}
                      <div>
                        <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
                          Responsável
                        </label>
                        {!users && !usersError && (
                          <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
                            <Loader2 size={13} className="animate-spin" /> Carregando…
                          </div>
                        )}
                        {users && (
                          <select
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                          >
                            <option value="">Não atribuir</option>
                            {users.map((u) => (
                              <option key={u.accountId} value={u.accountId}>
                                {u.displayName}
                                {u.emailAddress ? ` (${u.emailAddress})` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Sprint (se houver) */}
                      {sprints && sprints.length > 0 && (
                        <div>
                          <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
                            Sprint (opcional)
                          </label>
                          <select
                            value={sprintId === '' ? '' : String(sprintId)}
                            onChange={(e) => setSprintId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                          >
                            <option value="">Sem sprint</option>
                            {sprints.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} {s.state === 'active' ? '· ativa' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Labels */}
                      <div>
                        <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
                          Labels (separadas por vírgula)
                        </label>
                        <input
                          value={labels}
                          onChange={(e) => setLabels(e.target.value)}
                          placeholder="frontend, urgente"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        />
                      </div>

                      {submitError && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                          <AlertCircle size={13} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                          {submitError}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={handleCreate}
                          disabled={submitting || !createIssueType || !summary.trim()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                        >
                          {submitting ? (
                            <>
                              <Loader2 size={13} className="animate-spin" /> Criando…
                            </>
                          ) : (
                            <>
                              <Plus size={13} strokeWidth={2.5} /> Criar e vincular
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
