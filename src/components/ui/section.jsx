import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMotion, revealProps } from '@/lib/motion';

/**
 * A page section with a consistent rhythm and an optional brand tint.
 *
 * Tints are intentionally faint (4 to 5 percent) so sections separate without
 * reading as solid blocks of colour, and each one carries a hairline seam at
 * the top rather than a hard edge against the previous section.
 */
const TONES = {
  white: 'bg-white',
  teal: 'bg-tint-teal',
  blue: 'bg-tint-blue',
  orange: 'bg-tint-orange',
  glow: 'bg-white bg-brand-glow',
};

export default function Section({
  tone = 'white',
  seam = true,
  reveal = true,
  className = '',
  containerClassName = '',
  children = null,
  ...props
}) {
  const m = useMotion();
  const revealAttrs = reveal ? revealProps(m) : {};

  return (
    <section className={cn('relative', TONES[tone], className)} {...props}>
      {seam && (
        <div className="section-seam absolute inset-x-0 top-0 h-px" aria-hidden="true" />
      )}
      <motion.div
        {...revealAttrs}
        className={cn('mx-auto w-full max-w-7xl px-6 py-20 md:py-24', containerClassName)}
      >
        {children}
      </motion.div>
    </section>
  );
}

/** Eyebrow, heading, and supporting copy with a consistent hierarchy. */
export function SectionHeading({ eyebrow = null, title = null, description = null, align = 'left', accent = null, className = '' }) {
  return (
    <div
      className={cn(
        'max-w-prose',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      {eyebrow && (
        <div className="text-eyebrow uppercase text-brand-blue mb-3">{eyebrow}</div>
      )}
      {title && (
        <h2 className="text-h2 text-ink-900 text-balance">
          {title}
          {accent && <span className="text-brand-amber-deep"> {accent}</span>}
        </h2>
      )}
      {description && (
        <p className={cn('mt-4 text-lead text-ink-600 text-pretty', align === 'center' && 'mx-auto')}>
          {description}
        </p>
      )}
    </div>
  );
}
