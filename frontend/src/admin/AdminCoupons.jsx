import { useState } from 'react';
import { Pencil, Plus, Ticket, Trash2 } from 'lucide-react';
import { Badge, Button, EmptyState, ErrorState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { inr, shortDate } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const EMPTY = { code: '', description: '', type: 'percent', value: '', maxDiscount: '', minOrder: 0, usageLimit: '', expiresAt: '', isActive: true, featured: false };

function CouponForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(() =>
    initial
      ? { ...EMPTY, ...initial, maxDiscount: initial.maxDiscount ?? '', usageLimit: initial.usageLimit ?? '', expiresAt: initial.expiresAt ? initial.expiresAt.slice(0, 10) : '' }
      : EMPTY
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        description: form.description,
        type: form.type,
        value: Number(form.value),
        maxDiscount: form.type === 'percent' && form.maxDiscount !== '' ? Number(form.maxDiscount) : null,
        minOrder: Number(form.minOrder) || 0,
        usageLimit: form.usageLimit !== '' ? Number(form.usageLimit) : null,
        expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
        isActive: form.isActive,
        featured: form.featured,
      };
      const res = initial
        ? await api(`/admin/coupons/${initial._id}`, { method: 'PUT', body })
        : await api('/admin/coupons', { method: 'POST', body });
      onSaved(res.coupon);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Code" hint="Letters and numbers, 3–20 characters">
          <input className="input font-mono uppercase" value={form.code} onChange={set('code')} required maxLength={20} name="couponCode" />
        </Field>
        <Field label="Type">
          <select className="input" value={form.type} onChange={set('type')}>
            <option value="percent">Percentage off</option>
            <option value="flat">Flat ₹ off</option>
          </select>
        </Field>
        <Field label={form.type === 'percent' ? 'Percent off' : 'Amount off (₹)'}>
          <input className="input" type="number" min={1} max={form.type === 'percent' ? 90 : undefined} value={form.value} onChange={set('value')} required name="couponValue" />
        </Field>
        {form.type === 'percent' && (
          <Field label="Max discount (₹, optional)">
            <input className="input" type="number" min={1} value={form.maxDiscount} onChange={set('maxDiscount')} />
          </Field>
        )}
        <Field label="Minimum order (₹)">
          <input className="input" type="number" min={0} value={form.minOrder} onChange={set('minOrder')} />
        </Field>
        <Field label="Usage limit (optional)">
          <input className="input" type="number" min={1} value={form.usageLimit} onChange={set('usageLimit')} />
        </Field>
        <Field label="Expires on (optional)">
          <input className="input" type="date" value={form.expiresAt} onChange={set('expiresAt')} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <input className="input" value={form.description} onChange={set('description')} maxLength={140} placeholder="e.g. 15% off on orders above ₹500" name="couponDescription" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.isActive} onChange={set('isActive')} /> Active</label>
        <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.featured} onChange={set('featured')} /> Show on home page</label>
      </div>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>{initial ? 'Save coupon' : 'Create coupon'}</Button>
      </div>
    </form>
  );
}

export default function AdminCoupons() {
  const { toast, reloadMeta } = useApp();
  const { data, loading, error, reload, setData } = useAsync(() => api('/admin/coupons'), []);
  const [editing, setEditing] = useState(null);

  const saved = (coupon) => {
    setData((d) => {
      const exists = d.items.some((c) => c._id === coupon._id);
      return { ...d, items: exists ? d.items.map((c) => (c._id === coupon._id ? coupon : c)) : [coupon, ...d.items] };
    });
    setEditing(null);
    reloadMeta();
    toast(`Coupon ${coupon.code} saved`);
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try {
      await api(`/admin/coupons/${c._id}`, { method: 'DELETE' });
      setData((d) => ({ ...d, items: d.items.filter((x) => x._id !== c._id) }));
      reloadMeta();
      toast('Coupon deleted');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <>
      <PageHeader title="Coupons" subtitle="Discount codes patients can use at checkout" actions={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> New coupon</Button>} />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <Spinner />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Ticket} title="No coupons yet" action={<Button onClick={() => setEditing('new')}>Create a coupon</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((c) => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            return (
              <div key={c._id} className="card relative overflow-hidden p-5">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand-50" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg font-extrabold tracking-wider text-brand-700">{c.code}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">{c.description || '—'}</p>
                  </div>
                  <p className="text-2xl font-extrabold text-ink">{c.type === 'percent' ? `${c.value}%` : inr(c.value)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {!c.isActive ? <Badge tone="slate">Inactive</Badge> : expired ? <Badge tone="red">Expired</Badge> : <Badge tone="green">Active</Badge>}
                  {c.featured && <Badge tone="coral">On home page</Badge>}
                  {c.minOrder > 0 && <Badge>Min {inr(c.minOrder)}</Badge>}
                  {c.maxDiscount && <Badge>Max {inr(c.maxDiscount)}</Badge>}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-200 pt-3 text-xs text-ink-muted">
                  <span>
                    Used {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''} times{c.expiresAt ? ` · till ${shortDate(c.expiresAt)}` : ''}
                  </span>
                  <span>
                    <button onClick={() => setEditing(c)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label={`Edit ${c.code}`}><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(c)} className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${c.code}`}><Trash2 className="h-4 w-4" /></button>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'New coupon' : 'Edit coupon'} size="lg">
        {editing && <CouponForm initial={editing === 'new' ? null : editing} onSaved={saved} onCancel={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
