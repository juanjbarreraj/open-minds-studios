import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calculator, Target, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import Section, { SectionHeading } from '@/components/ui/section';
import { useMotion, staggerProps } from '@/lib/motion';

const services = [
  {
    title: 'K-12 Subject Tutoring',
    text: 'Math, reading comprehension, science, writing, and study skills with individualized tutoring plans.',
    href: '/services#k12',
    icon: Calculator,
    accent: 'rgb(var(--brand-primary))',
    tint: 'rgba(98, 191, 161, 0.12)',
  },
  {
    title: 'ACT and SAT Prep',
    text: 'Timing plans, score goals, formulas, question strategy, and personalized prep paths.',
    href: '/services#act-sat',
    icon: Target,
    accent: 'rgb(var(--brand-secondary))',
    tint: 'rgba(58, 154, 202, 0.12)',
  },
  {
    title: 'Academic Coaching',
    text: 'Organization, confidence building, and structured support for long-term school success.',
    href: '/services#coaching',
    icon: Compass,
    accent: 'rgb(var(--brand-accent-deep))',
    tint: 'rgba(239, 121, 57, 0.12)',
  },
];

export default function ServicesSection() {
  const m = useMotion();

  return (
    <Section id="services" tone="blue" reveal={false}>
      <motion.div initial="hidden" whileInView="visible" viewport={m.viewport} variants={m.section}>
        <SectionHeading
          eyebrow="Services"
          title="Support shaped around the student"
          description="Three ways we work with families, each built on the same idea: understand the gap first, then close it."
        />
      </motion.div>

      <motion.div {...staggerProps(m)} className="mt-12 grid gap-6 md:grid-cols-3">
        {services.map(({ title, text, href, icon: Icon, accent, tint }) => (
          <motion.div key={title} variants={m.card}>
            {/* The whole card is the link, so the target is large and the
                focus ring wraps the entire surface. */}
            <motion.div whileHover={m.lift} className="h-full">
              <Link
                to={href}
                className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-slate-200/80 bg-white p-7 shadow-elev-1 transition-[border-color,box-shadow] duration-hover ease-brand-out hover:border-brand/45 hover:shadow-elev-3"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] transition-transform duration-hover ease-brand-out group-hover:scale-105"
                  style={{ backgroundColor: tint }}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6" style={{ color: accent }} />
                </span>

                <h3 className="mt-5 text-h3 text-ink-900">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-ink-600">{text}</p>

                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-deep">
                  Learn more
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-hover ease-brand-out group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
