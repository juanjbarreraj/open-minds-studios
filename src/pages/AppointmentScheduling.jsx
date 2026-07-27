import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { studentsApi } from '@/api/studentsApi';
import { GraduationCap, LogOut, Loader2, ArrowLeft } from 'lucide-react';
import AuthModal from '@/components/landing/AuthModal';
import SiteLogo from '../components/shared/SiteLogo';
import { Link } from 'react-router-dom';
import SchedulingGrid from '../components/student/SchedulingGrid';

export default function AppointmentScheduling() {
  const { isAuthenticated, isLoadingAuth, logout } = useAuth();
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
        setStatus(s.approved && s.can_access_student_portal ? 'approved' : 'no-access');
      } catch {
        if (!active) return;
        setStatus('no-access');
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
      <h1 className="text-2xl font-bold text-slate-800">Book a Session</h1>
      <p className="mt-2 text-slate-500">Please sign in to book a tutoring session.</p>
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

  if (status === 'no-access') return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <p className="text-slate-500">Access denied. Please contact your administrator.</p>
        <Link to="/student-dashboard" className="mt-4 inline-block text-sm text-slate-400 underline">Back to Dashboard</Link>
      </div>
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
              <span className="text-lg font-bold text-slate-800">Book a Session</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/student-dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <button onClick={() => logout()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800">Tutor Availability</h2>
          <p className="mt-1 text-sm text-slate-500">Select a day to view available slots. Green = available, blue = booked.</p>
        </div>
        <div className="flex items-center gap-5 mb-6 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded border border-slate-300 bg-white"></span> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-[#6b8cda]"></span> Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-[#2c3e6b]"></span> Unavailable
          </span>
        </div>
        <SchedulingGrid student={student} />
      </main>
    </div>
  );
}
