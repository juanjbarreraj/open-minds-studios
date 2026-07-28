import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';
import AuthModal from './AuthModal';
import { useMotion, EASE_OUT } from '@/lib/motion';

const TRUST_POINTS = [
  'One-on-one sessions',
  'Tutors matched to your goals',
  'Progress you can actually see',
];

const PORTALS = [
  {
    type: 'student',
    title: 'Student and Parent',
    description: 'Book sessions, track progress, and pick up assigned work.',
    icon: GraduationCap,
    accent: 'rgb(var(--brand-primary))',
    tint: 'rgba(98, 191, 161, 0.1)',
  },
  {
    type: 'tutor',
    title: 'Tutor',
    description: 'Manage availability, appointments, and student modules.',
    icon: BookOpen,
    accent: 'rgb(var(--brand-secondary))',
    tint: 'rgba(58, 154, 202, 0.1)',
  },
];

export default function HeroSection() {
  const [authType, setAuthType] = useState(null);
  const m = useMotion();

  // One staged entrance, finishing well under a second so the page never
  // feels like it is holding the reader up.
  const stage = (delay) =>
    m.reduced
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: EASE_OUT },
        };

  return (
    <>
      <section className="relative isolate overflow-hidden bg-white bg-brand-glow">
        {/* Decorative only. Static gradients, no looping animation. */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 h-[24rem] w-[24rem] rounded-full bg-brand-blue/10 blur-3xl" />
        </div>

        <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-6 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Message */}
          <div>
            <motion.div
              {...stage(0.05)}
              className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-4 py-1.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              <span className="text-eyebrow uppercase text-brand-deep">
                Math, homework, and test prep
              </span>
            </motion.div>

            <motion.h1 {...stage(0.12)} className="mt-6 max-w-[13ch] text-display text-ink-900">
              Personalized Tutoring Gets{' '}
              <span className="text-brand-amber-deep">Results</span>
            </motion.h1>

            <motion.p {...stage(0.19)} className="mt-6 max-w-measure text-lead text-ink-600 text-pretty">
              We build the foundations behind the grade: clear instruction, steady practice,
              and the confidence to work through a hard problem alone.
            </motion.p>

            <motion.ul {...stage(0.26)} className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {TRUST_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm font-medium text-ink-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </motion.ul>

            <motion.div {...stage(0.33)} className="mt-9">
              <a
                href="/contact"
                className="inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-brand-amber px-7 text-base font-semibold text-ink-900 shadow-elev-2 transition-colors duration-fast ease-brand-out hover:bg-brand-amber-deep hover:text-white"
              >
                Book a free consultation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </motion.div>
          </div>

          {/* Portal choices. These are the primary action for a returning
              family or tutor, so they get real visual weight. */}
          <motion.div {...stage(0.22)} className="w-full">
            <div className="rounded-[var(--radius-xl)] border border-slate-200/80 bg-white/85 p-6 shadow-elev-3 backdrop-blur-sm sm:p-7">
              <img
                src="/assets/logo-no-background.png"
                alt="Open Minds Studios"
                width="320"
                height="214"
                className="mx-auto mb-6 w-48 select-none object-contain sm:w-56"
              />

              <h2 className="text-sm font-bold text-ink-900">Already with Open Minds?</h2>
              <p className="mt-1 text-sm text-ink-600">Sign in to your portal.</p>

              <div className="mt-5 grid gap-3">
                {PORTALS.map(({ type, title, description, icon: Icon, accent, tint }) => (
                  <motion.button
                    key={type}
                    type="button"
                    onClick={() => setAuthType(type)}
                    whileHover={m.lift}
                    whileTap={m.tap}
                    className="group flex w-full items-center gap-4 rounded-[var(--radius-lg)] border border-slate-200 bg-white p-4 text-left shadow-elev-1 transition-[border-color,box-shadow] duration-hover ease-brand-out hover:border-brand/45 hover:shadow-elev-2"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                      style={{ backgroundColor: tint }}
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5" style={{ color: accent }} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ink-900">{title}</span>
                      <span className="block text-xs leading-relaxed text-ink-600">{description}</span>
                    </span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-ink-400 transition-transform duration-hover ease-brand-out group-hover:translate-x-1 group-hover:text-brand"
                      aria-hidden="true"
                    />
                  </motion.button>
                ))}
              </div>

              <p className="mt-4 text-xs text-ink-500">
                New family? Start with a free consultation and we will set up your portal.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint. The bounce is decorative, so it is dropped entirely
            when reduced motion is requested rather than merely shortened. */}
        <div className="flex justify-center pb-10">
          <motion.div
            {...stage(0.4)}
            className="flex flex-col items-center gap-1.5"
            aria-hidden="true"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              Scroll to explore
            </span>
            <motion.span
              animate={m.reduced ? undefined : { y: [0, 5, 0] }}
              transition={m.reduced ? undefined : { repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <ChevronDown className="h-4 w-4 text-ink-400" />
            </motion.span>
          </motion.div>
        </div>
      </section>

      <AuthModal type={authType} onClose={() => setAuthType(null)} />
    </>
  );
}
