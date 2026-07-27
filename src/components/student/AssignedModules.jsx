import React, { useState } from 'react';
import { BookOpen, ExternalLink, Upload, Loader2, CheckCircle, Star } from 'lucide-react';
import { modulesApi, moduleStatusLabel } from '@/api/modulesApi';
import { filesApi } from '@/api/filesApi';

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.ppt,.pptx,.xls,.xlsx,.txt';

const STATUS_STYLE = {
  assigned: { bg: 'rgba(58,154,202,0.1)', color: 'rgb(30,100,160)' },
  submitted: { bg: 'rgba(246,178,59,0.12)', color: 'rgb(160,110,10)' },
  graded: { bg: 'rgba(98,191,161,0.12)', color: 'rgb(50,140,110)' },
};

function ModuleCard({ mod, onRefresh }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const sc = STATUS_STYLE[mod.status] || STATUS_STYLE.assigned;
  const canSubmit = mod.status === 'assigned';

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    const { id: fileId } = await filesApi.upload(file);
    setUploading(false);
    setSubmitting(true);
    await modulesApi.submit(mod.id, fileId);
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => onRefresh(), 1000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(58,154,202,0.1)' }}>
            <BookOpen className="h-4 w-4" style={{ color: 'rgb(58,154,202)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{mod.name}</div>
            {mod.tutor_name && <div className="text-xs text-slate-400">from {mod.tutor_name}</div>}
          </div>
        </div>
        <span className="ml-3 shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: sc.bg, color: sc.color }}>
          {moduleStatusLabel(mod.status)}
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
          {mod.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{mod.description}</p>
          )}

          {/* Tutor's uploaded file */}
          {mod.file_url && (
            <a
              href={filesApi.url(mod.file_url)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 transition"
            >
              <ExternalLink className="h-4 w-4 text-slate-400" />
              {mod.file_name || 'Open module file'}
            </a>
          )}

          {/* Grade display */}
          {mod.status === 'graded' && (
            <div className="rounded-2xl border p-4 space-y-1"
              style={{ borderColor: 'rgba(98,191,161,0.3)', backgroundColor: 'rgba(98,191,161,0.06)' }}>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" style={{ color: 'rgb(98,191,161)' }} />
                <span className="text-sm font-bold text-slate-800">Grade: {mod.grade}</span>
              </div>
              {mod.feedback && <p className="text-sm text-slate-600 pl-6">{mod.feedback}</p>}
            </div>
          )}

          {/* Student submission */}
          {mod.status === 'submitted' && mod.student_submission_url && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-700">
              <CheckCircle className="h-4 w-4" />
              Submitted - awaiting grade from your tutor.
            </div>
          )}

          {/* Submit work, only if assigned */}
          {canSubmit && (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Submit your work</div>
              <label className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer hover:border-slate-300 hover:bg-slate-100 transition">
                <Upload className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-500 truncate">
                  {file ? file.name : 'Click to upload your completed work'}
                </span>
                <input type="file" accept={ACCEPTED_TYPES} onChange={e => setFile(e.target.files[0])} className="hidden" />
              </label>
              {submitted ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
                  <CheckCircle className="h-4 w-4" /> Submitted!
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!file || uploading || submitting}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
                  style={{ backgroundColor: 'rgb(98,191,161)' }}
                  onMouseEnter={e => { if (file && !submitting) e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'; }}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'}
                >
                  {(uploading || submitting) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit for Grading'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssignedModules({ modules, loading, onRefresh }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-slate-700 mb-4">Assigned Modules</div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      ) : modules.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">No modules assigned yet.</div>
      ) : (
        <div className="space-y-3">
          {modules.map(m => (
            <ModuleCard key={m.id} mod={m} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}