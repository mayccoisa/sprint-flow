-- Create ENUMs
CREATE TYPE squad_status AS ENUM ('Active', 'Inactive');
CREATE TYPE member_specialty AS ENUM ('Frontend', 'Backend', 'QA', 'Design');
CREATE TYPE member_status AS ENUM ('Active', 'Inactive');
CREATE TYPE task_type AS ENUM ('Feature', 'Bug', 'TechDebt', 'Spike');
CREATE TYPE task_priority AS ENUM ('High', 'Medium', 'Low');
CREATE TYPE task_status AS ENUM ('Backlog', 'InSprint', 'Done', 'Archived');
CREATE TYPE task_sprint_status AS ENUM ('Todo', 'InProgress', 'Done', 'Blocked');
CREATE TYPE sprint_status AS ENUM ('Planning', 'Active', 'Completed', 'Cancelled');
CREATE TYPE version_status AS ENUM ('Planned', 'InProgress', 'Released', 'Cancelled');

-- Create squads table
CREATE TABLE squads (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  status squad_status NOT NULL DEFAULT 'Active'
);

-- Create team_members table
CREATE TABLE team_members (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  squad_id BIGINT NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  capacity INTEGER NOT NULL DEFAULT 0,
  specialty member_specialty NOT NULL,
  avatar_url TEXT,
  status member_status NOT NULL DEFAULT 'Active'
);

-- Create tasks table
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  estimate_frontend INTEGER,
  estimate_backend INTEGER,
  estimate_qa INTEGER,
  estimate_design INTEGER,
  task_type task_type NOT NULL DEFAULT 'Feature',
  priority task_priority NOT NULL DEFAULT 'Medium',
  status task_status NOT NULL DEFAULT 'Backlog',
  order_index INTEGER NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE
);

-- Create sprints table
CREATE TABLE sprints (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  squad_id BIGINT NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status sprint_status NOT NULL DEFAULT 'Planning'
);

-- Create sprint_tasks table
CREATE TABLE sprint_tasks (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sprint_id BIGINT NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  task_status task_sprint_status NOT NULL DEFAULT 'Todo',
  UNIQUE(sprint_id, task_id)
);

-- Create task_assignments table
CREATE TABLE task_assignments (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id BIGINT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  UNIQUE(task_id, member_id)
);

-- Create releases table
CREATE TABLE releases (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version_name TEXT NOT NULL,
  release_date DATE NOT NULL,
  squad_id BIGINT REFERENCES squads(id) ON DELETE SET NULL,
  status version_status NOT NULL DEFAULT 'Planned',
  description TEXT,
  release_notes TEXT,
  color TEXT DEFAULT '#6366f1'
);

-- Create release_tasks join table
CREATE TABLE release_tasks (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  release_id BIGINT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(release_id, task_id)
);

-- Enable RLS on all tables
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - no auth)
CREATE POLICY "Allow all operations on squads" ON squads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sprints" ON sprints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sprint_tasks" ON sprint_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on task_assignments" ON task_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on releases" ON releases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on release_tasks" ON release_tasks FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_team_members_squad_id ON team_members(squad_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_start_date ON tasks(start_date);
CREATE INDEX idx_tasks_end_date ON tasks(end_date);
CREATE INDEX idx_sprints_squad_id ON sprints(squad_id);
CREATE INDEX idx_sprints_status ON sprints(status);
CREATE INDEX idx_sprint_tasks_sprint_id ON sprint_tasks(sprint_id);
CREATE INDEX idx_sprint_tasks_task_id ON sprint_tasks(task_id);
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_member_id ON task_assignments(member_id);
CREATE INDEX idx_releases_release_date ON releases(release_date);
CREATE INDEX idx_release_tasks_release_id ON release_tasks(release_id);
CREATE INDEX idx_release_tasks_task_id ON release_tasks(task_id);