import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, House, Search } from 'lucide-react';
import { LabCard } from '../components/Cards';
import { LabCardSkeleton } from '../components/Skeletons';
import { EmptyState, ErrorState } from '../components/ui';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { CATEGORIES } from '../lib/categories';
import { useSeo } from '../lib/seo';
import { useAsync } from '../lib/useAsync';

export default function Labs() {
  const { city, setCity } = useApp();
  const [params, setParams] = useSearchParams();

  // Shareable / search-engine links like /labs?city=Kolkata pick the city, then the param is dropped
  // so the city selector stays the single source of truth.
  const urlCity = params.get('city');
  useEffect(() => {
    if (!urlCity) return;
    setCity(urlCity);
    const next = new URLSearchParams(params);
    next.delete('city');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCity]);
  const [q, setQ] = useState(params.get('q') || '');
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'rating';
  const home = params.get('home') === '1';

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const labs = useAsync(
    () => api('/labs', { params: { city, q: params.get('q'), category, sort, homeCollection: home ? 'true' : '', limit: 48 } }),
    [city, params.toString()]
  );

  const where = city ? ` in ${city}` : '';
  const what = category ? `${category} — ` : '';
  useSeo({
    title: `${what}Diagnostic labs${where}`,
    description: `Find NABL-accredited diagnostic labs${where}${category ? ` offering ${category.toLowerCase()}` : ''}. Compare ratings, prices and report times, and book home sample collection online.`,
    path: `/labs${city ? `?city=${encodeURIComponent(city)}` : ''}`,
  });

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Diagnostic labs {city && <span className="text-brand-600">in {city}</span>}</h1>
      <p className="mt-1 text-ink-muted">Every lab is verified before it goes live on Sanjibani.</p>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            update('q', q.trim());
          }}
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-10" placeholder="Search labs by name or area" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search labs" />
        </form>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={category} onChange={(e) => update('category', e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select className="input w-auto" value={sort} onChange={(e) => update('sort', e.target.value)} aria-label="Sort by">
            <option value="rating">Top rated</option>
            <option value="price">Lowest price</option>
            <option value="fee">Lowest collection fee</option>
            <option value="name">Name A–Z</option>
          </select>
          <button className={`chip ${home ? 'chip-on' : 'chip-off'}`} onClick={() => update('home', home ? '' : '1')}>
            <House className="h-4 w-4" /> Home collection
          </button>
        </div>
      </div>

      <div className="mt-8">
        {labs.error ? (
          <ErrorState error={labs.error} onRetry={labs.reload} />
        ) : labs.loading && !labs.data ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <LabCardSkeleton key={i} />)}</div>
        ) : labs.data.items.length === 0 ? (
          <EmptyState icon={Building2} title="No labs match your filters" text="Try a different city, category or search term." />
        ) : (
          <>
            <p className="mb-4 text-sm font-medium text-ink-muted">{labs.data.total} labs</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {labs.data.items.map((lab) => (
                <LabCard key={lab._id} lab={lab} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
