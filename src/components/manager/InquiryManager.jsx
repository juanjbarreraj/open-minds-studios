import React, { useEffect, useState } from 'react';
import { Search, Loader2, Check, X, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { inquiriesApi, inquiryStatusLabel } from '@/api/inquiriesApi';

const STATUSES = ['new', 'contacted', 'closed'];

const statusColors = {
  new: 'bg-amber-100 text-amber-700 border-amber-200',
  contacted: 'bg-blue-100 text-blue-700 border-blue-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

function formatSubmitted(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function InquiryManager() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'new', manager_notes: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      setInquiries(await inquiriesApi.list());
    } catch (err) {
      flash(err?.message || 'Inquiries could not be loaded.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const startEdit = (inq) => {
    setEditing(inq.id);
    setEditForm({ status: inq.status, manager_notes: inq.manager_notes || '' });
  };

  const save = async () => {
    setSaving(true);
    try {
      await inquiriesApi.update(editing, editForm);
      flash('Inquiry updated.');
      setEditing(null);
      load();
    } catch (err) {
      flash(err?.message || 'That inquiry could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = inquiries.filter((i) => {
    const haystack = `${i.parent_name} ${i.email} ${i.subject_or_exam} ${i.interested_program}`.toLowerCase();
    return (!search || haystack.includes(search.toLowerCase())) &&
      (!filterStatus || i.status === filterStatus);
  });

  return (
    <div className="space-y-4">
      {msg && <div className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</div>}

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inquiries..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-300"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{inquiryStatusLabel(s)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-400">
          No inquiries found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inq) => {
            const isExpanded = expandedId === inq.id;
            return (
              <div key={inq.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                  className="w-full flex flex-wrap items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition rounded-2xl"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                    <Mail className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800 truncate">{inq.parent_name}</div>
                    <div className="text-xs text-slate-400 truncate">
                      {inq.email} · {formatSubmitted(inq.created_date || inq.created_at)}
                    </div>
                  </div>
                  {inq.interested_program && (
                    <span className="hidden sm:inline text-xs text-slate-500">{inq.interested_program}</span>
                  )}
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[inq.status] || statusColors.new}`}>
                    {inquiryStatusLabel(inq.status)}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div>
                        <div className="text-xs text-slate-400">Submitted</div>
                        <div className="text-slate-700">{formatSubmitted(inq.created_date || inq.created_at)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Student grade</div>
                        <div className="text-slate-700">{inq.student_grade || 'Not provided'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Subject or exam</div>
                        <div className="text-slate-700">{inq.subject_or_exam || 'Not provided'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Interested program</div>
                        <div className="text-slate-700">{inq.interested_program || 'Not specified'}</div>
                      </div>
                    </div>

                    {inq.goals && (
                      <div className="text-sm">
                        <div className="text-xs text-slate-400 mb-1">Goals</div>
                        <p className="text-slate-700 whitespace-pre-line">{inq.goals}</p>
                      </div>
                    )}
                    {inq.message && (
                      <div className="text-sm">
                        <div className="text-xs text-slate-400 mb-1">Message</div>
                        <p className="text-slate-700 whitespace-pre-line">{inq.message}</p>
                      </div>
                    )}

                    {editing === inq.id ? (
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="text-xs font-semibold text-indigo-700">Status</label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          >
                            {STATUSES.map((s) => <option key={s} value={s}>{inquiryStatusLabel(s)}</option>)}
                          </select>
                        </div>
                        <textarea
                          value={editForm.manager_notes}
                          onChange={(e) => setEditForm((f) => ({ ...f, manager_notes: e.target.value }))}
                          placeholder="Internal notes about this lead"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={save}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                          >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
                          </button>
                          <button onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        {inq.manager_notes ? (
                          <p className="flex-1 text-sm text-slate-600 whitespace-pre-line">
                            <span className="text-xs text-slate-400 block mb-1">Notes</span>
                            {inq.manager_notes}
                          </p>
                        ) : (
                          <p className="flex-1 text-xs text-slate-400">No notes yet.</p>
                        )}
                        <button
                          onClick={() => startEdit(inq)}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                        >
                          Update status and notes
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
