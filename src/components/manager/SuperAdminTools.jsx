import React, { useEffect, useState } from 'react';
import { Loader2, ShieldAlert, Trash2, Search } from 'lucide-react';
import { bookingsApi, bookingStatusLabel } from '@/api/bookingsApi';
import { maintenanceApi } from '@/api/maintenanceApi';

const STATUSES = ['pending', 'confirmed', 'declined', 'cancelled', 'completed'];

const formatBytes = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Tools that step outside the normal workflow. Reachable only by super admins,
// and every use is written to the audit table.
export default function SuperAdminTools() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [search, setSearch] = useState('');
  const [targetId, setTargetId] = useState('');
  const [overrideForm, setOverrideForm] = useState({ status: 'confirmed', reason: '' });
  const [overriding, setOverriding] = useState(false);

  const [orphans, setOrphans] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const load = async () => {
    setLoading(true);
    try {
      setBookings(await bookingsApi.list());
    } catch (err) {
      flash(err?.message || 'Bookings could not be loaded.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const runOverride = async () => {
    if (!targetId) { flash('Choose an appointment first.'); return; }
    if (overrideForm.reason.trim().length < 10) {
      flash('Give a reason of at least 10 characters. It is stored in the audit log.');
      return;
    }
    setOverriding(true);
    try {
      await bookingsApi.overrideStatus(targetId, overrideForm.status, overrideForm.reason.trim());
      flash('Override applied and recorded in the audit log.');
      setTargetId('');
      setOverrideForm({ status: 'confirmed', reason: '' });
      load();
    } catch (err) {
      flash(err?.message || 'That override could not be applied.');
    } finally {
      setOverriding(false);
    }
  };

  const scanOrphans = async () => {
    setScanning(true);
    setConfirmCleanup(false);
    try {
      setOrphans(await maintenanceApi.previewOrphanFiles(0));
    } catch (err) {
      flash(err?.message || 'The scan could not be completed.');
    } finally {
      setScanning(false);
    }
  };

  const runCleanup = async () => {
    setCleaning(true);
    try {
      const result = await maintenanceApi.cleanupOrphanFiles(0);
      flash(`Removed ${result.recordsRemoved} file record(s) and ${result.blobsRemoved} file(s) from disk.`);
      setConfirmCleanup(false);
      setOrphans(null);
    } catch (err) {
      flash(err?.message || 'The cleanup could not be completed.');
    } finally {
      setCleaning(false);
    }
  };

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const haystack = `${b.student_first_name} ${b.student_last_name} ${b.student_email} ${b.session_date}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const inputCls = 'rounded-xl border border-slate-200 px-3 py-2 text-sm';

  return (
    <div className="space-y-6">
      {msg && <div className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</div>}

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
        <div className="text-sm text-amber-800">
          <div className="font-semibold">These tools bypass the normal workflow</div>
          <p className="mt-0.5 text-xs text-amber-700">
            Use them only when the standard screens cannot resolve a situation. Every action is recorded with your name and the reason you give.
          </p>
        </div>
      </div>

      {/* Booking status override */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Force an appointment status</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Sets a status the normal lifecycle forbids, for example reopening a session marked completed by mistake.
          </p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find an appointment..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-300"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className={inputCls}>
              <option value="">Select an appointment...</option>
              {filtered.slice(0, 100).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.session_date} {b.preferred_start_time} · {b.student_first_name} {b.student_last_name} · {bookingStatusLabel(b.status)}
                </option>
              ))}
            </select>
            <select
              value={overrideForm.status}
              onChange={(e) => setOverrideForm((f) => ({ ...f, status: e.target.value }))}
              className={inputCls}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{bookingStatusLabel(s)}</option>)}
            </select>
          </div>
        )}

        <textarea
          value={overrideForm.reason}
          onChange={(e) => setOverrideForm((f) => ({ ...f, reason: e.target.value }))}
          placeholder="Why is this override needed? Stored in the audit log."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[70px]"
        />
        <button
          onClick={runOverride}
          disabled={overriding}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {overriding && <Loader2 className="h-4 w-4 animate-spin" />}
          {overriding ? 'Applying...' : 'Apply override'}
        </button>
      </div>

      {/* Orphan file cleanup */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Unreferenced uploads</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Files uploaded but never attached to a module. Anything a module references is never listed and never removed.
          </p>
        </div>

        <button
          onClick={scanOrphans}
          disabled={scanning}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          {scanning ? 'Scanning...' : 'Scan for unreferenced files'}
        </button>

        {orphans && (
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <strong>{orphans.count}</strong> unreferenced file{orphans.count === 1 ? '' : 's'}, {formatBytes(orphans.total_bytes)} total
            </div>

            {orphans.count > 0 && (
              <>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-2">File</th>
                        <th className="px-4 py-2">Size</th>
                        <th className="px-4 py-2">Uploaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orphans.files.map((f) => (
                        <tr key={f.id} className="border-t border-slate-100">
                          <td className="px-4 py-2 text-slate-700">{f.original_name}</td>
                          <td className="px-4 py-2 text-slate-500">{formatBytes(f.size_bytes)}</td>
                          <td className="px-4 py-2 text-slate-500">
                            {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!confirmCleanup ? (
                  <button
                    onClick={() => setConfirmCleanup(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" /> Delete these files
                  </button>
                ) : (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-red-700">
                      Permanently delete {orphans.count} file{orphans.count === 1 ? '' : 's'} ({formatBytes(orphans.total_bytes)})?
                    </p>
                    <p className="text-xs text-red-500">This cannot be undone. Files attached to a module are not affected.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={runCleanup}
                        disabled={cleaning}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                      >
                        {cleaning && <Loader2 className="h-4 w-4 animate-spin" />}
                        {cleaning ? 'Deleting...' : 'Yes, delete'}
                      </button>
                      <button
                        onClick={() => setConfirmCleanup(false)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
                      >
                        Keep files
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
