import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FlaskConical, TrendingUp } from 'lucide-react';
import { OfferCard, useAddToCart } from '../components/Cards';
import { OfferSkeleton } from '../components/Skeletons';
import { EmptyState, ErrorState } from '../components/ui';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { CATEGORIES } from '../lib/categories';
import { inr } from '../lib/format';
import { useSeo } from '../lib/seo';
import { useAsync } from '../lib/useAsync';
import SearchBar from '../components/SearchBar';

export default function CompareTests() {
  const { city } = useApp();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'price';
  const cartApi = useAddToCart();

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const result = useAsync(() => api('/tests/search', { params: { q, category, city, sort, limit: 100 } }), [q, category, city, sort]);

  // Group offers by test name so patients see "HbA1c at 4 labs from ₹349".
  const groups = useMemo(() => {
    const map = new Map();
    result.data?.items.forEach((t) => {
      if (!map.has(t.name)) map.set(t.name, []);
      map.get(t.name).push(t);
    });
    return [...map.entries()];
  }, [result.data]);

  const cheapest = groups.length && q ? Math.min(...groups[0][1].map((t) => t.price)) : null;
  const subject = q || category;
  useSeo({
    title: subject ? `${subject} test price${city ? ` in ${city}` : ''} — compare ${groups[0]?.[1].length > 1 ? `${groups[0][1].length} labs` : 'labs'}` : 'Compare lab test prices',
    description: subject
      ? `Compare ${subject} prices across trusted labs${city ? ` in ${city}` : ''}${cheapest ? `, starting at ₹${cheapest}` : ''}. Book home sample collection and get reports online.`
      : 'Compare prices for blood tests, health packages and scans across trusted diagnostic labs. Book home sample collection online.',
    path: q ? `/tests?q=${encodeURIComponent(q)}` : category ? `/tests?category=${encodeURIComponent(category)}` : '/tests',
  });

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Compare test prices</h1>
      <p className="mt-1 text-ink-muted">Same test, different labs — pick the best price, rating and report time{city ? ` in ${city}` : ''}.</p>
      <div className="mt-6 max-w-2xl">
        <SearchBar key={q} initial={q} />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <button className={`chip ${!category ? 'chip-on' : 'chip-off'}`} onClick={() => update('category', '')}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip ${category === c ? 'chip-on' : 'chip-off'}`} onClick={() => update('category', c)}>
              {c}
            </button>
          ))}
        </div>
        <select className="input w-full shrink-0 sm:w-48" value={sort} onChange={(e) => update('sort', e.target.value)} aria-label="Sort offers">
          <option value="price">Lowest price</option>
          <option value="rating">Top rated lab</option>
          <option value="discount">Biggest discount</option>
          <option value="name">Test name</option>
        </select>
      </div>

      <div className="mt-8 space-y-10">
        {result.error ? (
          <ErrorState error={result.error} onRetry={result.reload} />
        ) : result.loading && !result.data ? (
          <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <OfferSkeleton key={i} />)}</div>
        ) : groups.length === 0 ? (
          <EmptyState icon={FlaskConical} title="No tests found" text={q ? `We couldn’t find “${q}”. Try a shorter name like “thyroid”.` : 'Try another category or city.'} />
        ) : (
          groups.map(([name, offers]) => {
            const prices = offers.map((o) => o.price);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            return (
              <section key={name} data-testid="compare-group">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-extrabold">{name}</h2>
                  <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                    <TrendingUp className="h-4 w-4 text-brand-600" />
                    {offers.length} {offers.length === 1 ? 'lab' : 'labs'} · {inr(min)}
                    {max > min && ` – ${inr(max)}`}
                    {max > min && <span className="font-semibold text-brand-700"> · save up to {inr(max - min)}</span>}
                  </p>
                </div>
                <div className="space-y-3">
                  {offers.map((t) => (
                    <OfferCard key={t._id} test={t} cartApi={cartApi} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
      {cartApi.modal}
    </div>
  );
}
