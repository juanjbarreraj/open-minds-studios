import React, { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import MetricCards from './MetricCards';
import TodaysFocus from './TodaysFocus';
import UpcomingSessions from './UpcomingSessions';
import AssignedModules from './AssignedModules';

const mockMetrics = [
  { label: 'Math Confidence', value: '+18%' },
  { label: 'Reading Accuracy', value: '+12%' },
  { label: 'Practice Test Score', value: '+160 pts' },
  { label: 'Attendance', value: '100%' },
];

export default function StudentDashboardView({ user, student }) {
  const [bookings, setBookings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [modules, setModules] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingModules, setLoadingModules] = useState(true);

  const loadModules = useCallback(async () => {
    if (!student) return;
    setLoadingModules(true);
    const mods = await base44.entities.Module.filter({ student_email: student.email }, '-created_date');
    setModules(mods);
    setLoadingModules(false);
  }, [student]);

  useEffect(() => {
    if (!student) return;
    (async () => {
      const [allBookings, allCourses, allTutors] = await Promise.all([
        base44.entities.Booking.filter({ student_email: student.email }, '-created_date'),
        base44.entities.Course.list(),
        base44.entities.Tutor.list(),
      ]);
      setBookings(allBookings.filter(b => b.status !== 'Cancelled'));
      setCourses(allCourses);
      setTutors(allTutors);
      setLoadingBookings(false);
    })();
    loadModules();
  }, [student, loadModules]);

  const upcoming = bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'Appointment Confirmed');
  const past = bookings.filter(b => b.status === 'Completed');

  const getTutorName = (tutorId) => tutors.find(t => t.id === tutorId)?.full_name || 'Your Tutor';
  const getCourseName = (courseId) => {
    const c = courses.find(c => c.id === courseId);
    return c ? c.course_name : 'Session';
  };

  const handleCancel = async (bookingId) => {
    await base44.entities.Booking.update(bookingId, { status: 'Cancelled' });
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  const firstName = user?.full_name?.split(' ')[0] || student?.first_name || 'Student';

  return (
    <div className="space-y-6">
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
      <MetricCards metrics={mockMetrics} />

      {/* Today's focus */}
      <TodaysFocus />

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
            <span className="ml-auto text-xs text-slate-400">{past.length} completed</span>
          </div>
          <div className="space-y-2">
            {past.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-slate-700">{getCourseName(b.course_id)}</span>
                  <span className="ml-2 text-slate-400">with {getTutorName(b.tutor_id)}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">Completed</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}