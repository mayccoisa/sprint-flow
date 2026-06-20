import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAtlassianClient, AtlassianNotConnectedError } from './client';
import {
  jiraCreateIssue,
  jiraGetIssue,
  listJiraSprintsForProject,
  searchJiraIssuesByProject,
  type CreateIssueInput,
  type SprintSummary,
  type JiraIssueSummary,
  type SearchIssuesInput,
} from './jira';
import { ATLASSIAN_ENC_KEY } from './secrets';

interface JiraProjectSummary {
  key: string;
  name: string;
  projectTypeKey?: string;
  avatarUrl?: string;
}

interface JiraIssueTypeSummary {
  id: string;
  name: string;
  iconUrl?: string;
  subtask: boolean;
}

interface JiraUserSummary {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrl?: string;
}

function mapAxiosError(err: unknown): { code: string; message: string } {
  if (err instanceof AtlassianNotConnectedError) {
    return {
      code: 'failed-precondition',
      message: 'Conecte sua conta Atlassian em Ferramentas → Jira.',
    };
  }
  const e = err as {
    response?: { status?: number; data?: { errorMessages?: string[]; message?: string; errors?: Record<string, string> } };
    message?: string;
  };
  const status = e.response?.status;
  const data = e.response?.data;
  const upstream =
    data?.errorMessages?.join('; ') ??
    (data?.errors ? Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`).join('; ') : undefined) ??
    data?.message;
  if (status === 401 || status === 403) {
    return {
      code: 'unauthenticated',
      message: 'Credenciais Atlassian rejeitadas. Atualize email/token em Ferramentas → Jira.',
    };
  }
  if (status === 404) {
    return { code: 'not-found', message: upstream ?? 'Recurso não encontrado no Jira.' };
  }
  return { code: 'internal', message: upstream ?? e.message ?? 'Erro Atlassian desconhecido.' };
}

function requireUid(req: { auth?: { uid?: string } }): string {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'login required');
  return uid;
}

export const listJiraProjects = onCall(
  { secrets: [ATLASSIAN_ENC_KEY] },
  async (req): Promise<{ ok: true; projects: JiraProjectSummary[] }> => {
    const uid = requireUid(req);
    try {
      const client = await getAtlassianClient(uid);
      const resp = await client.jira.get('/rest/api/3/project/search?maxResults=50&orderBy=name');
      const values = (resp.data?.values ?? []) as Array<Record<string, unknown>>;
      const projects: JiraProjectSummary[] = values.map((p) => ({
        key: String(p.key),
        name: String(p.name),
        projectTypeKey: p.projectTypeKey as string | undefined,
        avatarUrl: (p.avatarUrls as Record<string, string> | undefined)?.['24x24'],
      }));
      return { ok: true, projects };
    } catch (err) {
      const mapped = mapAxiosError(err);
      throw new HttpsError(mapped.code as 'internal', mapped.message);
    }
  },
);

export const listJiraIssueTypes = onCall<{ projectKey: string }>(
  { secrets: [ATLASSIAN_ENC_KEY] },
  async (req): Promise<{ ok: true; issueTypes: JiraIssueTypeSummary[] }> => {
    const uid = requireUid(req);
    const projectKey = req.data?.projectKey?.trim();
    if (!projectKey) throw new HttpsError('invalid-argument', 'projectKey é obrigatório');

    try {
      const client = await getAtlassianClient(uid);
      const resp = await client.jira.get(`/rest/api/3/project/${encodeURIComponent(projectKey)}`);
      const types = (resp.data?.issueTypes ?? []) as Array<Record<string, unknown>>;
      const issueTypes: JiraIssueTypeSummary[] = types.map((t) => ({
        id: String(t.id),
        name: String(t.name),
        iconUrl: t.iconUrl as string | undefined,
        subtask: Boolean(t.subtask),
      }));
      return { ok: true, issueTypes };
    } catch (err) {
      const mapped = mapAxiosError(err);
      throw new HttpsError(mapped.code as 'internal', mapped.message);
    }
  },
);

export const listJiraAssignableUsers = onCall<{ projectKey: string; query?: string }>(
  { secrets: [ATLASSIAN_ENC_KEY] },
  async (req): Promise<{ ok: true; users: JiraUserSummary[] }> => {
    const uid = requireUid(req);
    const projectKey = req.data?.projectKey?.trim();
    if (!projectKey) throw new HttpsError('invalid-argument', 'projectKey é obrigatório');
    const query = (req.data?.query ?? '').trim();

    try {
      const client = await getAtlassianClient(uid);
      const params = new URLSearchParams({ project: projectKey, maxResults: '50' });
      if (query) params.set('query', query);
      const resp = await client.jira.get(`/rest/api/3/user/assignable/search?${params.toString()}`);
      const list = (resp.data ?? []) as Array<Record<string, unknown>>;
      const users: JiraUserSummary[] = list
        .filter((u) => (u.accountType ?? 'atlassian') === 'atlassian' && Boolean(u.active))
        .map((u) => ({
          accountId: String(u.accountId),
          displayName: String(u.displayName ?? u.emailAddress ?? u.accountId),
          emailAddress: u.emailAddress as string | undefined,
          avatarUrl: (u.avatarUrls as Record<string, string> | undefined)?.['24x24'],
        }));
      return { ok: true, users };
    } catch (err) {
      const mapped = mapAxiosError(err);
      throw new HttpsError(mapped.code as 'internal', mapped.message);
    }
  },
);

export const listJiraSprints = onCall<{ projectKey: string }>(
  { secrets: [ATLASSIAN_ENC_KEY] },
  async (req): Promise<{ ok: true; sprints: SprintSummary[] }> => {
    const uid = requireUid(req);
    const projectKey = req.data?.projectKey?.trim();
    if (!projectKey) throw new HttpsError('invalid-argument', 'projectKey é obrigatório');

    try {
      const sprints = await listJiraSprintsForProject(uid, projectKey);
      return { ok: true, sprints };
    } catch (err) {
      const mapped = mapAxiosError(err);
      throw new HttpsError(mapped.code as 'internal', mapped.message);
    }
  },
);

export const createJiraIssueFromInitiative = onCall<CreateIssueInput>(
  { secrets: [ATLASSIAN_ENC_KEY] },
  async (
    req,
  ): Promise<{ ok: true; issueKey: string; issueUrl: string; projectKey: string; issueType: string }> => {
    const uid = requireUid(req);
    const data = req.data;
    if (!data?.projectKey?.trim()) throw new HttpsError('invalid-argument', 'Selecione um projeto Jira.');
    if (!data?.issueType?.trim()) throw new HttpsError('invalid-argument', 'Selecione um tipo de issue.');
    if (!data?.summary?.trim()) throw new HttpsError('invalid-argument', 'Resumo é obrigatório.');

    try {
      const result = await jiraCreateIssue(uid, {
        projectKey: data.projectKey,
        issueType: data.issueType,
        summary: data.summary,
        description: data.description,
        labels: data.labels,
        parentKey: data.parentKey,
        assigneeAccountId: data.assigneeAccountId,
        sprintId: data.sprintId,
      });
      return { ok: true, ...result };
    } catch (err) {
      const mapped = mapAxiosError(err);
      throw new HttpsError(mapped.code as 'internal', mapped.message);
    }
  },
);

export const searchJiraIssues = onCall<SearchIssuesInput>(
  { secrets: [ATLASSIAN_ENC_KEY] },
  async (req): Promise<{ ok: true; issues: JiraIssueSummary[] }> => {
    const uid = requireUid(req);
    const projectKey = req.data?.projectKey?.trim();
    if (!projectKey) throw new HttpsError('invalid-argument', 'projectKey é obrigatório');
    try {
      const issues = await searchJiraIssuesByProject(uid, {
        projectKey,
        query: req.data?.query?.trim() || undefined,
        issueType: req.data?.issueType?.trim() || undefined,
        assigneeAccountId: req.data?.assigneeAccountId?.trim() || undefined,
        excludeClosedSprints: req.data?.excludeClosedSprints,
        maxResults: req.data?.maxResults,
      });
      return { ok: true, issues };
    } catch (err) {
      const mapped = mapAxiosError(err);
      throw new HttpsError(mapped.code as 'internal', mapped.message);
    }
  },
);

export const getJiraIssue = onCall<{ issueKey: string }>(
  { secrets: [ATLASSIAN_ENC_KEY] },
  async (req): Promise<{ ok: true; issue: JiraIssueSummary }> => {
    const uid = requireUid(req);
    const issueKey = req.data?.issueKey?.trim();
    if (!issueKey) throw new HttpsError('invalid-argument', 'issueKey é obrigatório.');
    try {
      const issue = await jiraGetIssue(uid, issueKey);
      return { ok: true, issue };
    } catch (err) {
      const mapped = mapAxiosError(err);
      throw new HttpsError(mapped.code as 'internal', mapped.message);
    }
  },
);
