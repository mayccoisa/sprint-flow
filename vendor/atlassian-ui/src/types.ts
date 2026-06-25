export interface JiraProject {
  key: string;
  name: string;
  projectTypeKey?: string;
  avatarUrl?: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
  iconUrl?: string;
  subtask: boolean;
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrl?: string;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'future' | 'closed';
  boardName?: string;
  startDate?: string;
  endDate?: string;
}

export interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
  type?: string;
}

export interface ConfluencePage {
  id: string;
  title: string;
  status?: string;
}

export interface ConfluenceFolder {
  id: string;
  title: string;
  parentId?: string;
}

export interface JiraApi {
  listProjects: () => Promise<{ projects: JiraProject[] }>;
  listIssueTypes: (input: { projectKey: string }) => Promise<{ issueTypes: JiraIssueType[] }>;
  listAssignableUsers: (input: { projectKey: string; query?: string }) => Promise<{ users: JiraUser[] }>;
  /** Lista sprints ativas + futuras dos boards Scrum do projeto. Opcional — se ausente, o seletor de sprint é ocultado. */
  listSprints?: (input: { projectKey: string }) => Promise<{ sprints: JiraSprint[] }>;
}

export interface ConfluenceApi {
  listSpaces: () => Promise<{ spaces: ConfluenceSpace[] }>;
  listPages: (input: { spaceKey: string }) => Promise<{ pages: ConfluencePage[] }>;
  listFolders: (input: { spaceKey: string }) => Promise<{ folders: ConfluenceFolder[] }>;
  createFolder: (input: { spaceKey: string; title: string; parentId?: string }) => Promise<{ folder: ConfluenceFolder }>;
}

export interface JiraIssueDraft {
  projectKey: string;
  issueType: string;
  summary: string;
  description?: string;
  labels?: string[];
  assigneeAccountId?: string;
  sprintId?: number;
}

export interface ConfluencePageDraft {
  spaceKey: string;
  title: string;
  content: string;
  parentId?: string;
}
