import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar />
      <main className="min-h-screen md:ml-64">
        <div className="container mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};
