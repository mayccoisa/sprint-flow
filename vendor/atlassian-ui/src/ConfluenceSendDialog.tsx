import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronRight,
  FileText,
  Folder,
  FolderPlus,
  Check,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ConfluenceIcon } from './ConfluenceIcon';
import { GhostButtonSm, PrimaryButton, SecondaryButton } from './buttons';
import type {
  ConfluenceApi,
  ConfluenceFolder,
  ConfluencePage,
  ConfluencePageDraft,
  ConfluenceSpace,
} from './types';

export interface ConfluenceSendDialogProps {
  open: boolean;
  onClose: () => void;
  api: ConfluenceApi;
  onSubmit: (draft: ConfluencePageDraft) => Promise<{ pageId: string; pageUrl: string }>;
  initialTitle: string;
  initialContent: string;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; pageId: string; pageUrl: string }
  | { kind: 'error'; message: string };

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim()) return m;
  }
  return 'Erro desconhecido';
}

export function ConfluenceSendDialog({
  open,
  onClose,
  api,
  onSubmit,
  initialTitle,
  initialContent,
}: ConfluenceSendDialogProps) {
  const [spaces, setSpaces] = useState<ConfluenceSpace[] | null>(null);
  const [spacesError, setSpacesError] = useState<string | null>(null);
  const [spaceKey, setSpaceKey] = useState('');
  const [spaceFilter, setSpaceFilter] = useState('');
  const [spacePickerOpen, setSpacePickerOpen] = useState(true);

  const [pages, setPages] = useState<ConfluencePage[] | null>(null);
  const [folders, setFolders] = useState<ConfluenceFolder[] | null>(null);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string>('');
  const [parentKind, setParentKind] = useState<'folder' | 'page' | ''>('');
  const [destPickerOpen, setDestPickerOpen] = useState(false);
  const [destFilter, setDestFilter] = useState('');

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const description = useMemo(
    () => initialContent.replace(/^\s*#\s+[^\n]*\n+/, '').trim(),
    [initialContent],
  );

  useEffect(() => {
    if (!open) return;
    setSpaceKey('');
    setSpaceFilter('');
    setSpacePickerOpen(true);
    setPages(null);
    setFolders(null);
    setParentId('');
    setParentKind('');
    setDestPickerOpen(false);
    setDestFilter('');
    setNewFolderOpen(false);
    setNewFolderName('');
    setFolderError(null);
    setTitle(initialTitle);
    setStatus({ kind: 'idle' });
    setSpacesError(null);
    setDestinationError(null);

    let cancelled = false;
    setSpaces(null);
    api
      .listSpaces()
      .then((res) => {
        if (cancelled) return;
        setSpaces(res.spaces);
      })
      .catch((err) => {
        if (cancelled) return;
        setSpacesError(errorMessage(err));
        setSpaces([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, initialTitle, api]);

  useEffect(() => {
    if (!spaceKey) {
      setPages(null);
      setFolders(null);
      setParentId('');
      setParentKind('');
      return;
    }
    let cancelled = false;
    setPages(null);
    setFolders(null);
    setParentId('');
    setParentKind('');
    setDestinationError(null);

    Promise.allSettled([api.listPages({ spaceKey }), api.listFolders({ spaceKey })]).then(
      ([pagesRes, foldersRes]) => {
        if (cancelled) return;
        if (pagesRes.status === 'fulfilled') {
          setPages(pagesRes.value.pages);
        } else {
          setPages([]);
          setDestinationError(errorMessage(pagesRes.reason));
        }
        if (foldersRes.status === 'fulfilled') {
          setFolders(foldersRes.value.folders);
        } else {
          setFolders([]);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [spaceKey, api]);

  const filteredSpaces = useMemo(() => {
    if (!spaces) return null;
    const q = spaceFilter.trim().toLowerCase();
    if (!q) return spaces;
    return spaces.filter(
      (s) => s.key.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    );
  }, [spaces, spaceFilter]);

  type Destination =
    | { kind: 'folder'; id: string; title: string }
    | { kind: 'page'; id: string; title: string };

  const allDestinations = useMemo<Destination[]>(() => {
    const all: Destination[] = [];
    const folderIds = new Set<string>();
    const folderTitlesLower = new Set<string>();
    for (const f of folders ?? []) {
      all.push({ kind: 'folder', id: f.id, title: f.title });
      folderIds.add(f.id);
      folderTitlesLower.add(f.title.toLowerCase());
    }
    for (const p of pages ?? []) {
      if (folderIds.has(p.id)) continue;
      if (folderTitlesLower.has(p.title.toLowerCase())) continue;
      all.push({ kind: 'page', id: p.id, title: p.title });
    }
    return all.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
      return a.title.localeCompare(b.title, 'pt-BR');
    });
  }, [folders, pages]);

  const filteredDestinations = useMemo(() => {
    const q = destFilter.trim().toLowerCase();
    if (!q) return allDestinations;
    return allDestinations.filter((d) => d.title.toLowerCase().includes(q));
  }, [allDestinations, destFilter]);

  const destinationsLoading = pages === null || folders === null;

  const selectedSpace = useMemo(
    () => spaces?.find((s) => s.key === spaceKey) ?? null,
    [spaces, spaceKey],
  );

  const selectedParent = useMemo<Destination | null>(() => {
    if (!parentId) return null;
    if (parentKind === 'folder') {
      const f = folders?.find((x) => x.id === parentId);
      return f ? { kind: 'folder', id: f.id, title: f.title } : null;
    }
    const p = pages?.find((x) => x.id === parentId);
    return p ? { kind: 'page', id: p.id, title: p.title } : null;
  }, [parentId, parentKind, folders, pages]);

  const canSubmit = !!spaceKey && !!title.trim() && status.kind !== 'submitting';

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name || !spaceKey || creatingFolder) return;
    setCreatingFolder(true);
    setFolderError(null);
    try {
      const res = await api.createFolder({
        spaceKey,
        title: name,
        parentId: parentKind === 'folder' && parentId ? parentId : undefined,
      });
      const folder = res.folder;
      setFolders((prev) => [...(prev ?? []), folder]);
      setParentId(folder.id);
      setParentKind('folder');
      setNewFolderOpen(false);
      setNewFolderName('');
      setDestPickerOpen(false);
    } catch (err) {
      setFolderError(errorMessage(err));
    } finally {
      setCreatingFolder(false);
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    setStatus({ kind: 'submitting' });
    try {
      const res = await onSubmit({
        spaceKey,
        title: title.trim(),
        content: description,
        parentId: parentId || undefined,
      });
      setStatus({ kind: 'success', pageId: res.pageId, pageUrl: res.pageUrl });
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
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-50">
              <ConfluenceIcon size={16} />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-bold text-slate-900">Publicar no Confluence</h2>
              <p className="text-[11px] font-medium text-slate-500">
                Cria uma página a partir deste documento
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
          <SuccessView pageUrl={status.pageUrl} onClose={onClose} />
        ) : (
          <div className="grid flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] overflow-hidden">
            <div className="flex flex-col gap-4 overflow-y-auto border-r border-slate-100 px-6 py-5">
              <section>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Space
                </label>

                {spacesError && (
                  <div className="mb-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertCircle size={13} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                    {spacesError}
                  </div>
                )}
                {!spaces && !spacesError && (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-500">
                    <Loader2 size={13} className="animate-spin" /> Carregando spaces…
                  </div>
                )}

                {selectedSpace && !spacePickerOpen && (
                  <button
                    type="button"
                    onClick={() => setSpacePickerOpen(true)}
                    className="group flex w-full items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-left transition-colors hover:bg-sky-100"
                  >
                    <div className="grid h-6 w-6 place-items-center rounded bg-sky-200 text-[10px] font-bold text-sky-800">
                      {selectedSpace.key.slice(0, 2)}
                    </div>
                    <div className="flex-1 leading-tight">
                      <div className="text-sm font-bold text-sky-900">{selectedSpace.name}</div>
                      <div className="font-mono text-[10px] text-sky-700">{selectedSpace.key}</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 opacity-0 group-hover:opacity-100">
                      Trocar
                    </span>
                    <ChevronRight size={13} strokeWidth={2.5} className="text-sky-500" />
                  </button>
                )}

                {spaces && spaces.length > 0 && spacePickerOpen && (
                  <>
                    <div className="relative mb-2">
                      <Search
                        size={12}
                        strokeWidth={2.5}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        autoFocus
                        value={spaceFilter}
                        onChange={(e) => setSpaceFilter(e.target.value)}
                        placeholder="Filtrar por nome ou chave…"
                        className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-100">
                      {filteredSpaces?.length === 0 ? (
                        <p className="px-3 py-3 text-xs text-slate-400">Nenhum match.</p>
                      ) : (
                        filteredSpaces?.map((s) => (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => {
                              setSpaceKey(s.key);
                              setSpacePickerOpen(false);
                              setSpaceFilter('');
                            }}
                            className={`flex w-full items-center gap-2 border-b border-slate-50 px-3 py-2 text-left text-xs transition-colors last:border-b-0 ${
                              spaceKey === s.key
                                ? 'bg-sky-50 text-sky-800'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="grid h-5 w-5 place-items-center rounded bg-slate-200 text-[9px] font-bold text-slate-600">
                              {s.key.slice(0, 2)}
                            </div>
                            <span className="flex-1 truncate font-bold text-slate-800">{s.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">{s.key}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}

                {spaces && spaces.length === 0 && !spacesError && (
                  <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Nenhum space do Confluence visível para sua conta.
                  </p>
                )}
              </section>

              {selectedSpace && !spacePickerOpen && (
                <>
                  <section>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Onde criar{' '}
                        <span className="font-normal lowercase text-slate-400">(opcional)</span>
                      </label>
                      {!newFolderOpen && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewFolderOpen(true);
                            setNewFolderName('');
                            setFolderError(null);
                          }}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 transition-colors hover:bg-sky-50"
                        >
                          <FolderPlus size={11} strokeWidth={2.5} />
                          Nova pasta
                        </button>
                      )}
                    </div>

                    {destinationError && (
                      <div className="mb-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        <AlertCircle size={13} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                        {destinationError}
                      </div>
                    )}

                    {newFolderOpen && (
                      <div className="mb-2 rounded-xl border border-sky-200 bg-sky-50/60 p-3">
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-sky-700">
                          Criar nova pasta
                          {parentKind === 'folder' && selectedParent && (
                            <span className="ml-1 font-normal lowercase text-sky-600">
                              dentro de "{selectedParent.title}"
                            </span>
                          )}
                        </label>
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateFolder();
                              }
                              if (e.key === 'Escape') setNewFolderOpen(false);
                            }}
                            placeholder="Nome da pasta…"
                            disabled={creatingFolder}
                            className="flex-1 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                          />
                          <button
                            type="button"
                            onClick={handleCreateFolder}
                            disabled={!newFolderName.trim() || creatingFolder}
                            className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:bg-sky-300"
                          >
                            {creatingFolder ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Check size={11} strokeWidth={3} />
                            )}
                            Criar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewFolderOpen(false);
                              setNewFolderName('');
                              setFolderError(null);
                            }}
                            disabled={creatingFolder}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                          >
                            <X size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                        {folderError && (
                          <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-[11px] text-red-700">
                            {folderError}
                          </p>
                        )}
                      </div>
                    )}

                    {destinationsLoading && (
                      <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-500">
                        <Loader2 size={13} className="animate-spin" /> Carregando pastas e páginas…
                      </div>
                    )}

                    {!destinationsLoading && selectedParent && !destPickerOpen && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDestPickerOpen(true)}
                          className="group flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50"
                        >
                          {selectedParent.kind === 'folder' ? (
                            <Folder
                              size={16}
                              strokeWidth={2}
                              className="shrink-0 fill-amber-100 text-amber-500"
                            />
                          ) : (
                            <FileText size={16} strokeWidth={2} className="shrink-0 text-sky-500" />
                          )}
                          <div className="flex-1 leading-tight">
                            <div className="truncate text-sm font-bold text-slate-800">
                              {selectedParent.title}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400">
                              {selectedParent.kind === 'folder' ? 'Pasta' : 'Página'}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 opacity-0 group-hover:opacity-100">
                            Trocar
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setParentId('');
                            setParentKind('');
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                          title="Criar no topo do space"
                        >
                          <X size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}

                    {!destinationsLoading && (!selectedParent || destPickerOpen) && (
                      <>
                        <div className="relative mb-2">
                          <Search
                            size={12}
                            strokeWidth={2.5}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            autoFocus={destPickerOpen}
                            value={destFilter}
                            onChange={(e) => setDestFilter(e.target.value)}
                            placeholder="Filtrar pastas e páginas…"
                            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                        <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setParentId('');
                              setParentKind('');
                              setDestPickerOpen(false);
                              setDestFilter('');
                            }}
                            className={`flex w-full items-center gap-2 border-b border-slate-50 px-3 py-2 text-left text-xs transition-colors ${
                              !parentId
                                ? 'bg-sky-50 text-sky-800'
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <ChevronRight size={14} strokeWidth={2} className="text-slate-300" />
                            <span className="italic">No topo do space (sem pasta)</span>
                          </button>
                          {filteredDestinations.length === 0 ? (
                            <p className="px-3 py-3 text-xs text-slate-400">Nenhum match.</p>
                          ) : (
                            filteredDestinations.map((d) => (
                              <button
                                key={`${d.kind}-${d.id}`}
                                type="button"
                                onClick={() => {
                                  setParentId(d.id);
                                  setParentKind(d.kind);
                                  setDestPickerOpen(false);
                                  setDestFilter('');
                                }}
                                className={`flex w-full items-center gap-2 border-b border-slate-50 px-3 py-2 text-left text-xs transition-colors last:border-b-0 ${
                                  parentId === d.id && parentKind === d.kind
                                    ? 'bg-sky-50 text-sky-800'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                {d.kind === 'folder' ? (
                                  <Folder
                                    size={14}
                                    strokeWidth={2}
                                    className="shrink-0 fill-amber-100 text-amber-500"
                                  />
                                ) : (
                                  <FileText
                                    size={14}
                                    strokeWidth={1.8}
                                    className="shrink-0 text-sky-400"
                                  />
                                )}
                                <span className="flex-1 truncate font-bold text-slate-800">
                                  {d.title}
                                </span>
                                <span className="text-[9px] uppercase tracking-wider text-slate-400">
                                  {d.kind === 'folder' ? 'pasta' : 'página'}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}

                    {!destinationsLoading &&
                      allDestinations.length === 0 &&
                      !destinationError && (
                        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
                          Sem pastas nem páginas neste space — a nova página vai pro topo.
                        </p>
                      )}
                  </section>

                  <section>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      Título da página
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <p className="mt-1 text-[10px] text-slate-400">
                      O Confluence não aceita 2 páginas com o mesmo título no mesmo space.
                    </p>
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
                Preview da página
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                    {selectedSpace ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 font-bold text-sky-700">
                        <ConfluenceIcon size={10} />
                        {selectedSpace.name}
                      </span>
                    ) : (
                      <span className="rounded-md border border-dashed border-slate-200 px-1.5 py-0.5 text-slate-400">
                        SPACE
                      </span>
                    )}
                    {selectedParent && (
                      <>
                        <ChevronRight size={11} strokeWidth={2.5} className="text-slate-300" />
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600">
                          {selectedParent.kind === 'folder' ? (
                            <Folder
                              size={10}
                              strokeWidth={2}
                              className="fill-amber-200 text-amber-500"
                            />
                          ) : (
                            <FileText size={10} strokeWidth={2.2} />
                          )}
                          {selectedParent.title}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-slate-900">
                    {title || <span className="text-slate-400">Título…</span>}
                  </h3>
                  <div className="prose prose-sm prose-slate max-w-none">
                    {description ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
                    ) : (
                      <p className="italic text-slate-400">
                        (documento vazio — a página será publicada em branco)
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-slate-400">
                  O markdown é convertido para o formato storage (XHTML) do Confluence —
                  headings, listas, código e links são preservados.
                </p>
              </div>
            </div>
          </div>
        )}

        {status.kind !== 'success' && (
          <footer className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-3">
            <p className="text-[11px] text-slate-500">
              {selectedSpace ? (
                <>
                  Será publicada em <strong>{selectedSpace.name}</strong>
                  {selectedParent && (
                    <>
                      {selectedParent.kind === 'folder' ? ', dentro da pasta ' : ', como filha de '}
                      <strong>{selectedParent.title}</strong>
                    </>
                  )}
                  .
                </>
              ) : (
                'Selecione um space para habilitar a publicação.'
              )}
            </p>
            <div className="flex items-center gap-2">
              <GhostButtonSm onClick={onClose} disabled={status.kind === 'submitting'}>
                Cancelar
              </GhostButtonSm>
              <PrimaryButton onClick={submit} disabled={!canSubmit}>
                {status.kind === 'submitting' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Publicando…
                  </>
                ) : (
                  <>
                    <ConfluenceIcon size={14} /> Publicar página
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

function SuccessView({ pageUrl, onClose }: { pageUrl: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
        <CheckCircle2 size={26} strokeWidth={2.2} />
      </div>
      <h3 className="text-xl font-bold text-slate-900">Página publicada!</h3>
      <p className="text-sm text-slate-600">
        O documento foi publicado no Confluence e vinculado a este doc.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <a
          href={pageUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-sky-200 transition-colors hover:bg-sky-700"
        >
          <ConfluenceIcon size={14} className="brightness-0 invert" />
          Abrir no Confluence
          <ExternalLink size={13} strokeWidth={2.5} />
        </a>
        <SecondaryButton onClick={onClose}>Fechar</SecondaryButton>
      </div>
    </div>
  );
}
