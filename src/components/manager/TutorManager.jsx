import React, { useEffect, useState } from 'react';
import { tutorsApi } from '@/api/tutorsApi';
import { Plus, Pencil, Trash2, Search, Check, X, Loader2 } from 'lucide-react';

const empty = { full_name: '', email: '', phone: '', bio: '', auth_provider: 'google', approved: false, can_access_manager_dashboard: false, is_super_admin: false };

export default function TutorManager({ isSuperAdmin }) {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | tutorObj
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => { setLoading(true); setTutors(await tutorsApi.list()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const startEdit = (t) => { setEditing(t); setForm({ ...empty, ...t }); };
  const startNew = () => { setEditing('new'); setForm({ ...empty }); };
  const cancel = () => { setEditing(null); };

  const save = async () => {
    setSaving(true);
    const data = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      bio: form.bio,
      approved: form.approved,
      can_access_manager_dashboard: form.can_access_manager_dashboard,
      is_super_admin: form.is_super_admin,
    };
    if (!isSuperAdmin) { delete data.can_access_manager_dashboard; delete data.is_super_admin; }
    if (editing === 'new') { await tutorsApi.create(data); flash('Tutor created.'); }
    else { await tutorsApi.update(editing.id, data); flash('Tutor updated.'); }
    setSaving(false);
    setEditing(null);
    load();
  };

  const confirmDelete = async () => {
    await tutorsApi.remove(deleteId);
    setDeleteId(null);
    flash('Tutor deleted.');
    load();
  };

  const filtered = tutors.filter(t =>
    t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  );

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      {msg && <div className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</div>}

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tutors..." className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-300" />
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Add Tutor
        </button>
      </div>

      {/* Form */}
      {editing && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 space-y-4">
          <div className="text-sm font-semibold text-indigo-700">{editing === 'new' ? 'New Tutor' : 'Edit Tutor'}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Full Name*" value={form.full_name} onChange={e => f('full_name', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input placeholder="Email*" value={form.email} onChange={e => f('email', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input placeholder="Phone" value={form.phone || ''} onChange={e => f('phone', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <select value={form.auth_provider} onChange={e => f('auth_provider', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="google">Google</option>
              <option value="email">Email</option>
            </select>
            <textarea placeholder="Bio" value={form.bio || ''} onChange={e => f('bio', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2 min-h-[80px]" />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.approved} onChange={e => f('approved', e.target.checked)} className="rounded" />
              Approved
            </label>
            {isSuperAdmin && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.can_access_manager_dashboard} onChange={e => f('can_access_manager_dashboard', e.target.checked)} className="rounded" />
                  Manager Access
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.is_super_admin} onChange={e => f('is_super_admin', e.target.checked)} className="rounded" />
                  Super Admin
                </label>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
            </button>
            <button onClick={cancel} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-700">Are you sure you want to delete this tutor?</p>
          <div className="flex gap-2">
            <button onClick={confirmDelete} className="rounded-xl bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
            <button onClick={() => setDeleteId(null)} className="rounded-xl border border-slate-200 px-4 py-1.5 text-sm text-slate-600">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-400">No tutors found.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-center">Approved</th>
                <th className="px-4 py-3 text-center">Manager</th>
                <th className="px-4 py-3 text-center">Super Admin</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{t.full_name}</td>
                  <td className="px-4 py-3 text-slate-500">{t.email}</td>
                  <td className="px-4 py-3 text-slate-500">{t.phone || '-'}</td>
                  <td className="px-4 py-3 text-center">{t.approved ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Yes</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">No</span>}</td>
                  <td className="px-4 py-3 text-center">{t.can_access_manager_dashboard ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Yes</span> : '-'}</td>
                  <td className="px-4 py-3 text-center">{t.is_super_admin ? <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">Yes</span> : '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(t)} className="text-slate-400 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteId(t.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
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