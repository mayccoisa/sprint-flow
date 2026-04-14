export type SquadStatus = 'Active' | 'Inactive';
export type MemberSpecialty = 'Frontend' | 'Backend' | 'QA' | 'Design';
export type MemberStatus = 'Active' | 'Inactive';
export type TaskType = 'Feature' | 'Bug' | 'TechDebt' | 'Spike';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus =
  | 'Discovery'
  | 'Refinement'
  | 'ReadyForEng'
  | 'Backlog' // Engineering Backlog
  | 'InSprint'
  | 'Review'
  | 'Done'
  | 'Archived';
export type TaskSprintStatus = 'Todo' | 'InProgress' | 'Done' | 'Blocked';
export type SprintStatus = 'Planning' | 'Active' | 'Completed' | 'Cancelled';
export type VersionStatus = 'Planned' | 'InProgress' | 'Released' | 'Cancelled';

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
  owner_id: string; // The user profile string ID who created it
  jira_config?: JiraConfig;
}


export interface Squad {
  id: number;
  workspace_id?: string;
  created_at: string;
  name: string;
  description: string | null;
  status: SquadStatus;
}

export interface TeamMember {
  id: number;
  workspace_id?: string;
  created_at: string;
  name: string;
  squad_id: number;
  capacity: number;
  specialty: MemberSpecialty;
  avatar_url: string | null;
  status: MemberStatus;
  user_id?: string; // Links member to a system user or pending invite
}



export interface Sprint {
  id: number;
  workspace_id?: string;
  created_at: string;
  name: string;
  squad_id: number;
  start_date: string;
  end_date: string;
  status: SprintStatus;
}

export interface SprintTask {
  id: number;
  workspace_id?: string;
  created_at: string;
  sprint_id: number;
  task_id: number;
  order_index: number;
  task_status: TaskSprintStatus;
}

export interface TaskAssignment {
  id: number;
  workspace_id?: string;
  created_at: string;
  task_id: number;
  member_id: number;
}

export interface Release {
  id: number;
  workspace_id?: string;
  created_at: string;
  version_name: string;
  release_date: string;
  squad_id: number | null;
  status: VersionStatus;
  description: string | null;
  release_notes: string | null;
  color: string | null;
}

export interface ReleaseTask {
  id: number;
  workspace_id?: string;
  created_at: string;
  release_id: number;
  task_id: number;
}



export type PrioritizationModel = 'ICE' | 'RICE' | 'BRICE';

// Update Task interface with area_id and prioritization metrics
export interface Task {
  id: number;
  workspace_id?: string;
  created_at: string;
  title: string;
  description: string | null;
  estimate_frontend: number | null;
  estimate_backend: number | null;
  estimate_qa: number | null;
  estimate_design: number | null;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  order_index: number;
  start_date: string | null;
  end_date: string | null;
  // Product Context
  product_objective: string | null;
  business_goal: string | null;
  user_impact: string | null;
  has_prototype: boolean;
  prototype_link: string | null;
  // Strategy
  area_id: number | null;
  feature_id: number | null;
  // Prioritization
  prioritization_model?: PrioritizationModel;
  ice_impact?: number | null;
  ice_confidence?: number | null;
  ice_ease?: number | null;
  rice_reach?: number | null;
  rice_impact?: number | null;
  rice_confidence?: number | null;
  rice_effort?: number | null;
  brice_business_value?: number | null;
  brice_reach?: number | null;
  brice_impact?: number | null;
  brice_confidence?: number | null;
  brice_effort?: number | null;
  // Jira Integration
  jira_key?: string | null;
}

export interface TaskDateChange {
  id: string;
  workspace_id?: string;
  task_id: number;
  old_end_date: string | null;
  new_end_date: string | null;
  reason: string;
  changed_at: string;
}

export interface JiraConfig {
  url: string;
  email: string;
  apiToken: string;
  isEnabled: boolean;
  // Configuração de Produto
  productProjectKey: string;
  productIssueTypes: string; // Ex: "Story, Initiative"
  // Configuração de Engenharia
  engProjectKey: string;
  engIssueTypes: string; // Ex: "Task, Bug"
}

