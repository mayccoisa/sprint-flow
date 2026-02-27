import { Users, ListTodo, Calendar as CalendarIcon, Folders, Database, Package, Settings, LogOut, Lightbulb, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { SettingsDialog } from './settings/SettingsDialog';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { hasPermission } = useAuth(); // Added useAuth hook
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [initiativesOpen, setInitiativesOpen] = useState(true);

  const baseNavigation = [
    { name: t('sidebar.dashboard'), href: '/', icon: Folders, type: 'link' },
    {
      name: t('sidebar.initiatives'),
      icon: Lightbulb,
      type: 'group',
      isOpen: initiativesOpen,
      toggle: () => setInitiativesOpen(!initiativesOpen),
      children: [
        { name: t('sidebar.allInitiatives'), href: '/initiatives', feature: 'initiatives' },
        { name: t('sidebar.strategy'), href: '/product-strategy', feature: 'strategy' },
        { name: t('sidebar.modules'), href: '/product-modules', feature: 'strategy' },
        { name: t('sidebar.productBacklog'), href: '/product-backlog', feature: 'backlog' },
        { name: t('sidebar.engineeringBacklog'), href: '/engineering-backlog', feature: 'backlog' },
        { name: t('sidebar.documentation', 'Documentation'), href: '/docs', feature: 'documents' },
      ]
    },
    { name: t('sidebar.squads'), href: '/squads', icon: Folders, type: 'link', feature: 'squads' },
    { name: t('sidebar.sprints'), href: '/sprints', icon: CalendarIcon, type: 'link', feature: 'sprints' },
    { name: t('sidebar.calendar'), href: '/calendar', icon: CalendarIcon, type: 'link', feature: 'sprints' },
    { name: t('sidebar.releases'), href: '/releases', icon: Package, type: 'link', feature: 'releases' },
  ];

  const adminNavigation = [];
  if (hasPermission('users', 'view')) {
    adminNavigation.push({ name: t('sidebar.usersManagement') || 'Users Management', href: '/users', icon: Users, type: 'link' });
  }

  const navigation = [...baseNavigation, ...adminNavigation]; // Combine navigation items

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-xl font-bold text-primary">Sprint Planner</h1>
      </div>
      <nav className="space-y-1 p-4">
        {navigation.map((item, index) => {
          if (item.type === 'group' && item.children) {
            // Filter children based on permission
            const visibleChildren = item.children.filter((child: any) =>
              !child.feature || hasPermission(child.feature, 'view')
            );

            if (visibleChildren.length === 0) return null;

            return (
              <div key={index} className="space-y-1">
                <button
                  onClick={item.toggle}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {item.icon && <item.icon className="h-5 w-5" />}
                    {item.name}
                  </div>
                  {item.isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                {item.isOpen && (
                  <div className="pl-9 space-y-1">
                    {visibleChildren.map((child: any) => {
                      const isActive = location.pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={cn(
                            'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Filter main links based on permission
          if ((item as any).feature && !hasPermission((item as any).feature, 'view')) {
            return null;
          }

          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href!}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {item.icon && <item.icon className="h-5 w-5" />}
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border p-4">
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="h-5 w-5" />
          {t('settings.title')}
        </button>
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </aside>
  );
};
