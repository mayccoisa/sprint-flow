import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Internal styled buttons used by the dialogs. Kept here so the package has
 * zero dependency on the host app's design-system components.
 *
 * Classes assume Tailwind v3+ with the default palette (slate/indigo/etc.).
 */

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 font-bold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60';
const mdSize = 'px-4 py-2 text-sm rounded-xl';
const smSize = 'px-3 py-1.5 text-xs rounded-lg';

export function PrimaryButton({ className = '', ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={`${base} ${mdSize} bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:shadow-none ${className}`}
    />
  );
}

export function SecondaryButton({ className = '', ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={`${base} ${mdSize} bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 ${className}`}
    />
  );
}

export function GhostButtonSm({ className = '', ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={`${base} ${smSize} text-slate-600 hover:bg-slate-100 hover:text-slate-900 ${className}`}
    />
  );
}
