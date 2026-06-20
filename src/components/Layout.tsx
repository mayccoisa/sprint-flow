import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { collapsed } = useSidebar();
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar />
      <main
        className={cn(
          'min-h-screen transition-[margin] duration-200 ease-out',
          collapsed ? 'md:ml-16' : 'md:ml-64',
        )}
      >
        <div className="container mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};
