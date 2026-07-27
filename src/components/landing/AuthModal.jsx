import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, BookOpen, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AuthModal({ type, onClose }) {
  // type: 'student' | 'tutor'
  const isStudent = type === 'student';

  const handleContinue = () => {
    const nextUrl = isStudent ? '/student-dashboard' : '/tutor-dashboard';
    base44.auth.redirectToLogin(nextUrl);
  };

  return (
    <AnimatePresence>
      {type && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={onClose} className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: isStudent ? 'rgb(98,191,161)' : 'rgb(58,154,202)' }}>
                {isStudent
                  ? <GraduationCap className="h-7 w-7 text-white" />
                  : <BookOpen className="h-7 w-7 text-white" />
                }
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {isStudent ? 'Student & Parent Access' : 'Tutor Access'}
                </h2>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  {isStudent
                    ? 'Sign in or create an account to access your session schedule, progress reports, and prep materials.'
                    : 'Sign in to access your tutor dashboard, manage appointments, and update your availability.'
                  }
                </p>
              </div>

              {/* Single CTA — Base44 handles Google + Email on their auth page */}
              <button
                onClick={handleContinue}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow transition-all duration-200"
                style={{ backgroundColor: isStudent ? 'rgb(98,191,161)' : 'rgb(58,154,202)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isStudent ? 'rgb(70,165,135)' : 'rgb(40,120,170)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = isStudent ? 'rgb(98,191,161)' : 'rgb(58,154,202)'}
              >
                Continue to Sign In <ArrowRight className="h-4 w-4" />
              </button>

              <p className="mt-4 text-center text-xs text-slate-400">
                {isStudent
                  ? 'New families can create an account on the next screen.'
                  : 'Tutor accounts require approval after registration.'
                }
              </p>

              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500 text-center">
                Supports <strong>Google Sign-In</strong> and <strong>Email & Password</strong>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}