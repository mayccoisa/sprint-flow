-- Create squads table
CREATE TABLE IF NOT EXISTS public.squads (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'))
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  squad_id BIGINT NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  capacity INTEGER NOT NULL DEFAULT 0,
  specialty TEXT NOT NULL CHECK (specialty IN ('Frontend', 'Backend', 'QA', 'Design')),
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'))
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  estimate_frontend INTEGER,
  estimate_backend INTEGER,
  estimate_qa INTEGER,
  estimate_design INTEGER,
  task_type TEXT NOT NULL CHECK (task_type IN ('Feature', 'Bug', 'TechDebt', 'Spike')),
  priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  status TEXT NOT NULL DEFAULT 'Backlog' CHECK (status IN ('Backlog', 'InSprint', 'Done', 'Archived')),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Create sprints table
CREATE TABLE IF NOT EXISTS public.sprints (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  squad_id BIGINT NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'Active', 'Completed', 'Cancelled'))
);

-- Create sprint_tasks table with task_status for Kanban
CREATE TABLE IF NOT EXISTS public.sprint_tasks (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sprint_id BIGINT NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  task_id BIGINT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  task_status TEXT NOT NULL DEFAULT 'Todo' CHECK (task_status IN ('Todo', 'InProgress', 'Done', 'Blocked')),
  UNIQUE(sprint_id, task_id)
);

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  task_id BIGINT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  member_id BIGINT NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  UNIQUE(task_id, member_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_squad_id ON public.team_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_sprints_squad_id ON public.sprints(squad_id);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_sprint_id ON public.sprint_tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_task_id ON public.sprint_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_member_id ON public.task_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Enable Row Level Security
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - adjust based on auth requirements)
CREATE POLICY "Allow all operations on squads" ON public.squads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sprints" ON public.sprints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sprint_tasks" ON public.sprint_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on task_assignments" ON public.task_assignments FOR ALL USING (true) WITH CHECK (true);