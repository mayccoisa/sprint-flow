import { getAtlassianClient, AtlassianNotConnectedError } from './client';
import { markdownToAdf } from './markdownToAdf';

export interface CreateIssueInput {
  projectKey: string;
  issueType: string;
  summary: string;
  description?: string;
  labels?: string[];
  parentKey?: string;
  assigneeAccountId?: string;
  sprintId?: number;
}

export interface CreateIssueResult {
  issueKey: string;
  issueUrl: string;
  projectKey: string;
  issueType: string;
}

export async function jiraCreateIssue(
  uid: string,
  input: CreateIssueInput,
): Promise<CreateIssueResult> {
  const client = await getAtlassianClient(uid);

  const fields: Record<string, unknown> = {
    project: { key: input.projectKey },
    issuetype: { name: input.issueType },
    summary: input.summary,
    description: markdownToAdf(input.description ?? ''),
  };
  if (input.labels?.length) fields.labels = input.labels;
  if (input.parentKey) fields.parent = { key: input.parentKey };
  if (input.assigneeAccountId) fields.assignee = { accountId: input.assigneeAccountId };

  if (typeof input.sprintId === 'number' && Number.isFinite(input.sprintId)) {
    const sprintFieldId = await getSprintCustomFieldId(client);
    if (sprintFieldId) fields[sprintFieldId] = input.sprintId;
  }

  const resp = await client.jira.post('/rest/api/3/issue', { fields });
  const issueKey = resp.data.key as string;
  return {
    issueKey,
    issueUrl: `${client.siteUrl}/browse/${issueKey}`,
    projectKey: input.projectKey,
    issueType: input.issueType,
  };
}

export interface JiraIssueSummary {
  key: string;
  summary: string;
  status: string;
  assignee: string | null;
  assigneeAccountId: string | null;
  assigneeAvatarUrl: string | null;
  issueType: string;
  url: string;
  sprintName: string | null;
  sprintState: 'active' | 'future' | 'closed' | null;
}

export interface SearchIssuesInput {
  projectKey: string;
  query?: string;
  issueType?: string;
  assigneeAccountId?: string;
  /** Quando true, exclui issues em sprints fechadas (mantém backlog + sprints abertas/futuras). Default: true. */
  excludeClosedSprints?: boolean;
  maxResults?: number;
}

