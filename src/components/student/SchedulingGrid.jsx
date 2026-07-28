import React, { useEffect, useState, useCallback } from 'react';
import { tutorsApi } from '@/api/tutorsApi';
import { availabilityApi } from '@/api/availabilityApi';
import { bookingsApi } from '@/api/bookingsApi';
import { coursesApi } from '@/api/coursesApi';
import { Loader2, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import {
  todayInAppTz, nowTimeInAppTz, toYmd, ymdToDate, addDaysToYmd, mondayOfYmd,
} from '@/lib/appTime';
import BookingModal from './BookingModal';
import AppointmentDetailModal from './AppointmentDetailModal';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatSlotLabel(time) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function addMinutes(time, mins) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function timeToMins(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Returns 1-hour booking slots that fit within a tutor's availability window
// e.g. 09:00–17:00 → [09:00, 10:00, 11:00, ..., 16:00] (16:00 is last valid; 17:00 would exceed end)
function getBookableHourSlots(tutorSlots) {
  const bookable = new Set();
  tutorSlots.forEach(s => {
    const startMins = timeToMins(s.start_time);
    const endMins = timeToMins(s.end_time);
    // iterate in 60-min steps; only add slot if slot+60 <= end
    for (let cur = startMins; cur + 60 <= endMins; cur += 60) {
      const hh = String(Math.floor(cur / 60)).padStart(2, '0');
      const mm = String(cur % 60).padStart(2, '0');
      bookable.add(`${hh}:${mm}`);
    }
  });
  return [...bookable].sort();
}

// Check if a 1-hour slot is already booked on the cell's calendar date
function isSlotBooked(bookings, tutorId, cellDate, slotTime) {
  const dateStr = toYmd(cellDate);
  const slotStart = timeToMins(slotTime);
  const slotEnd = slotStart + 60;
  return bookings.find(b => {
    if (b.tutor_id !== tutorId || b.session_date !== dateStr) return false;
    if (!b.preferred_start_time) return false;
    // overlap: booking starts before slot ends AND booking ends after slot starts
    const bStart = timeToMins(b.preferred_start_time);
    const bEnd = b.preferred_end_time ? timeToMins(b.preferred_end_time) : bStart + 60;
    return bStart < slotEnd && bEnd > slotStart;
  });
}

function getWeekDays(mondayYmd) {
  return Array.from({ length: 7 }, (_, i) => ymdToDate(addDaysToYmd(mondayYmd, i)));
}

export default function SchedulingGrid({ student }) {
  const [tutors, setTutors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  // Everything below is anchored to Eastern Time, which is what the server
  // validates against, not to whatever time zone the browser is in.
  const todayYmd = todayInAppTz();
  const maxYmd = addDaysToYmd(todayYmd, 30);

  const [weekStart, setWeekStart] = useState(() => mondayOfYmd(todayYmd));
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const canGoNext = addDaysToYmd(weekStart, 7) <= maxYmd;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tutorData, slotData, bookingData, courseData] = await Promise.all([
        tutorsApi.list(),
        availabilityApi.list(),
        bookingsApi.busy(),
        coursesApi.list(),
      ]);
      setTutors(tutorData.sort((a, b) => a.full_name.localeCompare(b.full_name)));
      setSlots(slotData.filter(s => s.is_active !== false));
      // Busy rows from the server are only pending/confirmed bookings
      setBookings(bookingData);
      setCourses(courseData);
      setError('');
    } catch (err) {
      setError(err?.message || 'We could not load the schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const weekDays = getWeekDays(weekStart);

  const goNext = () => {
    if (!canGoNext) return;
    setWeekStart(prev => addDaysToYmd(prev, 7));
    setSelectedDay(null);
  };

  const goPrev = () => {
    setWeekStart(prev => addDaysToYmd(prev, -7));
    setSelectedDay(null);
  };

  const weekLabel = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${MONTH_ABBR[start.getMonth()]} ${start.getDate()} to ${MONTH_ABBR[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );

  if (error) return (
    <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-8 text-center">
      <p className="text-sm text-red-600">{error}</p>
      <button
        onClick={loadData}
        className="mt-3 rounded-xl px-4 py-1.5 text-xs font-semibold text-white transition-all duration-200"
        style={{ backgroundColor: 'rgb(58,154,202)' }}
      >
        Try again
      </button>
    </div>
  );

  const renderDaySlots = (date) => {
    const dayName = DAY_NAMES[date.getDay()];
    const dayYmd = toYmd(date);
    const isPast = dayYmd < todayYmd;
    const isToday = dayYmd === todayYmd;
    const isBeyondWindow = dayYmd > maxYmd;
    const nowEt = nowTimeInAppTz();
    const daySlots = slots.filter(s => s.day_of_week === dayName);
    const dayTutors = tutors.filter(t => daySlots.some(s => s.tutor_id === t.id));

    if (dayTutors.length === 0) {
      return (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-8 text-center text-sm text-slate-400">
          No tutors available on {dayName}.
        </div>
      );
    }

    return (
      <div className="mt-4 space-y-5">
        {dayTutors.map(tutor => {
          const tutorSlots = daySlots.filter(s => s.tutor_id === tutor.id);
          const bookableSlots = getBookableHourSlots(tutorSlots);

          if (bookableSlots.length === 0) return null;

          return (
            <div key={tutor.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: 'rgb(58,154,202)' }}
                >
                  {tutor.full_name.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-slate-800">{tutor.full_name}</span>
                <span className="ml-auto text-xs text-slate-400">1-hour sessions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {bookableSlots.map(slotTime => {
                  const cellKey = `${tutor.id}-${date.toDateString()}-${slotTime}`;
                  const bookedBooking = isSlotBooked(bookings, tutor.id, date, slotTime);
                  const isBooked = !!bookedBooking;
                  const isSelected = selectedCell?.cellKey === cellKey;
                  const endTime = addMinutes(slotTime, 60);

                  if (isBooked) {
                    return (
                      <button
                        key={slotTime}
                        onClick={() => setSelectedBooking({ booking: bookedBooking, tutor, date })}
                        className="rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-all duration-200"
                        style={{ backgroundColor: 'rgb(107,140,218)' }}
                        title="Already booked. Click to view details."
                      >
                        {formatSlotLabel(slotTime)} to {formatSlotLabel(endTime)}
                      </button>
                    );
                  }

                  // Not bookable: a past day, an hour that already passed
                  // today, or a day beyond the 30-day booking window.
                  const hasPassedToday = isToday && slotTime <= nowEt;
                  if (isPast || hasPassedToday || isBeyondWindow) {
                    return (
                      <span
                        key={slotTime}
                        className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-100 cursor-not-allowed"
                        title={isBeyondWindow ? 'Bookings open 30 days ahead.' : 'This time has passed.'}
                      >
                        {formatSlotLabel(slotTime)} to {formatSlotLabel(endTime)}
                      </span>
                    );
                  }

                  return (
                    <button
                      key={slotTime}
                      onClick={() => setSelectedCell(isSelected ? null : { tutor, date, dayName, slotTime, cellKey })}
                      className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 border"
                      style={isSelected ? {
                        backgroundColor: 'rgb(98,191,161)',
                        color: 'white',
                        borderColor: 'rgb(98,191,161)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(98,191,161,0.35)',
                      } : {
                        backgroundColor: 'rgba(98,191,161,0.08)',
                        color: 'rgb(60,160,130)',
                        borderColor: 'rgba(98,191,161,0.3)',
                      }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.backgroundColor = 'rgba(98,191,161,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.backgroundColor = 'rgba(98,191,161,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                    >
                      {formatSlotLabel(slotTime)} to {formatSlotLabel(endTime)}
                    </button>
                  );
                })}
              </div>

              {/* Confirm booking bar */}
              {selectedCell?.tutor?.id === tutor.id && selectedCell?.date?.toDateString() === date.toDateString() && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Selected: <strong className="text-slate-700">
                      {formatSlotLabel(selectedCell.slotTime)} to {formatSlotLabel(addMinutes(selectedCell.slotTime, 60))}
                    </strong>
                  </span>
                  <button
                    onClick={() => setSelectedCell(prev => ({ ...prev, openModal: true }))}
                    className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white transition-all duration-200"
                    style={{ backgroundColor: 'rgb(98,191,161)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'}
                  >
                    Book this slot
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={goPrev}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <div className="text-sm font-semibold text-slate-700">{weekLabel()}</div>
        <button
          onClick={goNext}
          disabled={!canGoNext}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-200"
          style={canGoNext ? { color: 'rgb(58,154,202)', cursor: 'pointer' } : { color: 'rgb(203,213,225)', cursor: 'not-allowed' }}
          onMouseEnter={e => { if (canGoNext) e.currentTarget.style.backgroundColor = 'rgba(58,154,202,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {weekDays.map((date) => {
          const dayName = DAY_NAMES[date.getDay()];
          const hasSlots = slots.some(s => s.day_of_week === dayName && tutors.some(t => t.id === s.tutor_id));
          const dayYmd = toYmd(date);
          const isToday = dayYmd === todayYmd;
          const isPast = dayYmd < todayYmd;
          const isBeyondWindow = dayYmd > maxYmd;
          const isSelected = selectedDay?.toDateString() === date.toDateString();

          return (
            <button
              key={date.toISOString()}
              onClick={() => { setSelectedDay(isSelected ? null : date); setSelectedCell(null); }}
              className="flex flex-col items-center gap-1 rounded-2xl px-1 py-3 transition-all duration-200 border"
              style={{
                backgroundColor: isSelected ? 'rgba(58,154,202,0.1)' : isToday ? 'rgba(98,191,161,0.07)' : 'white',
                borderColor: isSelected ? 'rgb(58,154,202)' : isToday ? 'rgba(98,191,161,0.5)' : 'rgb(226,232,240)',
                opacity: (isPast && !isToday) || isBeyondWindow ? 0.55 : 1,
                transform: isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected ? '0 4px 14px rgba(58,154,202,0.18)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <span className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: isSelected ? 'rgb(58,154,202)' : isPast ? 'rgb(148,163,184)' : 'rgb(100,116,139)' }}>
                {dayName.slice(0, 3)}
              </span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                style={isToday
                  ? { backgroundColor: 'rgb(98,191,161)', color: 'white' }
                  : { color: isSelected ? 'rgb(58,154,202)' : isPast ? 'rgb(148,163,184)' : 'rgb(30,41,59)' }}
              >
                {date.getDate()}
              </span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: hasSlots ? (isPast ? 'rgb(203,213,225)' : 'rgb(98,191,161)') : 'transparent' }}
              />
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-slate-800">
              {DAY_NAMES[selectedDay.getDay()]}, {MONTH_ABBR[selectedDay.getMonth()]} {selectedDay.getDate()}
            </h3>
            {toYmd(selectedDay) < todayYmd && (
              <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-slate-200 text-slate-500">Past date</span>
            )}
            {toYmd(selectedDay) > maxYmd && (
              <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-slate-200 text-slate-500">Beyond booking window</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-1">All sessions are 1 hour. Click a slot to select it, then confirm your booking. Times are shown in Eastern Time (ET).</p>
          {renderDaySlots(selectedDay)}
        </div>
      )}

      {!selectedDay && (
        <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-400">
          Select a day above to view available time slots.
        </div>
      )}

      {selectedCell?.openModal && (
        <BookingModal
          cell={selectedCell}
          student={student}
          onClose={() => setSelectedCell(null)}
          onBooked={() => { setSelectedCell(null); loadData(); }}
        />
      )}

      {selectedBooking && (
        <AppointmentDetailModal
          booking={selectedBooking.booking}
          tutor={selectedBooking.tutor}
          course={courses.find(c => c.id === selectedBooking.booking?.course_id)}
          date={selectedBooking.date}
          onClose={() => setSelectedBooking(null)}
          onCancelled={() => { setSelectedBooking(null); loadData(); }}
        />
      )}
    </div>
  );
}