import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface Options {
  /** Whether there are unsaved changes to protect. */
  when: boolean;
  /** Called when user chooses "Save and leave". */
  onSave?: () => Promise<void> | void;
  title?: string;
  description?: string;
}

interface Result {
  /** Dialog element — must be mounted somewhere in the JSX. */
  dialog: React.ReactNode;
  /**
   * Wrap any navigation intent (Voltar button, breadcrumb link, etc.) with this
   * to prompt before navigating away.
   *
   *   <Button onClick={() => guardedRun(() => navigate('/initiatives'))}>Voltar</Button>
   */
  guardedRun: (run: () => void) => void;
}

/**
 * Lightweight unsaved-changes guard. Does NOT depend on react-router's
 * useBlocker (which requires a data router) — caller wraps each navigation
 * call with `guardedRun`. Browser refresh / close is covered automatically
 * via `beforeunload`.
 */
export function useUnsavedChangesGuard({ when, onSave, title, description }: Options): Result {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const pendingRun = useRef<(() => void) | null>(null);

  // Avisa o usuário em refresh / fechar aba.
  useEffect(() => {
    if (!when) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when]);

  const guardedRun = useCallback(
    (run: () => void) => {
      if (!when) {
        run();
        return;
      }
      pendingRun.current = run;
      setOpen(true);
    },
    [when],
  );

  const close = () => {
    pendingRun.current = null;
    setOpen(false);
  };

  const handleDiscard = () => {
    const run = pendingRun.current;
    pendingRun.current = null;
    setOpen(false);
    run?.();
  };

  const handleSave = async () => {
    if (!onSave) {
      handleDiscard();
      return;
    }
    setSaving(true);
    try {
      await onSave();
      const run = pendingRun.current;
      pendingRun.current = null;
      setOpen(false);
      run?.();
    } finally {
      setSaving(false);
    }
  };

  const dialog = (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !saving) close();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? 'Alterações não salvas'}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? 'Você tem alterações pendentes. O que deseja fazer antes de sair?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={close} disabled={saving}>
            Continuar editando
          </AlertDialogCancel>
          <Button
            variant="ghost"
            onClick={handleDiscard}
            disabled={saving}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Descartar e sair
          </Button>
          {onSave && (
            <AlertDialogAction onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar e sair'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { dialog, guardedRun };
}
