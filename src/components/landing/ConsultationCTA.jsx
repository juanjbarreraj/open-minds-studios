import React from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, ArrowRight } from 'lucide-react';

export default function ConsultationCTA() {
  return (
    <section className="border-t border-slate-200" style={{ background: 'linear-gradient(135deg, rgba(16,45,70,0.97) 0%, rgba(22,40,64,0.98) 60%, rgba(26,50,69,0.97) 100%)' }}>
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          style={{
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '2rem',
            padding: '3rem 2rem',
          }}
        >
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'rgba(98,191,161,0.18)' }}
          >
            <CalendarCheck className="h-7 w-7" style={{ color: 'rgb(98,191,161)' }} />
          </div>

          <h2 className="text-3xl font-bold text-white md:text-4xl leading-tight">
            Schedule a Free 30-Minute Consultation
          </h2>
          <p className="mt-4 text-base leading-relaxed max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Learn how Open Minds Studios can help your child strengthen academic skills, build real confidence, and succeed. Personalized support designed around their goals.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200"
              style={{ backgroundColor: 'rgb(98,191,161)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Book Your Free Consultation <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#about"
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              Learn more about our approach →
            </a>
          </div>

          <p className="mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            No commitment required. Available online for families across the area.
          </p>
        </motion.div>
      </div>
    </section>
  );
}