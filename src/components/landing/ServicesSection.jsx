import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const services = [
  {
    title: 'K–12 Subject Tutoring',
    text: 'Math, reading comprehension, science, writing, and study skills with individualized tutoring plans.',
    href: '/services#k12',
  },
  {
    title: 'ACT / SAT Prep',
    text: 'Timing plans, score goals, formulas, question strategy, and personalized prep paths.',
    href: '/services#act-sat',
  },
  {
    title: 'Academic Coaching',
    text: 'Organization, confidence building, and structured support for long-term school success.',
    href: '/services#coaching',
  },
];

const inView = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.5 } };

export default function ServicesSection() {
  return (
    <section id="services" className="border-t border-slate-200" style={{ backgroundColor: 'rgba(16,95,166,0.04)' }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
      <motion.div className="flex flex-col gap-3" {...inView}>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgb(98,191,161)' }}>Services</div>
        </div>
      </motion.div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {services.map((card, i) => (
          <motion.div
            key={card.title}
            className="group rounded-2xl p-6 transition-all duration-[250ms] ease-out hover:-translate-y-1"
            style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(98,191,161,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
            {...inView}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <div className="text-xl font-semibold">{card.title}</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">{card.text}</p>
            <Link
              to={card.href}
              className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-all duration-200"
              style={{ backgroundColor: 'rgb(98,191,161)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'}
            >
              Learn More <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        ))}
      </div>
      </div>
    </section>
  );
}