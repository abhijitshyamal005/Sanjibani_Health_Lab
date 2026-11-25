import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarClock, CarFront, Route, ChevronRight, CircleCheck, ClipboardList, CreditCard, Download, FileText, House, Phone, Star } from 'lucide-react';
import { LabCover } from '../components/Brand';
import { Button, EmptyState, ErrorState, Field, Modal, Spinner, StatusBadge, Tabs } from '../components/ui';
import { useApp } from '../context/AppContext';
import { api, apiDownload } from '../lib/api';
import { payForBooking } from '../lib/payments';
import { COLLECTION_TYPES, FIELD_FLOW, FIELD_STATUS, FLOW, STATUS, dateTime, inr, slotDate, slotTime } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export function BookingList() {
  const { data, loading, error, reload } = useAsync(() => api('/bookings/me'), []);
  const [tab, setTab] = useState('upcoming');

  if (error) return <div className="container-page py-16"><ErrorState error={error} onRetry={reload} /></div>;
  if (loading && !data) return <Spinner className="min-h-[50vh]" />;

  const active = ['pending', 'confirmed', 'sample_collected', 'report_ready'];
  const lists = {
    upcoming: data.items.filter((b) => active.includes(b.status)),
    past: data.items.filter((b) => !active.includes(b.status)),
  };

  return (
    <div className="container-page max-w-4xl py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">My bookings</h1>
      <div className="mt-5">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'upcoming', label: 'Active', count: lists.upcoming.length },
            { value: 'past', label: 'Past', count: lists.past.length },
          ]}
        />
      </div>
      <div className="mt-5 space-y-3">
        {lists[tab].length === 0 && (
          <EmptyState icon={ClipboardList} title={tab === 'upcoming' ? 'No active bookings' : 'No past bookings'} text="Book a test and track it here." action={<Link to="/tests"><Button>Find a test</Button></Link>} />
        )}
        {lists[tab].map((b) => (
          <Link key={b._id} to={`/bookings/${b._id}`} className="card flex items-center gap-4 p-4 transition hover:shadow-lift" data-testid="booking-card">
            <LabCover lab={b.lab} className="hidden h-14 w-14 shrink-0 rounded-xl sm:block [&>div]:hidden" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{b.lab?.name}</p>
                <StatusBadge status={b.status} />
              </div>
              <p className="mt-0.5 truncate text-sm text-ink-soft">{b.items.map((i) => i.name).join(', ')}</p>
              <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-ink-muted">
                <span>{slotDate(b.slot.date)} · {slotTime(b.slot.time)}</span>
                <span>{COLLECTION_TYPES[b.collectionType]?.label}</span>
                <span>#{b.code}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-extrabold">{inr(b.total)}</p>
              <ChevronRight className="ml-auto mt-1 h-5 w-5 text-ink-muted" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CollectorTracker({ booking }) {
  const flow = [...(FIELD_FLOW[booking.collectionType] || [])];
  if (booking.collectionType === 'assisted_visit') flow.push('dropped_home');
  const current = flow.indexOf(booking.fieldStatus || 'assigned');
  return (
    <div className="mt-5 rounded-2xl bg-brand-50/70 p-4 ring-1 ring-brand-100" data-testid="collector-tracker">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><Route className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{booking.collectionType === 'assisted_visit' ? 'Your assistant' : 'Your sample collector'}</p>
          <p className="font-bold text-ink">{booking.collector.name}</p>
        </div>
        <a href={`tel:${booking.collector.phone}`} className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-brand-700 shadow-sm">
          <Phone className="h-4 w-4" /> Call
        </a>
      </div>
      <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {flow.map((s, i) => (
          <li key={s} className={`flex items-center gap-1.5 font-semibold ${i <= current ? 'text-brand-700' : 'text-ink-muted'}`}>
            <span className={`h-2 w-2 rounded-full ${i <= current ? 'bg-brand-500' : 'bg-slate-300'}`} />
            {FIELD_STATUS[s]?.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function StatusTimeline({ booking }) {
  if (booking.status === 'cancelled') {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
        <p className="font-bold">Booking cancelled {booking.cancelledBy ? `by ${booking.cancelledBy}` : ''}</p>
        {booking.cancelReason && <p className="mt-1">Reason: {booking.cancelReason}</p>}
      </div>
    );
  }
  const current = STATUS[booking.status].step;
  const at = Object.fromEntries(booking.statusHistory.map((h) => [h.status, h.at]));
  return (
    <ol className="relative space-y-5" aria-label="Booking progress">
      {FLOW.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className="relative flex gap-3">
            {i < FLOW.length - 1 && <span className={`absolute left-[11px] top-7 h-[calc(100%-4px)] w-0.5 ${i < current ? 'bg-brand-500' : 'bg-slate-200'}`} />}
            <span className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[11px] font-bold ${done ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-400'}`}>
              {done ? '✓' : i + 1}
            </span>
            <div>
              <p className={`text-sm font-bold ${done ? 'text-ink' : 'text-ink-muted'}`}>{STATUS[s].label}</p>
              {at[s] && <p className="text-xs text-ink-muted">{dateTime(at[s])}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ReviewForm({ booking, onDone }) {
  const { toast } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <div className="card p-5">
      <h3 className="font-bold">How was your experience with {booking.lab.name}?</h3>
      <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} aria-checked={rating === n} role="radio">
            <Star className={`h-8 w-8 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
          </button>
        ))}
      </div>
      <textarea className="input mt-3" rows={3} maxLength={500} placeholder="Tell other patients about the collection, staff and report (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <Button
        className="mt-3"
        loading={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await api('/reviews', { method: 'POST', body: { bookingId: booking._id, rating, comment } });
            toast('Thanks for your review!');
            onDone();
          } catch (e) {
            toast(e.message, 'error');
          } finally {
            setSaving(false);
          }
        }}
      >
        Submit review
      </Button>
    </div>
  );
}

export function BookingDetail() {
  const { id } = useParams();
  const { toast, meta } = useApp();
  const location = useLocation();
  const { data, loading, error, reload, setData } = useAsync(() => api(`/bookings/${id}`), [id]);
  const [paying, setPaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (error) return <div className="container-page py-16"><ErrorState error={error} onRetry={reload} /></div>;
  if (loading && !data) return <Spinner className="min-h-[50vh]" />;
  const b = data.booking;
  const canCancel = ['pending', 'confirmed'].includes(b.status);
  const canPay = meta?.paymentsEnabled && b.paymentStatus !== 'paid' && b.status !== 'cancelled';

  const payNow = async () => {
    setPaying(true);
    try {
      const paid = await payForBooking(b._id);
      if (paid) {
        setData((d) => ({ ...d, booking: { ...d.booking, ...paid, lab: d.booking.lab, user: d.booking.user } }));
        toast('Payment successful');
      }
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setPaying(false);
    }
  };

  const downloadReport = async () => {
    setDownloading(true);
    try {
      await apiDownload(`/bookings/${b._id}/report`, `Sanjibani-Report-${b.code}.pdf`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setDownloading(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      const res = await api(`/bookings/${b._id}/cancel`, { method: 'PATCH', body: { reason: reason || undefined } });
      setData((d) => ({ ...d, booking: { ...d.booking, ...res.booking } }));
      setCancelOpen(false);
      toast('Booking cancelled');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page max-w-5xl py-8">
      <Link to="/bookings" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> My bookings
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Booking #{b.code}</h1>
        <StatusBadge status={b.status} />
      </div>
      <p className="mt-1 text-sm text-ink-muted">Placed {dateTime(b.createdAt)}</p>
      {location.state?.justBooked && b.status === 'pending' && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-coral-50 p-4 ring-1 ring-coral-200" role="status">
          <CircleCheck className="h-6 w-6 shrink-0 text-coral-600" />
          <div>
            <p className="font-bold text-coral-700">Booking placed successfully!</p>
            <p className="text-sm text-coral-700/80">{b.lab.name} will confirm your slot shortly. We’ll email you at every step.</p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {b.status === 'report_ready' || b.status === 'completed' ? (
            <div className="card flex gap-3 border-brand-200 bg-brand-50/60 p-5">
              <FileText className="h-6 w-6 shrink-0 text-brand-700" />
              <div>
                <p className="font-bold text-brand-900">Your report is ready</p>
                <p className="mt-1 text-sm text-brand-900/80">{b.reportNote || (b.report ? 'Download your report below.' : 'The lab has shared your report. Contact the lab if you have not received it.')}</p>
                {b.report && (
                  <Button size="sm" className="mt-3" onClick={downloadReport} loading={downloading} data-testid="download-report">
                    <Download className="h-4 w-4" /> Download report (PDF)
                  </Button>
                )}
              </div>
            </div>
          ) : null}

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <LabCover lab={b.lab} className="h-12 w-12 shrink-0 rounded-xl [&>div]:hidden" />
              <div className="min-w-0 flex-1">
                <Link to={`/labs/${b.lab.slug}`} className="font-bold hover:text-brand-700">{b.lab.name}</Link>
                <p className="text-xs text-ink-muted">{[b.lab.address?.area, b.lab.address?.city].filter(Boolean).join(', ')}</p>
              </div>
              <a href={`tel:${b.lab.phone}`} className="flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">
                <Phone className="h-4 w-4" /> Call
              </a>
            </div>
            <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
              <div className="flex gap-3">
                <CalendarClock className="h-5 w-5 text-coral-500" />
                <div>
                  <p className="font-semibold">{slotDate(b.slot.date)}</p>
                  <p className="text-ink-muted">{slotTime(b.slot.time)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                {b.collectionType === 'home' ? <House className="h-5 w-5 text-coral-500" /> : b.collectionType === 'assisted_visit' ? <CarFront className="h-5 w-5 text-coral-500" /> : <Building2 className="h-5 w-5 text-coral-500" />}
                <div>
                  <p className="font-semibold">{COLLECTION_TYPES[b.collectionType]?.label}</p>
                  <p className="text-ink-muted">
                    {b.collectionType === 'lab_visit'
                      ? [b.lab.address?.line, b.lab.address?.area].filter(Boolean).join(', ')
                      : [b.address?.line, b.address?.area, b.address?.city, b.address?.pincode].filter(Boolean).join(', ')}
                  </p>
                  {b.collectionType === 'assisted_visit' && <p className="mt-1 text-xs text-ink-muted">Our staff will pick you up, stay with you at the lab and drop you home.</p>}
                </div>
              </div>
            </div>
            {b.collector && b.status !== 'cancelled' && <CollectorTracker booking={b} />}
            <p className="mt-4 text-sm text-ink-muted">
              Patient: <span className="font-semibold text-ink">{b.patient.name}</span>, {b.patient.age} yrs, {b.patient.gender} · {b.patient.phone}
            </p>
          </div>

          <div className="card p-5">
            <h2 className="font-bold">Tests</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {b.items.map((i) => (
                <li key={i.name} className="flex justify-between gap-4 py-2.5 text-sm">
                  <span>{i.name}</span>
                  <span className="font-semibold">{inr(i.price)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1.5 border-t border-dashed border-slate-200 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd>{inr(b.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Collection fee</dt><dd>{b.collectionFee ? inr(b.collectionFee) : 'Free'}</dd></div>
              {b.discount > 0 && <div className="flex justify-between text-coral-700"><dt>Coupon {b.couponCode}</dt><dd>− {inr(b.discount)}</dd></div>}
              <div className="flex justify-between text-base font-extrabold"><dt>Total</dt><dd>{inr(b.total)}</dd></div>
              <p className={`text-xs ${b.paymentStatus === 'paid' ? 'font-semibold text-coral-700' : 'text-ink-muted'}`}>
                {b.paymentStatus === 'paid' ? `Paid${b.paymentMethod === 'online' ? ' online' : ''}` : 'Pay at sample collection'}
              </p>
            </dl>
          </div>

          {b.status === 'completed' && !b.reviewed && <ReviewForm booking={b} onDone={() => setData((d) => ({ ...d, booking: { ...d.booking, reviewed: true } }))} />}
          {b.reviewed && <p className="text-sm font-medium text-brand-700">✓ You reviewed this booking. Thank you!</p>}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-4 font-bold">Status</h2>
            <StatusTimeline booking={b} />
          </div>
          {canPay && (
            <Button className="w-full" onClick={payNow} loading={paying}>
              <CreditCard className="h-4 w-4" /> Pay {inr(b.total)} online
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" className="w-full" onClick={() => setCancelOpen(true)} data-testid="cancel-booking">
              Cancel booking
            </Button>
          )}
        </aside>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this booking?"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep booking</Button>
            <Button variant="accent" loading={busy} onClick={cancel} data-testid="confirm-cancel">Yes, cancel</Button>
          </>
        }
      >
        <Field label="Reason (optional)">
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Rescheduling" />
        </Field>
      </Modal>
    </div>
  );
}
