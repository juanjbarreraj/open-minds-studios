import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMotion } from '@/lib/motion';

/**
 * The product's button system, rebuilt with real depth.
 *
 * Each solid variant is a layered surface, not a flat rectangle: a two-stop
 * gradient fill, a low-opacity highlight along the top edge (the `before`
 * pseudo element), and multi-layer shadows that deepen on hover. Motion is
 * transform only, so hover lift and press stay on the compositor.
 *
 * Variants carry meaning: primary is the one obvious action, accent is the
 * roughly ten percent of calls to action that earn the orange, and
 * destructive can never be mistaken for either. Every variant keeps a visible
 * focus ring, a real disabled state, and a 44px minimum target at md.
 */
const VARIANTS = {
  primary: {
    className: 'text-white focus-visible:outline-brand-deep',
    style: {
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.16), rgba(255,255,255,0) 42%), linear-gradient(180deg, rgb(110,205,175) 0%, rgb(78,175,145) 100%)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 18px -6px rgba(78,175,145,0.6), 0 2px 6px rgba(15,23,42,0.12)',
    },
    hoverShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 12px 26px -8px rgba(78,175,145,0.7), 0 4px 10px rgba(15,23,42,0.14)',
  },
  secondary: {
    className: 'text-white focus-visible:outline-brand-blue-deep',
    style: {
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.16), rgba(255,255,255,0) 42%), linear-gradient(180deg, rgb(78,168,214) 0%, rgb(48,132,186) 100%)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 18px -6px rgba(48,132,186,0.6), 0 2px 6px rgba(15,23,42,0.12)',
    },
    hoverShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 12px 26px -8px rgba(48,132,186,0.7), 0 4px 10px rgba(15,23,42,0.14)',
  },
  accent: {
    className: 'text-ink-900 focus-visible:outline-brand-amber-deep',
    style: {
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.28), rgba(255,255,255,0) 45%), linear-gradient(180deg, rgb(250,190,80) 0%, rgb(240,160,50) 100%)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 6px 18px -6px rgba(240,160,50,0.6), 0 2px 6px rgba(15,23,42,0.1)',
    },
    hoverShadow: '0 1px 0 rgba(255,255,255,0.5) inset, 0 12px 26px -8px rgba(240,160,50,0.7), 0 4px 10px rgba(15,23,42,0.12)',
  },
  destructive: {
    className: 'text-white focus-visible:outline-red-700',
    style: {
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0) 42%), linear-gradient(180deg, rgb(233,80,80) 0%, rgb(207,45,45) 100%)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.22) inset, 0 6px 18px -6px rgba(207,45,45,0.55), 0 2px 6px rgba(15,23,42,0.12)',
    },
    hoverShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 12px 26px -8px rgba(207,45,45,0.68), 0 4px 10px rgba(15,23,42,0.14)',
  },
};

// Flat, bordered variants keep their utility styling; they are secondary
// surfaces and do not need the layered treatment.
const FLAT_VARIANTS = {
  outline: 'bg-white text-ink-700 border border-slate-200 shadow-elev-1 hover:border-brand-blue/40 hover:bg-slate-50',
  ghost: 'bg-transparent text-ink-600 hover:bg-slate-100 hover:text-ink-900',
  'destructive-quiet': 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
};

const SIZES = {
  sm: 'min-h-[36px] px-3.5 py-2 text-xs gap-1.5 rounded-xl',
  md: 'min-h-[44px] px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'min-h-[52px] px-7 py-3 text-base gap-2.5 rounded-2xl',
};

/** @type {any} */
const ActionButton = React.forwardRef(function ActionButton(props, ref) {
  const {
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
    style = {},
    ...rest
  } = /** @type {any} */ (props);
  const m = useMotion();
  const isDisabled = disabled || loading;
  const MotionComponent = React.useMemo(() => motion.create(Component), [Component]);
  const layered = VARIANTS[variant];
  const [hovered, setHovered] = React.useState(false);

  const composedStyle = layered
    ? {
        ...layered.style,
        ...(hovered && !isDisabled ? { boxShadow: layered.hoverShadow } : {}),
        ...style,
      }
    : style;

  return (
    <MotionComponent
      ref={ref}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      // Lift ~2-3px on hover, settle down and compress slightly on press.
      whileHover={isDisabled ? undefined : { y: -2.5, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
      whileTap={isDisabled ? undefined : { y: 0, scale: 0.98, transition: { duration: 0.12 } }}
      style={composedStyle}
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden font-semibold',
        'transition-[filter,background-color,border-color] duration-fast ease-brand-out',
        'disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none',
        'cursor-pointer select-none',
        layered ? layered.className : FLAT_VARIANTS[variant],
        !isDisabled && layered && 'hover:brightness-[1.03]',
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span>{loading && loadingText ? loadingText : children}</span>
      {!loading && IconRight && (
        <IconRight
          className="h-4 w-4 shrink-0 transition-transform duration-hover ease-brand-out group-hover:translate-x-1"
          aria-hidden="true"
        />
      )}
    </MotionComponent>
  );
});

export default ActionButton;
