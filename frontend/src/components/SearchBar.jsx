import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';
import { categoryMeta } from '../lib/categories';
import { inr } from '../lib/format';

/** Test search with live suggestions (debounced), keyboard navigation and a Search button. */
export default function SearchBar({ initial = '', large = false }) {
  const [q, setQ] = useState(initial);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const navigate = useNavigate();
  const boxRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      return undefined;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      api('/tests/suggest', { params: { q: term } })
        .then((d) => !cancelled && setItems(d.items || []))
        .catch(() => !cancelled && setItems([]));
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    const close = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (term) => {
    setOpen(false);
    navigate(term.trim() ? `/tests?q=${encodeURIComponent(term.trim())}` : '/tests');
  };

  const onKeyDown = (e) => {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      setQ(items[active].name);
      go(items[active].name);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showList = open && items.length > 0;

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className={`flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card transition focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-500/10 ${large ? 'sm:p-2' : ''}`}
        role="search"
      >
        <Search className="ml-3 h-5 w-5 shrink-0 text-ink-muted" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search tests like CBC, Thyroid, Vitamin D…"
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] placeholder:text-slate-400 focus:outline-none"
          aria-label="Search tests"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          data-testid="search-input"
          autoComplete="off"
        />
        <button className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 px-5 text-sm font-bold text-white transition hover:from-brand-700 hover:to-brand-500">
          Search
        </button>
      </form>
      {showList && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white py-1.5 shadow-lift" data-testid="search-suggestions">
          {items.map((it, i) => {
            const meta = categoryMeta(it.category);
            const Icon = meta.icon;
            return (
              <li
                key={it.name}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQ(it.name);
                  go(it.name);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 ${i === active ? 'bg-brand-50' : ''}`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{it.name}</span>
                  <span className="flex items-center gap-1 text-xs text-ink-muted">
                    <TrendingUp className="h-3 w-3" /> {it.labCount} {it.labCount === 1 ? 'lab' : 'labs'} · {it.category}
                  </span>
                </span>
                <span className="text-right text-xs text-ink-muted">
                  from
                  <span className="block text-sm font-extrabold text-ink">{inr(it.minPrice)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
