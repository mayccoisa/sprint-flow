import { JiraSendDialog as BaseDialog } from '@maycon/atlassian-ui';
import { FirebaseError } from 'firebase/app';
import { useUserSettings } from '@/features/settings/useUserSettings';
import { jiraApi, createJiraIssueFromInitiativeFn } from './callableApi';

interface Props {
  open: boolean;
  onClose: () => void;
  initialTitle: string;
  initialDescription: string;
  onCreated?: (result: { issueKey: string; issueUrl: string }) => void | Promise<void>;
}

function translateError(err: unknown): Error {
  if (err instanceof FirebaseError) {
    const code = err.code.replace(/^functions\//, '');
    const msg = err.message;
    if (code === 'internal' && (!msg || msg === 'internal' || msg === 'INTERNAL')) {
      return new Error(
        'A função no servidor não respondeu. Verifique se o deploy do backend está atualizado.',
      );
    }
    if (code === 'unauthenticated') return new Error(msg || 'Sessão expirada. Faça login novamente.');
    return new Error(msg || `Erro: ${code}`);
  }
  return err instanceof Error ? err : new Error(String(err));
}

const wrapApi = {
  listProjects: () => jiraApi.listProjects().catch((err) => Promise.reject(translateError(err))),
  listIssueTypes: (i: Parameters<typeof jiraApi.listIssueTypes>[0]) =>
    jiraApi.listIssueTypes(i).catch((err) => Promise.reject(translateError(err))),
  listAssignableUsers: (i: Parameters<typeof jiraApi.listAssignableUsers>[0]) =>
    jiraApi.listAssignableUsers(i).catch((err) => Promise.reject(translateError(err))),
  listSprints: (i: { projectKey: string }) =>
    jiraApi.listSprints!(i).catch((err) => Promise.reject(translateError(err))),
};

export function JiraSendDialog({ open, onClose, initialTitle, initialDescription, onCreated }: Props) {
  const { atlassian } = useUserSettings();
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      api={wrapApi}
      initialTitle={initialTitle}
      initialDescription={initialDescription}
      currentUserEmail={atlassian.email}
      onSubmit={async (draft) => {
        try {
          const res = await createJiraIssueFromInitiativeFn({
            projectKey: draft.projectKey,
            issueType: draft.issueType,
            summary: draft.summary,
            description: draft.description,
            labels: draft.labels,
            assigneeAccountId: draft.assigneeAccountId,
            sprintId: draft.sprintId,
          });
          const result = { issueKey: res.data.issueKey, issueUrl: res.data.issueUrl };
          if (onCreated) await onCreated(result);
          return result;
        } catch (err) {
          throw translateError(err);
        }
      }}
    />
  );
}
