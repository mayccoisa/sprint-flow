import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronRight,
  UserCircle2,
  CalendarClock,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { JiraIcon } from './JiraIcon';
import { GhostButtonSm, PrimaryButton, SecondaryButton } from './buttons';
import type {
  JiraApi,
  JiraIssueDraft,
  JiraIssueType,
  JiraProject,
  JiraSprint,
  JiraUser,
} from './types';

export interface JiraSendDialogProps {
  open: boolean;
  onClose: () => void;
  api: JiraApi;
  onSubmit: (draft: JiraIssueDraft) => Promise<{ issueKey: string; issueUrl: string }>;
  initialTitle: string;
  initialDescription: string;
  /** Used to pre-select the assignee whose email matches the connected user. */
  currentUserEmail?: string;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; issueKey: string; issueUrl: string }
  | { kind: 'error'; message: string };

const DEFAULT_TYPE_PRIORITY = ['Story', 'Task', 'Epic', 'Bug'];

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim()) return m;
  }
  return 'Erro desconhecido';
}

export function JiraSendDialog({
  open,
  onClose,
  api,
  onSubmit,
  initialTitle,
  initialDescription,
  currentUserEmail,
}: JiraSendDialogProps) {
  // Projetos
  const [projects, setProjects] = useState<JiraProject[] | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectKey, setProjectKey] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [projectPickerOpen, setProjectPickerOpen] = useState(true);

  // Issue types
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[] | null>(null);
  const [issueTypesError, setIssueTypesError] = useState<string | null>(null);
  const [issueType, setIssueType] = useState('');

  // Usuários
  const [users, setUsers] = useState<JiraUser[] | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [userFilter, setUserFilter] = useState('');

  // Sprints (opcional — só carrega se api.listSprints existir)
  const [sprints, setSprints] = useState<JiraSprint[] | null>(null);
  const [sprintsError, setSprintsError] = useState<string | null>(null);
  const [sprintId, setSprintId] = useState<number | ''>('');

  const [summary, setSummary] = useState(initialTitle);
  const [labels, setLabels] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const description = useMemo(
    () => initialDescription.replace(/^\s*#\s+[^\n]*\n+/, '').trim(),
    [initialDescription],
  );

  // Reset ao abrir + carregar projetos
  useEffect(() => {
    if (!open) return;
    setProjectKey('');
    setProjectFilter('');
    setProjectPickerOpen(true);
    setIssueTypes(null);
    setIssueType('');
    setUsers(null);
    setAssigneeId('');
    setUserPickerOpen(false);
    setUserFilter('');
    setSprints(null);
    setSprintId('');
    setSprintsError(null);
    setSummary(initialTitle);
    setLabels('');
    setStatus({ kind: 'idle' });
    setProjectsError(null);
    setIssueTypesError(null);
    setUsersError(null);

    let cancelled = false;
    setProjects(null);
    api
      .listProjects()
      .then((res) => {
        if (cancelled) return;
        setProjects(res.projects);
      })
      .catch((err) => {
        if (cancelled) return;
        setProjectsError(errorMessage(err));
        setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, initialTitle, api]);

  // Issue types + users quando projeto muda
  useEffect(() => {
    if (!projectKey) {
      setIssueTypes(null);
      setIssueType('');
      setUsers(null);
      setAssigneeId('');
      setSprints(null);
      setSprintId('');
      return;
    }
    let cancelled = false;

    setIssueTypes(null);
    setIssueType('');
    setIssueTypesError(null);
    api
      .listIssueTypes({ projectKey })
      .then((res) => {
        if (cancelled) return;
        const types = res.issueTypes.filter((t) => !t.subtask);
        setIssueTypes(types);
        const def = DEFAULT_TYPE_PRIORITY.map((n) => types.find((t) => t.name === n)).find(
          Boolean,
        );
        setIssueType(def?.name ?? types[0]?.name ?? '');
      })
      .catch((err) => {
        if (cancelled) return;
        setIssueTypesError(errorMessage(err));
        setIssueTypes([]);
      });

    setUsers(null);
    setAssigneeId('');
    setUsersError(null);
    api
      .listAssignableUsers({ projectKey })
      .then((res) => {
        if (cancelled) return;
        const list = res.users;
        setUsers(list);
        const userEmail = currentUserEmail?.toLowerCase();
        const me =
          (userEmail && list.find((u) => u.emailAddress?.toLowerCase() === userEmail)) || null;
        if (me) setAssigneeId(me.accountId);
      })
      .catch((err) => {
        if (cancelled) return;
        setUsersError(errorMessage(err));
        setUsers([]);
      });

    if (api.listSprints) {
      setSprints(null);
      setSprintId('');
      setSprintsError(null);
      api
        .listSprints({ projectKey })
        .then((res) => {
          if (cancelled) return;
          setSprints(res.sprints);
        })
        .catch((err) => {
          if (cancelled) return;
          setSprintsError(errorMessage(err));
          setSprints([]);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [projectKey, currentUserEmail, api]);

  const filteredProjects = useMemo(() => {
    if (!projects) return null;
    const q = projectFilter.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) => p.key.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    );
  }, [projects, projectFilter]);

  const filteredUsers = useMemo(() => {
    if (!users) return null;
    const q = userFilter.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.emailAddress?.toLowerCase().includes(q),
    );
  }, [users, userFilter]);

  const selectedProject = useMemo(
    () => projects?.find((p) => p.key === projectKey) ?? null,
    [projects, projectKey],
  );

  const selectedType = useMemo(
    () => issueTypes?.find((t) => t.name === issueType) ?? null,
    [issueTypes, issueType],
  );

  const selectedUser = useMemo(
    () => users?.find((u) => u.accountId === assigneeId) ?? null,
    [users, assigneeId],
  );

  const selectedSprint = useMemo(
    () => (sprintId ? sprints?.find((s) => s.id === sprintId) ?? null : null),
    [sprints, sprintId],
  );

  const canSubmit =
    !!projectKey && !!issueType && !!summary.trim() && status.kind !== 'submitting';

  const submit = async () => {
    if (!canSubmit) return;
    setStatus({ kind: 'submitting' });
    try {
      const res = await onSubmit({
        projectKey,
        issueType,
        summary: summary.trim(),
        description,
        labels: labels
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
        assigneeAccountId: assigneeId || undefined,
        sprintId: sprintId || undefined,
      });
      setStatus({ kind: 'success', issueKey: res.issueKey, issueUrl: res.issueUrl });
    } catch (err) {
      setStatus({ kind: 'error', message: errorMessage(err) });
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status.kind !== 'submitting') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, status.kind]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in"
      onClick={() => status.kind !== 'submitting' && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl animate-zoom-in-95"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50">
              <JiraIcon size={16} />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-bold text-slate-900">Enviar para o Jira</h2>
              <p className="text-[11px] font-medium text-slate-500">
                Cria uma issue a partir deste documento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={status.kind === 'submitting'}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </header>

        {status.kind === 'success' ? (
          <SuccessView
            issueKey={status.issueKey}
            issueUrl={status.issueUrl}
            onClose={onClose}
          />
        ) : (
          <div className="grid flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] overflow-hidden">
            <div className="flex flex-col gap-4 overflow-y-auto border-r border-slate-100 px-6 py-5">
              <section>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Projeto Jira
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
                    className="group flex w-full items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-left transition-colors hover:bg-indigo-100"
                  >
                    {selectedProject.avatarUrl ? (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <img src={selectedProject.avatarUrl} alt="" className="h-6 w-6 rounded" />
                    ) : (
                      <div className="grid h-6 w-6 place-items-center rounded bg-indigo-200 text-[10px] font-bold text-indigo-800">
                        {selectedProject.key.slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 leading-tight">
                      <div className="text-sm font-bold text-indigo-900">{selectedProject.name}</div>
                      <div className="font-mono text-[10px] text-indigo-700">{selectedProject.key}</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 opacity-0 group-hover:opacity-100">
                      Trocar
                    </span>
                    <ChevronRight size={13} strokeWidth={2.5} className="text-indigo-500" />
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
                        className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-100">
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
                              projectKey === p.key
                                ? 'bg-indigo-50 text-indigo-800'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            {p.avatarUrl ? (
                              // eslint-disable-next-line jsx-a11y/alt-text
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
              </section>

              {selectedProject && !projectPickerOpen && (
                <>
                  <section>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      Tipo de issue
                    </label>
                    {!issueTypes && !issueTypesError && (
                      <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-500">
                        <Loader2 size={13} className="animate-spin" /> Carregando tipos…
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
                            type="button"
                            onClick={() => setIssueType(t.name)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                              issueType === t.name
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {t.iconUrl && (
                              // eslint-disable-next-line jsx-a11y/alt-text
                              <img src={t.iconUrl} alt="" className="h-3.5 w-3.5" />
                            )}
                            {t.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      Responsável
                    </label>
                    {!users && !usersError && (
                      <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-500">
                        <Loader2 size={13} className="animate-spin" /> Carregando usuários…
                      </div>
                    )}
                    {usersError && (
                      <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        <AlertCircle size={13} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                        {usersError}
                      </div>
                    )}

                    {users && selectedUser && !userPickerOpen && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setUserPickerOpen(true)}
                          className="group flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50"
                        >
                          {selectedUser.avatarUrl ? (
                            // eslint-disable-next-line jsx-a11y/alt-text
                            <img
                              src={selectedUser.avatarUrl}
                              alt=""
                              className="h-6 w-6 rounded-full"
                            />
                          ) : (
                            <UserCircle2 size={22} strokeWidth={1.8} className="text-slate-400" />
                          )}
                          <div className="flex-1 leading-tight">
                            <div className="text-sm font-bold text-slate-800">
                              {selectedUser.displayName}
                            </div>
                            {selectedUser.emailAddress && (
                              <div className="truncate text-[10px] text-slate-500">
                                {selectedUser.emailAddress}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 opacity-0 group-hover:opacity-100">
                            Trocar
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssigneeId('')}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                          title="Deixar sem responsável"
                        >
                          <X size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}

                    {users && users.length > 0 && (!selectedUser || userPickerOpen) && (
                      <>
                        <div className="relative mb-2">
                          <Search
                            size={12}
                            strokeWidth={2.5}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            autoFocus={userPickerOpen}
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            placeholder="Filtrar por nome ou email…"
                            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                        <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setAssigneeId('');
                              setUserPickerOpen(false);
                              setUserFilter('');
                            }}
                            className="flex w-full items-center gap-2 border-b border-slate-50 px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50"
                          >
                            <UserCircle2 size={18} strokeWidth={1.8} className="text-slate-300" />
                            <span className="italic">Sem responsável</span>
                          </button>
                          {filteredUsers?.length === 0 ? (
                            <p className="px-3 py-3 text-xs text-slate-400">Nenhum match.</p>
                          ) : (
                            filteredUsers?.map((u) => (
                              <button
                                key={u.accountId}
                                type="button"
                                onClick={() => {
                                  setAssigneeId(u.accountId);
                                  setUserPickerOpen(false);
                                  setUserFilter('');
                                }}
                                className={`flex w-full items-center gap-2 border-b border-slate-50 px-3 py-2 text-left text-xs transition-colors last:border-b-0 ${
                                  assigneeId === u.accountId
                                    ? 'bg-indigo-50 text-indigo-800'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                {u.avatarUrl ? (
                                  // eslint-disable-next-line jsx-a11y/alt-text
                                  <img src={u.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
                                ) : (
                                  <UserCircle2
                                    size={18}
                                    strokeWidth={1.8}
                                    className="text-slate-400"
                                  />
                                )}
                                <span className="flex-1 truncate font-bold text-slate-800">
                                  {u.displayName}
                                </span>
                                {u.emailAddress && (
                                  <span className="truncate text-[10px] text-slate-400">
                                    {u.emailAddress}
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </section>

                  {api.listSprints && (
                    <section>
                      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        <CalendarClock size={11} strokeWidth={2.5} />
                        Sprint
                        <span className="font-normal lowercase text-slate-400">(opcional)</span>
                      </label>
                      {!sprints && !sprintsError && (
                        <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-500">
                          <Loader2 size={13} className="animate-spin" /> Carregando sprints…
                        </div>
                      )}
                      {sprintsError && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          <AlertCircle size={13} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                          {sprintsError}
                        </div>
                      )}
                      {sprints && sprints.length === 0 && !sprintsError && (
                        <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          Nenhuma sprint ativa ou futura nos boards Scrum deste projeto.
                        </p>
                      )}
                      {sprints && sprints.length > 0 && (
                        <select
                          value={sprintId}
                          onChange={(e) =>
                            setSprintId(e.target.value ? Number(e.target.value) : '')
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="">Backlog (sem sprint)</option>
                          {sprints.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.state === 'active' ? '🟢 ' : '⏳ '}
                              {s.name}
                              {s.boardName ? ` — ${s.boardName}` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </section>
                  )}

                  <section>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      Título (summary)
                    </label>
                    <input
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </section>

                  <section>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      Labels{' '}
                      <span className="font-normal lowercase text-slate-400">
                        (opcional, separadas por vírgula)
                      </span>
                    </label>
                    <input
                      value={labels}
                      onChange={(e) => setLabels(e.target.value)}
                      placeholder="ex: doc-hub, planejamento"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </section>
                </>
              )}

              {status.kind === 'error' && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle size={13} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col overflow-hidden bg-slate-50/50">
              <div className="border-b border-slate-100 bg-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Preview da issue
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    {selectedProject ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                        {selectedProject.key}
                      </span>
                    ) : (
                      <span className="rounded-md border border-dashed border-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                        PROJETO
                      </span>
                    )}
                    {selectedType ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                        {selectedType.iconUrl && (
                          // eslint-disable-next-line jsx-a11y/alt-text
                          <img src={selectedType.iconUrl} alt="" className="h-3 w-3" />
                        )}
                        {selectedType.name}
                      </span>
                    ) : (
                      <span className="rounded-md border border-dashed border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400">
                        TIPO
                      </span>
                    )}
                    {selectedUser && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        {selectedUser.avatarUrl ? (
                          // eslint-disable-next-line jsx-a11y/alt-text
                          <img
                            src={selectedUser.avatarUrl}
                            alt=""
                            className="h-3 w-3 rounded-full"
                          />
                        ) : (
                          <UserCircle2 size={10} strokeWidth={2} />
                        )}
                        {selectedUser.displayName}
                      </span>
                    )}
                    {selectedSprint && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                        <CalendarClock size={10} strokeWidth={2.5} />
                        {selectedSprint.name}
                      </span>
                    )}
                    {labels
                      .split(',')
                      .map((l) => l.trim())
                      .filter(Boolean)
                      .map((l) => (
                        <span
                          key={l}
                          className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700"
                        >
                          {l}
                        </span>
                      ))}
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-slate-900">
                    {summary || <span className="text-slate-400">Título…</span>}
                  </h3>
                  <div className="prose prose-sm prose-slate max-w-none">
                    {description ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
                    ) : (
                      <p className="italic text-slate-400">
                        (documento vazio — a descrição da issue ficará em branco)
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-slate-400">
                  A descrição é convertida automaticamente para o formato do Jira (ADF).
                </p>
              </div>
            </div>
          </div>
        )}

        {status.kind !== 'success' && (
          <footer className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-3">
            <p className="text-[11px] text-slate-500">
              {selectedProject && selectedType ? (
                <>
                  Será criada como <strong>{selectedType.name}</strong> em{' '}
                  <strong>{selectedProject.name}</strong>
                  {selectedUser && (
                    <>
                      , atribuída a <strong>{selectedUser.displayName}</strong>
                    </>
                  )}
                  .
                </>
              ) : (
                'Selecione projeto e tipo para habilitar o envio.'
              )}
            </p>
            <div className="flex items-center gap-2">
              <GhostButtonSm onClick={onClose} disabled={status.kind === 'submitting'}>
                Cancelar
              </GhostButtonSm>
              <PrimaryButton onClick={submit} disabled={!canSubmit}>
                {status.kind === 'submitting' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Criando…
                  </>
                ) : (
                  <>
                    <JiraIcon size={14} /> Criar issue
                  </>
                )}
              </PrimaryButton>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

function SuccessView({
  issueKey,
  issueUrl,
  onClose,
}: {
  issueKey: string;
  issueUrl: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
        <CheckCircle2 size={26} strokeWidth={2.2} />
      </div>
      <h3 className="text-xl font-bold text-slate-900">Issue criada!</h3>
      <p className="text-sm text-slate-600">
        O documento foi enviado para o Jira como{' '}
        <span className="font-mono font-bold text-slate-900">{issueKey}</span>.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <a
          href={issueUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700"
        >
          <JiraIcon size={14} className="brightness-0 invert" />
          Abrir no Jira
          <ExternalLink size={13} strokeWidth={2.5} />
        </a>
        <SecondaryButton onClick={onClose}>Fechar</SecondaryButton>
      </div>
    </div>
  );
}
