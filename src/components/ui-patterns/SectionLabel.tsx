import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
  /** Optional element rendered after the label (badge, count, hint). */
  trailing?: ReactNode;
}

/**
 * Compact uppercase label used to introduce subsections inside cards or panels.
 * Centralises the recurring pattern: `text-xs uppercase tracking-wider text-muted-foreground`.
 *
 * Use for dense contexts where a full `<CardTitle>` would be too heavy
 * (e.g. "DATAS PLANEJADAS", "TAREFAS POR TIPO", "INDICADORES").
 */
export const SectionLabel = ({ children, className, trailing }: SectionLabelProps) => {
  return (
    <div className="flex items-center gap-2">
      <h3
        className={cn(
          'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
          className
        )}
      >
        {children}
      </h3>
      {trailing}
    </div>
  );
};

interface CaptionProps {
  children: ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

/**
 * Standard helper / hint / caption text. Replaces stray `text-[10px]` and
 * `text-[11px]` strings across the codebase — always renders at `text-xs`
 * (12 px) in muted foreground.
 */
export const Caption = ({ children, className, as: Tag = 'p' }: CaptionProps) => {
  return (
    <Tag className={cn('text-xs text-muted-foreground', className)}>{children}</Tag>
  );
};
