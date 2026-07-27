import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Users, BookOpen, ClipboardList,
  Wifi, Heart, Star, Shield, Clock, MessageCircle, Zap } from
'lucide-react';
import SiteHeader from '../components/landing/SiteHeader';
import SiteFooter from '../components/landing/SiteFooter';

const inView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5 }
};

const offerings = [
{ icon: Users, label: 'Private 1-to-1 tutoring', desc: "Dedicated sessions focused entirely on your student's needs." },
{ icon: BookOpen, label: 'K–12 academic support', desc: 'From foundational skills to advanced coursework across all subjects.' },
{ icon: Star, label: 'ACT / SAT / Keystone prep', desc: 'Structured test prep strategies that improve scores and build confidence.' },
{ icon: Clock, label: 'Flexible online scheduling', desc: "Sessions scheduled around your family's availability." },
{ icon: ClipboardList, label: 'Written progress reports', desc: 'After every session, families receive a recap of what was covered.' },
{ icon: Shield, label: 'IEP / 504 / GIEP support', desc: 'Experienced support for learners with individualized education plans.' }];


const whyStay = [
{ icon: Heart, label: 'Same tutor consistency', desc: 'Students work with the same tutor to build familiarity and trust over time.' },
{ icon: ClipboardList, label: 'Written session reports', desc: 'Detailed notes after each session keep parents informed and students accountable.' },
{ icon: Users, label: 'Sibling discount', desc: 'Families with multiple students receive discounted pricing.' },
{ icon: Shield, label: 'Individualized academic support', desc: 'Every plan is tailored to the specific student, not a generic curriculum.' },
{ icon: MessageCircle, label: 'Clear family communication', desc: 'Open lines of communication between tutors and families throughout the program.' },
{ icon: Wifi, label: 'Flexible online format', desc: 'Easy-to-access Zoom sessions that fit seamlessly into busy family schedules.' }];


