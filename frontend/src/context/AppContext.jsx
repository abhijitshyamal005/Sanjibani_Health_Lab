import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { api } from '../lib/api';

const AppContext = createContext(null);
const CITY_KEY = 'patholy.city';

/** App-wide: platform metadata, selected city, and toasts. */
export function AppProvider({ children }) {
  const [meta, setMeta] = useState(null);
  const [city, setCityState] = useState(() => {
    try {
      return localStorage.getItem(CITY_KEY) || '';
    } catch {
      return '';
    }
  });
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const loadMeta = useCallback(() => api('/meta').then(setMeta).catch(() => {}), []);
  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const setCity = useCallback((c) => {
    setCityState(c);
    try {
      localStorage.setItem(CITY_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const toast = useCallback((message, type = 'success') => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const value = useMemo(() => ({ meta, reloadMeta: loadMeta, city, setCity, toast }), [meta, loadMeta, city, setCity, toast]);

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lift animate-[toast_.25s_ease-out] ${
              t.type === 'error' ? 'bg-red-600' : 'bg-ink'
            }`}
          >
            {t.type === 'error' ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} aria-label="Dismiss">
              <X className="h-4 w-4 opacity-70" />
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
