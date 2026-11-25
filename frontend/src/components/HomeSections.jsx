import { useState } from 'react';
import { BadgeCheck, ChevronDown, Copy, Quote, Star, Ticket } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { inr } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { SectionTitle } from './ui';

export function couponLabel(c) {
  if (!c) return '';
  return c.type === 'percent' ? `${c.value}% OFF` : `${inr(c.value)} OFF`;
}

/** Dashed "ticket" with the featured coupon, copy-to-clipboard. */
export function OfferStrip() {
  const { meta, toast } = useApp();
  const c = meta?.featuredCoupon;
  if (!c) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(c.code);
      toast(`Coupon ${c.code} copied`);
    } catch {
      toast(`Use code ${c.code} at checkout`);
    }
  };
  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/70 px-5 py-4 sm:flex-row" data-testid="offer-strip">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-sm">
          <Ticket className="h-5 w-5" />
        </span>
        <p className="text-sm text-ink-soft sm:text-base">
          Get <span className="font-extrabold text-brand-700">{couponLabel(c)}</span>
          {c.minOrder ? <> on orders above <b>{inr(c.minOrder)}</b></> : null}
          {c.maxDiscount ? <span className="text-ink-muted"> (up to {inr(c.maxDiscount)})</span> : null}
        </p>
      </div>
      <button onClick={copy} className="flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 font-mono text-sm font-bold tracking-wider text-brand-700 hover:bg-brand-50">
        {c.code} <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}

export function TrustStats() {
  const { meta } = useApp();
  const stats = [
    { value: `${meta?.stats.labs ?? '—'}+`, label: 'Verified labs' },
    { value: `${meta?.stats.tests ?? '—'}+`, label: 'Tests & packages' },
    { value: `${meta?.stats.cities ?? '—'}`, label: 'Cities live' },
    { value: '6 AM', label: 'Earliest home collection' },
  ];
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-3xl bg-white shadow-card sm:grid-cols-4">
      {stats.map((s, i) => (
        <div key={s.label} className={`px-5 py-6 text-center ${i > 0 ? 'sm:border-l' : ''} ${i % 2 ? 'border-l sm:border-l' : ''} ${i > 1 ? 'border-t sm:border-t-0' : ''} border-slate-100`}>
          <p className="text-3xl font-extrabold tracking-tight text-brand-600">{s.value}</p>
          <p className="mt-1 text-sm font-medium text-ink-muted">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

export function Testimonials() {
  const { data } = useAsync(() => api('/reviews/recent').catch(() => ({ items: [] })), []);
  const items = data?.items || [];
  if (items.length === 0) return null;
  return (
    <section className="container-page mt-16">
      <SectionTitle title="Loved by patients" subtitle="Real reviews from completed bookings on Sanjibani" />
      <div className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {items.slice(0, 6).map((r) => (
          <figure key={r._id} className="card relative w-[85%] shrink-0 snap-center p-5 sm:w-auto" data-testid="testimonial">
            <Quote className="absolute right-4 top-4 h-8 w-8 text-brand-100" />
            <div className="flex gap-0.5 text-amber-400" role="img" aria-label={`${r.rating} out of 5`}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-current' : 'text-slate-200'}`} />
              ))}
            </div>
            <blockquote className="mt-3 text-[15px] leading-relaxed text-ink-soft">“{r.comment}”</blockquote>
            <figcaption className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-coral-500 text-sm font-bold text-white">
                {r.userName?.[0] || 'P'}
              </span>
              <span className="text-sm">
                <span className="flex items-center gap-1 font-bold text-ink">
                  {r.userName} <BadgeCheck className="h-4 w-4 text-coral-500" aria-label="Verified booking" />
                </span>
                <span className="text-xs text-ink-muted">booked at {r.labName}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  ['How does home sample collection work?', 'Pick a lab, add tests and choose “Home collection” with a time slot. A trained phlebotomist from the lab visits your address with a sealed kit, collects the sample and takes it to the lab.'],
  ['Are the labs on Sanjibani verified?', 'Yes. Every lab is reviewed by our team before it goes live, and accreditations such as NABL, CAP or ISO 15189 are shown on each lab’s page.'],
  ['When and how do I pay?', 'Pay by UPI at checkout (scan the QR with Google Pay, PhonePe or Paytm — no extra charges), or pay at the time of sample collection or lab visit. Prices shown are final — there are no hidden charges beyond the home collection fee shown in your cart.'],
  ['How will I get my report?', 'The lab uploads your report when it is ready. You can download it from “My bookings” and you also get an email when it is ready.'],
  ['Can I cancel or reschedule?', 'You can cancel any booking before the sample is collected from the booking page. To reschedule, cancel and book a new slot, or call the lab directly.'],
  ['Do I need to fast before my test?', 'Some tests need 10–12 hours of fasting. Each test shows its preparation instructions — check them before your slot.'],
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="container-page mt-16">
      <div className="grid gap-8 [&>*]:min-w-0 lg:grid-cols-[320px_1fr]">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Questions? We’ve got answers.</h2>
          <p className="mt-2 text-sm text-ink-muted">Can’t find what you’re looking for? Tap the help button and talk to us.</p>
        </div>
        <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-card">
          {FAQS.map(([q, a], i) => (
            <div key={q}>
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-ink hover:bg-slate-50"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                {q}
                <ChevronDown className={`h-5 w-5 shrink-0 text-ink-muted transition ${open === i ? 'rotate-180 text-brand-600' : ''}`} />
              </button>
              {open === i && <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">{a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
