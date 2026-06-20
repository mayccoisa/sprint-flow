import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import type { TaskAuditLog } from '@/types';

interface Options {
  /** When set, subscribes only to logs of a single task — much faster on detail pages. */
  taskId?: number;
  /** Skip subscription entirely (useful for conditional mounting). Default: false. */
  disabled?: boolean;
}

/**
 * Lazy subscription to `task_audit_logs`. Replaces the global subscription that
 * previously lived in useFirestoreData — that one pulled every audit row for the
 * workspace on every page load, which was the main bottleneck for "Todas Iniciativas".
 *
 * Mount this hook only where audit logs are actually consumed:
 *  - InitiativeDetail → `useTaskAuditLogs({ taskId })` (single-task filter, tiny payload)
 *  - InitiativesDashboard tab → `useTaskAuditLogs()` (full workspace, but only when tab is active)
 */
export function useTaskAuditLogs({ taskId, disabled }: Options = {}) {
  const { currentWorkspaceId } = useWorkspace();
  const [logs, setLogs] = useState<TaskAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (disabled || !currentWorkspaceId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const constraints = [where('workspace_id', '==', currentWorkspaceId)];
    if (typeof taskId === 'number' && Number.isFinite(taskId)) {
      constraints.push(where('task_id', '==', taskId));
    }
    const q = query(collection(db, 'task_audit_logs'), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as TaskAuditLog));
        setLogs(items);
        setLoading(false);
      },
      (err) => {
        console.error('useTaskAuditLogs error:', err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [currentWorkspaceId, taskId, disabled]);

  return { logs, loading };
}
