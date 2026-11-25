import { useMemo, useState } from 'react';
import { FlaskConical, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Badge, Button, EmptyState, ErrorState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { CATEGORIES, SAMPLE_TYPES } from '../lib/categories';
import { inr } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const EMPTY = {
  name: '',
  category: 'Blood Tests',
  type: 'test',
  description: '',
  parameters: '',
  sampleType: 'Blood',
  preparation: 'No special preparation',
  reportTime: '24 hours',
  mrp: '',
  price: '',
  homeCollection: true,
  isPopular: false,
  isActive: true,
};

function TestForm({ initial, onSaved, onCancel }) {
  const { toast } = useApp();
  const [form, setForm] = useState(() => (initial ? { ...EMPTY, ...initial, parameters: (initial.parameters || []).join(', ') } : EMPTY));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const discount = form.mrp && form.price ? Math.round(((form.mrp - form.price) / form.mrp) * 100) : 0;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (Number(form.price) > Number(form.mrp)) return setError('Offer price cannot be higher than MRP');
    setSaving(true);
    try {
      const body = {
        ...form,
        mrp: Number(form.mrp),
        price: Number(form.price),
        parameters: form.parameters.split(',').map((p) => p.trim()).filter(Boolean),
      };
      const res = initial
        ? await api(`/partner/tests/${initial._id}`, { method: 'PUT', body })
        : await api('/partner/tests', { method: 'POST', body });
      toast(initial ? 'Test updated' : 'Test added');
      onSaved(res.test);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" id="test-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Test / package name" className="sm:col-span-2">
          <input className="input" value={form.name} onChange={set('name')} required name="testName" placeholder="e.g. Lipid Profile" />
        </Field>
        <Field label="Category">
          <select className="input" value={form.category} onChange={set('category')} name="category">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Type">
          <select className="input" value={form.type} onChange={set('type')}>
            <option value="test">Single test</option>
            <option value="package">Package (multiple tests)</option>
          </select>
        </Field>
        <Field label="MRP (₹)">
          <input className="input" type="number" min={1} value={form.mrp} onChange={set('mrp')} required name="mrp" />
        </Field>
        <Field label="Your price (₹)" hint={discount > 0 ? `${discount}% off MRP` : 'Price patients pay'}>
          <input className="input" type="number" min={1} value={form.price} onChange={set('price')} required name="price" />
        </Field>
        <Field label="Sample type">
          <select className="input" value={form.sampleType} onChange={set('sampleType')}>
            {SAMPLE_TYPES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Report time">
          <input className="input" value={form.reportTime} onChange={set('reportTime')} />
        </Field>
        <Field label="Preparation" className="sm:col-span-2">
          <input className="input" value={form.preparation} onChange={set('preparation')} />
        </Field>
        <Field label="Parameters included" hint="Comma separated, e.g. HDL, LDL, Triglycerides" className="sm:col-span-2">
          <textarea className="input" rows={2} value={form.parameters} onChange={set('parameters')} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea className="input" rows={2} value={form.description} onChange={set('description')} maxLength={1000} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        {[
          ['homeCollection', 'Available for home collection'],
          ['isPopular', 'Mark as bestseller'],
          ['isActive', 'Visible to patients'],
        ].map(([k, label]) => (
          <label key={k} className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form[k]} onChange={set(k)} /> {label}
          </label>
        ))}
      </div>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving} data-testid="save-test">{initial ? 'Save test' : 'Add test'}</Button>
      </div>
    </form>
  );
}

export default function PartnerTests() {
  const { toast } = useApp();
  const { data, loading, error, reload, setData } = useAsync(() => api('/partner/tests'), []);
  const [editing, setEditing] = useState(null); // null | 'new' | test
  const [deleting, setDeleting] = useState(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const items = useMemo(() => data?.items || [], [data]);
  const filtered = items.filter((t) => (!category || t.category === category) && (!q || t.name.toLowerCase().includes(q.toLowerCase())));

  const upsert = (test) => {
    setData((d) => {
      const exists = d.items.some((t) => t._id === test._id);
      return { ...d, items: exists ? d.items.map((t) => (t._id === test._id ? test : t)) : [test, ...d.items] };
    });
    setEditing(null);
  };

  const toggleActive = async (t) => {
    try {
      const res = await api(`/partner/tests/${t._id}`, { method: 'PUT', body: { isActive: !t.isActive } });
      upsert(res.test);
      toast(res.test.isActive ? `${t.name} is visible` : `${t.name} hidden from patients`);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const remove = async () => {
    try {
      await api(`/partner/tests/${deleting._id}`, { method: 'DELETE' });
      setData((d) => ({ ...d, items: d.items.filter((t) => t._id !== deleting._id) }));
      toast('Test deleted');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Tests & prices"
        subtitle={`${items.filter((t) => t.isActive).length} visible · ${items.length} total`}
        actions={<Button onClick={() => setEditing('new')} data-testid="add-test"><Plus className="h-4 w-4" /> Add test</Button>}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-10" placeholder="Search your tests" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tests" />
        </div>
        <select className="input sm:w-56" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState icon={FlaskConical} title="No tests yet" text="Add the tests and packages your lab offers, with your prices." action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Add your first test</Button>} />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Test</th>
                  <th className="px-3 py-3 font-semibold">Category</th>
                  <th className="px-3 py-3 text-right font-semibold">MRP</th>
                  <th className="px-3 py-3 text-right font-semibold">Price</th>
                  <th className="px-3 py-3 font-semibold">Visible</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr key={t._id} className={t.isActive ? '' : 'bg-slate-50/70 text-ink-muted'} data-testid="partner-test-row">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-ink">{t.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {t.type === 'package' && <Badge tone="violet">Package</Badge>}
                        {t.isPopular && <Badge tone="coral">Bestseller</Badge>}
                        {!t.homeCollection && <Badge>Lab only</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-3">{t.category}</td>
                    <td className="px-3 py-3 text-right text-ink-muted line-through">{inr(t.mrp)}</td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-bold text-ink">{inr(t.price)}</span>
                      {t.discount > 0 && <span className="block text-xs text-brand-600">{t.discount}% off</span>}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        role="switch"
                        aria-checked={t.isActive}
                        aria-label={`Toggle ${t.name} visibility`}
                        onClick={() => toggleActive(t)}
                        className={`relative h-6 w-11 rounded-full transition ${t.isActive ? 'bg-brand-600' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${t.isActive ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <button onClick={() => setEditing(t)} className="rounded-lg p-2 text-ink-muted hover:bg-slate-100 hover:text-ink" aria-label={`Edit ${t.name}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleting(t)} className="rounded-lg p-2 text-ink-muted hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${t.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="p-8 text-center text-sm text-ink-muted">No tests match your search.</p>}
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add a test' : 'Edit test'} size="lg">
        {editing && <TestForm initial={editing === 'new' ? null : editing} onSaved={upsert} onCancel={() => setEditing(null)} />}
      </Modal>
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete test?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>Keep</Button>
            <Button variant="accent" onClick={remove}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          <b>{deleting?.name}</b> will be removed from your catalogue. Past bookings keep their details. Tip: you can hide a test instead of deleting it.
        </p>
      </Modal>
    </>
  );
}
