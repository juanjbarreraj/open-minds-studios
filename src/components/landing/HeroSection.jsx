import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GraduationCap, BookOpen, ArrowRight, ChevronDown } from 'lucide-react';
import AuthModal from './AuthModal';

export default function HeroSection() {
  const [authType, setAuthType] = useState(null);
  const introRef = useRef(null);

  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const y = useTransform(scrollY, [0, 300], [0, -60]);

  return (
    <>
      {/* ── Full-screen logo intro ── */}
      <div ref={introRef} className="relative" style={{ height: '100vh' }}>
        <motion.div
          style={{ opacity, y }}
          className="sticky top-0 flex h-screen w-full flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        >
          {/* Radial gradient background */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(98,191,161,0.10) 0%, rgba(58,154,202,0.06) 45%, #f8fafc 100%)',
            }}
          />

          {/* Subtle decorative blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
            <div style={{
              position: 'absolute', top: '15%', left: '8%', width: '320px', height: '320px',
              background: 'radial-gradient(circle, rgba(98,191,161,0.08) 0%, transparent 70%)',
              borderRadius: '50%', filter: 'blur(50px)',
            }} />
            <div style={{
              position: 'absolute', bottom: '15%', right: '8%', width: '280px', height: '280px',
              background: 'radial-gradient(circle, rgba(58,154,202,0.08) 0%, transparent 70%)',
              borderRadius: '50%', filter: 'blur(50px)',
            }} />
          </div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-10"
          >
            <img
              src="https://media.base44.com/images/public/69c3f3171ffea17f779ab7ec/2008f0116_logonobackground.png"
              alt="Open Minds Studios"
              className="w-80 sm:w-[28rem] md:w-[36rem] lg:w-[44rem] object-contain drop-shadow-sm select-none"
            />

            {/* Login buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="flex flex-col items-center gap-4 sm:flex-row"
            >
              <button
                onClick={() => setAuthType('student')}
                className="rounded-2xl px-10 py-4 text-base font-semibold text-white shadow-md transition-all duration-200"
                style={{ backgroundColor: 'rgb(98,191,161)', minWidth: '200px' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Student / Parent Login
              </button>
              <button
                onClick={() => setAuthType('tutor')}
                className="rounded-2xl px-10 py-4 text-base font-semibold text-white shadow-md transition-all duration-200"
                style={{ backgroundColor: 'rgb(58,154,202)', minWidth: '160px' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgb(40,120,170)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgb(58,154,202)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Tutor Login
              </button>
            </motion.div>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="absolute bottom-10 flex flex-col items-center gap-2"
          >
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            >
              <ChevronDown className="h-5 w-5 text-slate-300" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <AuthModal type={authType} onClose={() => setAuthType(null)} />
    </>
  );
}