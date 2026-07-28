import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: 'My son increased his SAT score by 230 points after working with Open Minds Studios.',
    author: 'Parent testimonial',
  },
  {
    quote: 'Very affordable, flexible, and personalized. It became part of our weekly routine.',
    author: 'Parent testimonial',
  },
  {
    quote: 'The one-on-one support helped build confidence and improve reading and math performance.',
    author: 'Parent testimonial',
  },
];

const inView = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.5 } };

export default function TestimonialsSection() {
  return (
    <section id="results" className="border-t border-slate-200" style={{ backgroundColor: 'rgba(98,193,161,0.05)' }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
      <motion.div {...inView}>
        <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgb(98,191,161)' }}>Testimonials</div>
        <h2 className="mt-2 text-3xl font-bold md:text-4xl">
          See What Other Parents Are Saying
        </h2>
      </motion.div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {testimonials.map((item, i) => (
          <motion.div
            key={item.quote}
            className="relative rounded-2xl p-6 transition-all duration-hover ease-out hover:-translate-y-1"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(58,154,202,0.15)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
            {...inView}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Quote className="mb-3 h-5 w-5" style={{ color: 'rgb(246,178,59)' }} />
            <p className="text-base leading-8 text-slate-700">"{item.quote}"</p>
            <div className="mt-5 text-sm font-medium text-slate-500">{item.author}</div>
          </motion.div>
        ))}
      </div>
      </div>
    </section>
  );
}