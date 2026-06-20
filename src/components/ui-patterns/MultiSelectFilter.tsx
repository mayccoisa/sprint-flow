import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  /** Optional tailwind bg-* class for a colored dot indicator. */
  dot?: string;
  /** Force display order (lower first). */
  order?: number;
  /** Italic styling — used for "Sem X" sentinels. */
  muted?: boolean;
}

interface Props {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Show a search field above the list. Auto-enabled if > 8 options. */
  searchable?: boolean;
  emptyText?: string;
  align?: 'start' | 'end';
}

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  searchable,
  emptyText = 'Nenhuma opção',
  align = 'start',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const showSearch = searchable ?? options.length > 8;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    return [...base].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [options, query]);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const clear = () => onChange([]);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(''); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-1.5 font-medium',
            selected.length > 0 && 'border-primary/40 text-primary',
          )}
        >
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-[10px] tabular-nums">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-64 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              Limpar
            </button>
          )}
        </div>
        {showSearch && (
          <div className="relative border-b px-2 py-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className="w-full rounded border border-input bg-transparent py-1.5 pl-7 pr-2 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-xs italic text-muted-foreground">{emptyText}</p>
          ) : (
            filtered.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                    isSelected && 'bg-accent/50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background',
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  {opt.dot && <span className={cn('h-2 w-2 rounded-full', opt.dot)} />}
                  <span className={cn('flex-1 truncate', opt.muted && 'italic text-muted-foreground')}>
                    {opt.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
