import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Copy, Check, Ban } from 'lucide-react';
import { invitationsApi } from '@/api/invitationsApi';
import { studentsApi } from '@/api/studentsApi';
import { tutorsApi } from '@/api/tutorsApi';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  revoked: 'bg-slate-100 text-slate-600 border-slate-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
};

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// No email provider is connected, so the manager copies the link and passes it
// on however they normally reach the family or tutor.
export default function InvitationManager() {
  const [invitations, setInvitations] = useState([]);
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ profile_type: 'student', profile_id: '', expires_in_days: 14 });
  const [issued, setIssued] = useState(null);
  const [copied, setCopied] = useState(false);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const load = async () => {
    setLoading(true);
    try {
      const [inv, st, tu] = await Promise.all([
        invitationsApi.list(), studentsApi.list(), tutorsApi.list(),
      ]);
      setInvitations(inv);
      setStudents(st.filter((s) => !s.user_id));
      setTutors(tu.filter((t) => !t.user_id && !t.can_access_manager_dashboard && !t.is_super_admin));
    } catch (err) {
      flash(err?.message || 'Invitations could not be loaded.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.profile_id) { flash('Choose a profile to invite.'); return; }
    setSaving(true);
    try {
      const result = await invitationsApi.create({
        profile_type: form.profile_type,
        profile_id: form.profile_id,
        expires_in_days: Number(form.expires_in_days) || 14,
      });
      // The only moment the raw token is available; it is never stored or listed.
      setIssued({
        url: `${window.location.origin}${result.invite_path}`,
        expires_at: result.expires_at,
      });
      setCreating(false);
      setForm({ profile_type: 'student', profile_id: '', expires_in_days: 14 });
      load();
    } catch (err) {
      flash(err?.message || 'That invitation could not be created.');
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id) => {
    try {
      await invitationsApi.revoke(id);
      flash('Invitation revoked.');
      load();
    } catch (err) {
      flash(err?.message || 'That invitation could not be revoked.');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(issued.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      flash('Copy failed. Select the link and copy it manually.');
    }
  };

  const profileOptions = form.profile_type === 'student' ? students : tutors;
  const inputCls = 'rounded-xl border border-slate-200 px-3 py-2 text-sm';

  return (
    <div className="space-y-4">
      {msg && <div className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</div>}

      {issued && (
        <div className="rounded-2xl border border-brand-blue/25 bg-brand-blue/10 p-5 space-y-3">
          <div className="text-sm font-semibold text-brand-blue-deep">Invitation link created</div>
          <p className="text-xs text-brand-blue">
            This link is shown once. Copy it now and pass it to the person directly. It expires on {formatDate(issued.expires_at)} and works a single time.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 min-w-0 truncate rounded-xl bg-white border border-brand-blue/25 px-3 py-2 text-xs text-slate-700">
              {issued.url}
            </code>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-deep"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={() => setIssued(null)}
              className="rounded-xl border border-brand-blue/25 bg-white px-4 py-2 text-sm text-brand-blue-deep"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <p className="text-sm text-slate-500">
          Invite a family or tutor to create an account already linked to their profile.
        </p>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-deep"
        >
          <Plus className="h-4 w-4" /> New Invitation
        </button>
      </div>

      {creating && (
        <div className="rounded-2xl border border-brand-blue/15 bg-brand-blue/10 p-5 space-y-3">
          <div className="text-sm font-semibold text-brand-blue-deep">New Invitation</div>
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={form.profile_type}
              onChange={(e) => setForm((f) => ({ ...f, profile_type: e.target.value, profile_id: '' }))}
              className={inputCls}
            >
              <option value="student">Student / Parent</option>
              <option value="tutor">Tutor</option>
            </select>
            <select
              value={form.profile_id}
              onChange={(e) => setForm((f) => ({ ...f, profile_id: e.target.value }))}
              className={inputCls}
            >
              <option value="">Select a profile...</option>
              {profileOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email} ({p.email})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={90}
              value={form.expires_in_days}
              onChange={(e) => setForm((f) => ({ ...f, expires_in_days: Number(e.target.value) }))}
              className={inputCls}
              placeholder="Expires in days"
            />
          </div>
          <p className="text-xs text-brand-blue">
            Manager and super admin profiles cannot be invited. A super admin links those accounts directly.
          </p>
          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-deep disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create link
            </button>
            <button onClick={() => setCreating(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : invitations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-400">
          No invitations yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">For</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700">{inv.email || 'Not specified'}</td>
                  <td className="px-4 py-3 text-slate-500">{inv.profile_type === 'student' ? 'Student / Parent' : 'Tutor'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(inv.expires_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[inv.status]}`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inv.status === 'pending' && (
                      <button
                        onClick={() => revoke(inv.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        <Ban className="h-3.5 w-3.5" /> Revoke
                      </button>
                    )}
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
