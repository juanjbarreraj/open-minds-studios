import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { studentsApi } from '@/api/studentsApi';
import { Loader2, ShieldX, LogOut, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthModal from '@/components/landing/AuthModal';
import SiteLogo from '../components/shared/SiteLogo';
import StudentDashboardView from '../components/student/StudentDashboardView';

export default function StudentDashboard() {
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();
  const [student, setStudent] = useState(null);
  const [status, setStatus] = useState('loading');
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (isLoadingAuth || !isAuthenticated) return;
    let active = true;
    (async () => {
      try {
        const s = await studentsApi.me();
        if (!active) return;
        setStudent(s);
        setStatus(s.approved && s.can_access_student_portal ? 'approved' : 'pending');
      } catch {
        if (!active) return;
        setStatus('pending');
      }
    })();
    return () => { active = false; };
  }, [isLoadingAuth, isAuthenticated]);

  if (isLoadingAuth || (isAuthenticated && status === 'loading')) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );

  if (!isAuthenticated) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <GraduationCap className="mb-4 h-10 w-10" style={{ color: 'rgb(98,191,161)' }} />
      <h1 className="text-2xl font-bold text-slate-800">Student Portal</h1>
      <p className="mt-2 text-slate-500">Please sign in to access your dashboard.</p>
      <button
        onClick={() => setShowAuth(true)}
        className="mt-6 rounded-2xl px-8 py-3 text-sm font-semibold text-white shadow transition"
        style={{ backgroundColor: 'rgb(98,191,161)' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'}
      >
        Sign In
      </button>
      {showAuth && <AuthModal type="student" onClose={() => setShowAuth(false)} />}
    </div>
  );

  if (status === 'pending') return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <SiteLogo />
          <button onClick={() => logout()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <ShieldX className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Student Portal Pending Approval</h1>
          <p className="mt-4 text-slate-500 leading-relaxed">
            Your account has been received and is awaiting approval. You will be able to access the student portal once an administrator approves your account.
          </p>
          <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-3 text-sm text-slate-500">
            Logged in as <span className="font-medium text-slate-700">{user?.email}</span>
          </div>
          <Link to="/" className="mt-6 inline-block text-sm text-ink-500 hover:text-slate-700 underline underline-offset-2">
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <SiteLogo />
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-slate-700" />
              <span className="text-lg font-bold text-slate-800">Student Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:block">{user?.full_name || user?.email}</span>
            <button onClick={() => logout()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <StudentDashboardView user={user} student={student} />
      </main>
    </div>
  );
}
