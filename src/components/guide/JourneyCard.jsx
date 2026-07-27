import React from 'react';
import { motion } from 'framer-motion';

export default function JourneyCard({ journey, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.08 }}
      className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
    >
      <h3 className="text-lg font-bold text-slate-900 md:text-xl">{journey.title}</h3>
      {journey.context && (
        <p className="mt-2 text-sm italic text-slate-500">“{journey.context}”</p>
      )}
      <ol className="mt-5 space-y-4">
        {journey.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-4">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: 'rgb(98,191,161)' }}
            >
              {i + 1}
            </span>
            <span className="pt-0.5 text-[15px] leading-7 text-slate-600">{step}</span>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}