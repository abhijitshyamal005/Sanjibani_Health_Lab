import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { Button, Field } from '../components/ui';
import { useAuth, homeFor } from '../context/AuthContext';
import { api, tokenStore } from '../lib/api';
import { AuthShell, PasswordInput } from './Auth';

export default function ForgotPassword() {
  const { setUser, setLab } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const requestCode = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setInfo(res.message);
      setDevCode(res.devCode || '');
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api('/auth/reset-password', { method: 'POST', body: { email, code: code.trim(), newPassword: password } });
      tokenStore.set(res.token);
      setUser(res.user);
      setLab(res.lab || null);
      navigate(homeFor(res.user), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === 'email' ? 'Reset your password' : 'Enter the code'}
      subtitle={step === 'email' ? 'We’ll email you a 6-digit code to set a new password.' : `We sent a code to ${email}. It expires in 15 minutes.`}
    >
      {step === 'email' ? (
        <form onSubmit={requestCode} className="space-y-4">
          <Field label="Email">
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" name="email" />
          </Field>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={loading}>Send code</Button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-4">
          {info && (
            <p className="flex items-start gap-2 rounded-xl bg-coral-50 px-3 py-2.5 text-sm text-coral-700">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0" /> {info}
            </p>
          )}
          {devCode && (
            <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800" data-testid="dev-code">
              Email is not configured on this server (development mode). Your code is <b className="font-mono text-sm">{devCode}</b>
            </p>
          )}
          <Field label="6-digit code">
            <input className="input font-mono tracking-[.4em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required name="code" autoComplete="one-time-code" />
          </Field>
          <Field label="New password" hint="At least 6 characters">
            <PasswordInput minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required name="newPassword" autoComplete="new-password" />
          </Field>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={loading}>Set new password</Button>
          <button type="button" onClick={requestCode} className="w-full text-center text-sm font-semibold text-brand-700 hover:underline">
            Resend code
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink-muted">
        Remembered it? <Link to="/login" className="font-bold text-brand-700">Back to log in</Link>
      </p>
    </AuthShell>
  );
}
