import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMotion } from '@/lib/motion';

/**
 * The product's button system.
 *
 * Variants carry meaning, not just colour: primary is the one obvious action,
 * accent is reserved for the roughly ten percent of calls to action that
 * deserve the orange, and destructive can never be mistaken for either.
 *
 * Every variant keeps a visible focus ring, a real disabled state, and a
 * 44px minimum touch target at the default size.
 */
const VARIANTS = {
  primary:
    'bg-brand text-white shadow-elev-brand hover:bg-brand-deep focus-visible:outline-brand-deep',
  secondary:
    'bg-brand-blue text-white shadow-elev-2 hover:bg-brand-blue-deep',
  outline:
    'bg-white text-ink-700 border border-slate-200 shadow-elev-1 hover:border-brand-blue/40 hover:bg-slate-50',
  accent:
    'bg-brand-amber text-ink-900 shadow-elev-2 hover:bg-brand-amber-deep hover:text-white',
  ghost:
    'bg-transparent text-ink-600 hover:bg-slate-100 hover:text-ink-900',
  destructive:
    'bg-red-600 text-white shadow-elev-2 hover:bg-red-700 focus-visible:outline-red-700',
  'destructive-quiet':
    'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
};

const SIZES = {
  sm: 'min-h-[36px] px-3.5 py-2 text-xs gap-1.5 rounded-xl',
  // 44px tall: the minimum comfortable touch target.
  md: 'min-h-[44px] px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'min-h-[52px] px-7 py-3 text-base gap-2.5 rounded-2xl',
};

const ActionButton = React.forwardRef(function ActionButton(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText = '',
    icon: Icon = null,
    iconRight: IconRight = null,
    className = '',
    children = null,
    disabled = false,
    as: Component = 'button',
    ...props
  },
  ref
) {
  const m = useMotion();
  const isDisabled = disabled || loading;
  const MotionComponent = React.useMemo(() => motion.create(Component), [Component]);

  return (
    <MotionComponent
      ref={ref}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      whileHover={isDisabled ? undefined : m.hover}
      whileTap={isDisabled ? undefined : m.tap}
      className={cn(
        'inline-flex items-center justify-center font-semibold',
        'transition-colors duration-fast ease-brand-out',
        'disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none',
        'cursor-pointer select-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span>{loading && loadingText ? loadingText : children}</span>
      {!loading && IconRight && <IconRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
    </MotionComponent>
  );
});

export default ActionButton;
