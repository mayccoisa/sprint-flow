import { useEffect, useState } from 'react';
import {
  Check,
  ExternalLink,
  Loader2,
  Trash2,
  Link2,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { Button } from '@/components/ui/button';
import { useUserSettings } from '@/features/settings/useUserSettings';
import {
  disconnectAtlassianFn,
  setAtlassianCredentialsFn,
} from '@/features/settings/callableApi';
import { formatRelative } from '@/lib/formatRelative';
import { useConfirm } from '@/components/ui-patterns';

type Mode = 'view' | 'edit';

export function AtlassianToolSettings() {
  const { atlassian, loading } = useUserSettings();
  const confirm = useConfirm();
  const [mode, setMode] = useState<Mode>('view');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (loading) return;
    setMode(atlassian.connected ? 'view' : 'edit');
    setEmail(atlassian.email ?? '');
    setSiteUrl(atlassian.siteUrl ?? '');
    setApiToken('');
    setShowToken(false);
    setError(null);
    setSavedFlash(false);
  }, [loading, atlassian.connected, atlassian.email, atlassian.siteUrl]);

  function formatCallableError(err: unknown): string {
    if (err instanceof FirebaseError) {
      const code = err.code.replace(/^functions\//, '');
      const msg = err.message;
      if (code === 'internal' && (!msg || msg === 'internal' || msg === 'INTERNAL')) {
        return 'A função no servidor não respondeu (provavelmente ainda não foi deployada). Rode o deploy das Cloud Functions e tente de novo.';
      }
      if (code === 'not-found') {
        return 'A função setAtlassianCredentials não existe no projeto Firebase. Faça o deploy das Cloud Functions.';
      }
      if (code === 'unauthenticated') {
        return msg || 'Credenciais rejeitadas pela Atlassian. Confira email, token e URL do site.';
      }
      if (code === 'failed-precondition') {
        return msg || 'URL do site não encontrada ou resposta inesperada da Atlassian.';
      }
      if (code === 'invalid-argument') {
        return msg || 'Algum campo está inválido.';
      }
      return msg ? `${msg} (${code})` : `Erro: ${code}`;
    }
    return (err as Error)?.message ?? 'Erro desconhecido';
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await setAtlassianCredentialsFn({
        email: email.trim(),
        apiToken: apiToken.trim(),
        siteUrl: siteUrl.trim(),
      });
      setSavedFlash(true);
      setApiToken('');
      setMode('view');
      window.setTimeout(() => setSavedFlash(false), 1500);
    } catch (err) {
      setError(formatCallableError(err));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    const ok = await confirm({
      title: 'Desconectar conta Atlassian?',
      description: 'A ferramenta de Jira parará de funcionar até você reconectar.',
      confirmLabel: 'Desconectar',
    });
    if (!ok) return;
    setError(null);
    setBusy(true);
    try {
      await disconnectAtlassianFn({});
      setEmail('');
      setSiteUrl('');
      setApiToken('');
      setMode('edit');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 size={14} className="animate-spin" /> Carregando…
      </div>
    );
  }

  const showForm = mode === 'edit' || !atlassian.connected;

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground">
          <Link2 size={14} strokeWidth={2.5} className="text-sky-600" />
          Conta Atlassian
        </h3>
        <p className="text-xs text-muted-foreground">
          Esta ferramenta usa <strong>API Token</strong> — cada usuário gera o próprio token na conta
          Atlassian dele e cola aqui. As ações (criar issue) ficam atribuídas a você.
        </p>
      </section>

      {showForm ? (
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
              Email da conta Atlassian
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.nome@empresa.com"
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm transition-all placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
              URL do site
            </span>
            <input
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://empresa.atlassian.net"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 font-mono text-sm transition-all placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
              API Token
            </span>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="ATATT3xFfGF0..."
                autoComplete="off"
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 pr-10 font-mono text-sm transition-all placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
                aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </label>

          <a
            href="https://id.atlassian.com/manage-profile/security/api-tokens"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
          >
            <KeyRound size={11} strokeWidth={2.5} />
            Gerar API token na Atlassian
            <ExternalLink size={11} strokeWidth={2.5} />
          </a>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>
          )}
          {savedFlash && (
            <p className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <Check size={12} strokeWidth={3} /> Conectado
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            {atlassian.connected ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setMode('view')}>
                Cancelar
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={busy || !email.trim() || !apiToken.trim() || !siteUrl.trim()}>
              {busy ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Testando…
                </>
              ) : (
                <>
                  <Check size={14} strokeWidth={3} /> Testar e salvar
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Check size={14} strokeWidth={3} />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-bold text-emerald-800">Conectado</div>
                <div className="text-[11px] text-emerald-700">
                  {atlassian.email && <span className="font-mono">{atlassian.email}</span>}
                  {atlassian.siteUrl && <> · <span className="font-mono">{atlassian.siteUrl}</span></>}
                  {atlassian.updatedAt && <> · atualizado {formatRelative(atlassian.updatedAt)}</>}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>
          )}

          <div className="flex items-center justify-between">
            <Button variant="secondary" size="sm" onClick={() => setMode('edit')} disabled={busy}>
              Atualizar credenciais
            </Button>
            <button
              onClick={disconnect}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={12} strokeWidth={2.5} />
              Desconectar
            </button>
          </div>
        </div>
      )}

      <section className="border-t border-border pt-4">
        <h4 className="mb-2 text-[13px] font-medium text-muted-foreground">
          Como obter o API Token
        </h4>
        <ol className="space-y-1 text-xs text-muted-foreground">
          <li>
            1. Abra{' '}
            <a
              href="https://id.atlassian.com/manage-profile/security/api-tokens"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-indigo-600 hover:underline"
            >
              id.atlassian.com/manage-profile/security/api-tokens
            </a>
            .
          </li>
          <li>2. Clique em <strong>Create API token</strong>, dê um nome (ex: "Sprint Flow") e copie o valor.</li>
          <li>3. Cole o token aqui — junto com o email da conta e a URL do seu site Atlassian.</li>
        </ol>
      </section>
    </div>
  );
}
