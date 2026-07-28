import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMotion } from '@/lib/motion';

/**
 * The elevation system as a component.
 *
 *   level 1  resting content card
 *   level 2  interactive card, or a panel that sits above content
 *   level 3  featured card, popover, sticky panel
 *   level 4  modal
 *
 * `interactive` adds the affordances a clickable card needs: pointer cursor,
 * a lift, and a border that responds. Clickability is never signalled by
 * colour alone, so callers should also include a directional cue or a label.
 */
const LEVELS = {
  0: 'bg-transparent',
  1: 'bg-white border border-slate-200/80 shadow-elev-1',
  2: 'bg-white border border-slate-200/80 shadow-elev-2',
  3: 'bg-white border border-slate-200/70 shadow-elev-3',
  4: 'bg-white border border-slate-200/60 shadow-elev-4',
};

const RADII = {
  md: 'rounded-[var(--radius-md)]',
  lg: 'rounded-[var(--radius-lg)]',
  xl: 'rounded-[var(--radius-xl)]',
};

export default function Surface({
  level = 1,
  radius = 'lg',
  interactive = false,
  as = 'div',
  className = '',
  children = null,
  ...props
}) {
  const m = useMotion();
  const Component = React.useMemo(() => motion.create(as), [as]);

  return (
    <Component
      whileHover={interactive ? m.lift : undefined}
      className={cn(
        LEVELS[level],
        RADII[radius],
        'transition-[border-color,box-shadow] duration-hover ease-brand-out',
        interactive && 'cursor-pointer hover:border-brand/45 hover:shadow-elev-3',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
