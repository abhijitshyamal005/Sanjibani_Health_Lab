import { useState } from 'react';
import { Pencil, Phone, Plus, UserRound, Users } from 'lucide-react';
import { Badge, Button, EmptyState, ErrorState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { initials, inr } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { usePartner } from './PartnerApp';

function CollectorForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState({ name: initial?.name || '', email: initial?.email || '', phone: initial?.phone || '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(form.phone)) return setError('Enter a valid 10-digit mobile number');
    setSaving(true);
    try {
      const body = initial ? { name: form.name, phone: form.phone, ...(form.password ? { password: form.password } : {}) } : form;
      const res = initial
        ? await api(`/partner/collectors/${initial._id}`, { method: 'PATCH', body })
        : await api('/partner/collectors', { method: 'POST', body });
      onSaved(res.collector);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name"><input className="input" value={form.name} onChange={set('name')} required name="collectorName" /></Field>
        <Field label="Mobile number"><input className="input" inputMode="numeric" maxLength={10} value={form.phone} onChange={set('phone')} required name="collectorPhone" /></Field>
        <Field label="Login email" className="sm:col-span-2">
          <input className="input" type="email" value={form.email} onChange={set('email')} required disabled={!!initial} name="collectorEmail" />
        </Field>
        <Field label={initial ? 'New password (optional)' : 'Password'} hint="At least 6 characters — share it with the collector" className="sm:col-span-2">
          <input className="input" type="text" minLength={6} value={form.password} onChange={set('password')} required={!initial} name="collectorPassword" autoComplete="new-password" />
        </Field>
      </div>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving} data-testid="save-collector">{initial ? 'Save' : 'Add collector'}</Button>
      </div>
    </form>
  );
}

export default function PartnerCollectors() {
  const { lab } = usePartner();
  const { toast } = useApp();
  const { data, loading, error, reload, setData } = useAsync(() => api('/partner/collectors'), []);
  const [editing, setEditing] = useState(null);

  const saved = (c) => {
    setData((d) => {
      const exists = d.items.some((x) => x._id === c._id);
      return { ...d, items: exists ? d.items.map((x) => (x._id === c._id ? { ...x, ...c } : x)) : [{ activeJobs: 0, completedJobs: 0, monthEarnings: 0, ...c }, ...d.items] };
    });
    setEditing(null);
    toast(`${c.name} saved`);
  };

  const toggle = async (c) => {
    try {
      const res = await api(`/partner/collectors/${c._id}`, { method: 'PATCH', body: { isActive: !c.isActive } });
      saved({ ...c, ...res.collector });
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const items = data?.items || [];
  const payroll = items.reduce((s, c) => s + (c.monthEarnings || 0), 0);

  return (
    <>
      <PageHeader
        title="Sample collectors"
        subtitle={`Pay rate: ${inr(lab.collectorPayoutHome ?? 60)} per home collection · ${inr(lab.collectorPayoutAssisted ?? 120)} per assisted visit (change in Lab profile)`}
        actions={<Button onClick={() => setEditing('new')} data-testid="add-collector"><Plus className="h-4 w-4" /> Add collector</Button>}
      />
      {items.length > 0 && (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="card p-4"><p className="text-sm text-ink-muted">Active collectors</p><p className="text-2xl font-extrabold">{items.filter((c) => c.isActive).length}</p></div>
          <div className="card p-4"><p className="text-sm text-ink-muted">Jobs in progress</p><p className="text-2xl font-extrabold">{items.reduce((s, c) => s + (c.activeJobs || 0), 0)}</p></div>
          <div className="card p-4"><p className="text-sm text-ink-muted">Payout due this month</p><p className="text-2xl font-extrabold text-brand-600">{inr(payroll)}</p></div>
        </div>
      )}
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No collectors yet"
          text="Add your sample collectors (phlebotomists) so you can assign home collections and assisted visits to them. They log in with the email and password you set."
          action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Add your first collector</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <div key={c._id} className={`card p-5 ${c.isActive ? '' : 'opacity-60'}`} data-testid="collector-card">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 font-bold text-brand-700">{initials(c.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{c.name}</p>
                  <p className="truncate text-xs text-ink-muted">{c.email}</p>
                  <a href={`tel:${c.phone}`} className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-brand-700"><Phone className="h-3.5 w-3.5" /> {c.phone}</a>
                </div>
                {c.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Inactive</Badge>}
              </div>
              <div className="mt-4 grid grid-cols-3 rounded-xl bg-slate-50 py-2 text-center text-sm">
                <div><p className="font-bold">{c.activeJobs || 0}</p><p className="text-xs text-ink-muted">Assigned</p></div>
                <div><p className="font-bold">{c.completedJobs || 0}</p><p className="text-xs text-ink-muted">Collected</p></div>
                <div><p className="font-bold text-brand-700">{inr(c.monthEarnings || 0)}</p><p className="text-xs text-ink-muted">This month</p></div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => toggle(c)}>{c.isActive ? 'Deactivate' : 'Activate'}</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /> Edit</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add sample collector' : 'Edit collector'} size="lg">
        {editing && (
          <>
            {editing === 'new' && (
              <p className="mb-4 flex gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-sm text-sky-800">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0" /> The collector logs in at the same website and only sees jobs you assign — no test prices.
              </p>
            )}
            <CollectorForm initial={editing === 'new' ? null : editing} onSaved={saved} onCancel={() => setEditing(null)} />
          </>
        )}
      </Modal>
    </>
  );
}
