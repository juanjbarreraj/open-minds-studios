import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const inView = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.5 } };

function PricingCard() {
  const navigate = useNavigate();
  return (
    <div
      className="rounded-3xl p-6 cursor-pointer transition-all duration-hover ease-out hover:-translate-y-2 hover:shadow-xl group"
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.72)', border: '1.5px solid rgba(98,191,161,0.45)', boxShadow: '0 4px 24px rgba(98,191,161,0.1)' }}
      onClick={() => navigate('/subscription-plans')}>
      
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Pricing</div>
        


        
      </div>
      <div className="mt-2 text-3xl font-bold" style={{ color: 'rgb(98,191,161)' }}>Tier Based</div>
      <div className="mt-2 text-sm text-slate-600">Flexible programs designed around your goals</div>
      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 group-hover:gap-2.5"
      style={{ color: 'rgb(98,191,161)' }}>
        View programs <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
      </div>
    </div>);

}

export default function AboutSection() {
  return (
    <section id="about" className="relative bg-tint-orange">
      <div className="section-seam absolute inset-x-0 top-0 h-px" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr]">
        <motion.div {...inView}>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">About the center</div>
          <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
            Built around trust, consistency, and individualized learning.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            Designed for a modern tutoring center that offers one-on-one academic support,
            ACT/SAT prep, progress tracking, upcoming session visibility, and student access
            to prep materials in one place.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {['Private 1-to-1 tutoring', 'K–12 academic support', 'ACT / SAT / Keystone prep', 'Certified teachers', 'Flexible online scheduling', 'Written progress reports after sessions'].map((f) =>
            <div key={f} className="rounded-xl border px-4 py-3 text-sm shadow-sm" style={{ borderColor: 'rgba(98,191,161,0.3)', backgroundColor: 'rgba(98,191,161,0.05)' }}>{f}</div>
            )}
          </div>
        </motion.div>

        <motion.div className="grid gap-4 sm:grid-cols-2" {...inView} transition={{ duration: 0.5, delay: 0.1 }}>
          <PricingCard />
          <div className="rounded-2xl p-6" style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.35)', boxShadow: '0 4px 24px rgba(58,154,202,0.08)' }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Format</div>
            <div className="mt-2 text-3xl font-bold" style={{ color: 'rgb(58,154,202)' }}>Online</div>
            <div className="mt-2 text-sm text-slate-600">Zoom-based sessions with flexible scheduling</div>
          </div>
          <div className="rounded-2xl p-6 sm:col-span-2" style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.35)', boxShadow: '0 4px 24px rgba(246,178,59,0.08)' }}>
            <div className="text-sm text-slate-500">Why parents stay</div>
            <div className="mt-2 text-lg font-semibold leading-relaxed">
              Same tutor, written session reports, sibling discount, and support for IEP / 504 / GIEP learners
            </div>
          </div>
        </motion.div>
      </div>
    </section>);

}