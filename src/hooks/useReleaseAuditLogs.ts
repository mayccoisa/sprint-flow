import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import type { ReleaseAuditLog } from '@/types';

interface Options {
  releaseId?: number;
  disabled?: boolean;
}

export function useReleaseAuditLogs({ releaseId, disabled }: Options = {}) {
  const { currentWorkspaceId } = useWorkspace();
  const [logs, setLogs] = useState<ReleaseAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (disabled || !currentWorkspaceId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const constraints = [where('workspace_id', '==', currentWorkspaceId)];
    if (typeof releaseId === 'number' && Number.isFinite(releaseId)) {
      constraints.push(where('release_id', '==', releaseId));
    }
    const q = query(collection(db, 'release_audit_logs'), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as unknown as ReleaseAuditLog),
        );
        setLogs(items);
        setLoading(false);
      },
      (err) => {
        console.error('useReleaseAuditLogs error:', err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [currentWorkspaceId, releaseId, disabled]);

  return { logs, loading };
}
