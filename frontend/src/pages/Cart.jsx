import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CarFront, Smartphone, House, Info, Layers, ShoppingBag, Ticket, Trash2, Wallet, X } from 'lucide-react';
import { LabCover } from '../components/Brand';
import { MyInviteCoupons } from '../components/InvitePanel';
import { Button, EmptyState, Field } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { inr, slotDate, slotTime, ymd } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { RELATIONS, ageFrom } from '../lib/family';

const FALLBACK_SLOTS = ['07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '17:00-18:00'];
const IN_PERSON = ['lab_visit', 'assisted_visit'];
const TYPE_LABEL = { home: 'Home collection', lab_visit: 'Lab visit', assisted_visit: 'Assisted visit' };

const homeAllowedFor = (g) => Boolean(g.lab.homeCollection && g.items.every((i) => i.homeCollection));
const defaultPlan = (g) => ({ type: homeAllowedFor(g) ? 'home' : 'lab_visit', date: ymd(1), time: '' });

/** The visit type a lab group will actually use (falls back to a lab visit when the choice isn't offered). */
function effectiveType(g, plan) {
  const t = plan?.type || 'lab_visit';
  if (t === 'home' && !homeAllowedFor(g)) return 'lab_visit';
  if (t === 'assisted_visit' && !g.lab.assistedVisit) return 'lab_visit';
  return t;
}

const feeFor = (lab, type) => (type === 'home' ? lab.homeCollectionFee || 0 : type === 'assisted_visit' ? lab.assistedVisitFee || 0 : 0);

/** One lab in the cart: its tests, how the sample is given, and when. Each becomes its own booking. */
function LabPart({ group, plan, setPlan, index, multi, error, onRemoveLab }) {
  const cart = useCart();
  const { meta } = useApp();
  const { lab, items } = group;
  const homeAllowed = homeAllowedFor(group);
  const assistedAllowed = Boolean(lab.assistedVisit);
  const type = effectiveType(group, plan);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => ymd(i)), []);

  const availability = useAsync(
    () => (lab.slug ? api(`/labs/${lab.slug}/availability`, { params: { date: plan.date, type } }) : Promise.resolve(null)),
    [lab.slug, plan.date, type]
  );
  const slots = useMemo(() => {
    if (availability.data?.slots) return availability.data.slots.filter((s) => !s.past);
    const all = meta?.timeSlots || FALLBACK_SLOTS;
    const hour = new Date().getHours();
    return all.filter((t) => plan.date !== ymd(0) || Number(t.slice(0, 2)) > hour).map((t) => ({ time: t, available: null }));
  }, [availability.data, meta, plan.date]);

  const subtotal = items.reduce((s, i) => s + i.price, 0);

  return (
    <section className="card overflow-hidden" data-testid="lab-part" data-lab={lab.name}>
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 p-4">
        <LabCover lab={lab} className="h-11 w-11 shrink-0 rounded-xl [&>div]:hidden" />
        <div className="min-w-0 flex-1">
          {multi && <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Lab {index + 1}</p>}
          <Link to={`/labs/${lab.slug}`} className="block truncate font-bold hover:text-brand-700">{lab.name}</Link>
          <p className="text-xs text-ink-muted">{[lab.area, lab.city].filter(Boolean).join(', ')}</p>
        </div>
        {multi && (
          <button onClick={() => onRemoveLab(lab._id)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-ink-muted hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${lab.name}`} data-testid="remove-lab">
            Remove lab
          </button>
        )}
      </div>

      <ul className="divide-y divide-slate-100 px-4">
        {items.map((i) => (
          <li key={i._id} className="flex items-start gap-3 py-3" data-testid="cart-item">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug">{i.name}</p>
              <p className="text-sm">
                <span className="font-bold">{inr(i.price)}</span>{' '}
                {i.mrp > i.price && <span className="text-xs text-ink-muted line-through">{inr(i.mrp)}</span>}
              </p>
            </div>
            <button onClick={() => cart.remove(i._id)} className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${i.name}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="border-t border-slate-100 p-4">
        <h3 className="text-sm font-bold">How would you like to give your sample{multi ? ` to ${lab.name}` : ''}?</h3>
        {!homeAllowed && (
          <p className="mt-3 flex gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-sm text-sky-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {lab.homeCollection ? 'Some of these tests can only be done at the lab.' : 'This lab does not offer home collection.'} Book a free slot at the lab
              {assistedAllowed ? ', or choose Assisted visit — our staff will pick you up, stay with you at the lab and drop you home.' : '.'}
            </span>
          </p>
        )}
        <div className={`mt-3 grid gap-3 ${assistedAllowed ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {[
            { value: 'home', icon: House, title: 'Home collection', text: homeAllowed ? `A sample collector comes to you · ${lab.homeCollectionFee ? inr(lab.homeCollectionFee) : 'Free'}` : 'Not available for these tests', disabled: !homeAllowed },
            { value: 'lab_visit', icon: Building2, title: 'Visit the lab', text: `Free slot · ${lab.area ? `${lab.area}, ` : ''}${lab.city || ''}`, disabled: false },
            ...(assistedAllowed
              ? [{ value: 'assisted_visit', icon: CarFront, title: 'Assisted visit', text: `Pickup, stay & drop home · ${lab.assistedVisitFee ? inr(lab.assistedVisitFee) : 'Free'}`, disabled: false }]
              : []),
          ].map((o) => (
            <button
              key={o.value}
              disabled={o.disabled}
              onClick={() => setPlan({ type: o.value, time: '' })}
              className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                type === o.value ? 'border-brand-600 bg-brand-50/60' : 'border-slate-200 hover:border-brand-300'
              }`}
              data-testid={`collection-${o.value}`}
            >
              <o.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
              <span>
                <span className="block text-sm font-bold">{o.title}</span>
                <span className="text-xs text-ink-muted">{o.text}</span>
              </span>
            </button>
          ))}
        </div>

        <h3 className="mt-5 text-sm font-bold">Pick a {type === 'home' ? 'collection' : type === 'assisted_visit' ? 'pickup' : 'lab visit'} slot</h3>
        <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {dates.map((d, i) => (
            <button
              key={d}
              onClick={() => setPlan({ date: d, time: '' })}
              className={`flex w-[68px] shrink-0 flex-col items-center rounded-2xl border-2 py-2 text-sm transition ${plan.date === d ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 hover:border-brand-300'}`}
            >
              <span className="text-xs font-semibold opacity-80">{i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : slotDate(d).split(',')[0]}</span>
              <span className="text-lg font-extrabold">{d.slice(8)}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((s) => {
            const full = s.available === 0;
            const on = plan.time === s.time;
            return (
              <button
                key={s.time}
                onClick={() => setPlan({ time: s.time })}
                disabled={full}
                className={`chip flex-col justify-center gap-0 py-2 leading-tight disabled:cursor-not-allowed disabled:opacity-50 ${on ? 'chip-on' : 'chip-off'}`}
                data-testid="time-slot"
              >
                <span>{slotTime(s.time)}</span>
                {s.available !== null && s.available !== undefined && (
                  <span className={`text-[11px] font-semibold ${on ? 'text-white/80' : full ? 'text-red-500' : s.available <= 2 ? 'text-amber-600' : 'text-coral-600'}`}>
                    {full ? 'Full' : s.available <= 2 ? `Only ${s.available} left` : `${s.available} available`}
                  </span>
                )}
              </button>
            );
          })}
          {slots.length === 0 && <p className="col-span-full text-sm text-ink-muted">No slots left today — pick another day.</p>}
        </div>
        {error && <p className="mt-2 text-xs font-medium text-red-600" role="alert">{error}</p>}
        {multi && (
          <p className="mt-3 text-xs text-ink-muted">
            {items.length} {items.length === 1 ? 'test' : 'tests'} · {inr(subtotal)} · {TYPE_LABEL[type]} {feeFor(lab, type) ? inr(feeFor(lab, type)) : 'free'}
          </p>
        )}
      </div>
    </section>
  );
}

export default function Cart() {
  const cart = useCart();
  const { user } = useAuth();
  const { meta, toast } = useApp();
  const navigate = useNavigate();
  const multi = cart.labCount > 1;

  // Visit type, date and time per lab, keyed by lab id.
  const [plans, setPlans] = useState({});
  const planFor = (g) => ({ ...defaultPlan(g), ...plans[g.lab._id] });
  const setPlanFor = (labId) => (patch) => {
    setPlans((p) => ({ ...p, [labId]: { ...p[labId], ...patch } }));
    setErrors((e) => ({ ...e, [`slot:${labId}`]: undefined }));
  };

  const [patient, setPatient] = useState({ name: user?.name || '', age: ageFrom(user?.dateOfBirth), gender: user?.gender || '', phone: user?.phone || '' });
  const [who, setWho] = useState('self'); // 'self' or a saved family member's id
  const family = user?.familyMembers || [];
  const pickWho = (id) => {
    setWho(id);
    setErrors((e) => ({ ...e, name: undefined, age: undefined, gender: undefined, phone: undefined }));
    if (id === 'self') {
      setPatient({ name: user?.name || '', age: ageFrom(user?.dateOfBirth), gender: user?.gender || '', phone: user?.phone || '' });
      return;
    }
    const m = family.find((f) => f._id === id);
    if (m) setPatient({ name: m.name, age: ageFrom(m.dateOfBirth), gender: m.gender, phone: m.phone || user?.phone || '' });
  };
  const [address, setAddress] = useState({
    line: user?.address?.line || '',
    area: user?.address?.area || '',
    city: user?.address?.city || cart.groups[0]?.lab.city || '',
    pincode: user?.address?.pincode || '',
  });
  const [notes, setNotes] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discount, description }
  const [couponError, setCouponError] = useState('');
  const [applying, setApplying] = useState(false);
  const [payMethod, setPayMethod] = useState('pay_at_collection');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const itemsKey = cart.items.map((i) => i._id).join(',');

  // Any change to the cart invalidates an applied coupon (the discount depends on the subtotal).
  useEffect(() => {
    setCoupon(null);
    setCouponError('');
  }, [itemsKey]);

  // The cart can render before the session loads (e.g. on a page refresh) — prefill once the user is known.
  useEffect(() => {
    if (!user) return;
    setPatient((p) => ({
      name: p.name || user.name || '',
      age: p.age === '' ? ageFrom(user.dateOfBirth) : p.age,
      gender: p.gender || user.gender || '',
      phone: p.phone || user.phone || '',
    }));
    setAddress((a) => ({
      line: a.line || user.address?.line || '',
      area: a.area || user.address?.area || '',
      city: a.city || user.address?.city || '',
      pincode: a.pincode || user.address?.pincode || '',
    }));
  }, [user]);

  const cartGroupsBody = () => cart.groups.map((g) => ({ labId: g.lab._id, items: g.items.map((i) => i._id) }));

  const applyCoupon = async (code = couponInput) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    if (!user) {
      setCouponError('Log in to apply a coupon');
      return;
    }
    setApplying(true);
    setCouponError('');
    try {
      const res = await api('/coupons/validate', { method: 'POST', body: { code: clean, groups: cartGroupsBody() } });
      setCoupon(res);
      setCouponInput(res.code);
      toast(`${res.code} applied — you save ${inr(res.discount)}`);
    } catch (e) {
      setCoupon(null);
      setCouponError(e.message);
    } finally {
      setApplying(false);
    }
  };

  if (cart.count === 0) {
    return (
      <div className="container-page py-16">
        <h1 className="sr-only">Your cart</h1>
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          text="Find a lab or compare a test’s price across labs to get started."
          action={
            <div className="flex gap-2">
              <Link to="/tests"><Button>Compare tests</Button></Link>
              <Link to="/labs"><Button variant="outline">Browse labs</Button></Link>
            </div>
          }
        />
      </div>
    );
  }

  const parts = cart.groups.map((g) => {
    const plan = planFor(g);
    const type = effectiveType(g, plan);
    return { group: g, plan, type, fee: feeFor(g.lab, type), subtotal: g.items.reduce((s, i) => s + i.price, 0) };
  });
  const needsAddress = parts.some((p) => p.type !== 'lab_visit');
  const fees = parts.reduce((s, p) => s + p.fee, 0);
  const discount = coupon?.discount || 0;
  const payable = Math.max(0, cart.subtotal + fees - discount);
  // Free UPI: the lab's own UPI ID, or the platform UPI ID as a fallback.
  const upiEnabled = Boolean(meta?.upiAvailable || cart.groups.every((g) => g.lab.upiEnabled));
  const assistedOnly = parts.every((p) => p.type === 'assisted_visit');

  const validate = () => {
    const e = {};
    parts.forEach((p, i) => {
      const key = `slot:${p.group.lab._id}`;
      if (!p.plan.time) e[key] = 'Pick a time slot';
      for (let j = 0; j < i; j += 1) {
        const q = parts[j];
        const clash = q.plan.date === p.plan.date && q.plan.time && q.plan.time === p.plan.time && (IN_PERSON.includes(p.type) || IN_PERSON.includes(q.type));
        if (clash) e[key] = `Same time as ${q.group.lab.name}. Pick another slot — you can’t be at two places at once.`;
      }
    });
    if (!patient.name.trim()) e.name = 'Required';
    if (!(Number(patient.age) >= 0 && Number(patient.age) <= 120 && patient.age !== '')) e.age = 'Enter age';
    if (!patient.gender) e.gender = 'Select';
    if (!/^[6-9]\d{9}$/.test(patient.phone)) e.phone = 'Enter a valid 10-digit mobile';
    if (needsAddress) {
      if (!address.line.trim()) e.line = 'Required';
      if (!address.city.trim()) e.city = 'Required';
      if (!/^\d{6}$/.test(address.pincode)) e.pincode = '6-digit pincode';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeBooking = async () => {
    if (!user) return navigate('/login?next=/cart');
    if (!validate()) {
      toast('Please fix the highlighted fields', 'error');
      return;
    }
    setSubmitting(true);
    const payUpi = upiEnabled && payMethod === 'upi_direct';
    try {
      const res = await api('/bookings', {
        method: 'POST',
        body: {
          groups: parts.map((p) => ({
            labId: p.group.lab._id,
            items: p.group.items.map((i) => i._id),
            collectionType: p.type,
            slot: { date: p.plan.date, time: p.plan.time },
          })),
          patient: { ...patient, age: Number(patient.age) },
          address: needsAddress ? address : undefined,
          notes,
          couponCode: coupon?.code,
        },
      });
      const placed = res.bookings || [res.booking];
      cart.clear();
      if (placed.length > 1) {
        toast(`${placed.length} bookings placed — one for each lab.${payUpi ? ' Pay each lab from its booking.' : ''}`);
      } else {
        toast(payUpi ? 'Booking placed! Scan the QR to pay by UPI.' : 'Booking placed! The lab will confirm shortly.');
      }
      navigate(`/bookings/${placed[0]._id}`, { replace: true, state: { justBooked: true, payUpi, orderCount: placed.length } });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const setP = (k) => (e) => setPatient((p) => ({ ...p, [k]: e.target.value }));
  const setA = (k) => (e) => setAddress((a) => ({ ...a, [k]: e.target.value }));
  const removeLab = (labId) => {
    cart.removeLab(labId);
    setPlans(({ [labId]: _gone, ...rest }) => rest);
  };

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>
      {multi && (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-brand-50/70 px-4 py-3 text-sm text-brand-900 ring-1 ring-brand-100" data-testid="multi-lab-note">
          <Layers className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
          <span>
            Your tests are from <b>{cart.labCount} labs</b>. We’ll place one booking with each lab for the same patient — each lab confirms its own tests and sends its own sample collector.
          </span>
        </p>
      )}
      <div className="mt-6 grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 font-bold">1. {multi ? 'Tests and slot for each lab' : 'Tests, sample collection and slot'}</h2>
            <div className="space-y-4">
              {parts.map((p, i) => (
                <LabPart
                  key={p.group.lab._id}
                  group={p.group}
                  plan={p.plan}
                  setPlan={setPlanFor(p.group.lab._id)}
                  index={i}
                  multi={multi}
                  error={errors[`slot:${p.group.lab._id}`]}
                  onRemoveLab={removeLab}
                />
              ))}
            </div>
            <Link to="/tests" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline" data-testid="add-more-tests">
              + Add tests from another lab
            </Link>
          </div>

          {/* Patient */}
          <section className="card p-5">
            <h2 className="font-bold">2. Patient details</h2>
            {multi && <p className="mt-1 text-sm text-ink-muted">Shared with every lab in this order.</p>}
            {user && (
              <div className="mt-4">
                <p className="text-sm font-semibold">Who is this test for?</p>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Who is this test for?">
                  {[{ _id: 'self', name: 'Myself' }, ...family].map((m) => (
                    <button
                      key={m._id}
                      type="button"
                      role="radio"
                      aria-checked={who === m._id}
                      onClick={() => pickWho(m._id)}
                      className={`chip ${who === m._id ? 'chip-on' : 'chip-off'}`}
                      data-testid="patient-choice"
                    >
                      {m.name}
                      {m.relation && <span className="text-[11px] font-semibold opacity-75">· {RELATIONS[m.relation]}</span>}
                    </button>
                  ))}
                  <Link to="/profile#family" className="chip chip-off text-brand-700" data-testid="manage-family">
                    + {family.length ? 'Manage family' : 'Add family member'}
                  </Link>
                </div>
              </div>
            )}
            {!user && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                <Link to="/login?next=/cart" className="font-bold underline">Log in</Link> or <Link to="/register?next=/cart" className="font-bold underline">create an account</Link> to place your booking.
              </p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name}>
                <input className="input" value={patient.name} onChange={setP('name')} name="patientName" />
              </Field>
              <Field label="Mobile number" error={errors.phone}>
                <input className="input" inputMode="numeric" maxLength={10} value={patient.phone} onChange={setP('phone')} name="patientPhone" />
              </Field>
              <Field label="Age" error={errors.age}>
                <input className="input" type="number" min={0} max={120} value={patient.age} onChange={setP('age')} name="patientAge" />
              </Field>
              <Field label="Gender" error={errors.gender}>
                <select className="input" value={patient.gender} onChange={setP('gender')} name="patientGender">
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
          </section>

          {needsAddress && (
            <section className="card p-5">
              <h2 className="font-bold">3. {assistedOnly ? 'Pickup & drop address' : 'Collection address'}</h2>
              {parts.some((p) => p.type === 'assisted_visit') && (
                <p className="mt-1 text-sm text-ink-muted">For an assisted visit, a staff member picks you up here, stays with you through the visit and drops you back.</p>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="House / street" error={errors.line} className="sm:col-span-2">
                  <input className="input" value={address.line} onChange={setA('line')} name="addressLine" />
                </Field>
                <Field label="Area / locality">
                  <input className="input" value={address.area} onChange={setA('area')} name="addressArea" />
                </Field>
                <Field label="City" error={errors.city}>
                  <input className="input" value={address.city} onChange={setA('city')} name="addressCity" />
                </Field>
                <Field label="Pincode" error={errors.pincode}>
                  <input className="input" inputMode="numeric" maxLength={6} value={address.pincode} onChange={setA('pincode')} name="addressPincode" />
                </Field>
              </div>
            </section>
          )}
          {upiEnabled && (
            <section className="card p-5">
              <h2 className="font-bold">Payment</h2>
              {multi && <p className="mt-1 text-sm text-ink-muted">Each lab is paid separately for its own tests.</p>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { value: 'upi_direct', icon: Smartphone, title: 'Pay now via UPI', text: 'Google Pay, PhonePe, Paytm · no extra charges' },
                  { value: 'pay_at_collection', icon: Wallet, title: 'Pay at collection', text: 'Cash or UPI at the visit' },
                ].map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setPayMethod(o.value)}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${payMethod === o.value ? 'border-brand-500 bg-brand-50/60' : 'border-slate-200 hover:border-brand-300'}`}
                    data-testid={`pay-${o.value}`}
                  >
                    <o.icon className="mt-0.5 h-5 w-5 text-brand-600" />
                    <span>
                      <span className="block font-bold">{o.title}</span>
                      <span className="text-sm text-ink-muted">{o.text}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          <Field label={multi ? 'Notes for the labs (optional)' : 'Notes for the lab (optional)'}>
            <textarea className="input" rows={2} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Please call before arriving" />
          </Field>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 p-4">
              <h2 className="font-bold">Order summary</h2>
              <ul className="mt-3 space-y-3">
                {parts.map((p) => (
                  <li key={p.group.lab._id} className="text-sm" data-testid="summary-lab">
                    <div className="flex justify-between gap-3">
                      <span className="min-w-0 truncate font-semibold">{p.group.lab.name}</span>
                      <span className="font-semibold">{inr(p.subtotal + p.fee)}</span>
                    </div>
                    <p className="text-xs text-ink-muted">
                      {p.group.items.length} {p.group.items.length === 1 ? 'test' : 'tests'} · {TYPE_LABEL[p.type]}
                      {p.plan.time ? ` · ${slotDate(p.plan.date)}, ${slotTime(p.plan.time)}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4">
              {coupon ? (
                <div className="flex items-center gap-3 rounded-xl bg-coral-50 px-3 py-2.5 text-sm ring-1 ring-coral-200" data-testid="coupon-applied">
                  <Ticket className="h-4 w-4 text-coral-600" />
                  <div className="flex-1">
                    <p className="font-bold text-coral-700">{coupon.code} applied</p>
                    <p className="text-xs text-coral-700/80">{coupon.description}</p>
                  </div>
                  <button onClick={() => { setCoupon(null); setCouponInput(''); }} className="rounded-lg p-1 text-coral-700 hover:bg-coral-100" aria-label="Remove coupon">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyCoupon();
                  }}
                >
                  <div className="relative flex-1">
                    <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
                    <input className="input pl-9 uppercase" placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} aria-label="Coupon code" name="coupon" />
                  </div>
                  <Button type="submit" variant="outline" loading={applying} className="shrink-0">Apply</Button>
                </form>
              )}
              {couponError && <p className="mt-2 text-xs font-medium text-red-600" role="alert">{couponError}</p>}
              {user?.role === 'patient' && !coupon && <MyInviteCoupons onApply={applyCoupon} current={coupon?.code} />}
              {!coupon && meta?.featuredCoupon && couponInput.trim().toUpperCase() !== meta.featuredCoupon.code && (
                <button className="mt-2 text-xs font-semibold text-brand-700 hover:underline" onClick={() => applyCoupon(meta.featuredCoupon.code)}>
                  Try {meta.featuredCoupon.code}: {meta.featuredCoupon.description}
                </button>
              )}
            </div>
            <dl className="space-y-2 border-t border-slate-100 bg-slate-50/60 p-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Tests total</dt><dd>{inr(cart.subtotal)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">{multi ? 'Collection fees' : TYPE_LABEL[parts[0].type]}</dt>
                <dd>{fees ? inr(fees) : 'Free'}</dd>
              </div>
              {discount > 0 && <div className="flex justify-between text-coral-700"><dt>Coupon {coupon.code}</dt><dd className="font-semibold" data-testid="coupon-discount">− {inr(discount)}</dd></div>}
              {cart.savings + discount > 0 && <div className="flex justify-between text-coral-700"><dt>Total savings</dt><dd className="font-semibold">{inr(cart.savings + discount)}</dd></div>}
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-base font-extrabold"><dt>To pay</dt><dd data-testid="cart-total">{inr(payable)}</dd></div>
            </dl>
            <div className="p-4 pt-0">
              {!multi && parts[0].plan.time && <p className="mb-3 text-center text-xs text-ink-muted">{slotDate(parts[0].plan.date)} · {slotTime(parts[0].plan.time)}</p>}
              <Button variant="accent" size="lg" className="w-full" onClick={placeBooking} loading={submitting} data-testid="place-booking">
                {!user
                  ? 'Log in to book'
                  : multi
                    ? `Place ${cart.labCount} bookings`
                    : upiEnabled && payMethod === 'upi_direct'
                      ? `Book & pay ${inr(payable)} via UPI`
                      : 'Place booking'}
              </Button>
              <p className="mt-2 text-center text-xs text-ink-muted">
                {upiEnabled && payMethod === 'upi_direct' ? (multi ? 'You’ll pay each lab by UPI from its booking' : 'You’ll see the UPI QR on the next screen') : 'Pay at the time of sample collection'}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
