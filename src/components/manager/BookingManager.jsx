import React, { useEffect, useState } from 'react';
import { bookingsApi, bookingStatusLabel } from '@/api/bookingsApi';
import { tutorsApi } from '@/api/tutorsApi';
import { coursesApi } from '@/api/coursesApi';
import { Search, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';

const STATUSES = ['pending', 'confirmed', 'declined', 'cancelled', 'completed'];
const statusColors = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', declined: 'bg-red-100 text-red-700' };

export default function BookingManager() {
  const [bookings, setBookings] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTutor, setFilterTutor] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', meeting_link: '' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [b, t, c] = await Promise.all([
        bookingsApi.list(),
        tutorsApi.list(),
        coursesApi.list(),
      ]);
      setBookings(b); setTutors(t); setCourses(c);
    } catch (err) {
      flash(err?.message || 'Bookings could not be loaded.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const save = async () => {
    setSaving(true);
    try {
      await bookingsApi.managerUpdate(editing.id, { status: editForm.status, meeting_link: editForm.meeting_link });
      flash('Booking updated.');
      setEditing(null);
      load();
    } catch (err) {
      flash(err?.message || 'That booking could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await bookingsApi.remove(deleteId);
      flash('Booking deleted.');
      load();
    } catch (err) {
      flash(err?.message || 'That booking could not be deleted.');
    } finally {
      setDeleteId(null);
    }
  };

  const getTutorName = (id) => tutors.find(t => t.id === id)?.full_name || '-';
  const getCourseName = (id) => { const c = courses.find(c => c.id === id); return c ? `${c.course_code}` : '-'; };

  const filtered = bookings.filter(b => {
    const name = `${b.student_first_name} ${b.student_last_name} ${b.student_email}`.toLowerCase();
    return (!search || name.includes(search.toLowerCase())) &&
      (!filterStatus || b.status === filterStatus) &&
      (!filterTutor || b.tutor_id === filterTutor);
  });

  return (
    <div className="space-y-4">
      {msg && <div className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</div>}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..." className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-brand-blue/50" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{bookingStatusLabel(s)}</option>)}
        </select>
        <select value={filterTutor} onChange={e => setFilterTutor(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="">All Tutors</option>
          {tutors.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
        </select>
      </div>

      {editing && (
        <div className="rounded-2xl border border-brand-blue/15 bg-brand-blue/10 p-5 space-y-3">
          <div className="text-sm font-semibold text-brand-blue-deep">Edit Booking - {editing.student_first_name} {editing.student_last_name}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {STATUSES.map(s => <option key={s} value={s}>{bookingStatusLabel(s)}</option>)}
            </select>
            <input placeholder="Meeting Link" value={editForm.meeting_link || ''} onChange={e => setEditForm(p => ({ ...p, meeting_link: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-deep disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
            </button>
            <button onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-700">Delete this booking?</p>
          <div className="flex gap-2">
            <button onClick={confirmDelete} className="rounded-xl bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
            <button onClick={() => setDeleteId(null)} className="rounded-xl border border-slate-200 px-4 py-1.5 text-sm text-slate-600">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-400">No bookings found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{b.student_first_name} {b.student_last_name}</p>
                  <p className="text-xs text-slate-500">{b.student_email}{b.student_phone ? ` · ${b.student_phone}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${statusColors[b.status] || 'bg-slate-100 text-slate-600'}`}>{bookingStatusLabel(b.status)}</span>
                  <button onClick={() => { setEditing(b); setEditForm({ status: b.status, meeting_link: b.meeting_link || '' }); }} className="text-slate-400 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteId(b.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                <span>Tutor: <span className="font-medium text-slate-700">{getTutorName(b.tutor_id)}</span></span>
                <span>Course: <span className="font-medium text-slate-700">{getCourseName(b.course_id)}</span></span>
                <span>{b.preferred_day} {b.session_date} · {b.preferred_start_time} – {b.preferred_end_time}</span>
                <span>{b.meeting_type}{b.meeting_link ? <a href={b.meeting_link} target="_blank" rel="noreferrer" className="ml-1 text-brand-blue underline">Join</a> : ''}</span>
              </div>
              {b.assignment_description && <p className="mt-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs text-slate-600">{b.assignment_description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}