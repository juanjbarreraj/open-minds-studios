import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, TrendingUp } from 'lucide-react';

const upcomingSessions = [
  { date: 'Tue, Mar 18', time: '4:00 PM', subject: 'SAT Math', tutor: 'Karen' },
  { date: 'Thu, Mar 20', time: '6:00 PM', subject: 'Reading Comprehension', tutor: 'Nina' },
  { date: 'Sat, Mar 22', time: '11:00 AM', subject: 'Keystone Prep', tutor: 'Chris' },
];

const prepModules = [
  { title: 'SAT Timing Game Plan', type: 'Strategy', progress: 82 },
  { title: 'ACT Reading Drill Set', type: 'Practice', progress: 64 },
  { title: 'Keystone Algebra Review', type: 'Course', progress: 47 },
  { title: 'Study Skills Bootcamp', type: 'Toolkit', progress: 91 },
];

const recentProgress = [
  { label: 'Math Confidence', value: '+18%' },
  { label: 'Reading Accuracy', value: '+12%' },
  { label: 'Practice Test Score', value: '+160 pts' },
  { label: 'Attendance', value: '100%' },
];

const inView = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.5 } };

export default function PortalSection() {
  return (
    <motion.section
      id="student-portal"
      className="border-t border-slate-200"
      style={{ backgroundColor: 'rgba(239,121,57,0.04)' }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Header */}
        <motion.div className="max-w-3xl mb-10" {...inView}>
          <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgb(58,154,202)' }}>
            Introducing The Student Portal
          </div>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
            Navigate Our All New<br />
            <span style={{ color: 'rgb(98,191,161)' }}>Intuitive Student Portal</span>
          </h2>
        </motion.div>

        {/* Dashboard preview card */}
        <motion.div
          className="rounded-[2rem] p-8"
          style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 8px 40px rgba(0,0,0,0.07)' }}
          {...inView}
        >
          {/* Dashboard header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgb(58,154,202)' }}>Student Dashboard</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">Welcome back, Alex</div>
            </div>
            <div
              className="rounded-full px-4 py-1.5 text-sm font-semibold"
              style={{ backgroundColor: 'rgba(98,191,161,0.12)', color: 'rgb(60,160,130)' }}
            >
              Next session in 2 days
            </div>
          </div>

          {/* Progress metric cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
            {recentProgress.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl p-4 transition-all duration-hover ease-out hover:-translate-y-1 hover:shadow-xl"
                style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.4)', borderTop: '3px solid rgb(98,191,161)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
              >
                <div className="text-xs text-slate-500">{item.label}</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Today's focus bar */}
          <div
            className="rounded-2xl p-4 mb-6"
            style={{ backgroundColor: 'rgba(98,191,161,0.07)', border: '1px solid rgba(98,191,161,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4" style={{ color: 'rgb(246,178,59)' }} />
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's focus</div>
            </div>
            <div className="text-base font-semibold text-slate-800">SAT Math: timing strategy and no-calculator drills</div>
            <div className="mt-3 h-2 rounded-full bg-white border border-slate-200">
              <div className="h-2 w-3/4 rounded-full transition-all duration-700" style={{ backgroundColor: 'rgb(98,191,161)' }} />
            </div>
            <div className="mt-1.5 text-xs text-slate-500">75% of weekly prep plan completed</div>
          </div>

          {/* Bottom two columns: sessions + prep modules */}
          <div className="grid gap-6 md:grid-cols-2">

            {/* Upcoming sessions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" style={{ color: 'rgb(58,154,202)' }} />
                  <div className="text-sm font-semibold text-slate-700">Upcoming Sessions</div>
                </div>
                <button
                  className="rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{ backgroundColor: 'rgb(98,191,161)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'}
                >
                  Book session
                </button>
              </div>
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={`${session.date}-${session.time}`}
                    className="flex items-center justify-between rounded-2xl p-3.5 transition-all duration-hover ease-out hover:-translate-y-1"
                    style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{session.subject}</div>
                      <div className="text-xs text-slate-500">with {session.tutor}</div>
                    </div>
                    <div
                      className="rounded-lg px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: 'rgba(58,154,202,0.08)', color: 'rgb(58,154,202)' }}
                    >
                      {session.date}, {session.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prep modules */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-slate-700">Assigned Modules</div>
                <div
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: 'rgba(246,178,59,0.12)', color: 'rgb(200,135,20)' }}
                >
                  Demo view
                </div>
              </div>
              <div className="space-y-3">
                {prepModules.map((mod) => (
                  <div key={mod.title} className="rounded-2xl p-3.5 transition-all duration-hover ease-out hover:-translate-y-1" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{mod.title}</div>
                        <div className="text-xs text-slate-500">{mod.type}</div>
                      </div>
                      <div className="text-xs font-semibold" style={{ color: 'rgb(98,191,161)' }}>{mod.progress}%</div>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${mod.progress}%`, backgroundColor: 'rgb(98,191,161)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </motion.section>
  );
}