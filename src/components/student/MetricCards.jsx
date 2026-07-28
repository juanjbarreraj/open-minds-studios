import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, LineChart } from 'lucide-react';
import { useMotion, staggerProps } from '@/lib/motion';

// Progress metrics recorded by the student's tutor. Nothing is invented: with
// no records the dashboard says so instead of displaying placeholder numbers.
export default function MetricCards({ metrics }) {
  const m = useMotion();

  if (!metrics || metrics.length === 0) {
    return (
      <motion.div
        initial={m.reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-slate-200 bg-white px-6 py-10 text-center"
      >
        <LineChart className="mb-3 h-8 w-8 text-slate-300" aria-hidden="true" />
        <div className="text-sm font-semibold text-ink-700">No progress recorded yet</div>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-500">
          Your tutor adds practice scores and milestones here as you work through your sessions.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div {...staggerProps(m)} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((metric) => (
        <motion.div
          key={metric.id || metric.label}
          variants={m.card}
          whileHover={m.lift}
          className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-slate-200/80 bg-white p-5 shadow-elev-1 transition-shadow duration-hover ease-brand-out hover:shadow-elev-2"
        >
          {/* Brand wash that deepens on hover, replacing the flat top rule. */}
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand-blue to-brand opacity-70 transition-opacity duration-hover group-hover:opacity-100"
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs font-medium leading-snug text-ink-500">{metric.label}</div>
            <TrendingUp className="h-3.5 w-3.5 shrink-0 text-brand/70" aria-hidden="true" />
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-ink-900">
            {metric.value}
            {metric.unit && <span className="ml-1 text-sm font-medium text-ink-400">{metric.unit}</span>}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
