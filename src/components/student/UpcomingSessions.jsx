import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, CalendarPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusChip from '@/components/ui/status-chip';
import ActionButton from '@/components/ui/action-button';
import { bookingStatusLabel } from '@/api/bookingsApi';
import { formatSessionWhen } from '@/lib/format';
import { useMotion } from '@/lib/motion';

export default function UpcomingSessions({ bookings, loading, getTutorName, getCourseName, onCancel }) {
  const m = useMotion();

  return (
    <div className="rounded-[var(--radius-lg)] border border-slate-200/80 bg-white p-6 shadow-elev-1">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-brand-blue" aria-hidden="true" />
          <h2 className="text-sm font-bold text-ink-900">Upcoming Sessions</h2>
          {bookings.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-ink-600">
              {bookings.length}
            </span>
          )}
        </div>
        <ActionButton as={Link} to="/appointment-scheduling" size="sm" icon={CalendarPlus}>
          Book session
        </ActionButton>
      </div>

      {loading ? (
        // Skeletons match the shape of a real row, so nothing jumps when the
        // data lands.
        <div className="space-y-3" aria-busy="true" aria-label="Loading your sessions">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-[var(--radius-md)] bg-slate-50 px-4 py-4">
              <div className="space-y-2">
                <div className="h-3.5 w-40 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-6 w-28 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <motion.div
          initial={m.reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[var(--radius-md)] border border-dashed border-slate-200 px-6 py-10 text-center"
        >
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-slate-300" aria-hidden="true" />
          <p className="text-sm font-medium text-ink-700">No sessions booked yet</p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-ink-500">
            Pick a tutor and a time that works for you. Every session is one hour.
          </p>
          <ActionButton as={Link} to="/appointment-scheduling" size="sm" icon={CalendarPlus} className="mt-4">
            Book your first session
          </ActionButton>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {bookings.map((b) => (
              <motion.div
                key={b.id}
                layout={!m.reduced}
                initial={m.reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={m.reduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
                transition={{ duration: 0.24 }}
                className="rounded-[var(--radius-md)] border border-slate-200/80 bg-white p-4 shadow-elev-1 transition-shadow duration-hover ease-brand-out hover:shadow-elev-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-ink-900">{getCourseName(b.course_id)}</div>
                    <div className="mt-0.5 text-xs text-ink-500">with {getTutorName(b.tutor_id)}</div>
                    {/* Friendly Eastern Time, not a raw 24 hour string. */}
                    <div className="mt-2 text-sm font-medium text-ink-700">{formatSessionWhen(b)}</div>
                  </div>
                  <StatusChip tone={b.status}>{bookingStatusLabel(b.status)}</StatusChip>
                </div>

                <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                  {/* A labelled button rather than a 24px icon: comfortably
                      past the 44px touch minimum. */}
                  <ActionButton variant="ghost" size="sm" onClick={() => onCancel(b.id)}>
                    Cancel session
                  </ActionButton>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
