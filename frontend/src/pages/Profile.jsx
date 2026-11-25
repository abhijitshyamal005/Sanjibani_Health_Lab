import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ClipboardList, FileText, IndianRupee, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { Button, Field, Modal, StatCard } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { initials, inr, shortDate } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { RELATIONS, ageFrom } from '../lib/family';

const EMPTY_MEMBER = { name: '', relation: '', gender: '', dateOfBirth: '', phone: '' };

/** People the patient books tests for — picked with one tap at checkout. */
function FamilyMembers() {
  const { user, setUser } = useAuth();
  const { toast } = useApp();
  const members = user.familyMembers || [];
  const [editing, setEditing] = useState(null); // null | 'new' | member id
  const [form, setForm] = useState(EMPTY_MEMBER);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState('');

  useEffect(() => {
    if (window.location.hash === '#family') document.getElementById('family')?.scrollIntoView({ block: 'start' });
  }, []);

  const open = (m) => {
    setEditing(m ? m._id : 'new');
    setForm(m ? { ...EMPTY_MEMBER, ...m, phone: m.phone || '' } : EMPTY_MEMBER);
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { name: form.name, relation: form.relation, gender: form.gender, dateOfBirth: form.dateOfBirth, phone: form.phone };
      const res = editing === 'new'
        ? await api('/auth/me/family', { method: 'POST', body })
        : await api(`/auth/me/family/${editing}`, { method: 'PUT', body });
      setUser(res.user);
      setEditing(null);
      toast(editing === 'new' ? `${form.name} added to your family` : 'Family member updated');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.name} from your family members?`)) return;
    setRemoving(m._id);
    try {
      const res = await api(`/auth/me/family/${m._id}`, { method: 'DELETE' });
      setUser(res.user);
      toast(`${m.name} removed`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setRemoving('');
    }
  };

  return (
    <section id="family" className="card mt-6 scroll-mt-24 p-5" data-testid="family-section">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-bold"><Users className="h-5 w-5 text-brand-700" /> Family members</h2>
          <p className="mt-0.5 text-sm text-ink-muted">Save the people you book tests for and pick them with one tap at checkout.</p>
        </div>
        {members.length < 8 && (
          <Button size="sm" variant="outline" onClick={() => open(null)} data-testid="add-family">
            <UserPlus className="h-4 w-4" /> Add member
          </Button>
        )}
      </div>
      {members.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-ink-muted">No family members yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <li key={m._id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3" data-testid="family-member">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">{initials(m.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.name}</p>
                <p className="text-xs text-ink-muted">{RELATIONS[m.relation]} · {ageFrom(m.dateOfBirth)} yrs · {m.gender}{m.phone ? ` · ${m.phone}` : ''}</p>
              </div>
              <button onClick={() => open(m)} className="rounded-lg p-2 text-ink-muted hover:bg-slate-100 hover:text-ink" aria-label={`Edit ${m.name}`}><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(m)} disabled={removing === m._id} className="rounded-lg p-2 text-ink-muted hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${m.name}`}><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add family member' : 'Edit family member'}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" form="family-form" loading={saving} data-testid="save-family">Save</Button>
          </>
        }
      >
        <form id="family-form" className="grid gap-4 sm:grid-cols-2" onSubmit={save}>
          <Field label="Full name" className="sm:col-span-2"><input className="input" name="familyName" value={form.name} onChange={set('name')} maxLength={80} required /></Field>
          <Field label="Relation">
            <select className="input" name="familyRelation" value={form.relation} onChange={set('relation')} required>
              <option value="">Select</option>
              {Object.entries(RELATIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Gender">
            <select className="input" name="familyGender" value={form.gender} onChange={set('gender')} required>
              <option value="">Select</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Date of birth"><input className="input" type="date" name="familyDob" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChange={set('dateOfBirth')} required /></Field>
          <Field label="Mobile (optional)" hint="Leave empty to use yours"><input className="input" name="familyPhone" inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" value={form.phone} onChange={set('phone')} /></Field>
        </form>
      </Modal>
    </section>
  );
}

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

      <FamilyMembers />

      <div className="mt-6 grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_340px]">
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
