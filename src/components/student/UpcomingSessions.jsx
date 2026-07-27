import React from 'react';
import { CalendarDays, Loader2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  pending: { bg: 'rgba(246,178,59,0.1)', color: 'rgb(180,120,10)' },
  confirmed: { bg: 'rgba(98,191,161,0.1)', color: 'rgb(60,160,130)' },
};

function formatSlot(day, start, end) {
  if (day && start) return `${day}, ${start}${end ? ` – ${end}` : ''}`;
  return 'TBD';
}

export default function UpcomingSessions({ bookings, loading, getTutorName, getCourseName, onCancel }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" style={{ color: 'rgb(58,154,202)' }} />
          <div className="text-sm font-semibold text-slate-700">Upcoming Sessions</div>
        </div>
        <Link
          to="/appointment-scheduling"
          className="rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:opacity-90"
          style={{ backgroundColor: 'rgb(98,191,161)' }}
        >
          Book session
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">
          No upcoming sessions.{' '}
          <Link to="/appointment-scheduling" className="underline" style={{ color: 'rgb(98,191,161)' }}>
            Book one now
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => {
            const sc = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
            return (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{getCourseName(b.course_id)}</div>
                  <div className="text-xs text-slate-400">with {getTutorName(b.tutor_id)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className="rounded-lg px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: sc.bg, color: sc.color }}
                  >
                    {formatSlot(b.preferred_day, b.preferred_start_time, b.preferred_end_time)}
                  </span>
                  <button
                    onClick={() => onCancel(b.id)}
                    className="rounded-lg p-1 text-slate-300 hover:text-red-400 transition-colors"
                    title="Cancel session"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}