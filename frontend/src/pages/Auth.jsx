import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Store, UserRound } from 'lucide-react';
import { Logo } from '../components/Brand';
import authPhoto from '../assets/photos/lab-scientist.jpg';
import { Button, Field } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAuth, homeFor } from '../context/AuthContext';

// Demo logins only exist in local/dev data — never show them on the live site.
const SHOW_DEMO = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO === 'true';

export function AuthShell({ title, subtitle, children }) {
  const { meta } = useApp();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 p-12 text-white lg:flex lg:flex-col">
        <img src={authPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-forest-from/80 to-forest-to/30" />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative my-auto max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">Healthcare is better when prices are clear.</h2>
          <p className="mt-4 text-white/70">
            Patients compare and book tests from verified labs. Labs reach new patients and run bookings from one dashboard.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              [meta?.stats.labs ?? '—', 'verified labs'],
              [meta?.stats.tests ?? '—', 'tests listed'],
              [meta?.stats.cities ?? '—', meta?.stats.cities === 1 ? 'city' : 'cities'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-extrabold">{v}</p>
                <p className="text-xs text-white/70">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-coral-500/30 blur-3xl" />
      </div>
      <div className="flex flex-col justify-center px-4 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight lg:mt-0">{title}</h1>
          <p className="mt-2 text-ink-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input className="input pr-11" type={show ? 'text' : 'password'} {...props} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-muted hover:bg-slate-100" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function redirectTarget(user, next) {
  if (next && next.startsWith('/') && !next.startsWith('//') && (user.role === 'patient' || next.startsWith(homeFor(user)))) return next;
  return homeFor(user);
}

export function Login() {
  const { login, user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const next = params.get('next');

  if (user) return <Navigate to={redirectTarget(user, next)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      navigate(redirectTarget(u, next), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in as a patient, lab partner or admin.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <input className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required name="email" />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required name="password" />
        </Field>
        <div className="-mt-1 text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-700 hover:underline">Forgot password?</Link>
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading}>Log in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-muted">
        New here? <Link to={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-bold text-brand-700">Create an account</Link>
      </p>
      {SHOW_DEMO && (
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-4 text-xs text-ink-muted">
        <p className="font-bold text-ink-soft">Demo accounts</p>
        <ul className="mt-2 space-y-1">
          {[
            ['Patient', 'patient@sanjibani.in', 'Patient@123'],
            ['Lab partner', 'lab1@sanjibani.in', 'Lab@1234'],
            ['Sample collector', 'collector1@sanjibani.in', 'Collector@123'],
            ['Admin', 'admin@sanjibani.in', 'Admin@123'],
          ].map(([role, email, password]) => (
            <li key={role}>
              <button type="button" className="text-left hover:text-brand-700" onClick={() => setForm({ email, password })}>
                <b>{role}:</b> {email} / {password}
              </button>
            </li>
          ))}
        </ul>
      </div>
      )}
    </AuthShell>
  );
}

export function Register() {
  const { register, user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(params.get('role') === 'lab' ? 'lab' : 'patient');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const next = params.get('next');

  if (user) return <Navigate to={redirectTarget(user, next)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(form.phone)) return setError('Enter a valid 10-digit mobile number');
    setLoading(true);
    try {
      const u = await register({ ...form, role });
      navigate(redirectTarget(u, next), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AuthShell
      title={role === 'lab' ? 'Register your lab' : 'Create your account'}
      subtitle={role === 'lab' ? 'Create a partner account, then add your lab details and tests.' : 'Book tests, track reports and save on every visit.'}
    >
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1" role="radiogroup" aria-label="Account type">
        {[
          { v: 'patient', label: 'I’m a patient', icon: UserRound },
          { v: 'lab', label: 'I run a lab', icon: Store },
        ].map(({ v, label, icon: Icon }) => (
          <button key={v} type="button" role="radio" aria-checked={role === v} onClick={() => setRole(v)} className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${role === v ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-muted'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field label={role === 'lab' ? 'Your name (lab owner / manager)' : 'Full name'}>
          <input className="input" value={form.name} onChange={set('name')} required name="name" autoComplete="name" />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={form.email} onChange={set('email')} required name="email" autoComplete="email" />
        </Field>
        <Field label="Mobile number">
          <input className="input" inputMode="numeric" maxLength={10} value={form.phone} onChange={set('phone')} required name="phone" autoComplete="tel" />
        </Field>
        <Field label="Password" hint="At least 6 characters">
          <PasswordInput minLength={6} value={form.password} onChange={set('password')} required name="password" autoComplete="new-password" />
        </Field>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
        <Button type="submit" size="lg" variant={role === 'lab' ? 'accent' : 'primary'} className="w-full" loading={loading}>
          {role === 'lab' ? 'Continue to lab details' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account? <Link to="/login" className="font-bold text-brand-700">Log in</Link>
      </p>
    </AuthShell>
  );
}

export function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-7xl font-extrabold text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-extrabold">This page took a sick day</h1>
      <p className="mt-2 text-ink-muted">The page you’re looking for doesn’t exist.</p>
      <Link to="/" className="mt-6"><Button>Back to home</Button></Link>
    </div>
  );
}
