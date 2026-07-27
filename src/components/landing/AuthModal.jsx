import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function AuthModal({ type, onClose }) {
  // type: 'student' | 'tutor'
  const isStudent = type === 'student';
  const accent = isStudent ? 'rgb(98,191,161)' : 'rgb(58,154,202)';
  const accentHover = isStudent ? 'rgb(70,165,135)' : 'rgb(40,120,170)';

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const nextUrl = isStudent ? '/student-dashboard' : '/tutor-dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        await register({
          email,
          password,
          full_name: fullName,
          account_type: isStudent ? 'student' : 'tutor',
        });
      } else {
        await login(email, password);
      }
      onClose();
      // From the landing page, continue to the dashboard; when the modal was
      // opened on a protected page, stay there and let it re-render signed in.
      const path = location.pathname.toLowerCase();
      if (path === '/' || path === '/home') {
        navigate(nextUrl);
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:ring-2';

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
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: accent }}>
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

              {/* Sign in / create account switch */}
              <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
                {[['signin', 'Sign In'], ['signup', 'Create Account']].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setMode(value); setError(''); }}
                    className="rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200"
                    style={mode === value
                      ? { backgroundColor: 'white', color: accent, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                      : { color: 'rgb(100,116,139)' }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder={isStudent ? 'Student or parent full name' : 'Full name'}
                    className={inputCls}
                    autoComplete="name"
                  />
                )}
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className={inputCls}
                  autoComplete="email"
                />
                <input
                  type="password"
                  required
                  minLength={mode === 'signup' ? 8 : 1}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Password (at least 8 characters)' : 'Password'}
                  className={inputCls}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow transition-all duration-200 disabled:opacity-60"
                  style={{ backgroundColor: accent }}
                  onMouseEnter={e => { if (!busy) e.currentTarget.style.backgroundColor = accentHover; }}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = accent}
                >
                  {busy
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <>{mode === 'signup' ? 'Create Account' : 'Sign In'} <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-400">
                {isStudent
                  ? 'New families can create an account and will be approved by our team.'
                  : 'Tutor accounts require approval after registration.'
                }
              </p>

              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500 text-center">
                Sign in with your <strong>Email & Password</strong>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
