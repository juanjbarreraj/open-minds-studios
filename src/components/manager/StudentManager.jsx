import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Search, Check, X, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

const empty = { first_name: '', last_name: '', full_name: '', email: '', phone: '', approved: false, can_access_student_portal: false, notes: '' };

export default function StudentManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => { setLoading(true); setStudents(await base44.entities.Student.list('-created_date')); setLoading(false); };
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const data = { ...form };
    if (!data.full_name) data.full_name = `${data.first_name} ${data.last_name}`.trim();
    if (editing === 'new') { await base44.entities.Student.create(data); flash('Student created.'); }
    else { await base44.entities.Student.update(editing.id, data); flash('Student updated.'); }
    setSaving(false); setEditing(null); load();
  };

  const confirmDelete = async () => {
    await base44.entities.Student.delete(deleteId);
    setDeleteId(null); flash('Student deleted.'); load();
  };

  const toggleField = async (student, field) => {
    await base44.entities.Student.update(student.id, { [field]: !student[field] });
    load();
  };

  const filtered = students.filter(s =>
    (s.full_name || `${s.first_name} ${s.last_name}`).toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {msg && <div className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</div>}

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-300" />
        </div>
        <button onClick={() => { setEditing('new'); setForm({ ...empty }); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Add Student
        </button>
      </div>

      {editing && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 space-y-4">
          <div className="text-sm font-semibold text-indigo-700">{editing === 'new' ? 'New Student' : 'Edit Student'}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="First Name" value={form.first_name} onChange={e => f('first_name', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input placeholder="Last Name" value={form.last_name} onChange={e => f('last_name', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input placeholder="Email*" value={form.email} onChange={e => f('email', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input placeholder="Phone" value={form.phone || ''} onChange={e => f('phone', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <textarea placeholder="Notes" value={form.notes || ''} onChange={e => f('notes', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2 min-h-[70px]" />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.approved} onChange={e => f('approved', e.target.checked)} className="rounded" /> Approved
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.can_access_student_portal} onChange={e => f('can_access_student_portal', e.target.checked)} className="rounded" /> Portal Access
            </label>
          </div>
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
          <p className="text-sm text-red-700">Delete this student record?</p>
          <div className="flex gap-2">
            <button onClick={confirmDelete} className="rounded-xl bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
            <button onClick={() => setDeleteId(null)} className="rounded-xl border border-slate-200 px-4 py-1.5 text-sm text-slate-600">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-400">No students found.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-center">Approved</th>
                <th className="px-4 py-3 text-center">Portal Access</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.full_name || `${s.first_name} ${s.last_name}`}</td>
                  <td className="px-4 py-3 text-slate-500">{s.email}</td>
                  <td className="px-4 py-3 text-slate-500">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleField(s, 'approved')} className={s.approved ? 'text-green-500' : 'text-slate-300'}>
                      {s.approved ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleField(s, 'can_access_student_portal')} className={s.can_access_student_portal ? 'text-indigo-500' : 'text-slate-300'}>
                      {s.can_access_student_portal ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditing(s); setForm({ first_name: s.first_name || '', last_name: s.last_name || '', full_name: s.full_name || '', email: s.email, phone: s.phone || '', approved: s.approved, can_access_student_portal: s.can_access_student_portal, notes: s.notes || '' }); }} className="text-slate-400 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
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