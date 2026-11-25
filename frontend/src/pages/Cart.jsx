import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CarFront, CreditCard, House, Info, ShoppingBag, Ticket, Trash2, Wallet, X } from 'lucide-react';
import { LabCover } from '../components/Brand';
import { Button, EmptyState, Field } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { inr, slotDate, slotTime, ymd } from '../lib/format';
import { payForBooking } from '../lib/payments';
import { useAsync } from '../lib/useAsync';

const FALLBACK_SLOTS = ['07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '17:00-18:00'];

export default function Cart() {
  const cart = useCart();
  const { user } = useAuth();
  const { meta, toast } = useApp();
  const navigate = useNavigate();

  const homeAllowed = cart.lab?.homeCollection && cart.items.every((i) => i.homeCollection);
  const [type, setType] = useState(homeAllowed ? 'home' : 'lab_visit');
  const [date, setDate] = useState(ymd(1));
  const [time, setTime] = useState('');
  const [patient, setPatient] = useState({ name: user?.name || '', age: '', gender: user?.gender || '', phone: user?.phone || '' });
  const [address, setAddress] = useState({
    line: user?.address?.line || '',
    area: user?.address?.area || '',
    city: user?.address?.city || cart.lab?.city || '',
    pincode: user?.address?.pincode || '',
  });
  const [notes, setNotes] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discount, description }
  const [couponError, setCouponError] = useState('');
  const [applying, setApplying] = useState(false);
  const [payMethod, setPayMethod] = useState('pay_at_collection');
  const itemsKey = cart.items.map((i) => i._id).join(',');

  // Any change to the cart invalidates an applied coupon (the discount depends on the subtotal).
  useEffect(() => {
    setCoupon(null);
    setCouponError('');
  }, [itemsKey]);

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
      const res = await api('/coupons/validate', { method: 'POST', body: { code: clean, labId: cart.lab._id, items: cart.items.map((i) => i._id) } });
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
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // The cart can render before the session loads (e.g. on a page refresh) — prefill once the user is known.
  useEffect(() => {
    if (!user) return;
    setPatient((p) => ({
      name: p.name || user.name || '',
      age: p.age,
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

  const assistedAllowed = Boolean(cart.lab?.assistedVisit);
  const collectionType =
    (type === 'home' && !homeAllowed) || (type === 'assisted_visit' && !assistedAllowed) ? 'lab_visit' : type;
  const needsAddress = collectionType === 'home' || collectionType === 'assisted_visit';
  const fee =
    collectionType === 'home' ? cart.lab?.homeCollectionFee || 0 : collectionType === 'assisted_visit' ? cart.lab?.assistedVisitFee || 0 : 0;
  const discount = coupon?.discount || 0;
  const payable = Math.max(0, cart.subtotal + fee - discount);
  const onlineEnabled = Boolean(meta?.paymentsEnabled);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => ymd(i)), []);
  // Live slot availability for the chosen lab, date and visit type.
  const availability = useAsync(
    () => (cart.lab?.slug ? api(`/labs/${cart.lab.slug}/availability`, { params: { date, type: collectionType } }) : Promise.resolve(null)),
    [cart.lab?.slug, date, collectionType]
  );
  const slots = useMemo(() => {
    if (availability.data?.slots) return availability.data.slots.filter((s) => !s.past);
    const all = meta?.timeSlots || FALLBACK_SLOTS;
    const hour = new Date().getHours();
    return all
      .filter((t) => date !== ymd(0) || Number(t.slice(0, 2)) > hour)
      .map((t) => ({ time: t, available: null }));
  }, [availability.data, meta, date]);
  useEffect(() => {
    setTime('');
  }, [collectionType]);

  if (cart.count === 0) {
    return (
      <div className="container-page py-16">
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

  const validate = () => {
    const e = {};
    if (!time) e.time = 'Pick a time slot';
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
    try {
      const { booking } = await api('/bookings', {
        method: 'POST',
        body: {
          labId: cart.lab._id,
          items: cart.items.map((i) => i._id),
          collectionType,
          slot: { date, time },
          patient: { ...patient, age: Number(patient.age) },
          address: needsAddress ? address : undefined,
          notes,
          couponCode: coupon?.code,
        },
      });
      cart.clear();
      if (onlineEnabled && payMethod === 'online') {
        try {
          const paid = await payForBooking(booking._id);
          toast(paid ? 'Payment successful! Booking confirmed.' : 'Booking placed. You can pay online later from the booking page.');
        } catch (e) {
          toast(`${e.message} Your booking is saved — you can pay later.`, 'error');
        }
      } else {
        toast('Booking placed! The lab will confirm shortly.');
      }
      navigate(`/bookings/${booking._id}`, { replace: true, state: { justBooked: true } });
    } catch (err) {
      toast(err.message, 'error');
      if (err.status === 409) {
        setTime('');
        availability.reload();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const setP = (k) => (e) => setPatient((p) => ({ ...p, [k]: e.target.value }));
  const setA = (k) => (e) => setAddress((a) => ({ ...a, [k]: e.target.value }));

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Collection type */}
          <section className="card p-5">
            <h2 className="font-bold">1. How would you like to give your sample?</h2>
            {!homeAllowed && (
              <p className="mt-3 flex gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-sm text-sky-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                {cart.lab.homeCollection
                  ? 'Some tests in your cart can only be done at the lab.'
                  : 'This lab does not offer home collection.'}{' '}
                Book a free slot at the lab{assistedAllowed ? ', or choose Assisted visit — our staff will pick you up, stay with you at the lab and drop you home.' : '.'}
              </p>
            )}
            <div className={`mt-4 grid gap-3 ${assistedAllowed ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              {[
                { value: 'home', icon: House, title: 'Home collection', text: homeAllowed ? `A sample collector comes to you · ${cart.lab.homeCollectionFee ? inr(cart.lab.homeCollectionFee) : 'Free'}` : 'Not available for these tests', disabled: !homeAllowed },
                { value: 'lab_visit', icon: Building2, title: 'Visit the lab', text: `Free slot · ${cart.lab.area ? `${cart.lab.area}, ` : ''}${cart.lab.city || ''}`, disabled: false },
                ...(assistedAllowed
                  ? [{ value: 'assisted_visit', icon: CarFront, title: 'Assisted visit', text: `Pickup, stay & drop home · ${cart.lab.assistedVisitFee ? inr(cart.lab.assistedVisitFee) : 'Free'}`, disabled: false }]
                  : []),
              ].map((o) => (
                <button
                  key={o.value}
                  disabled={o.disabled}
                  onClick={() => setType(o.value)}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    collectionType === o.value ? 'border-brand-600 bg-brand-50/60' : 'border-slate-200 hover:border-brand-300'
                  }`}
                  data-testid={`collection-${o.value}`}
                >
                  <o.icon className="mt-0.5 h-5 w-5 text-brand-700" />
                  <span>
                    <span className="block font-bold">{o.title}</span>
                    <span className="text-sm text-ink-muted">{o.text}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Slot */}
          <section className="card p-5">
            <h2 className="font-bold">2. Pick a {collectionType === 'home' ? 'collection' : collectionType === 'assisted_visit' ? 'pickup' : 'lab visit'} slot</h2>
            <div className="scrollbar-none -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
              {dates.map((d, i) => (
                <button
                  key={d}
                  onClick={() => {
                    setDate(d);
                    setTime('');
                  }}
                  className={`flex w-[72px] shrink-0 flex-col items-center rounded-2xl border-2 py-2.5 text-sm transition ${date === d ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 hover:border-brand-300'}`}
                >
                  <span className="text-xs font-semibold opacity-80">{i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : slotDate(d).split(',')[0]}</span>
                  <span className="text-lg font-extrabold">{d.slice(8)}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((s) => {
                const full = s.available === 0;
                return (
                  <button
                    key={s.time}
                    onClick={() => setTime(s.time)}
                    disabled={full}
                    className={`chip flex-col justify-center gap-0 py-2 leading-tight disabled:cursor-not-allowed disabled:opacity-50 ${time === s.time ? 'chip-on' : 'chip-off'}`}
                    data-testid="time-slot"
                  >
                    <span>{slotTime(s.time)}</span>
                    {s.available !== null && s.available !== undefined && (
                      <span className={`text-[11px] font-semibold ${time === s.time ? 'text-white/80' : full ? 'text-red-500' : s.available <= 2 ? 'text-amber-600' : 'text-coral-600'}`}>
                        {full ? 'Full' : s.available <= 2 ? `Only ${s.available} left` : `${s.available} available`}
                      </span>
                    )}
                  </button>
                );
              })}
              {slots.length === 0 && <p className="col-span-full text-sm text-ink-muted">No slots left today — pick another day.</p>}
            </div>
            {errors.time && <p className="mt-2 text-xs font-medium text-red-600">{errors.time}</p>}
          </section>

          {/* Patient */}
          <section className="card p-5">
            <h2 className="font-bold">3. Patient details</h2>
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
              <h2 className="font-bold">4. {collectionType === 'assisted_visit' ? 'Pickup & drop address' : 'Collection address'}</h2>
              {collectionType === 'assisted_visit' && (
                <p className="mt-1 text-sm text-ink-muted">A {cart.lab.name} staff member picks you up here, stays with you through the visit and drops you back.</p>
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
          {onlineEnabled && (
            <section className="card p-5">
              <h2 className="font-bold">Payment</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { value: 'online', icon: CreditCard, title: 'Pay online now', text: 'UPI, cards, net banking, wallets' },
                  { value: 'pay_at_collection', icon: Wallet, title: 'Pay at collection', text: 'Cash or UPI to the lab' },
                ].map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setPayMethod(o.value)}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${payMethod === o.value ? 'border-brand-500 bg-brand-50/60' : 'border-slate-200 hover:border-brand-300'}`}
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
          <Field label="Notes for the lab (optional)">
            <textarea className="input" rows={2} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Please call before arriving" />
          </Field>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 p-4">
              <LabCover lab={cart.lab} className="h-12 w-12 shrink-0 rounded-xl [&>div]:hidden" />
              <div className="min-w-0">
                <Link to={`/labs/${cart.lab.slug}`} className="block truncate font-bold hover:text-brand-700">{cart.lab.name}</Link>
                <p className="text-xs text-ink-muted">{[cart.lab.area, cart.lab.city].filter(Boolean).join(', ')}</p>
              </div>
            </div>
            <ul className="divide-y divide-slate-100 px-4">
              {cart.items.map((i) => (
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
              {!coupon && meta?.featuredCoupon && couponInput.trim().toUpperCase() !== meta.featuredCoupon.code && (
                <button className="mt-2 text-xs font-semibold text-brand-700 hover:underline" onClick={() => applyCoupon(meta.featuredCoupon.code)}>
                  Try {meta.featuredCoupon.code}: {meta.featuredCoupon.description}
                </button>
              )}
            </div>
            <dl className="space-y-2 border-t border-slate-100 bg-slate-50/60 p-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Tests total</dt><dd>{inr(cart.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">{collectionType === 'home' ? 'Home collection' : collectionType === 'assisted_visit' ? 'Assisted visit' : 'Lab visit'}</dt><dd>{fee ? inr(fee) : 'Free'}</dd></div>
              {discount > 0 && <div className="flex justify-between text-coral-700"><dt>Coupon {coupon.code}</dt><dd className="font-semibold" data-testid="coupon-discount">− {inr(discount)}</dd></div>}
              {cart.savings + discount > 0 && <div className="flex justify-between text-coral-700"><dt>Total savings</dt><dd className="font-semibold">{inr(cart.savings + discount)}</dd></div>}
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-base font-extrabold"><dt>To pay</dt><dd data-testid="cart-total">{inr(payable)}</dd></div>
            </dl>
            <div className="p-4 pt-0">
              {time && <p className="mb-3 text-center text-xs text-ink-muted">{slotDate(date)} · {slotTime(time)}</p>}
              <Button variant="accent" size="lg" className="w-full" onClick={placeBooking} loading={submitting} data-testid="place-booking">
                {!user ? 'Log in to book' : onlineEnabled && payMethod === 'online' ? `Pay ${inr(payable)} & book` : 'Place booking'}
              </Button>
              <p className="mt-2 text-center text-xs text-ink-muted">{onlineEnabled && payMethod === 'online' ? 'Secure payment by Razorpay' : 'Pay at the time of sample collection'}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
