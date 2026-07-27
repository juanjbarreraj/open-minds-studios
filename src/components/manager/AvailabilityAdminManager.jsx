import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Check, X, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const empty = { tutor_id: '', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', is_active: true };

export default function AvailabilityAdminManager() {
  const [slots, setSlots] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTutor, setFilterTutor] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    const [s, t] = await Promise.all([base44.entities.AvailabilitySlot.list(), base44.entities.Tutor.list()]);
    setSlots(s); setTutors(t); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    if (editing === 'new') { await base44.entities.AvailabilitySlot.create(form); flash('Slot created.'); }
    else { await base44.entities.AvailabilitySlot.update(editing.id, form); flash('Slot updated.'); }
    setSaving(false); setEditing(null); load();
  };

  const confirmDelete = async () => {
    await base44.entities.AvailabilitySlot.delete(deleteId);
    setDeleteId(null); flash('Slot deleted.'); load();
  };

  const toggleActive = async (slot) => {
    await base44.entities.AvailabilitySlot.update(slot.id, { is_active: !slot.is_active });
    load();
  };

  const getTutorName = (id) => tutors.find(t => t.id === id)?.full_name || '—';

  const filtered = slots.filter(s =>
    (!filterTutor || s.tutor_id === filterTutor) &&
    (!filterDay || s.day_of_week === filterDay)
  );

  return (
    <div className="space-y-4">
      {msg && <div className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</div>}

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <select value={filterTutor} onChange={e => setFilterTutor(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">All Tutors</option>
            {tutors.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
          <select value={filterDay} onChange={e => setFilterDay(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">All Days</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing('new'); setForm({ ...empty }); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Add Slot
        </button>
      </div>

      {editing && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 space-y-3">
          <div className="text-sm font-semibold text-indigo-700">{editing === 'new' ? 'New Slot' : 'Edit Slot'}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={form.tutor_id} onChange={e => f('tutor_id', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Select Tutor…</option>
              {tutors.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
            <select value={form.day_of_week} onChange={e => f('day_of_week', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="time" value={form.start_time} onChange={e => f('start_time', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input type="time" value={form.end_time} onChange={e => f('end_time', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={!!form.is_active} onChange={e => f('is_active', e.target.checked)} className="rounded" /> Active
          </label>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
            </button>
            <button onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-700">Delete this availability slot?</p>
          <div className="flex gap-2">
            <button onClick={confirmDelete} className="rounded-xl bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
            <button onClick={() => setDeleteId(null)} className="rounded-xl border border-slate-200 px-4 py-1.5 text-sm text-slate-600">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-400">No slots found.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Tutor</th>
                <th className="px-4 py-3 text-left">Day</th>
                <th className="px-4 py-3 text-left">Start</th>
                <th className="px-4 py-3 text-left">End</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{getTutorName(s.tutor_id)}</td>
                  <td className="px-4 py-3 text-slate-600">{s.day_of_week}</td>
                  <td className="px-4 py-3 text-slate-600">{s.start_time}</td>
                  <td className="px-4 py-3 text-slate-600">{s.end_time}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(s)} className={s.is_active ? 'text-green-500' : 'text-slate-300'}>
                      {s.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditing(s); setForm({ tutor_id: s.tutor_id, day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time, is_active: s.is_active }); }} className="text-slate-400 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteId(s.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}