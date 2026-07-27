import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { GraduationCap, LogOut, Loader2, ArrowLeft } from 'lucide-react';
import SiteLogo from '../components/shared/SiteLogo';
import { Link } from 'react-router-dom';
import SchedulingGrid from '../components/student/SchedulingGrid';

export default function AppointmentScheduling() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    (async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) { base44.auth.redirectToLogin('/appointment-scheduling'); return; }
      const me = await base44.auth.me();
      setUser(me);
      const matches = await base44.entities.Student.filter({ email: me.email });
      if (!matches.length) { setStatus('no-access'); return; }
      const s = matches[0];
      setStudent(s);
      setStatus(s.approved && s.can_access_student_portal ? 'approved' : 'no-access');
    })();
  }, []);

  if (status === 'loading') return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
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
            <button onClick={() => base44.auth.logout('/')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
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