import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { availabilityApi } from '@/api/availabilityApi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const emptySlot = { day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', is_active: true };

export default function AvailabilityManager({ slots, tutorId, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...emptySlot });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ ...emptySlot });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const validate = (s) => {
    if (s.start_time >= s.end_time) return 'End time must be after start time.';
    return '';
  };

  const handleAdd = async () => {
    const err = validate(form);
    if (err) { setError(err); return; }
    setSaving(true);
    try {
      await availabilityApi.create({ ...form, tutor_id: tutorId });
      setAdding(false);
      setForm({ ...emptySlot });
      setError('');
      onRefresh();
    } catch (e) {
      // For example a window overlapping one already set for that day.
      setError(e?.message || 'That availability window could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    const err = validate(editForm);
    if (err) { setError(err); return; }
    setSaving(true);
    try {
      await availabilityApi.update(id, editForm);
      setEditingId(null);
      setError('');
      onRefresh();
    } catch (e) {
      setError(e?.message || 'That availability window could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await availabilityApi.remove(id);
      onRefresh();
    } catch (e) {
      setError(e?.message || 'That availability window could not be deleted.');
    }
  };

  const handleToggle = async (slot) => {
    try {
      await availabilityApi.update(slot.id, { is_active: !slot.is_active });
      onRefresh();
    } catch (e) {
      setError(e?.message || 'That change could not be saved.');
    }
  };

  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = slots.filter((s) => s.day_of_week === day);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}
      {DAYS.map((day) => (
        <div key={day} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-slate-700">{day}</div>
          {slotsByDay[day].length === 0 && (
            <p className="text-xs text-slate-400">No slots added yet.</p>
          )}
          <div className="space-y-2">
            {slotsByDay[day].map((slot) =>
              editingId === slot.id ? (
                <div key={slot.id} className="flex flex-wrap items-center gap-2">
                  <input type="time" value={editForm.start_time} onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
                  <span className="text-slate-400">–</span>
                  <input type="time" value={editForm.end_time} onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
                  <button onClick={() => handleEdit(slot.id)} disabled={saving} className="rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-blue-deep">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { setEditingId(null); setError(''); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div key={slot.id} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${slot.is_active ? 'bg-slate-50' : 'bg-slate-100 opacity-60'}`}>
                  <span className="font-medium text-slate-700">{slot.start_time} – {slot.end_time}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(slot)} title={slot.is_active ? 'Deactivate' : 'Activate'} className="text-slate-400 hover:text-brand-blue">
                      {slot.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button onClick={() => { setEditingId(slot.id); setEditForm({ day_of_week: slot.day_of_week, start_time: slot.start_time, end_time: slot.end_time, is_active: slot.is_active }); setError(''); }} className="text-slate-400 hover:text-slate-700">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(slot.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          {adding && form.day_of_week === day ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
              <span className="text-slate-400">–</span>
              <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
              <button onClick={handleAdd} disabled={saving} className="rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-blue-deep">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setAdding(false); setError(''); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => { setAdding(true); setForm({ ...emptySlot, day_of_week: day }); }} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 transition hover:border-brand-blue/50 hover:text-brand-blue">
              <Plus className="h-3 w-3" /> Add slot
            </button>
          )}
        </div>
      ))}
    </div>
  );
}