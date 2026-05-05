import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SidebarContent } from './Sidebar';

/**
 * Mobile-only top bar with hamburger that opens the full sidebar in a Sheet.
 * Hidden on md+ (where the desktop fixed sidebar takes over).
 *
 * Closes automatically when the user navigates to a route.
 */
export const MobileSidebar = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('sidebar.openMenu', 'Open menu')}>
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">{t('sidebar.menu', 'Menu')}</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <span className="text-base font-semibold text-primary">Sprint Planner</span>
    </header>
  );
};
