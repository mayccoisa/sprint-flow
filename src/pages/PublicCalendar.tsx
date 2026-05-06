import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { resolveShareToken } from '@/lib/publicCalendar';
import Calendar from './Calendar';

export default function PublicCalendar() {
  const { token } = useParams<{ token: string }>();
  const { setCurrentWorkspaceId } = useWorkspace();
  const [status, setStatus] = useState<'loading' | 'ok' | 'forbidden'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('forbidden');
      return;
    }
    const entry = resolveShareToken(token);
    if (!entry || !entry.isPublic) {
      setStatus('forbidden');
      return;
    }
    setCurrentWorkspaceId(entry.workspaceId);
    setStatus('ok');
  }, [token, setCurrentWorkspaceId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Calendário privado</h1>
          <p className="text-sm text-muted-foreground">
            Este link foi desativado pelo proprietário ou nunca foi tornado público.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Calendar publicMode />
    </div>
  );
}
