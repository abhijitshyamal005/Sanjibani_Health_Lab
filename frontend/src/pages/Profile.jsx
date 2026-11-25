import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ClipboardList, FileText, IndianRupee } from 'lucide-react';
import { Button, Field, StatCard } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { initials, inr, shortDate } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { toast } = useApp();
  const bookings = useAsync(() => api('/bookings/me'), []);
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone,
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth || '',
    city: user.city || '',
    address: { line: '', area: '', city: '', pincode: '', ...user.address },
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState('');

  const save = async (body, which) => {
    setSaving(which);
    try {
      const { user: updated } = await api('/auth/me', { method: 'PATCH', body });
      setUser(updated);
      toast(which === 'password' ? 'Password updated' : 'Profile saved');
      if (which === 'password') setPw({ currentPassword: '', newPassword: '' });
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving('');
    }
  };

  const items = bookings.data?.items || [];
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setAddr = (k) => (e) => setForm((f) => ({ ...f, address: { ...f.address, [k]: e.target.value } }));

  return (
    <div className="container-page max-w-5xl py-8">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-xl font-extrabold text-white">{initials(user.name)}</span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{user.name}</h1>
          <p className="text-sm text-ink-muted">{user.email} · Member since {shortDate(user.createdAt)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={ClipboardList} label="Total bookings" value={items.length} />
        <StatCard icon={CalendarClock} tone="amber" label="Active" value={items.filter((b) => ['pending', 'confirmed', 'sample_collected'].includes(b.status)).length} />
        <StatCard icon={IndianRupee} tone="coral" label="Saved vs MRP" value={inr(items.filter((b) => b.status !== 'cancelled').reduce((s, b) => s + b.items.reduce((x, i) => x + (i.mrp - i.price), 0), 0))} />
      </div>

      {items.some((b) => b.status === 'report_ready' || b.status === 'completed') && (
        <div className="card mt-6 p-5">
          <h2 className="font-bold">Recent reports</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {items
              .filter((b) => ['report_ready', 'completed'].includes(b.status))
              .slice(0, 4)
              .map((b) => (
                <li key={b._id}>
                  <Link to={`/bookings/${b._id}`} className="flex items-center gap-3 py-3 text-sm hover:text-brand-700">
                    <FileText className="h-4 w-4 text-brand-600" />
                    <span className="flex-1 truncate">{b.items.map((i) => i.name).join(', ')}</span>
                    <span className="text-ink-muted">{b.lab?.name}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <form
          className="card space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            save(form, 'profile');
          }}
        >
          <h2 className="font-bold">Personal details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><input className="input" value={form.name} onChange={set('name')} required /></Field>
            <Field label="Mobile number"><input className="input" value={form.phone} onChange={set('phone')} maxLength={10} required /></Field>
            <Field label="Gender">
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Date of birth"><input className="input" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} /></Field>
          </div>
          <h3 className="pt-2 font-bold">Default collection address</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="House / street" className="sm:col-span-2"><input className="input" value={form.address.line} onChange={setAddr('line')} /></Field>
            <Field label="Area"><input className="input" value={form.address.area} onChange={setAddr('area')} /></Field>
            <Field label="City"><input className="input" value={form.address.city} onChange={setAddr('city')} /></Field>
            <Field label="Pincode"><input className="input" value={form.address.pincode} onChange={setAddr('pincode')} maxLength={6} /></Field>
          </div>
          <Button type="submit" loading={saving === 'profile'}>Save changes</Button>
        </form>

        <form
          className="card space-y-4 self-start p-5"
          onSubmit={(e) => {
            e.preventDefault();
            save(pw, 'password');
          }}
        >
          <h2 className="font-bold">Change password</h2>
          <Field label="Current password"><input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} required /></Field>
          <Field label="New password" hint="At least 6 characters"><input className="input" type="password" minLength={6} value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} required /></Field>
          <Button type="submit" variant="outline" loading={saving === 'password'}>Update password</Button>
        </form>
      </div>
    </div>
  );
}
