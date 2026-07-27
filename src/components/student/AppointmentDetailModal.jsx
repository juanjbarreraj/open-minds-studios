import React, { useState } from 'react';
import { X, CalendarDays, User, BookOpen, MapPin, Monitor, Loader2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function formatSlotLabel(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function formatCreatedDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${MONTH_ABBR[d.getMonth()]}. ${d.getDate()}, ${d.getFullYear()} at ${formatSlotLabel(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`)}`;
}

function formatBookingDate(dayName, date) {
  if (date) {
    const d = new Date(date);
    return `${DAY_NAMES[d.getDay()]}, ${MONTH_ABBR[d.getMonth()]}. ${d.getDate()}, ${d.getFullYear()}`;
  }
  return dayName || '';
}

const statusStyles = {
  'Pending': 'bg-amber-100 text-amber-700',
  'Appointment Confirmed': 'bg-emerald-100 text-emerald-700',
  'Confirmed': 'bg-emerald-100 text-emerald-700',
  'Completed': 'bg-blue-100 text-blue-700',
  'Cancelled': 'bg-red-100 text-red-700',
};

export default function AppointmentDetailModal({ booking, tutor, course, date, onClose, onCancelled }) {
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!booking) return null;

  const studentName = `${booking.student_first_name || ''} ${booking.student_last_name || ''}`.trim();
  const descParts = (booking.assignment_description || '').split('\n\n');
  const workOn = descParts[0] || '';
  const assignmentDesc = descParts.slice(1).join('\n\n') || '';

  const canCancel = booking.status === 'Pending' || booking.status === 'Appointment Confirmed' || booking.status === 'Confirmed';

  const handleCancel = async () => {
    setCancelling(true);
    await base44.entities.Booking.update(booking.id, { status: 'Cancelled' });
    setCancelling(false);
    if (onCancelled) onCancelled();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white px-6 pt-6 pb-4 border-b border-slate-100 rounded-t-3xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Appointment Details</h2>
              {booking.created_date && (
                <p className="mt-0.5 text-xs text-slate-500">
                  Booked on {formatCreatedDate(booking.created_date)}
                </p>
              )}
            </div>
            <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Status banner */}
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[booking.status] || 'bg-slate-100 text-slate-600'}`}>
              {booking.status}
            </span>
            {booking.status === 'Pending' && (
              <span className="text-xs text-slate-500">Waiting for tutor confirmation.</span>
            )}
            {(booking.status === 'Appointment Confirmed' || booking.status === 'Confirmed') && (
              <span className="text-xs text-slate-500">Your session is confirmed.</span>
            )}
          </div>

          {/* Session info */}
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-base font-bold text-slate-800">{studentName || 'Student'}</span>
            </div>

            <div className="text-sm text-slate-700">
              <span className="font-bold">{formatBookingDate(booking.preferred_day, date)}</span>
              {booking.preferred_start_time && (
                <span className="text-slate-600">
                  {' '}at {formatSlotLabel(booking.preferred_start_time)}
                  {booking.preferred_end_time && ` to ${formatSlotLabel(booking.preferred_end_time)}`}
                </span>
              )}
            </div>

            {tutor && (
              <div className="text-sm text-slate-700">
                Instructor: <span className="font-semibold">{tutor.full_name}</span>
                {tutor.email && (
                  <div className="mt-1 text-xs text-slate-500">
                    Email: <a href={`mailto:${tutor.email}`} style={{ color: 'rgb(58,154,202)' }} className="underline">{tutor.email}</a>
                  </div>
                )}
              </div>
            )}

            {booking.meeting_type === 'Online' && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Monitor className="h-3.5 w-3.5" /> Online session
              </div>
            )}
            {booking.meeting_type === 'In-Person' && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" /> Face-to-Face session
              </div>
            )}
          </div>

          {/* Course + assignment */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-800">Course</p>
              <p className="text-sm text-slate-600 mt-0.5">
                {course ? `${course.course_code}: ${course.course_name}` : 'Not specified'}
              </p>
            </div>

            {workOn && (
              <div>
                <p className="text-sm font-bold text-slate-800">What to work on</p>
                <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{workOn}</p>
              </div>
            )}

            {assignmentDesc && (
              <div>
                <p className="text-sm font-bold text-slate-800">Assignment description</p>
                <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{assignmentDesc}</p>
              </div>
            )}
          </div>

          {/* Cancel section */}
          {canCancel && (
            <div className="border-t border-slate-100 pt-4">
              {!confirmCancel ? (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                >
                  Cancel Appointment
                </button>
              ) : (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Cancel this appointment?</p>
                      <p className="text-xs text-red-500 mt-0.5">This will remove the appointment from both your calendar and the tutor's calendar. The slot will become available again.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                    >
                      {cancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
                    >
                      Keep Appointment
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}