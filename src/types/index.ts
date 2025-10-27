export type SquadStatus = 'Active' | 'Inactive';
export type MemberSpecialty = 'Frontend' | 'Backend' | 'QA' | 'Design';
export type MemberStatus = 'Active' | 'Inactive';
export type TaskType = 'Feature' | 'Bug' | 'TechDebt' | 'Spike';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Backlog' | 'InSprint' | 'Done' | 'Archived';
export type SprintStatus = 'Planning' | 'Active' | 'Completed' | 'Cancelled';

export interface Squad {
  id: number;
  created_at: string;
  name: string;
  description: string | null;
  status: SquadStatus;
}

export interface TeamMember {
  id: number;
  created_at: string;
  name: string;
  squad_id: number;
  capacity: number;
  specialty: MemberSpecialty;
  avatar_url: string | null;
  status: MemberStatus;
}

export interface Task {
  id: number;
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
}

export interface Sprint {
  id: number;
  created_at: string;
  name: string;
  squad_id: number;
  start_date: string;
  end_date: string;
  status: SprintStatus;
}

export interface SprintTask {
  id: number;
  created_at: string;
  sprint_id: number;
  task_id: number;
  order_index: number;
}

export interface TaskAssignment {
  id: number;
  created_at: string;
  task_id: number;
  member_id: number;
}
