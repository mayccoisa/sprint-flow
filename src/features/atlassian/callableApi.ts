import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import type { JiraApi } from '@maycon/atlassian-ui';

const listJiraProjectsFn = httpsCallable<
  unknown,
  Awaited<ReturnType<JiraApi['listProjects']>> & { ok: true }
>(functions, 'listJiraProjects');

const listJiraIssueTypesFn = httpsCallable<
  Parameters<JiraApi['listIssueTypes']>[0],
  Awaited<ReturnType<JiraApi['listIssueTypes']>> & { ok: true }
>(functions, 'listJiraIssueTypes');

const listJiraAssignableUsersFn = httpsCallable<
  Parameters<JiraApi['listAssignableUsers']>[0],
  Awaited<ReturnType<JiraApi['listAssignableUsers']>> & { ok: true }
>(functions, 'listJiraAssignableUsers');

const listJiraSprintsFn = httpsCallable<
  { projectKey: string },
  Awaited<ReturnType<NonNullable<JiraApi['listSprints']>>> & { ok: true }
>(functions, 'listJiraSprints');

export const jiraApi: JiraApi = {
  listProjects: () => listJiraProjectsFn().then((r) => ({ projects: r.data.projects })),
  listIssueTypes: (i) => listJiraIssueTypesFn(i).then((r) => ({ issueTypes: r.data.issueTypes })),
  listAssignableUsers: (i) => listJiraAssignableUsersFn(i).then((r) => ({ users: r.data.users })),
  listSprints: (i) => listJiraSprintsFn(i).then((r) => ({ sprints: r.data.sprints })),
};

interface CreateIssueInput {
  projectKey: string;
  issueType: string;
  summary: string;
  description?: string;
  labels?: string[];
  parentKey?: string;
  assigneeAccountId?: string;
  sprintId?: number;
}

export const createJiraIssueFromInitiativeFn = httpsCallable<
  CreateIssueInput,
  { ok: true; issueKey: string; issueUrl: string; projectKey: string; issueType: string }
>(functions, 'createJiraIssueFromInitiative');

interface SearchIssuesInput {
  projectKey: string;
  query?: string;
  issueType?: string;
  assigneeAccountId?: string;
  excludeClosedSprints?: boolean;
  maxResults?: number;
}

export interface JiraIssueRow {
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

export const searchJiraIssuesFn = httpsCallable<
  SearchIssuesInput,
  { ok: true; issues: JiraIssueRow[] }
>(functions, 'searchJiraIssues');

export const getJiraIssueFn = httpsCallable<
  { issueKey: string },
  {
    ok: true;
    issue: {
      key: string;
      summary: string;
      status: string;
      assignee: string | null;
      issueType: string;
      url: string;
    };
  }
>(functions, 'getJiraIssue');
