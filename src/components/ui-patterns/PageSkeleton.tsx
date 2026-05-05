import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Variant = 'kpi' | 'table' | 'kanban' | 'cards' | 'page';

interface PageSkeletonProps {
  variant?: Variant;
  /** Number of rows/cards/columns depending on variant. */
  count?: number;
  className?: string;
}

const Header = () => (
  <div className="flex items-center justify-between">
    <div className="space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
    <Skeleton className="h-10 w-32" />
  </div>
);

const KpiRow = ({ count = 4 }: { count?: number }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="mt-2 h-3 w-32" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const TableRows = ({ count = 6 }: { count?: number }) => (
  <Card>
    <CardContent className="p-0">
      <div className="divide-y divide-border">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const KanbanBoard = ({ count = 4 }: { count?: number }) => (
  <div className="flex space-x-6 overflow-x-auto pb-4">
    {Array.from({ length: count }).map((_, col) => (
      <div key={col} className="flex-1 min-w-[280px] bg-muted/40 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-6 rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, c) => (
            <Card key={c}>
              <CardHeader className="p-4 pb-2 space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const CardGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </CardContent>
      </Card>
    ))}
  </div>
);

/**
 * Standard page-level skeleton matching the canonical page structure
 * (header → KPIs → content). Replaces ad-hoc spinners and "Carregando..."
 * text per design.md §6.
 *
 * Variants:
 * - `page`   header + 4 KPI cards + 6 table rows
 * - `kpi`    just the 4-card KPI grid
 * - `table`  N row table
 * - `kanban` N column kanban board
 * - `cards`  N card grid (3-col responsive)
 */
export const PageSkeleton = ({
  variant = 'page',
  count,
  className,
}: PageSkeletonProps) => {
  if (variant === 'kpi') return <div className={className}><KpiRow count={count} /></div>;
  if (variant === 'table') return <div className={className}><TableRows count={count} /></div>;
  if (variant === 'kanban') return <div className={className}><KanbanBoard count={count} /></div>;
  if (variant === 'cards') return <div className={className}><CardGrid count={count} /></div>;

  // page
  return (
    <div className={cn('space-y-8', className)}>
      <Header />
      <KpiRow />
      <TableRows />
    </div>
  );
};
