import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Folders, Users, ListTodo, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocalData } from '@/hooks/useLocalData';

const Index = () => {
  const { data } = useLocalData();

  const activeSquads = data.squads.filter(s => s.status === 'Active').length;
  const activeMembers = data.members.filter(m => m.status === 'Active').length;
  const totalCapacity = data.members
    .filter(m => m.status === 'Active')
    .reduce((sum, m) => sum + m.capacity, 0);

  return (
    <Layout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Sprint Capacity Planner</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your teams, sprints, and capacity planning
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Squads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSquads}</div>
              <p className="text-xs text-muted-foreground">Development teams</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeMembers}</div>
              <p className="text-xs text-muted-foreground">Active contributors</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCapacity} pts</div>
              <p className="text-xs text-muted-foreground">Per sprint</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Folders className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Squads</CardTitle>
                  <CardDescription>Manage development teams</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Create and organize squads, view team composition, and manage squad members.
              </p>
              <Button asChild className="w-full">
                <Link to="/squads">Manage Squads</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>View all team members</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                See the complete team roster, capacity breakdown, and manage member assignments.
              </p>
              <Button asChild className="w-full">
                <Link to="/team">View Team</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <ListTodo className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Backlog</CardTitle>
                  <CardDescription>Manage tasks and estimates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Manage tasks, estimate effort, and organize your backlog.
              </p>
              <Button asChild className="w-full">
                <Link to="/backlog">Manage Backlog</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Sprints</CardTitle>
                  <CardDescription>Plan and track sprints</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Plan sprints, allocate tasks, and track capacity utilization.
              </p>
              <Button asChild className="w-full">
                <Link to="/sprints">Manage Sprints</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
