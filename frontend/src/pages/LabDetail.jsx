import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, CarFront, Clock, House, MapPin, Phone, Search, ShoppingBag, Star } from 'lucide-react';
import { LabCover } from '../components/Brand';
import { TestRow, useAddToCart } from '../components/Cards';
import { Badge, ErrorState, Rating, Spinner } from '../components/ui';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { inr, shortDate } from '../lib/format';
import { clip, labJsonLd, useSeo } from '../lib/seo';
import { useAsync } from '../lib/useAsync';

export default function LabDetail() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useAsync(() => api(`/labs/${slug}`), [slug]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const cartApi = useAddToCart();
  const cart = useCart();

  const tests = useMemo(() => {
    if (!data) return [];
    const rx = q.trim().toLowerCase();
    return data.tests.filter((t) => (!category || t.category === category) && (!rx || t.name.toLowerCase().includes(rx)));
  }, [data, q, category]);

  const categories = useMemo(() => {
    const counts = {};
    data?.tests.forEach((t) => (counts[t.category] = (counts[t.category] || 0) + 1));
    return Object.entries(counts);
  }, [data]);

  const seoLab = data?.lab;
  useSeo(seoLab ? {
    title: `${seoLab.name}, ${seoLab.address?.area ? `${seoLab.address.area}, ` : ''}${seoLab.address?.city} — test prices & home collection`,
    description: clip(`${seoLab.name} in ${seoLab.address?.city}: ${seoLab.accreditations?.length ? `${seoLab.accreditations.join(', ')} accredited. ` : ''}${data.tests.length ? `${data.tests.length} tests from ₹${Math.min(...data.tests.map((t) => t.price))}` : 'Diagnostic tests'}${seoLab.homeCollection ? ', home sample collection available' : ''}. Reports in ${seoLab.reportTime}. ${seoLab.tagline || ''}`),
    path: `/labs/${seoLab.slug}`,
    type: 'business.business',
    jsonLd: labJsonLd(seoLab, data.tests),
  } : { path: `/labs/${slug}` });

  if (error) return <div className="container-page py-16"><ErrorState error={error} onRetry={reload} /></div>;
  if (loading && !data) return <Spinner className="min-h-[60vh]" />;
  const { lab, reviews } = data;
  const inCart = cart.lab?._id === lab._id && cart.count > 0;

  return (
    <div className="pb-24">
      <div className="container-page pt-6">
        <LabCover lab={lab} size="lg" className="h-44 rounded-3xl sm:h-56" />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">{lab.name}</h1>
                {lab.tagline && <p className="mt-1 text-ink-soft">{lab.tagline}</p>}
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
                  <MapPin className="h-4 w-4" /> {[lab.address.line, lab.address.area, lab.address.city, lab.address.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center">
                <Rating value={lab.rating} count={lab.ratingCount} className="text-sm" />
                <p className="mt-1 text-xs text-ink-muted">{lab.ratingCount} ratings</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {lab.accreditations.map((a) => (
                <Badge key={a} tone="brand">
                  <BadgeCheck className="h-3.5 w-3.5" /> {a} accredited
                </Badge>
              ))}
            </div>
          </div>
          <div className="card grid grid-cols-2 gap-4 p-4 text-sm lg:grid-cols-1">
            <p className="flex items-center gap-2">
              <House className="h-4 w-4 text-coral-500" />
              {lab.homeCollection ? (lab.homeCollectionFee ? `Home collection ${inr(lab.homeCollectionFee)}` : 'Free home collection') : 'Lab visit only'}
            </p>
            {lab.assistedVisit && (
              <p className="flex items-center gap-2">
                <CarFront className="h-4 w-4 text-coral-500" /> Assisted visit {lab.assistedVisitFee ? inr(lab.assistedVisitFee) : 'free'} — pickup, stay & drop
              </p>
            )}
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-coral-500" /> Reports in {lab.reportTime}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-coral-500" /> Open {lab.opensAt} – {lab.closesAt}
            </p>
            <a href={`tel:${lab.phone}`} className="flex items-center gap-2 font-semibold text-brand-700">
              <Phone className="h-4 w-4 text-coral-500" /> {lab.phone}
            </a>
          </div>
        </div>
        {lab.description && <p className="mt-5 max-w-3xl text-sm leading-relaxed text-ink-soft">{lab.description}</p>}
      </div>

      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 hidden text-xs font-bold uppercase tracking-wider text-ink-muted lg:block">Categories</p>
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
            <button className={`chip lg:justify-between ${!category ? 'chip-on' : 'chip-off'}`} onClick={() => setCategory('')}>
              All tests <span className="opacity-70">{data.tests.length}</span>
            </button>
            {categories.map(([c, n]) => (
              <button key={c} className={`chip lg:justify-between ${category === c ? 'chip-on' : 'chip-off'}`} onClick={() => setCategory(c)}>
                {c} <span className="opacity-70">{n}</span>
              </button>
            ))}
          </div>
        </aside>

        <section>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input className="input pl-10" placeholder={`Search in ${lab.name}`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tests in this lab" />
          </div>
          <div className="card mt-4 divide-y divide-slate-100 px-4 sm:px-6">
            {tests.length === 0 && <p className="py-10 text-center text-sm text-ink-muted">No tests match “{q}”.</p>}
            {tests.map((t) => (
              <TestRow key={t._id} test={t} lab={lab} cartApi={cartApi} />
            ))}
          </div>

          <h2 className="mt-12 text-xl font-extrabold">Patient reviews</h2>
          {reviews.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">No reviews yet.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {reviews.map((r) => (
                <div key={r._id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{r.userName}</p>
                    <span className="flex items-center gap-0.5 text-amber-500" aria-label={`${r.rating} out of 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-current' : 'text-slate-200'}`} />
                      ))}
                    </span>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-ink-soft">{r.comment}</p>}
                  <p className="mt-2 text-xs text-ink-muted">{shortDate(r.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {inCart && (
        <div className="fixed inset-x-0 bottom-4 z-30 px-4">
          <Link to="/cart" className="mx-auto flex max-w-xl items-center justify-between rounded-2xl bg-brand-600 px-5 py-3.5 font-bold text-white shadow-lift hover:bg-brand-700" data-testid="view-cart-bar">
            <span>
              {cart.count} {cart.count === 1 ? 'test' : 'tests'} · {inr(cart.subtotal)}
            </span>
            <span className="flex items-center gap-2">
              View cart <ShoppingBag className="h-5 w-5" />
            </span>
          </Link>
        </div>
      )}
      {cartApi.modal}
    </div>
  );
}
