import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, ChevronDown, ArrowRight, CheckCircle2 } from 'lucide-react';
import AuthModal from './AuthModal';
import AnimatedLogo from './AnimatedLogo';
import PortalLoginButton from './PortalLoginButton';
import { useIntroTiming, useMotion, revealProps } from '@/lib/motion';

/**
 * IntroHero: the logo-first opening screen.
 *
 * One centered composition: the full brand mark near the visual centre of the
 * viewport below the header, the two portal actions underneath, and layered
 * brand lighting behind everything. No marketing copy competes with the logo;
 * the headline lives in the section below the fold.
 *
 * The ~2.5s entrance runs once per browser session (useIntroTiming); later
 * visits get a quick fade. Reduced motion collapses to a short opacity change.
 */
export default function HeroSection() {
  const [authType, setAuthType] = useState(null);
  const intro = useIntroTiming();
  const m = useMotion();

  return (
    <>
      <section
        className="bg-noise bg-vignette relative isolate flex flex-col overflow-hidden"
        style={{ minHeight: 'calc(100svh - 73px)' }}
      >
        {/* Layered lighting: teal upper left, blue upper right, faint orange
            warmth at the bottom. Fades in during the first 0.4s. */}
        <motion.div
          {...intro.lighting}
          aria-hidden="true"
          className="bg-intro-light pointer-events-none absolute inset-0 -z-10"
        />

        {/* Blurred background shapes, barely there; depth without circles. */}
        <motion.div {...intro.lighting} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 top-1/4 h-[30rem] w-[30rem] rounded-full bg-brand/[0.07] blur-[90px]" />
          <div className="absolute -right-32 top-1/3 h-[26rem] w-[26rem] rounded-full bg-brand-blue/[0.07] blur-[90px]" />
        </motion.div>

        {/* Centered composition */}
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-16 pt-6">
          <AnimatedLogo logoMotion={intro.logo} glowMotion={intro.glow} />

          <div className="mt-2 flex w-full max-w-sm flex-col items-center justify-center gap-4 sm:max-w-none sm:flex-row md:mt-4">
            <motion.div {...intro.button(0)} className="w-full sm:w-auto">
              <PortalLoginButton theme="student" icon={GraduationCap} onClick={() => setAuthType('student')}>
                Student / Parent Login
              </PortalLoginButton>
            </motion.div>
            <motion.div {...intro.button(1)} className="w-full sm:w-auto">
              <PortalLoginButton theme="tutor" icon={BookOpen} onClick={() => setAuthType('tutor')}>
                Tutor Login
              </PortalLoginButton>
            </motion.div>
          </div>
        </div>

        {/* Scroll hint settles in at the tail of the intro. Decorative. */}
        <motion.div
          {...intro.button(2)}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
            Scroll to explore
          </span>
          <motion.span
            animate={intro.reduced ? undefined : { y: [0, 5, 0] }}
            transition={intro.reduced ? undefined : { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-4 w-4 text-ink-400" />
          </motion.span>
        </motion.div>
      </section>

      {/* The message the old hero carried, now below the fold where it does
          not compete with the brand mark. */}
      <HeroMessage m={m} />

      <AuthModal type={authType} onClose={() => setAuthType(null)} />
    </>
  );
}

const TRUST_POINTS = [
  'One-on-one sessions',
  'Tutors matched to your goals',
  'Progress you can actually see',
];

function HeroMessage({ m }) {
  return (
    <section className="relative bg-white">
      <div className="section-seam absolute inset-x-0 top-0 h-px" aria-hidden="true" />
      <motion.div
        {...revealProps(m)}
        className="mx-auto flex w-full max-w-7xl flex-col items-start gap-8 px-6 py-16 md:flex-row md:items-center md:justify-between md:py-20"
      >
        <div className="max-w-2xl">
          <h1 className="text-h1 text-ink-900">
            Personalized Tutoring Gets <span className="text-brand-amber-deep">Results</span>
          </h1>
          <p className="mt-4 max-w-measure text-lead text-ink-600 text-pretty">
            We build the foundations behind the grade: clear instruction, steady practice,
            and the confidence to work through a hard problem alone.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm font-medium text-ink-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <a
          href="/contact"
          className="group inline-flex min-h-[52px] shrink-0 items-center gap-2 rounded-2xl px-7 text-base font-semibold text-ink-900 transition-[filter] duration-fast ease-brand-out hover:brightness-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber-deep"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.28), rgba(255,255,255,0) 45%), linear-gradient(180deg, rgb(250,190,80) 0%, rgb(240,160,50) 100%)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 8px 20px -8px rgba(240,160,50,0.65)',
          }}
        >
          Book a free consultation
          <ArrowRight className="h-4 w-4 transition-transform duration-hover ease-brand-out group-hover:translate-x-1" aria-hidden="true" />
        </a>
      </motion.div>
    </section>
  );
}