export interface JiraSyncLog {
  id: string;
  workspace_id?: string;
  timestamp: string;
  jira_key: string;
  task_title: string;
  action: 'Created' | 'Updated' | 'StatusSync' | 'Imported';
  details: string;
  status: 'Success' | 'Error';
}

// Product Architecture Types
export interface ProductModule {
  id: number;
  workspace_id?: string;
  name: string;
  description: string | null;
  area_id: number; // Keep for backward compatibility or grouping
  icon?: string; // Lucide icon name
  health_score?: number; // 0-100
}

export type MetricType = 'bug_count' | 'nps' | 'usage_rate';

export interface ModuleMetric {
  id: number;
  workspace_id?: string;
  module_id: number;
  metric_type: MetricType;
  value: number;
  date: string;
}

export type ServiceType = 'Internal' | 'External' | 'Database' | 'Queue' | 'Gateway';

export interface ProductService {
  id: number;
  workspace_id?: string;
  name: string;
  description: string | null;
  type: ServiceType;
}

export type FeatureStatus = 'Live' | 'Beta' | 'Development' | 'Concept' | 'Deprecated';

export interface ProductFeature {
  id: number;
  workspace_id?: string;
  module_id: number;
  name: string;
  description: string | null;
  status: FeatureStatus;
}

export type DependencyType = 'Read' | 'Write' | 'ReadWrite' | 'DependsOn';

export interface ServiceDependency {
  id: number;
  workspace_id?: string;
  feature_id: number;
  service_id: number;
  type: DependencyType;
}

// User Management & RBAC
export type UserRole = 'Admin' | 'Member';
export type FeatureAction = 'view' | 'create' | 'edit' | 'delete';

// Features that can have granular permissions
export type AppFeature = 'squads' | 'initiatives' | 'backlog' | 'strategy' | 'sprints' | 'releases' | 'users' | 'documents';

export type FeaturePermission = {
  [K in AppFeature]?: FeatureAction[];
};

export interface UserProfile {
  id: string; // Firebase Auth Uid
  created_at: string;
  email: string;
  name: string | null;
  role: UserRole;
  permissions: FeaturePermission;
}

// Documentation Hub Types
export type DocumentType =
  | 'PRD'
  | 'JTBD'
  | 'WorkingBackwards'
  | 'Technical'
  | 'Persona'
  | 'Interview'
  | 'Custom';

export interface DocumentTemplate {
  id: string;
  type: DocumentType;
  title: string;
  description: string;
  content: string; // Markdown structure
  icon?: string; // Lucide icon name
}

export interface ProductDocument {
  id: number;
  workspace_id?: string;
  created_at: string;
  updated_at: string;
  title: string;
  type: DocumentType;
  content: string; // Markdown content
  author_id: string; // UserProfile id
  status: 'Draft' | 'Published' | 'Archived';
  tags?: string[];
}

// Custom Forms
export type FormFieldType = 'ShortText' | 'LongText' | 'Date' | 'Selector';

export interface FormField {
  id: string;          // ID único do campo para referência
  label: string;       // Nome do campo exibido para o usuário
  type: FormFieldType;
  options?: string[];  // Opções, usado apenas quando type === 'Selector'
  required: boolean;
  order: number;
}

export type FormDestination = 'Product' | 'Engineering';

export interface CustomForm {
  id: string;
  workspace_id?: string;
  created_at: string;
  title: string;
  description: string | null;
  fields: FormField[];
  destination: FormDestination;
  is_active: boolean;
  slug: string; // URL amigável para acesso ao formulário
}

export interface FormSubmission {
  id: string;
  workspace_id?: string;
  form_id: string;
  created_at: string;
  submitted_by?: string; // ID do usuário se estiver logado
  data: Record<string, any>; // Respostas chaveadas pelo ID do `FormField`
  task_id?: number | null; // ID da Task gerada automaticamente
}
