import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ShieldX, LogOut, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import SiteLogo from '../components/shared/SiteLogo';
import StudentDashboardView from '../components/student/StudentDashboardView';

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    (async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) { base44.auth.redirectToLogin('/student-dashboard'); return; }
      const me = await base44.auth.me();
      setUser(me);

      const matches = await base44.entities.Student.filter({ email: me.email });
      let s;
      if (matches.length === 0) {
        const nameParts = (me.full_name || '').split(' ');
        s = await base44.entities.Student.create({
          email: me.email,
          full_name: me.full_name || '',
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          approved: false,
          can_access_student_portal: false,
        });
      } else {
        s = matches[0];
      }
      setStudent(s);
      setStatus(s.approved && s.can_access_student_portal ? 'approved' : 'pending');
    })();
  }, []);

  if (status === 'loading') return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );

  if (status === 'pending') return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <SiteLogo />
          <button onClick={() => base44.auth.logout('/')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
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
          <Link to="/" className="mt-6 inline-block text-sm text-slate-400 hover:text-slate-700 underline underline-offset-2">
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
            <button onClick={() => base44.auth.logout('/')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
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