import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, CheckCircle, Clock } from 'lucide-react';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function formatSlotLabel(time) {
  if (!time) return '';
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

// All appointments are exactly 60 minutes
const DURATION = 60;

export default function BookingModal({ cell, student, onClose, onBooked }) {
  const { tutor, date, dayName, slotTime } = cell;

  const [tutorCourses, setTutorCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [meetingType, setMeetingType] = useState('Online');
  const [courseId, setCourseId] = useState('');
  const [workOn, setWorkOn] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [studentPhone, setStudentPhone] = useState(student?.phone || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const endTime = addMinutes(slotTime, DURATION);
  const dateLabel = `${DAY_NAMES[date.getDay()]}, ${MONTH_ABBR[date.getMonth()]}. ${date.getDate()}, ${date.getFullYear()}`;

  useEffect(() => {
    (async () => {
      const [tc, ac] = await Promise.all([
        base44.entities.TutorCourse.filter({ tutor_id: tutor.id }),
        base44.entities.Course.list(),
      ]);
      setTutorCourses(tc);
      setAllCourses(ac);
      if (tc.length > 0) setCourseId(tc[0].course_id);
    })();
  }, [tutor.id]);

  const availableCourses = allCourses.filter(c => tutorCourses.some(tc => tc.course_id === c.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workOn.trim() || !assignmentDesc.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setSaving(true);

    const nameParts = (student?.full_name || '').split(' ');
    await base44.entities.Booking.create({
      tutor_id: tutor.id,
      student_first_name: student?.first_name || nameParts[0] || '',
      student_last_name: student?.last_name || nameParts.slice(1).join(' ') || '',
      student_email: student?.email || '',
      student_phone: studentPhone,
      course_id: courseId,
      assignment_description: `${workOn}\n\n${assignmentDesc}`,
      preferred_day: dayName,
      preferred_start_time: slotTime,
      preferred_end_time: endTime,
      meeting_type: meetingType,
      status: 'Pending',
    });

    setSaving(false);
    setSuccess(true);
    setTimeout(() => { onBooked(); onClose(); }, 2000);
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 rounded-t-3xl">
          <h2 className="text-xl font-bold text-slate-800">Book Appointment</h2>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center gap-4">
            <CheckCircle className="h-14 w-14" style={{ color: 'rgb(98,191,161)' }} />
            <div className="text-xl font-semibold text-slate-800">Appointment Requested!</div>
            <p className="text-sm text-slate-500">Your appointment is pending tutor confirmation.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">

            {/* Session summary */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: 'rgb(98,191,161)' }} />
                <p className="text-sm font-bold text-slate-700">{dateLabel}</p>
              </div>
              <p className="text-sm text-slate-600">
                <span className="font-semibold" style={{ color: 'rgb(98,191,161)' }}>{formatSlotLabel(slotTime)}</span>
                {' to '}
                <span className="font-semibold" style={{ color: 'rgb(98,191,161)' }}>{formatSlotLabel(endTime)}</span>
                <span className="ml-2 text-xs text-slate-400">(1 hour)</span>
              </p>
              <div className="text-sm text-slate-700">
                Instructor: <span className="font-semibold">{tutor.full_name}</span>
                {tutor.email && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    Email: <span style={{ color: 'rgb(58,154,202)' }}>{tutor.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Type */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-800">Appointment Type</h3>
              <label className="flex items-start gap-2 cursor-pointer text-sm text-slate-700">
                <input type="radio" name="meetingType" value="Online" checked={meetingType === 'Online'} onChange={() => setMeetingType('Online')} className="mt-0.5" />
                <span>Schedule <strong>Online</strong> appointment.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer text-sm text-slate-700">
                <input type="radio" name="meetingType" value="In-Person" checked={meetingType === 'In-Person'} onChange={() => setMeetingType('In-Person')} className="mt-0.5" />
                <span>Schedule <strong>Face-to-Face</strong> appointment.</span>
              </label>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800">Appointment Details</h3>
              <p className="text-xs text-slate-500">Fields marked with <span className="text-red-500 font-bold">*</span> are required.</p>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Instructor <span className="text-red-500">*</span></label>
                <input value={tutor.full_name} readOnly className={`${inputCls} bg-slate-50 text-slate-500`} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Course <span className="text-red-500">*</span></label>
                {availableCourses.length > 0 ? (
                  <select value={courseId} onChange={e => setCourseId(e.target.value)} className={inputCls} required>
                    {availableCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.course_code}: {c.course_name}</option>
                    ))}
                  </select>
                ) : (
                  <input value="No courses assigned" readOnly className={`${inputCls} bg-slate-50 text-slate-400`} />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">What would you like to work on? <span className="text-red-500">*</span></label>
                <textarea value={workOn} onChange={e => setWorkOn(e.target.value)} rows={3} required className={inputCls} placeholder="e.g. Review chapter 5 problems, prepare for upcoming exam..." />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Brief description of your assignment <span className="text-red-500">*</span></label>
                <textarea value={assignmentDesc} onChange={e => setAssignmentDesc(e.target.value)} rows={3} required className={inputCls} placeholder="Describe the assignment, topic, or challenge you are facing..." />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone (optional)</label>
                <input type="tel" value={studentPhone} onChange={e => setStudentPhone(e.target.value)} className={inputCls} placeholder="Your phone number" />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pb-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 transition"
                style={{ backgroundColor: 'rgb(98,191,161)' }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'; }}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Submitting...' : 'Request Appointment'}
              </button>
              <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}