import React, { useEffect, useState } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { progressApi } from '@/api/progressApi';

// Tutors record real progress for a student on their roster: a weekly focus
// and any number of simple labelled metrics. The student sees this read-only
// on their dashboard.
export default function StudentProgressModal({ student, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [focus, setFocus] = useState(null);

  const [focusForm, setFocusForm] = useState({ title: '', description: '', progress_percent: 0 });
  const [metricForm, setMetricForm] = useState({ label: '', value: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await progressApi.get(student.id);
      setMetrics(data.metrics);
      const current = data.focus[0] || null;
      setFocus(current);
      setFocusForm({
        title: current?.title || '',
        description: current?.description || '',
        progress_percent: current?.progress_percent ?? 0,
      });
      setError('');
    } catch (err) {
      setError(err?.message || 'Progress could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [student.id]);

  const saveFocus = async (e) => {
    e.preventDefault();
    if (!focusForm.title.trim()) { setError('A focus title is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: focusForm.title.trim(),
        description: focusForm.description.trim(),
        progress_percent: Number(focusForm.progress_percent) || 0,
      };
      if (focus) await progressApi.updateFocus(focus.id, payload);
      else await progressApi.createFocus(student.id, payload);
      await load();
    } catch (err) {
      setError(err?.message || 'That focus could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const addMetric = async (e) => {
    e.preventDefault();
    if (!metricForm.label.trim() || !metricForm.value.trim()) {
      setError('A metric needs both a label and a value.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await progressApi.createMetric(student.id, {
        label: metricForm.label.trim(),
        value: metricForm.value.trim(),
        display_order: metrics.length,
      });
      setMetricForm({ label: '', value: '' });
      await load();
    } catch (err) {
      setError(err?.message || 'That metric could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const removeMetric = async (id) => {
    setError('');
    try {
      await progressApi.removeMetric(id);
      await load();
    } catch (err) {
      setError(err?.message || 'That metric could not be removed.');
    }
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 rounded-t-3xl">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Progress</h2>
            <p className="text-xs text-slate-500">{student.name || student.email}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="px-6 py-5 space-y-6">
            {error && <p className="text-sm text-red-600">{error}</p>}

            <form onSubmit={saveFocus} className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">This week's focus</h3>
              <input
                className={inputCls}
                placeholder="Focus title"
                value={focusForm.title}
                onChange={(e) => setFocusForm((f) => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className={`${inputCls} min-h-[70px]`}
                placeholder="What should the student work on?"
                value={focusForm.description}
                onChange={(e) => setFocusForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-500">Completed</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={focusForm.progress_percent}
                  onChange={(e) => setFocusForm((f) => ({ ...f, progress_percent: Number(e.target.value) }))}
                />
                <span className="text-xs text-slate-400">percent</span>
                <button
                  type="submit"
                  disabled={saving}
                  className="ml-auto rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                  style={{ backgroundColor: 'rgb(98,191,161)' }}
                >
                  {saving ? 'Saving...' : 'Save focus'}
                </button>
              </div>
            </form>

            <div className="space-y-3 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-800">Progress metrics</h3>
              {metrics.length === 0 ? (
                <p className="text-xs text-slate-400">No metrics recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {metrics.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm">
                      <span className="text-slate-600">{m.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-800">{m.value}</span>
                        <button
                          onClick={() => removeMetric(m.id)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                          title="Remove metric"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={addMetric} className="flex flex-wrap gap-2">
                <input
                  className="flex-1 min-w-[130px] rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Label, e.g. Practice score"
                  value={metricForm.label}
                  onChange={(e) => setMetricForm((f) => ({ ...f, label: e.target.value }))}
                />
                <input
                  className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Value"
                  value={metricForm.value}
                  onChange={(e) => setMetricForm((f) => ({ ...f, value: e.target.value }))}
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
