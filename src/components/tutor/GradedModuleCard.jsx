import React, { useState } from 'react';
import { modulesApi } from '@/api/modulesApi';
import { Loader2, History, CheckCircle } from 'lucide-react';

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// A graded module, with a correction form and the full revision history.
// Corrections never overwrite the past: each one is appended to the history.
export default function GradedModuleCard({ mod, onCorrected }) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState(mod.grade || '');
  const [feedback, setFeedback] = useState(mod.feedback || '');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const [history, setHistory] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const toggleHistory = async () => {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next && history === null) {
      try {
        setHistory(await modulesApi.gradeRevisions(mod.id));
        setHistoryError('');
      } catch (err) {
        setHistoryError(err?.message || 'History could not be loaded.');
      }
    }
  };

  const submitCorrection = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError('A correction reason is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await modulesApi.correctGrade(mod.id, grade.trim(), feedback.trim(), reason.trim());
      setDone(true);
      setOpen(false);
      setReason('');
      setHistory(null);
      if (historyOpen) setHistory(await modulesApi.gradeRevisions(mod.id));
      onCorrected?.();
    } catch (err) {
      setError(err?.message || 'The correction could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-base font-semibold text-slate-800">{mod.name}</div>
          <div className="text-sm text-slate-500 mt-0.5">
            Student: <span className="font-medium text-slate-700">{mod.student_name}</span>
          </div>
        </div>
        <div className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">Graded</div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
        <div>
          <span className="text-xs text-slate-400 block">Grade</span>
          <span className="font-semibold text-slate-800">{mod.grade}</span>
        </div>
        {mod.feedback && (
          <div className="min-w-0 flex-1">
            <span className="text-xs text-slate-400 block">Feedback</span>
            <span className="text-slate-700">{mod.feedback}</span>
          </div>
        )}
        <div className="ml-auto text-xs text-slate-400">{formatDateTime(mod.graded_at)}</div>
      </div>

      {done && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle className="h-4 w-4" /> Grade corrected. The previous value is kept in the history.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!open && (
          <button
            onClick={() => { setOpen(true); setDone(false); setError(''); }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Correct this grade
          </button>
        )}
        <button
          onClick={toggleHistory}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
        >
          <History className="h-3.5 w-3.5" />
          {historyOpen ? 'Hide history' : 'Grade history'}
        </button>
      </div>

      {open && (
        <form onSubmit={submitCorrection} className="space-y-3 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Corrected grade *</label>
              <input className={inputCls} value={grade} onChange={(e) => setGrade(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Feedback</label>
              <input className={inputCls} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Reason for the correction *</label>
            <input
              className={inputCls}
              placeholder="e.g. Question 4 was marked incorrectly"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setError(''); }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ backgroundColor: 'rgb(58,154,202)' }}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? 'Saving...' : 'Save correction'}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      )}

      {historyOpen && (
        <div className="border-t border-slate-100 pt-4 space-y-2">
          {historyError && <p className="text-xs text-red-600">{historyError}</p>}
          {history === null && !historyError && (
            <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-slate-300" /></div>
          )}
          {history?.length === 0 && <p className="text-xs text-slate-400">No history recorded.</p>}
          {history?.map((rev, i) => (
            <div key={rev.id} className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">#{i + 1}</span>
                {rev.previous_grade
                  ? <span className="text-slate-700">{rev.previous_grade} to <strong>{rev.new_grade}</strong></span>
                  : <span className="text-slate-700">Graded <strong>{rev.new_grade}</strong></span>}
                <span className="ml-auto text-xs text-slate-400">{formatDateTime(rev.changed_at)}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {rev.correction_reason}
                {rev.changed_by_name ? ` (${rev.changed_by_name})` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
