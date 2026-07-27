import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Puzzle, Hash, HelpCircle, HeartCrack, UserCheck, Repeat, ShieldCheck, Smile, BookMarked } from 'lucide-react';

const inView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

const struggles = [
  { icon: Puzzle, text: 'Weak foundational skills' },
  { icon: Hash, text: 'Memorizing formulas instead of understanding them' },
  { icon: HelpCircle, text: 'Difficulty applying what they\'ve learned to new problems independently' },
  { icon: HeartCrack, text: 'Math anxiety and stress that affects performance on assignments and tests' },
];

const solutions = [
  { icon: UserCheck, text: 'Personalized instruction reduces content gaps' },
  { icon: BookMarked, text: 'Step-by-step explanations at student\'s pace' },
  { icon: ShieldCheck, text: 'Focus on understanding and revisiting concepts' },
  { icon: Smile, text: 'Test anxiety reduced and confidence increased' },
  { icon: Repeat, text: 'Daily active independent practice' },
];

export default function AcademicSupportSection() {
  return (
    <section id="academic-support" className="border-t border-slate-200" style={{ backgroundColor: 'rgba(16,95,166,0.04)' }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <motion.div className="text-center max-w-2xl mx-auto mb-12" {...inView}>
          <div
            className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: 'rgba(98,191,161,0.12)', color: 'rgb(60,160,130)' }}
          >
            Math, Homework & Test Anxiety
          </div>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl leading-tight">
            Does your child struggle with math, homework, or panic before tests?
          </h2>
          <p className="mt-4 text-base text-slate-500 leading-relaxed">
            If so, our tutoring approach is designed to provide clear instruction, stronger foundations, and lasting confidence, not just short-term fixes.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Why students struggle */}
          <motion.div
            {...inView}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-7 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Common reasons students fall behind</h3>
            </div>
            <ul className="space-y-4">
              {struggles.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.07)' }}>
                    <Icon className="h-4 w-4 text-red-400" />
                  </span>
                  <span className="text-sm leading-relaxed text-slate-600">{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* How tutoring helps */}
          <motion.div
            {...inView}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="rounded-2xl border p-7 shadow-sm"
            style={{ borderColor: 'rgba(98,191,161,0.3)', backgroundColor: 'rgba(98,191,161,0.04)' }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(98,191,161,0.15)' }}>
                <CheckCircle2 className="h-5 w-5" style={{ color: 'rgb(98,191,161)' }} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">How our tutoring makes a difference</h3>
            </div>
            <ul className="space-y-4">
              {solutions.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(98,191,161,0.1)' }}>
                    <Icon className="h-4 w-4" style={{ color: 'rgb(98,191,161)' }} />
                  </span>
                  <span className="text-sm leading-relaxed text-slate-600">{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}