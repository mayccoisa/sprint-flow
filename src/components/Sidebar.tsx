import {
  Activity,
  BookOpen,
  Boxes,
  Calendar,
  ChevronDown,
  ClipboardList,
  Code2,
  LayoutDashboard,
  Lightbulb,
  Plug,
  Rocket,
  Settings,
  Tag,
  UserCog,
  Users,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { SettingsDialog } from './settings/SettingsDialog';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WorkspaceSelector } from './workspace/WorkspaceSelector';

interface SidebarContentProps {
  /** Called whenever the user clicks an item that navigates — used to close mobile drawer. */
  onNavigate?: () => void;
}

type NavLeaf = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  feature?: string;
};

type NavSection = {
  id: string;
  name: string;
  children: NavLeaf[];
};

const STORAGE_PREFIX = 'sidebar_section_';

const readOpenState = (id: string, fallback: boolean) => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const SidebarContent = ({ onNavigate }: SidebarContentProps) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const dashboard: NavLeaf = {
    name: t('sidebar.dashboard'),
    href: '/',
    icon: LayoutDashboard,
  };

  const sections: NavSection[] = useMemo(() => {
    const teamChildren: NavLeaf[] = [
      { name: t('sidebar.squads'), href: '/squads', icon: Users, feature: 'squads' },
      { name: t('sidebar.forms', 'Formulários'), href: '/forms', icon: ClipboardList, feature: 'strategy' },
      { name: t('sidebar.jiraIntegration', 'Integração Jira'), href: '/admin/jira', icon: Plug },
    ];
    if (hasPermission('users', 'view')) {
      teamChildren.push({ name: t('sidebar.users') || 'Usuários', href: '/users', icon: UserCog, feature: 'users' });
    }

    return [
      {
        id: 'product',
        name: t('sidebar.productAndStrategy') || 'Produto & Estratégia',
        children: [
          { name: t('sidebar.allInitiatives'), href: '/initiatives', icon: Lightbulb, feature: 'initiatives' },
          { name: t('sidebar.strategy'), href: '/product-strategy', icon: Activity, feature: 'strategy' },
          { name: t('sidebar.modules'), href: '/product-modules', icon: Boxes, feature: 'strategy' },
          { name: t('sidebar.documentation', 'Documentação'), href: '/docs', icon: BookOpen, feature: 'documents' },
        ],
      },
      {
        id: 'execution',
        name: t('sidebar.planningAndExecution') || 'Planejamento & Execução',
        children: [
          { name: t('sidebar.productBacklog'), href: '/product-backlog', icon: ClipboardList, feature: 'backlog' },
          { name: t('sidebar.engineeringBacklog'), href: '/engineering-backlog', icon: Code2, feature: 'backlog' },
          { name: t('sidebar.sprints'), href: '/sprints', icon: Rocket, feature: 'sprints' },
          { name: t('sidebar.calendar'), href: '/calendar', icon: Calendar, feature: 'sprints' },
          { name: t('sidebar.releases'), href: '/releases', icon: Tag, feature: 'releases' },
        ],
      },
      {
        id: 'team',
        name: t('sidebar.teamAndAdmin') || 'Equipe & Admin',
        children: teamChildren,
      },
    ];
  }, [t, hasPermission]);

  const visibleSections = sections
    .map((s) => ({
      ...s,
      children: s.children.filter((c) => !c.feature || hasPermission(c.feature as any, 'view')),
    }))
    .filter((s) => s.children.length > 0);

  const activeSectionId = visibleSections.find((s) =>
    s.children.some((c) => c.href === location.pathname)
  )?.id;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const s of sections) initial[s.id] = readOpenState(s.id, true);
    return initial;
  });

  // Always keep the section containing the active route open.
  useEffect(() => {
    if (activeSectionId && !openSections[activeSectionId]) {
      setOpenSections((prev) => ({ ...prev, [activeSectionId]: true }));
    }
  }, [activeSectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(next[id]));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const isActive = (href: string) => location.pathname === href;

  const renderLeaf = (item: NavLeaf) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
        )}
        <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
        <span className="truncate">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-lg font-bold tracking-tight text-primary">Sprint Planner</h1>
      </div>

      <div className="px-3 pt-3">
        <WorkspaceSelector />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-0.5">{renderLeaf(dashboard)}</div>

        <div className="mt-4 space-y-4">
          {visibleSections.map((section) => {
            const open = openSections[section.id];
            const hasActiveChild = section.id === activeSectionId;

            return (
              <div key={section.id}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                    hasActiveChild
                      ? 'text-foreground'
                      : 'text-muted-foreground/70 hover:text-foreground'
                  )}
                  aria-expanded={open}
                >
                  <span className="flex items-center gap-2 truncate">
                    {section.name}
                    {hasActiveChild && !open && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                      open ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                </button>

                {open && (
                  <div className="mt-1 space-y-0.5">
                    {section.children.map(renderLeaf)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          {t('settings.title')}
        </button>
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

/** Desktop sidebar (md+). Mobile uses MobileSidebar via Sheet. */
export const Sidebar = () => (
  <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-border bg-card md:block">
    <SidebarContent />
  </aside>
);
