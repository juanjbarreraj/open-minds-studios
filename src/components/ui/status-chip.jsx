import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Status is communicated by text and a shape, never by colour alone: each
 * chip carries a label plus a coloured dot, so the meaning survives both
 * greyscale and colour vision deficiency.
 */
const TONES = {
  pending: { dot: 'bg-brand-amber', chip: 'bg-amber-50 text-amber-800 border-amber-200' },
  confirmed: { dot: 'bg-brand', chip: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  completed: { dot: 'bg-brand-blue', chip: 'bg-sky-50 text-sky-800 border-sky-200' },
  declined: { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700 border-slate-200' },
  neutral: { dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700 border-slate-200' },
  info: { dot: 'bg-brand-blue', chip: 'bg-sky-50 text-sky-800 border-sky-200' },
  success: { dot: 'bg-brand', chip: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  warning: { dot: 'bg-brand-amber', chip: 'bg-amber-50 text-amber-800 border-amber-200' },
  danger: { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 border-red-200' },
};

const SIZES = {
  sm: 'text-[11px] px-2 py-0.5 gap-1.5',
  md: 'text-xs px-2.5 py-1 gap-1.5',
};

export default function StatusChip({ tone = 'neutral', size = 'md', children = null, className = '', ...props }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold whitespace-nowrap',
        t.chip,
        SIZES[size],
        className
      )}
      {...props}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', t.dot)} aria-hidden="true" />
      {children}
    </span>
  );
}
