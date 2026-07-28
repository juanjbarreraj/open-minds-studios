import React, { useEffect, useState } from 'react';
import { coursesApi } from '@/api/coursesApi';
import { Plus, Pencil, Trash2, Search, Check, X, Loader2 } from 'lucide-react';

const empty = { course_code: '', course_name: '' };

export default function CourseManager() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try { setCourses(await coursesApi.list()); }
    catch (err) { flash(err?.message || 'Courses could not be loaded.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing === 'new') { await coursesApi.create(form); flash('Course created.'); }
      else { await coursesApi.update(editing.id, form); flash('Course updated.'); }
      setEditing(null);
      load();
    } catch (err) {
      // For example a duplicate course code.
      flash(err?.message || 'That course could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await coursesApi.remove(deleteId);
      flash('Course deleted.');
      load();
    } catch (err) {
      flash(err?.message || 'That course could not be deleted.');
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = courses.filter(c =>
    c.course_code?.toLowerCase().includes(search.toLowerCase()) ||
    c.course_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {msg && <div className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</div>}

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..." className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-300" />
        </div>
        <button onClick={() => { setEditing('new'); setForm({ ...empty }); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Add Course
        </button>
      </div>

      {editing && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 space-y-3">
          <div className="text-sm font-semibold text-indigo-700">{editing === 'new' ? 'New Course' : 'Edit Course'}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Course Code*" value={form.course_code} onChange={e => setForm(p => ({ ...p, course_code: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input placeholder="Course Name*" value={form.course_name} onChange={e => setForm(p => ({ ...p, course_name: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
            </button>
            <button onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-700">Delete this course?</p>
          <div className="flex gap-2">
            <button onClick={confirmDelete} className="rounded-xl bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
            <button onClick={() => setDeleteId(null)} className="rounded-xl border border-slate-200 px-4 py-1.5 text-sm text-slate-600">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-400">No courses found.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-medium text-slate-800">{c.course_code}</td>
                  <td className="px-4 py-3 text-slate-600">{c.course_name}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditing(c); setForm({ course_code: c.course_code, course_name: c.course_name }); }} className="text-slate-400 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteId(c.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
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