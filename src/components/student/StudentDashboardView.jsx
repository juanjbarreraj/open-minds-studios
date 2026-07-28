import React, { useEffect, useState, useCallback } from 'react';
import { bookingsApi, bookingStatusLabel } from '@/api/bookingsApi';
import { modulesApi } from '@/api/modulesApi';
import { coursesApi } from '@/api/coursesApi';
import { tutorsApi } from '@/api/tutorsApi';
import { progressApi } from '@/api/progressApi';
import { CheckCircle2 } from 'lucide-react';
import MetricCards from './MetricCards';
import TodaysFocus from './TodaysFocus';
import UpcomingSessions from './UpcomingSessions';
import AssignedModules from './AssignedModules';

export default function StudentDashboardView({ user, student }) {
  const [bookings, setBookings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [modules, setModules] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [focus, setFocus] = useState(null);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadModules = useCallback(async () => {
    if (!student) return;
    setLoadingModules(true);
    try {
      setModules(await modulesApi.list());
    } catch (err) {
      setLoadError(err?.message || 'We could not load your modules.');
    } finally {
      setLoadingModules(false);
    }
  }, [student]);

  useEffect(() => {
    if (!student) return;
    (async () => {
      try {
        const [allBookings, allCourses, allTutors, progress] = await Promise.all([
          bookingsApi.list(),
          coursesApi.list(),
          tutorsApi.list(),
          progressApi.get(),
        ]);
        setBookings(allBookings);
        setCourses(allCourses);
        setTutors(allTutors);
        setMetrics(progress.metrics);
        setFocus(progress.focus[0] || null);
      } catch (err) {
        setLoadError(err?.message || 'We could not load your sessions.');
      } finally {
        setLoadingBookings(false);
      }
    })();
    loadModules();
  }, [student, loadModules]);

  const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  // History keeps cancelled and declined requests visible so a student can see
  // what happened to them, while the active list above stays clean.
  const past = bookings.filter(b => ['completed', 'cancelled', 'declined'].includes(b.status));

  const getTutorName = (tutorId) => tutors.find(t => t.id === tutorId)?.full_name || 'Your Tutor';
  const getCourseName = (courseId) => {
    const c = courses.find(c => c.id === courseId);
    return c ? c.course_name : 'Session';
  };

  const handleCancel = async (bookingId) => {
    setLoadError('');
    try {
      const updated = await bookingsApi.updateStatus(bookingId, 'cancelled');
      setBookings(prev => prev.map(b => (b.id === bookingId ? updated : b)));
    } catch (err) {
      // For example the tutor declined the request while this page was open.
      setLoadError(err?.message || 'That session could not be cancelled. Refresh and try again.');
    }
  };

  const firstName = user?.full_name?.split(' ')[0] || student?.first_name || 'Student';

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {/* Welcome header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] mb-1" style={{ color: 'rgb(58,154,202)' }}>
            Student Dashboard
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {firstName}</h1>
        </div>
        {upcoming.length > 0 && (
          <div className="rounded-full px-4 py-1.5 text-sm font-semibold"
            style={{ backgroundColor: 'rgba(98,191,161,0.12)', color: 'rgb(60,160,130)' }}>
            {upcoming.length} upcoming session{upcoming.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Metrics */}
      <MetricCards metrics={metrics} />

      {/* Today's focus */}
      <TodaysFocus focus={focus} />

      {/* Sessions + Modules */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingSessions
          bookings={upcoming}
          loading={loadingBookings}
          getTutorName={getTutorName}
          getCourseName={getCourseName}
          onCancel={handleCancel}
        />
        <AssignedModules
          modules={modules}
          loading={loadingModules}
          onRefresh={loadModules}
        />
      </div>

      {/* Past Sessions */}
      {past.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4" style={{ color: 'rgb(98,191,161)' }} />
            <div className="text-sm font-semibold text-slate-700">Past Sessions</div>
            <span className="ml-auto text-xs text-slate-400">{past.length} in history</span>
          </div>
          <div className="space-y-2">
            {past.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-slate-700">{getCourseName(b.course_id)}</span>
                  <span className="ml-2 text-slate-400">with {getTutorName(b.tutor_id)}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                  {bookingStatusLabel(b.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}