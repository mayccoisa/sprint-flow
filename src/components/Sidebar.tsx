import { Users, ListTodo, Calendar as CalendarIcon, Folders, Database, Package } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Folders },
  { name: 'Squads', href: '/squads', icon: Folders },
  { name: 'Team Members', href: '/team', icon: Users },
  { name: 'Backlog', href: '/backlog', icon: ListTodo },
  { name: 'Sprints', href: '/sprints', icon: CalendarIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Releases', href: '/releases', icon: Package },
  { name: 'Seed Data', href: '/admin/seed-data', icon: Database },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-xl font-bold text-primary">Sprint Planner</h1>
      </div>
      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
