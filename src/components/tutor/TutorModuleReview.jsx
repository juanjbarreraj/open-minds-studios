import React, { useEffect, useState } from 'react';
import { modulesApi } from '@/api/modulesApi';
import { filesApi } from '@/api/filesApi';
import { ClipboardList, ExternalLink, Loader2, CheckCircle } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function GradeCard({ mod, onGraded }) {
  const [grade, setGrade] = useState(mod.grade || '');
  const [feedback, setFeedback] = useState(mod.feedback || '');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await modulesApi.grade(mod.id, grade.trim(), feedback.trim());
      setDone(true);
      onGraded?.();
    } catch (err) {
      setError(err?.message || 'The grade could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Student + module info */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-base font-semibold text-slate-800">{mod.name}</div>
          <div className="text-sm text-slate-500 mt-0.5">Student: <span className="font-medium text-slate-700">{mod.student_name}</span></div>
          {mod.description && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{mod.description}</p>}
        </div>
        <div className="rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700">
          Submitted for grading
        </div>
      </div>

      {/* Student submission */}
      {mod.student_submission_url && (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <ExternalLink className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="text-sm text-slate-600 min-w-0">
            <span className="font-medium">Submission:</span>{' '}
            <a
              href={filesApi.url(mod.student_submission_url)}
              target="_blank"
              rel="noreferrer"
              className="underline truncate"
              style={{ color: 'rgb(58,154,202)' }}
            >
              {mod.student_submission_name || 'View file'}
            </a>
          </div>
          <div className="ml-auto text-xs text-slate-400 shrink-0">{formatDate(mod.submitted_at)}</div>
        </div>
      )}

      {/* Grade form */}
      {done ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          Grade submitted!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Grade *</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400"
                placeholder="e.g. A, 92/100, Pass"
                value={grade}
                onChange={e => setGrade(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Feedback (optional)</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400"
                placeholder="Brief comment..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ backgroundColor: 'rgb(58,154,202)' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = 'rgb(40,130,175)'; }}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(58,154,202)'}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? 'Submitting...' : 'Submit Grade'}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}

export default function TutorModuleReview({ tutorId }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = async () => {
    try {
      const mods = await modulesApi.list({ status: 'submitted' });
      mods.sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime());
      setModules(mods);
      setLoadError('');
    } catch (err) {
      setLoadError(err?.message || 'Submissions could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (tutorId) load(); }, [tutorId]);

  if (loading) return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
    </div>
  );

  if (loadError) return (
    <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-8 text-center text-sm text-red-600">
      {loadError}
    </div>
  );

  if (modules.length === 0) return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-12 text-center shadow-sm">
      <ClipboardList className="mb-3 h-9 w-9 text-slate-300" />
      <p className="text-sm font-medium text-slate-500">No submissions to grade</p>
      <p className="mt-1 text-xs text-slate-400">Student submissions will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {modules.map(m => (
        <GradeCard key={m.id} mod={m} onGraded={load} />
      ))}
    </div>
  );
}