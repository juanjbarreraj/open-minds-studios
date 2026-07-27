import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const inView = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.5 } };

// Paste your Google Apps Script Web App URL here after deploying the script.
// See setup instructions: deploy as Web App, Execute as: Me, Who has access: Anyone.
const GOOGLE_SHEETS_WEBHOOK_URL = '';

const PROGRAMS = [
  '',
  'Foundation Program',
  'Score Boost Program',
  'Elite Intensive Program',
];

export default function ContactSection() {
  const [form, setForm] = useState({
    parentName: '', email: '', grade: '', subject: '', goal: '', details: '', interestedProgram: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill program from URL param and scroll to contact section
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prog = params.get('program');
    if (prog) {
      setForm(prev => ({ ...prev, interestedProgram: prog }));
      // Use instant scroll first to jump past the hero, then a smooth nudge
      const doScroll = () => {
        const el = document.getElementById('contact');
        if (el) {
          el.scrollIntoView({ behavior: 'instant' });
        }
      };
      // Try immediately, then retry to account for slow renders
      doScroll();
      setTimeout(doScroll, 100);
      setTimeout(doScroll, 400);
      setTimeout(doScroll, 800);
    }
  }, []);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const sendToGoogleSheets = async () => {
    if (!GOOGLE_SHEETS_WEBHOOK_URL) return;
    const payload = {
      timestamp: new Date().toISOString(),
      parentName: form.parentName,
      email: form.email,
      studentGrade: form.grade,
      subjectExam: form.subject,
      interestedProgram: form.interestedProgram || 'Not sure yet',
      mainGoal: form.goal,
      studentNeeds: form.details,
    };
    await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const inquiry = {
        parent_name: form.parentName,
        email: form.email,
        student_grade: form.grade,
        subject_or_exam: form.subject,
        goals: form.goal,
        message: form.details,
        interested_program: form.interestedProgram,
      };
      await Promise.all([
        base44.entities.Inquiry.create(inquiry),
        sendToGoogleSheets(),
      ]);
      await base44.functions.invoke('notifyNewInquiry', { inquiry });
      setSent(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const inputCls = 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100';

  return (
    <section id="contact" className="border-t border-slate-200" style={{ backgroundColor: 'rgba(16,95,166,0.04)' }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[0.95fr_1.05fr]">
        <motion.div {...inView}>
          <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgb(98,191,161)' }}>Contact Us</div>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Learn More About Open Minds Studios!</h2>
          <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
            Tell us about your student and we will reach out within 24 hours to schedule your free consultation.
          </p>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-slate-400" />
              412-218-4025
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-400" />
              openminds@openmindsstudios.com
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-slate-400" />
              Remote-first tutoring with flexible online scheduling
            </div>
          </div>
        </motion.div>

        <motion.div {...inView} transition={{ duration: 0.5, delay: 0.1 }}>
          {sent ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-slate-50 p-10 text-center shadow-sm">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
              <div className="mt-4 text-xl font-semibold">Thank you!</div>
              <p className="mt-2 text-sm text-slate-600">
                We will reach out within 24 hours to schedule your free consultation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <input className={inputCls} placeholder="Parent name" value={form.parentName} onChange={(e) => update('parentName', e.target.value)} required />
                <input className={inputCls} placeholder="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
                <input className={inputCls} placeholder="Student grade" value={form.grade} onChange={(e) => update('grade', e.target.value)} />
                <input className={inputCls} placeholder="Subject / exam" value={form.subject} onChange={(e) => update('subject', e.target.value)} />

                {/* Interested Program */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Interested Program</label>
                  <select
                    className={`${inputCls} w-full`}
                    value={form.interestedProgram}
                    onChange={(e) => update('interestedProgram', e.target.value)}
                  >
                    <option value="">Not sure yet</option>
                    {PROGRAMS.filter(Boolean).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {form.interestedProgram && (
                    <p className="mt-1 text-xs font-medium" style={{ color: 'rgb(98,191,161)' }}>
                      Selected: {form.interestedProgram}
                    </p>
                  )}
                </div>

                <input className={`${inputCls} md:col-span-2`} placeholder="Main goal (raise SAT score, improve math confidence, reading help, etc.)" value={form.goal} onChange={(e) => update('goal', e.target.value)} />
                <textarea className={`${inputCls} min-h-[120px] md:col-span-2`} placeholder="Tell us more about the student's needs" value={form.details} onChange={(e) => update('details', e.target.value)} />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
                style={{ backgroundColor: 'rgb(98,191,161)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'}
              >
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                {sending ? 'Sending...' : 'Request Consultation'}
              </button>
              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}