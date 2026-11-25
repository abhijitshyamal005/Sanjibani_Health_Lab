import { useState } from 'react';
import { Check } from 'lucide-react';
import { LabCover } from '../components/Brand';
import { Button, Field } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { ACCREDITATIONS } from '../lib/categories';

const empty = {
  name: '',
  tagline: '',
  description: '',
  phone: '',
  email: '',
  opensAt: '07:00',
  closesAt: '20:00',
  accreditations: [],
  homeCollection: true,
  homeCollectionFee: 0,
  reportTime: '24 hours',
  assistedVisit: false,
  assistedVisitFee: 149,
  upiId: '',
  upiName: '',
  slotCapacity: 4,
  collectorPayoutHome: 60,
  collectorPayoutAssisted: 120,
  establishedYear: '',
  coverTheme: 0,
  address: { line: '', area: '', city: '', pincode: '' },
};

export default function LabProfileForm({ lab, onSaved }) {
  const { toast, reloadMeta } = useApp();
  const { setLab: setAuthLab } = useAuth();
  const [form, setForm] = useState(() => (lab ? { ...empty, ...lab, address: { ...empty.address, ...lab.address }, establishedYear: lab.establishedYear || '' } : empty));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setAddr = (k) => (e) => setForm((f) => ({ ...f, address: { ...f.address, [k]: e.target.value } }));
  const toggleAcc = (a) =>
    setForm((f) => ({ ...f, accreditations: f.accreditations.includes(a) ? f.accreditations.filter((x) => x !== a) : [...f.accreditations, a] }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {
        ...form,
        homeCollectionFee: Number(form.homeCollectionFee) || 0,
        assistedVisitFee: Number(form.assistedVisitFee) || 0,
        slotCapacity: Number(form.slotCapacity) || 4,
        collectorPayoutHome: Number(form.collectorPayoutHome) || 0,
        collectorPayoutAssisted: Number(form.collectorPayoutAssisted) || 0,
        establishedYear: form.establishedYear ? Number(form.establishedYear) : undefined,
      };
      const res = await api('/partner/lab', { method: lab ? 'PUT' : 'POST', body });
      onSaved(res.lab);
      setAuthLab({ name: res.lab.name, slug: res.lab.slug, status: res.lab.status });
      reloadMeta();
      toast(lab ? 'Lab profile updated' : 'Lab submitted for verification. Now add your tests!');
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {lab?.status === 'rejected' && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          <p className="font-bold">Your lab was not approved</p>
          {lab.statusNote && <p className="mt-1">Reason: {lab.statusNote}</p>}
          <p className="mt-1">Update your details and save — your lab will be sent for review again.</p>
        </div>
      )}

      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Basic details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lab name" className="sm:col-span-2">
            <input className="input" value={form.name} onChange={set('name')} required name="labName" />
          </Field>
          <Field label="Tagline" hint="One line patients see on your card" className="sm:col-span-2">
            <input className="input" value={form.tagline} onChange={set('tagline')} maxLength={120} name="tagline" placeholder="e.g. NABL-accredited lab with same-day reports" />
          </Field>
          <Field label="About your lab" className="sm:col-span-2">
            <textarea className="input" rows={3} value={form.description} onChange={set('description')} maxLength={1500} />
          </Field>
          <Field label="Lab phone">
            <input className="input" value={form.phone} onChange={set('phone')} required name="labPhone" />
          </Field>
          <Field label="Lab email (optional)">
            <input className="input" type="email" value={form.email || ''} onChange={set('email')} />
          </Field>
          <Field label="Established year (optional)">
            <input className="input" type="number" min={1900} max={2100} value={form.establishedYear} onChange={set('establishedYear')} />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Address</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Street address" className="sm:col-span-2">
            <input className="input" value={form.address.line} onChange={setAddr('line')} required name="labAddress" />
          </Field>
          <Field label="Area / locality">
            <input className="input" value={form.address.area} onChange={setAddr('area')} name="labArea" />
          </Field>
          <Field label="City">
            <input className="input" value={form.address.city} onChange={setAddr('city')} required name="labCity" />
          </Field>
          <Field label="Pincode">
            <input className="input" value={form.address.pincode} onChange={setAddr('pincode')} required maxLength={6} pattern="\d{6}" title="6-digit pincode" name="labPincode" />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Services</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Opens at">
            <input className="input" type="time" value={form.opensAt} onChange={set('opensAt')} />
          </Field>
          <Field label="Closes at">
            <input className="input" type="time" value={form.closesAt} onChange={set('closesAt')} />
          </Field>
          <Field label="Typical report time">
            <input className="input" value={form.reportTime} onChange={set('reportTime')} placeholder="e.g. 24 hours" />
          </Field>
          <div>
            <span className="label">Home sample collection</span>
            <label className="flex h-[42px] items-center gap-3">
              <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={form.homeCollection} onChange={set('homeCollection')} />
              <span className="text-sm">We offer home collection</span>
            </label>
          </div>
          {form.homeCollection && (
            <Field label="Home collection fee (₹)" hint="Set 0 for free collection">
              <input className="input" type="number" min={0} max={2000} value={form.homeCollectionFee} onChange={set('homeCollectionFee')} />
            </Field>
          )}
        </div>
        <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div>
            <span className="label">Assisted visit</span>
            <label className="flex h-[42px] items-center gap-3">
              <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={form.assistedVisit} onChange={set('assistedVisit')} name="assistedVisit" />
              <span className="text-sm">Our staff pick patients up, stay with them and drop them home</span>
            </label>
          </div>
          {form.assistedVisit && (
            <Field label="Assisted visit fee (₹)" hint="Charged to the patient">
              <input className="input" type="number" min={0} max={5000} value={form.assistedVisitFee} onChange={set('assistedVisitFee')} name="assistedVisitFee" />
            </Field>
          )}
          <Field label="UPI ID for payments (free)" hint="Patients pay you directly by UPI — e.g. yourlab@okhdfcbank. Leave empty to turn off.">
            <input className="input font-mono" value={form.upiId || ''} onChange={set('upiId')} placeholder="yourlab@okhdfcbank" name="upiId" />
          </Field>
          <Field label="Name shown in UPI apps" hint="Usually your bank account name">
            <input className="input" value={form.upiName || ''} onChange={set('upiName')} placeholder={form.name} name="upiName" />
          </Field>
          <Field label="Bookings per time slot" hint="Max patients per 1-hour slot — separately for home collections and lab visits">
            <input className="input" type="number" min={1} max={50} value={form.slotCapacity} onChange={set('slotCapacity')} name="slotCapacity" />
          </Field>
        </div>
        <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <p className="text-sm text-ink-muted sm:col-span-2">
            <b className="text-ink">Field staff pay</b> — what your collectors earn per job. Shown only to them and you, never to patients.
          </p>
          <Field label="Per home collection (₹)">
            <input className="input" type="number" min={0} max={2000} value={form.collectorPayoutHome} onChange={set('collectorPayoutHome')} name="collectorPayoutHome" />
          </Field>
          <Field label="Per assisted visit (₹)">
            <input className="input" type="number" min={0} max={5000} value={form.collectorPayoutAssisted} onChange={set('collectorPayoutAssisted')} name="collectorPayoutAssisted" />
          </Field>
        </div>
        <div>
          <span className="label">Accreditations</span>
          <div className="flex flex-wrap gap-2">
            {ACCREDITATIONS.map((a) => (
              <button type="button" key={a} onClick={() => toggleAcc(a)} className={`chip ${form.accreditations.includes(a) ? 'chip-on' : 'chip-off'}`}>
                {form.accreditations.includes(a) && <Check className="h-3.5 w-3.5" />} {a}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Cover style</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((t) => (
            <button type="button" key={t} onClick={() => setForm((f) => ({ ...f, coverTheme: t }))} className={`overflow-hidden rounded-2xl ring-offset-2 ${form.coverTheme === t ? 'ring-2 ring-brand-600' : ''}`} aria-label={`Cover style ${t + 1}`}>
              <LabCover lab={{ ...form, _id: `theme${t}`, coverTheme: t }} className="h-16" />
            </button>
          ))}
        </div>
      </section>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={saving} data-testid="save-lab">
          {lab ? 'Save changes' : 'Submit lab for verification'}
        </Button>
      </div>
    </form>
  );
}
