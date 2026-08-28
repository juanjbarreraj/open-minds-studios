import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { submitInquiry } from '@/api/inquirySubmit';
import SiteHeader from '../components/landing/SiteHeader';
import SiteFooter from '../components/landing/SiteFooter';

const inView = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };

const PROGRAMS = [
  'Foundation Program',
  'Score Boost Program',
  'Elite Intensive Program',
];

export default function Contact() {
  const [form, setForm] = useState({
    parentName: '', email: '', grade: '', subject: '', goal: '', details: '', interestedProgram: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prog = params.get('program');
    if (prog) {
      setForm(prev => ({ ...prev, interestedProgram: prog }));
    }
  }, []);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await submitInquiry(form);
      setSent(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const inputCls = 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100';

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center py-16 px-6" style={{ backgroundColor: 'rgba(16,95,166,0.04)' }}>
        <div className="w-full max-w-6xl">
          <div className="grid gap-12 md:grid-cols-[0.95fr_1.05fr] items-start">

            {/* Left info */}
            <motion.div {...inView}>
              <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgb(98,191,161)' }}>Contact Us</div>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl leading-tight">Learn More About Open Minds Studios!</h1>
              <p className="mt-4 text-base leading-8 text-slate-600 max-w-sm">
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

              <div className="mt-10 rounded-2xl p-5 border" style={{ borderColor: 'rgba(98,191,161,0.3)', backgroundColor: 'rgba(98,191,161,0.05)' }}>
                <div className="text-sm font-semibold text-slate-700 mb-3">What happens next?</div>
                <ol className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><span className="font-bold" style={{ color: 'rgb(98,191,161)' }}>1.</span> We review your inquiry within 24 hours</li>
                  <li className="flex items-start gap-2"><span className="font-bold" style={{ color: 'rgb(98,191,161)' }}>2.</span> We reach out to schedule a free consultation</li>
                  <li className="flex items-start gap-2"><span className="font-bold" style={{ color: 'rgb(98,191,161)' }}>3.</span> We match your student with the right tutor and program</li>
                </ol>
              </div>
            </motion.div>

            {/* Right form */}
            <motion.div {...inView} transition={{ duration: 0.5, delay: 0.1 }}>
              {sent ? (
                <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-slate-50 p-12 text-center shadow-sm">
                  <CheckCircle className="h-12 w-12 text-emerald-500" />
                  <div className="mt-4 text-xl font-semibold">Thank you!</div>
                  <p className="mt-2 text-sm text-slate-600">
                    We will reach out within 24 hours to schedule your free consultation.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-7 shadow-sm">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className={inputCls} placeholder="Parent name" value={form.parentName} onChange={e => update('parentName', e.target.value)} required />
                    <input className={inputCls} placeholder="Email" type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
                    <input className={inputCls} placeholder="Student grade" value={form.grade} onChange={e => update('grade', e.target.value)} />
                    <input className={inputCls} placeholder="Subject / exam" value={form.subject} onChange={e => update('subject', e.target.value)} />

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Interested Program</label>
                      <select
                        className={`${inputCls} w-full`}
                        value={form.interestedProgram}
                        onChange={e => update('interestedProgram', e.target.value)}
                      >
                        <option value="">Not sure yet</option>
                        {PROGRAMS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      {form.interestedProgram && (
                        <p className="mt-1 text-xs font-medium" style={{ color: 'rgb(98,191,161)' }}>
                          Selected: {form.interestedProgram}
                        </p>
                      )}
                    </div>

                    <input className={`${inputCls} md:col-span-2`} placeholder="Main goal (raise SAT score, improve math confidence, reading help, etc.)" value={form.goal} onChange={e => update('goal', e.target.value)} />
                    <textarea className={`${inputCls} min-h-[120px] md:col-span-2`} placeholder="Tell us more about the student's needs" value={form.details} onChange={e => update('details', e.target.value)} />
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
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}