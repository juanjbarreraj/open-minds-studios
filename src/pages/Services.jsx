import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Target, Brain, ArrowRight, CheckCircle2, ClipboardList,
  Users, Star, Clock, MessageCircle, ChevronRight
} from 'lucide-react';
import SiteHeader from '../components/landing/SiteHeader';
import SiteFooter from '../components/landing/SiteFooter';

const inView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5 },
};

const steps = [
  { num: '1', title: 'Free Consultation', desc: 'We start with a no-obligation call to understand your student and what they need.' },
  { num: '2', title: 'Understanding Student Needs', desc: 'We assess academic gaps, goals, learning style, and schedule to build the right picture.' },
  { num: '3', title: 'Matching with the Right Tutor', desc: 'We pair your student with a tutor who fits their personality, goals, and subject needs.' },
  { num: '4', title: 'Creating a Personalized Plan', desc: 'A custom learning plan is built around your student, not a one-size-fits-all curriculum.' },
  { num: '5', title: 'Consistent Weekly Sessions', desc: 'Regular sessions keep students on track, building skills and confidence over time.' },
  { num: '6', title: 'Ongoing Feedback & Progress Tracking', desc: 'Parents receive session recaps and progress updates throughout the program.' },
];

const k12Points = [
  'One-on-one personalized instruction tailored to each student',
  'Support across math, reading, writing, science, history, and more',
  'Focus on building strong academic foundations',
  'Adapted to each student\'s pace and learning style',
  'Homework help and concept reinforcement after school',
  'Ongoing progress monitoring with session recap notes',
];

const k12How = [
  { label: 'Initial consultation', desc: 'We learn about the student\'s current challenges and goals.' },
  { label: 'Assessment of needs', desc: 'We identify gaps, strengths, and areas for targeted growth.' },
  { label: 'Custom learning plan', desc: 'A personalized roadmap is created for the student.' },
  { label: 'Weekly sessions', desc: 'Consistent, focused tutoring sessions build momentum.' },
  { label: 'Progress updates', desc: 'Families receive regular feedback and session summaries.' },
];

const satPoints = [
  'Structured test preparation programs for ACT and SAT',
  'Focus on timing strategies and question prioritization',
  'Full-length practice tests with detailed performance analysis',
  'Targeted improvement in weak areas: math, reading, writing, science',
  'Score improvement strategies and test-day confidence building',
  'Personalized pacing plans based on your student\'s target score',
];

const satHow = [
  { label: 'Diagnostic test', desc: 'Establish a baseline and identify which areas need the most attention.' },
  { label: 'Customized prep plan', desc: 'A structured plan is built around the student\'s test date and goals.' },
  { label: 'Strategy sessions', desc: 'Learn timing strategies, question types, and elimination techniques.' },
  { label: 'Practice + review cycles', desc: 'Regular practice tests are followed by detailed review sessions.' },
  { label: 'Progress tracking', desc: 'Score improvements are tracked and the plan is adjusted as needed.' },
];

const coachingPoints = [
  'Focus on organization, study habits, and academic routines',
  'Time management strategies and long-term planning support',
  'Accountability systems that keep students consistent',
  'Confidence building and mindset coaching for academic success',
  'Support for developing independent learning skills',
  'Strategies tailored to each student\'s unique challenges',
];

const coachingHow = [
  { label: 'Goal setting', desc: 'Define clear, achievable academic and personal goals.' },
  { label: 'Weekly coaching sessions', desc: 'Regular check-ins keep students focused and on track.' },
  { label: 'Habit-building strategies', desc: 'Build the routines that make academic success sustainable.' },
  { label: 'Ongoing check-ins', desc: 'Consistent support between sessions for accountability.' },
  { label: 'Personalized support', desc: 'Coaching adapts as the student grows and their needs evolve.' },
];

