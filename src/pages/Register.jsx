import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, GraduationCap, BookOpen, ArrowRight, ShieldX } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { invitationsApi } from '@/api/invitationsApi';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';

// Registration through a manager's invitation link. The token proves a manager
// intended this person to hold this profile, so the account is linked as soon
// as it is created rather than waiting for a manual link.
export default function Register() {
  const [params] = useSearchParams();
  const token = params.get('invite') || '';
  const navigate = useNavigate();
  const { register } = useAuth();

  const [checking, setChecking] = useState(Boolean(token));
  const [invite, setInvite] = useState(null);
  const [inviteError, setInviteError] = useState('');

  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const preview = await invitationsApi.preview(token);
        setInvite(preview);
        setForm((f) => ({
          ...f,
          email: preview.email || '',
          full_name: preview.full_name || '',
        }));
      } catch (err) {
        setInviteError(err?.message || 'This invitation link is not valid.');
      } finally {
        setChecking(false);
      }
    })();
  }, [token]);

  const isStudent = invite ? invite.intended_role === 'student_parent' : true;
  const accent = isStudent ? 'rgb(98,191,161)' : 'rgb(58,154,202)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        account_type: isStudent ? 'student' : 'tutor',
        invite: token || undefined,
      });
      navigate(isStudent ? '/student-dashboard' : '/tutor-dashboard');
    } catch (err) {
      setError(err?.message || 'Your account could not be created.');
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:ring-2';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
          {checking ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : inviteError ? (
            <div className="text-center space-y-4">
              <ShieldX className="mx-auto h-12 w-12 text-slate-300" />
              <h1 className="text-xl font-bold text-slate-900">Invitation not valid</h1>
              <p className="text-sm text-slate-500">{inviteError}</p>
              <p className="text-xs text-slate-400">
                Ask the Open Minds Studios team for a new link, or sign in from the home page if you already have an account.
              </p>
              <Link to="/Home" className="inline-block rounded-2xl border border-slate-200 px-6 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                Back to home
              </Link>
            </div>
          ) : (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: accent }}>
                {isStudent ? <GraduationCap className="h-7 w-7 text-white" /> : <BookOpen className="h-7 w-7 text-white" />}
              </div>

              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  {invite
                    ? `You have been invited as ${isStudent ? 'a student or parent' : 'a tutor'}. Your account will be connected to your profile automatically.`
                    : 'Create an account to access the Open Minds Studios portal.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Full name"
                  className={inputCls}
                  autoComplete="name"
                />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Email address"
                  className={inputCls}
                  autoComplete="email"
                  readOnly={Boolean(invite?.email)}
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Password (at least 8 characters)"
                  className={inputCls}
                  autoComplete="new-password"
                />

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow transition-all duration-200 disabled:opacity-60"
                  style={{ backgroundColor: accent }}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-400">
                Already have an account? Sign in from the <Link to="/Home" className="underline">home page</Link>.
              </p>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
