import React, { useState } from 'react';
import { X, Upload, Loader2, CheckCircle } from 'lucide-react';
import { filesApi } from '@/api/filesApi';
import { modulesApi } from '@/api/modulesApi';

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.ppt,.pptx,.xls,.xlsx,.txt';

export default function AssignModuleModal({ student, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Module name is required.'); return; }
    setError('');
    setSaving(true);

    let fileId = null;

    try {
      if (file) {
        setUploading(true);
        const { id } = await filesApi.upload(file);
        fileId = id;
        setUploading(false);
      }

      await modulesApi.create({
        student_email: student.email,
        student_name: student.name,
        name: form.name.trim(),
        description: form.description.trim(),
        file_id: fileId,
      });

      setDone(true);
      setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      setError(err?.message || 'The module could not be assigned. Please try again.');
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: 'rgb(98,191,161)' }}>
              Assign Module
            </div>
            <div className="text-base font-bold text-slate-800">To: {student.name}</div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center py-14 px-6 text-center">
            <CheckCircle className="h-12 w-12 mb-3" style={{ color: 'rgb(98,191,161)' }} />
            <div className="text-lg font-bold text-slate-800">Module Assigned!</div>
            <div className="text-sm text-slate-500 mt-1">It will appear in {student.name}'s portal.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Module Name *</label>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                placeholder="e.g. SAT Math Practice Set 1"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
              <textarea
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 min-h-[90px] resize-none"
                placeholder="Instructions, context, or goals for this module..."
                value={form.description}
                onChange={e => update('description', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Upload File (optional)</label>
              <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 cursor-pointer hover:border-slate-300 hover:bg-slate-100 transition">
                <Upload className="h-6 w-6 text-slate-400" />
                <span className="text-sm text-slate-500">
                  {file ? file.name : 'Click to upload - PDF, Word, images, etc.'}
                </span>
                {file && <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>}
                <input type="file" accept={ACCEPTED_TYPES} onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
                style={{ backgroundColor: 'rgb(98,191,161)' }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'; }}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'}
              >
                {(saving || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploading ? 'Uploading...' : saving ? 'Assigning...' : 'Assign Module'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}