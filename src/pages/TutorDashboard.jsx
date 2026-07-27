import React, { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { LogOut, LayoutDashboard, Clock, CalendarDays, Loader2, ShieldCheck, Users, ClipboardList } from 'lucide-react';
import SiteLogo from '../components/shared/SiteLogo';
import { Link } from 'react-router-dom';
import AppointmentsSection from '../components/tutor/AppointmentsSection';
import AvailabilityManager from '../components/tutor/AvailabilityManager';
import TutorProfile from '../components/tutor/TutorProfile';
import MyStudentsSection from '../components/tutor/MyStudentsSection';
import TutorModuleReview from '../components/tutor/TutorModuleReview';

export default function TutorDashboard() {
  const [user, setUser] = useState(null);
  const [tutor, setTutor] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tutorCourses, setTutorCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('loading'); // loading | no-auth | no-tutor | pending | approved

  const loadData = useCallback(async (tutorId) => {
    const [bookingData, slotData, tcData, courseData] = await Promise.all([
      base44.entities.Booking.filter({ tutor_id: tutorId }, '-created_date'),
      base44.entities.AvailabilitySlot.filter({ tutor_id: tutorId }),
      base44.entities.TutorCourse.filter({ tutor_id: tutorId }),
      base44.entities.Course.list(),
    ]);
    setBookings(bookingData.filter(b => b.status !== 'Cancelled'));
    setSlots(slotData);
    setTutorCourses(tcData);
    const courseIds = tcData.map((tc) => tc.course_id);
    setCourses(courseData.filter((c) => courseIds.includes(c.id)));
  }, []);

  useEffect(() => {
    (async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) { setStatus('no-auth'); setLoading(false); return; }
      const me = await base44.auth.me();
      setUser(me);
      const tutors = await base44.entities.Tutor.filter({ email: me.email });
      if (tutors.length === 0) { setStatus('no-tutor'); setLoading(false); return; }
      const t = tutors[0];
      setTutor(t);
      if (!t.approved) { setStatus('pending'); setLoading(false); return; }
      await loadData(t.id);
      setStatus('approved');
      setLoading(false);
    })();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (status === 'no-auth') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <LayoutDashboard className="mb-4 h-10 w-10 text-indigo-400" />
        <h1 className="text-2xl font-bold text-slate-800">Tutor Dashboard</h1>
        <p className="mt-2 text-slate-500">Please sign in to access your dashboard.</p>
        <button
          onClick={() => base44.auth.redirectToLogin()}
          className="mt-6 rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-700"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (status === 'no-tutor') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">No Tutor Profile Found</h2>
          <p className="mt-3 max-w-sm text-sm text-slate-500">
            Your account ({user?.email}) is not linked to a tutor profile. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-7 w-7 text-yellow-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Account Pending Approval</h2>
          <p className="mt-3 max-w-sm text-sm text-slate-500">
            Welcome, <strong>{tutor?.full_name}</strong>! Your tutor account is currently under review. You'll receive access once an administrator approves your profile.
          </p>
          <button onClick={() => base44.auth.logout()} className="mt-6 rounded-xl border border-slate-200 px-5 py-2 text-sm text-slate-500 transition hover:bg-slate-50">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <SiteLogo />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-700">{tutor?.full_name}</p>
              <p className="text-xs text-slate-400">{tutor?.email}</p>
            </div>
            {(tutor?.can_access_manager_dashboard || tutor?.is_super_admin) && (
              <Link
                to="/manager-dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <ShieldCheck className="h-4 w-4" /> Manager
              </Link>
            )}
            <button
              onClick={() => base44.auth.logout()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Left column */}
          <div className="space-y-8">
            {/* Appointments */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-indigo-500" />
                <h2 className="text-xl font-bold text-slate-800">Upcoming Appointments</h2>
                <span className="ml-auto rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-semibold text-indigo-600">
                  {bookings.length}
                </span>
              </div>
              <AppointmentsSection bookings={bookings} courses={courses} onRefresh={() => loadData(tutor.id)} />
            </section>

            {/* My Students */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <h2 className="text-xl font-bold text-slate-800">My Students</h2>
              </div>
              <MyStudentsSection
                bookings={bookings}
                tutorId={tutor.id}
                tutorName={tutor.full_name}
                onModuleAssigned={() => {}}
              />
            </section>

            {/* Module Review / Grading */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-500" />
                <h2 className="text-xl font-bold text-slate-800">Module Submissions</h2>
              </div>
              <TutorModuleReview tutorId={tutor.id} />
            </section>

            {/* Availability */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-500" />
                <h2 className="text-xl font-bold text-slate-800">Weekly Availability</h2>
              </div>
              <AvailabilityManager
                slots={slots}
                tutorId={tutor.id}
                onRefresh={() => loadData(tutor.id).then(() => {})}
              />
            </section>
          </div>

          {/* Right column — Profile */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
            <TutorProfile tutor={tutor} courses={courses} />
          </div>
        </div>
      </main>
    </div>
  );
}