function ServiceSection({ id, icon: Icon, color, bg, borderColor, title, badge, intro, points, howItems, children }) {
  return (
    <section id={id} className="py-16 px-6 border-t border-slate-100 scroll-mt-20" style={{ backgroundColor: bg }}>
      <div className="mx-auto max-w-5xl">
        <motion.div {...inView} className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] mb-3"
            style={{ backgroundColor: `${color}18`, color }}>
            <Icon className="h-3.5 w-3.5" />
            {badge}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{title}</h2>
          <p className="mt-3 text-base text-slate-600 leading-8 max-w-2xl">{intro}</p>
        </motion.div>

        <div className="grid gap-10 md:grid-cols-2">
          {/* What's included */}
          <motion.div {...inView} transition={{ duration: 0.5, delay: 0.05 }}>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-4">What's included</div>
            <ul className="space-y-3">
              {points.map(p => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* How it works */}
          <motion.div {...inView} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-4">How it works</div>
            <div className="space-y-3">
              {howItems.map((item, i) => (
                <div key={item.label} className="flex gap-3 rounded-xl border p-4"
                  style={{ borderColor, backgroundColor: `${color}06` }}>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: color }}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {children}
      </div>
    </section>
  );
}

export default function Services() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-6" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(98,191,161,0.1) 0%, rgba(58,154,202,0.06) 50%, #f8fafc 100%)',
      }}>
        <div className="pointer-events-none absolute inset-0">
          <div style={{ position: 'absolute', top: '-8%', left: '-4%', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(58,154,202,0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', top: '10%', right: '-4%', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(98,191,161,0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
        </div>
        <motion.div
          className="relative mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ backgroundColor: 'rgba(98,191,161,0.12)', color: 'rgb(60,160,130)' }}>
            Our Services
          </div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl" style={{
            background: 'linear-gradient(135deg, rgb(30,90,140) 0%, rgb(58,154,202) 45%, rgb(98,191,161) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Personalized Academic Support
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-500 max-w-2xl mx-auto">
            Designed to help students build confidence, improve performance, and stay consistent. Every service is fully customized to the individual student, not a generic program.
          </p>
          {/* Quick nav */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              { label: 'K–12 Tutoring', anchor: '#k12', color: 'rgb(98,191,161)' },
              { label: 'ACT / SAT Prep', anchor: '#act-sat', color: 'rgb(58,154,202)' },
              { label: 'Academic Coaching', anchor: '#coaching', color: 'rgb(246,178,59)' },
            ].map(({ label, anchor, color }) => (
              <a key={anchor} href={anchor}
                className="rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: color, color, backgroundColor: `${color}10` }}
              >
                {label}
              </a>
            ))}
          </div>
        </motion.div>
      </section>

      {/* K–12 */}
      <ServiceSection
        id="k12"
        icon={BookOpen}
        color="rgb(98,191,161)"
        bg="white"
        borderColor="rgba(98,191,161,0.25)"
        title="K–12 Subject Tutoring"
        badge="Academic Tutoring"
        intro="One-on-one subject tutoring built around your student's needs, pace, and goals. Whether they need help keeping up or want to get ahead, we provide consistent, structured support across all core subjects."
        points={k12Points}
        howItems={k12How}
      />

      {/* ACT / SAT */}
      <ServiceSection
        id="act-sat"
        icon={Target}
        color="rgb(58,154,202)"
        bg="rgba(58,154,202,0.03)"
        borderColor="rgba(58,154,202,0.2)"
        title="ACT / SAT Preparation"
        badge="Test Prep"
        intro="Structured, strategic test preparation programs designed to improve scores and build test-day confidence. We go beyond content review, teaching timing, strategy, and mental preparation that makes a real difference."
        points={satPoints}
        howItems={satHow}
      />

      {/* Coaching */}
      <ServiceSection
        id="coaching"
        icon={Brain}
        color="rgb(200,140,30)"
        bg="rgba(246,178,59,0.03)"
        borderColor="rgba(246,178,59,0.2)"
        title="Academic Coaching"
        badge="Coaching"
        intro="Academic coaching focuses on the skills behind the grades: organization, time management, study habits, and mindset. Ideal for students who struggle with consistency, motivation, or knowing how to approach their workload."
        points={coachingPoints}
        howItems={coachingHow}
      />

      {/* How We Work */}
      <section className="py-16 px-6 border-t border-slate-100" style={{ backgroundColor: 'rgba(16,95,166,0.04)' }}>
        <div className="mx-auto max-w-5xl">
          <motion.div className="mb-12 text-center" {...inView}>
            <div className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgb(98,191,161)' }}>Our Process</div>
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">How We Work</h2>
            <p className="mt-3 text-slate-500 text-sm max-w-xl mx-auto">
              From first contact to ongoing sessions: a clear, parent-friendly process designed to get your student the right support quickly.
            </p>
          </motion.div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map(({ num, title, desc }, i) => (
              <motion.div
                key={num}
                {...inView}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 hover:-translate-y-1 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white mb-4"
                  style={{ background: 'linear-gradient(135deg, rgb(58,154,202), rgb(98,191,161))' }}>
                  {num}
                </div>
                <div className="text-sm font-bold text-slate-800 mb-1">{title}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-slate-100">
        <motion.div className="mx-auto max-w-2xl text-center" {...inView}>
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Ready to get started?</h2>
          <p className="mt-3 text-slate-500 text-sm leading-relaxed">
            Tell us about your student and we'll reach out within 24 hours to schedule your free consultation.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ backgroundColor: 'rgb(98,191,161)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'}
          >
            Request a Free Consultation <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  );
}