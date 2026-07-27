import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Clock, BookOpen, Brain, TrendingDown, Target, ListChecks, BarChart3, Lightbulb } from 'lucide-react';

const inView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

const struggles = [
  { icon: Clock, text: 'Timing and pacing issues' },
  { icon: BookOpen, text: 'Understanding more important than memorization' },
  { icon: Brain, text: 'Lack of test-taking strategies that separate good scores from great ones' },
  { icon: TrendingDown, text: 'Students may know the material but freeze under pressure or run out of time' },
];

const solutions = [
  { icon: Target, text: 'Teach effective test preparation skills: active recall and spaced repetition, simulate test day using consistent pacing, focus on understanding mistakes' },
  { icon: ListChecks, text: 'Master test-taking skills: active reading, two-pass method, follow per-question time limits' },
  { icon: Lightbulb, text: 'Build a personalized study plan targeting each student\'s specific weak areas' },
  { icon: BarChart3, text: 'Set SAT target goal score and establish a structured practice schedule' },
  { icon: CheckCircle2, text: 'Guide students through mock tests and build error logs to analyze mistakes and detect patterns' },
];

export default function TestSupportSection() {
  return (
    <section id="test-support" className="border-t border-slate-200" style={{ backgroundColor: 'rgba(98,193,161,0.05)' }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <motion.div className="text-center max-w-2xl mx-auto mb-12" {...inView}>
          <div
            className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: 'rgba(58,154,202,0.1)', color: 'rgb(58,154,202)' }}
          >
            Standardized Test Support
          </div>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl leading-tight">
            Does your child struggle with standardized tests?
          </h2>
          <p className="mt-4 text-base text-slate-500 leading-relaxed">
            SAT, ACT and Keystones can feel overwhelming without effective test prep and test-taking strategies. Good news: these skills can be taught!
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Why students struggle */}
          <motion.div
            {...inView}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Why students often score below their potential</h3>
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
            style={{ borderColor: 'rgba(58,154,202,0.25)', backgroundColor: 'rgba(58,154,202,0.03)' }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(58,154,202,0.12)' }}>
                <CheckCircle2 className="h-5 w-5" style={{ color: 'rgb(58,154,202)' }} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">How our tutoring helps</h3>
            </div>
            <ul className="space-y-4">
              {solutions.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(58,154,202,0.1)' }}>
                    <Icon className="h-4 w-4" style={{ color: 'rgb(58,154,202)' }} />
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