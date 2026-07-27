import React, { useState } from 'react';
import { Calendar, Mail, Phone, Video, MapPin, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function formatSlotLabel(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

const statusStyles = {
  'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
  'Appointment Confirmed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Confirmed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Completed': 'bg-blue-100 text-blue-700 border-blue-200',
  'Cancelled': 'bg-red-100 text-red-700 border-red-200',
};

function AppointmentCard({ booking, course, onRefresh }) {
  const [acting, setActing] = useState(null); // 'accept' | 'decline'

  const handleAccept = async () => {
    setActing('accept');
    await base44.entities.Booking.update(booking.id, { status: 'Appointment Confirmed' });
    setActing(null);
    onRefresh();
  };

  const handleDecline = async () => {
    setActing('decline');
    await base44.entities.Booking.update(booking.id, { status: 'Cancelled' });
    setActing(null);
    onRefresh();
  };

  const isPending = booking.status === 'Pending';

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${isPending ? 'border-amber-200' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-base font-semibold text-slate-800">
            {booking.student_first_name} {booking.student_last_name}
          </p>
          {course && (
            <p className="mt-0.5 text-sm font-medium" style={{ color: 'rgb(58,154,202)' }}>
              {course.course_code}: {course.course_name}
            </p>
          )}
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[booking.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {booking.status}
        </span>
      </div>

      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          {booking.student_email}
        </div>
        {booking.student_phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-400" />
            {booking.student_phone}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          {booking.preferred_day}, {formatSlotLabel(booking.preferred_start_time)} to {formatSlotLabel(booking.preferred_end_time)}
        </div>
        <div className="flex items-center gap-2">
          {booking.meeting_type === 'Online' ? (
            <Video className="h-4 w-4 text-slate-400" />
          ) : (
            <MapPin className="h-4 w-4 text-slate-400" />
          )}
          {booking.meeting_type}
          {booking.meeting_link && (
            <a href={booking.meeting_link} target="_blank" rel="noreferrer" className="ml-1 underline" style={{ color: 'rgb(58,154,202)' }}>
              Join
            </a>
          )}
        </div>
      </div>

      {booking.assignment_description && (
        <p className="mt-3 rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-600 whitespace-pre-wrap line-clamp-3">
          {booking.assignment_description}
        </p>
      )}

      {/* Accept / Decline actions for pending appointments */}
      {isPending && (
        <div className="mt-4 pt-3 border-t border-amber-100 flex items-center gap-3">
          <span className="text-xs text-amber-600 font-medium flex-1">Awaiting your response</span>
          <button
            onClick={handleAccept}
            disabled={!!acting}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ backgroundColor: 'rgb(98,191,161)' }}
            onMouseEnter={e => { if (!acting) e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'; }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'}
          >
            {acting === 'accept' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
            {acting === 'accept' ? 'Confirming...' : 'Accept'}
          </button>
          <button
            onClick={handleDecline}
            disabled={!!acting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
          >
            {acting === 'decline' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            {acting === 'decline' ? 'Declining...' : 'Decline'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppointmentsSection({ bookings, courses, onRefresh }) {
  const getCourse = (courseId) => courses.find((c) => c.id === courseId);

  // Separate pending from others for display priority
  const pending = bookings.filter(b => b.status === 'Pending');
  const others = bookings.filter(b => b.status !== 'Pending');
  const ordered = [...pending, ...others];

  if (ordered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
        <Calendar className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-base font-medium text-slate-500">No upcoming appointments</p>
        <p className="mt-1 text-sm text-slate-400">Bookings will appear here once students schedule sessions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-700">
          {pending.length} pending {pending.length === 1 ? 'request' : 'requests'} need your response
        </div>
      )}
      {ordered.map((b) => (
        <AppointmentCard
          key={b.id}
          booking={b}
          course={getCourse(b.course_id)}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}