export default function About() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-6" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(98,191,161,0.1) 0%, rgba(58,154,202,0.06) 50%, #f8fafc 100%)'
      }}>
        <div className="pointer-events-none absolute inset-0">
          <div style={{ position: 'absolute', top: '-8%', left: '-4%', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(58,154,202,0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', top: '10%', right: '-4%', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(98,191,161,0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
        </div>
        <motion.div
          className="relative mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          
          <div className="mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]"
          style={{ backgroundColor: 'rgba(98,191,161,0.12)', color: 'rgb(60,160,130)' }}>
            About Open Minds Studios
          </div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl" style={{
            background: 'linear-gradient(135deg, rgb(30,90,140) 0%, rgb(58,154,202) 45%, rgb(98,191,161) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Academic Support Built Around Consistency and Growth
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-500 max-w-2xl mx-auto">Open Minds Studios provides private, one-on-one academic support designed to help students build real confidence, improve their skills, and stay consistent, session after session.

          </p>
        </motion.div>
      </section>

      {/* Mission */}
      <section className="py-16 px-6 border-t border-slate-100">
        <div className="mx-auto max-w-5xl">
          <motion.div className="grid gap-10 md:grid-cols-2 items-center" {...inView}>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgb(58,154,202)' }}>Meet Our Founder</div>
              <h2 className="text-2xl font-bold text-slate-900 md:text-3xl leading-snug">Meet Nina McGuigan

              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">Nina McGuigan founded Open Minds Studios with a simple mission: to create a learning environment where students feel supported, confident, and capable of reaching their full potential.

              </p>
              <p className="mt-3 text-base leading-8 text-slate-600">After working closely with students and families, Nina recognized that many tutoring programs focused only on grades instead of long-term growth. Open Minds Studios was built to be different by combining personalized academic support with consistency, encouragement, and genuine mentorship.

              </p>
              <p className="mt-3 text-base leading-8 text-slate-600">
                Today, Open Minds Studios continues to help students strengthen their skills, build confidence, and develop the habits needed for success both inside and outside the classroom.
              </p>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-lg">
              <img 
                src="https://media.base44.com/images/public/69c3f3171ffea17f779ab7ec/32869e03e_image1.png" 
                alt="Nina McGuigan, Founder of Open Minds Studios" 
                className="w-full h-auto object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16 px-6 border-t border-slate-100" style={{ backgroundColor: 'rgba(58,154,202,0.03)' }}>
        <div className="mx-auto max-w-5xl">
          <motion.div className="mb-10 text-center" {...inView}>
            <div className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgb(98,191,161)' }}>What We Offer</div>
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Academic support designed around your student</h2>
          </motion.div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map(({ icon: Icon, label, desc }, i) =>
            <motion.div
              key={label}
              {...inView}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(98,191,161,0.1)' }}>
                  <Icon className="h-5 w-5" style={{ color: 'rgb(98,191,161)' }} />
                </div>
                <div className="text-sm font-bold text-slate-800 mb-1">{label}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{desc}</div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Why Parents Stay */}
      <section className="py-16 px-6 border-t border-slate-100">
        <div className="mx-auto max-w-5xl">
          <motion.div className="mb-10 text-center" {...inView}>
            <div className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgb(246,178,59)' }}>Why Parents Stay</div>
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">What makes Open Minds Studios different</h2>
            <p className="mt-3 text-slate-500 text-sm max-w-xl mx-auto">Families return because they feel the difference — in their student's confidence, their communication with tutors, and their results.</p>
          </motion.div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {whyStay.map(({ icon: Icon, label, desc }, i) =>
            <motion.div
              key={label}
              {...inView}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              style={{ borderColor: 'rgba(246,178,59,0.2)', backgroundColor: 'rgba(246,178,59,0.03)' }}>
              
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(246,178,59,0.12)' }}>
                  <Icon className="h-5 w-5" style={{ color: 'rgb(200,140,30)' }} />
                </div>
                <div className="text-sm font-bold text-slate-800 mb-1">{label}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{desc}</div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Format Section */}
      <section className="py-16 px-6 border-t border-slate-100" style={{ backgroundColor: 'rgba(58,154,202,0.03)' }}>
        <div className="mx-auto max-w-5xl">
          <motion.div className="grid gap-10 md:grid-cols-2 items-center" {...inView}>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgb(58,154,202)' }}>Online Learning</div>
              <h2 className="text-2xl font-bold text-slate-900 md:text-3xl leading-snug">Learning That Fits Naturally Into Your Family’s Routine.

              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">Whether after school, in the evening, or on weekends, our remote-first approach allows families to access meaningful academic support without the stress of commuting or rigid schedules.

              </p>
              <ul className="mt-5 space-y-3">
                {[
                'Zoom-based one-on-one sessions',
                'Flexible scheduling to fit your family',
                'Remote-first — no commute required',
                'Easy access from any device',
                'Session recordings available on request'].
                map((item) =>
                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'rgb(98,191,161)' }} />
                    {item}
                  </li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl p-8 border text-center" style={{ borderColor: 'rgba(58,154,202,0.25)', backgroundColor: 'rgba(58,154,202,0.05)' }}>
              <Wifi className="h-12 w-12 mx-auto mb-4" style={{ color: 'rgb(58,154,202)' }} />
              <div className="text-3xl font-bold mb-2" style={{ color: 'rgb(58,154,202)' }}>100% Online</div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                Zoom-based sessions with flexible scheduling. Remote-first tutoring with easy access for families across all locations.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing / Tier CTA */}
      <section className="py-16 px-6 border-t border-slate-100">
        <div className="mx-auto max-w-5xl">
          <motion.div className="text-center mb-8" {...inView}>
            <div className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgb(98,191,161)' }}>Pricing</div>
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Tier-based monthly programs</h2>
            <p className="mt-3 text-slate-500 text-sm max-w-xl mx-auto">
              Tier-based monthly programs are designed to give families flexible support options depending on the student's goals, schedule, and level of need.
            </p>
          </motion.div>

          <motion.div {...inView} transition={{ duration: 0.5, delay: 0.15 }}>
            <Link
              to="/subscription-plans"
              className="group mx-auto flex max-w-2xl flex-col sm:flex-row items-center gap-6 rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer"
              style={{ borderColor: 'rgba(98,191,161,0.35)', backgroundColor: 'rgba(98,191,161,0.05)' }}>
              
              <div className="flex-1 text-left">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Monthly programs</div>
                <div className="text-2xl font-bold mb-1" style={{ color: 'rgb(98,191,161)' }}>Tier Based</div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Foundation, Score Boost, and Elite Intensive programs — each designed to match your student's goals and commitment level.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 group-hover:gap-3" style={{ color: 'rgb(98,191,161)' }}>
                  Explore monthly programs <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
              <div className="shrink-0">
                <div
                  className="rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all duration-200 group-hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, rgb(98,191,161) 0%, rgb(60,160,130) 100%)', boxShadow: '0 4px 14px rgba(98,191,161,0.35)' }}>
                  
                  View Tiers →
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-6 border-t border-slate-100" style={{ backgroundColor: 'rgba(16,95,166,0.04)' }}>
        <motion.div className="mx-auto max-w-2xl text-center" {...inView}>
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Ready to get started?</h2>
          <p className="mt-3 text-slate-500 text-sm leading-relaxed">
            Tell us about your student and we'll reach out within 24 hours to schedule your free consultation.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ backgroundColor: 'rgb(98,191,161)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'}>
            
            Request a Free Consultation <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      <SiteFooter />
    </div>);

}