export async function searchJiraIssuesByProject(
  uid: string,
  input: SearchIssuesInput,
): Promise<JiraIssueSummary[]> {
  const client = await getAtlassianClient(uid);
  const clauses: string[] = [`project = "${input.projectKey}"`];
  if (input.issueType) clauses.push(`issuetype = "${input.issueType}"`);
  if (input.assigneeAccountId) {
    if (input.assigneeAccountId === 'unassigned') {
      clauses.push('assignee is EMPTY');
    } else {
      clauses.push(`assignee = "${input.assigneeAccountId}"`);
    }
  }
  if (input.excludeClosedSprints !== false) {
    // backlog (sprint vazia) OU sprint não está em closedSprints()
    clauses.push('(sprint is EMPTY OR sprint not in closedSprints())');
  }
  if (input.query) {
    const q = input.query.replace(/"/g, '\\"');
    clauses.push(`(summary ~ "${q}*" OR key = "${q.toUpperCase()}")`);
  }
  const jql = `${clauses.join(' AND ')} ORDER BY updated DESC`;
  const max = Math.max(1, Math.min(50, input.maxResults ?? 25));

  // Descobre o customfield de Sprint pra pedir explicitamente
  const sprintFieldId = await getSprintCustomFieldId(client);
  const fields = ['summary', 'status', 'assignee', 'issuetype'];
  if (sprintFieldId) fields.push(sprintFieldId);

  const resp = await client.jira.post('/rest/api/3/search/jql', {
    jql,
    maxResults: max,
    fields,
  });
  const issues = (resp.data.issues ?? []) as Array<Record<string, unknown>>;
  return issues.map((i) => {
    const f = (i.fields ?? {}) as Record<string, unknown>;
    const status = (f.status ?? {}) as Record<string, unknown>;
    const assignee = (f.assignee ?? null) as Record<string, unknown> | null;
    const issuetype = (f.issuetype ?? {}) as Record<string, unknown>;
    const key = String(i.key);

    // Sprint: pega a mais relevante (ativa > futura > última fechada)
    let sprintName: string | null = null;
    let sprintState: 'active' | 'future' | 'closed' | null = null;
    if (sprintFieldId) {
      const arr = (f[sprintFieldId] ?? null) as Array<Record<string, unknown>> | null;
      if (Array.isArray(arr) && arr.length > 0) {
        const prio = (s: string) => (s === 'active' ? 0 : s === 'future' ? 1 : 2);
        const sorted = [...arr].sort(
          (a, b) => prio(String(a.state ?? 'closed')) - prio(String(b.state ?? 'closed')),
        );
        sprintName = String(sorted[0].name ?? '') || null;
        sprintState = (String(sorted[0].state ?? '') as 'active' | 'future' | 'closed') || null;
      }
    }

    return {
      key,
      summary: String(f.summary ?? ''),
      status: String(status.name ?? ''),
      assignee: (assignee?.displayName as string) ?? null,
      assigneeAccountId: (assignee?.accountId as string) ?? null,
      assigneeAvatarUrl:
        ((assignee?.avatarUrls as Record<string, string> | undefined)?.['24x24']) ?? null,
      issueType: String(issuetype.name ?? ''),
      url: `${client.siteUrl}/browse/${key}`,
      sprintName,
      sprintState,
    };
  });
}

export async function jiraGetIssue(uid: string, issueKey: string): Promise<JiraIssueSummary> {
  const client = await getAtlassianClient(uid);
  const resp = await client.jira.get(
    `/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,status,assignee,issuetype`,
  );
  const fields = (resp.data.fields ?? {}) as Record<string, unknown>;
  const status = (fields.status ?? {}) as Record<string, unknown>;
  const assignee = (fields.assignee ?? null) as Record<string, unknown> | null;
  const issuetype = (fields.issuetype ?? {}) as Record<string, unknown>;
  return {
    key: String(resp.data.key),
    summary: String(fields.summary ?? ''),
    status: String(status.name ?? ''),
    assignee: (assignee?.displayName as string) ?? null,
    assigneeAccountId: (assignee?.accountId as string) ?? null,
    assigneeAvatarUrl:
      ((assignee?.avatarUrls as Record<string, string> | undefined)?.['24x24']) ?? null,
    issueType: String(issuetype.name ?? ''),
    sprintName: null,
    sprintState: null,
    url: `${client.siteUrl}/browse/${resp.data.key}`,
  };
}

type JiraClient = Awaited<ReturnType<typeof getAtlassianClient>>;

const sprintFieldIdCache = new Map<string, string>();
async function getSprintCustomFieldId(client: JiraClient): Promise<string | null> {
  const cached = sprintFieldIdCache.get(client.siteUrl);
  if (cached) return cached;
  const resp = await client.jira.get('/rest/api/3/field');
  const fields = (resp.data ?? []) as Array<Record<string, unknown>>;
  const sprintField = fields.find((f) => {
    const schema = (f.schema ?? {}) as Record<string, unknown>;
    return schema.custom === 'com.pyxis.greenhopper.jira:gh-sprint';
  });
  if (!sprintField) return null;
  const id = String(sprintField.id);
  sprintFieldIdCache.set(client.siteUrl, id);
  return id;
}

export interface SprintSummary {
  id: number;
  name: string;
  state: 'active' | 'future' | 'closed';
  boardName?: string;
  startDate?: string;
  endDate?: string;
}

export async function listJiraSprintsForProject(
  uid: string,
  projectKey: string,
): Promise<SprintSummary[]> {
  const client = await getAtlassianClient(uid);
  const boardsResp = await client.jira.get(
    `/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}&type=scrum&maxResults=50`,
  );
  const boards = (boardsResp.data?.values ?? []) as Array<Record<string, unknown>>;
  if (!boards.length) return [];

  const all: SprintSummary[] = [];
  const seen = new Set<number>();
  for (const board of boards) {
    const boardId = board.id as number | undefined;
    if (typeof boardId !== 'number') continue;
    const boardName = board.name as string | undefined;
    try {
      const sprintsResp = await client.jira.get(
        `/rest/agile/1.0/board/${boardId}/sprint?state=active,future&maxResults=50`,
      );
      const sprints = (sprintsResp.data?.values ?? []) as Array<Record<string, unknown>>;
      for (const s of sprints) {
        const id = s.id as number;
        if (seen.has(id)) continue;
        seen.add(id);
        all.push({
          id,
          name: String(s.name),
          state: String(s.state) as 'active' | 'future' | 'closed',
          boardName,
          startDate: s.startDate as string | undefined,
          endDate: s.endDate as string | undefined,
        });
      }
    } catch {
      // Board sem permissão de sprint ou Kanban — segue
    }
  }
  all.sort((a, b) => {
    if (a.state !== b.state) return a.state === 'active' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return all;
}

export { AtlassianNotConnectedError };
