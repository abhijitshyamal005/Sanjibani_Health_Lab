import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { EmptyState, ErrorState, PageHeader, Spinner, StatusBadge } from '../components/ui';
import { api } from '../lib/api';
import { inr, initials, shortDate } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export default function PartnerPatients() {
  const { data, loading, error, reload } = useAsync(() => api('/partner/patients'), []);
  const [q, setQ] = useState('');

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Spinner />;
  const rx = q.trim().toLowerCase();
  const items = data.items.filter((p) => !rx || p.name.toLowerCase().includes(rx) || p.phone.includes(rx));

  return (
    <>
      <PageHeader title="Patients" subtitle={`${data.items.length} patients have booked with your lab`} />
      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input className="input pl-10" placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search patients" />
      </div>
      {data.items.length === 0 ? (
        <EmptyState icon={Users} title="No patients yet" text="Patients who book with your lab will be listed here." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Patient</th>
                <th className="px-3 py-3 font-semibold">Phone</th>
                <th className="px-3 py-3 text-right font-semibold">Bookings</th>
                <th className="px-3 py-3 text-right font-semibold">Paid</th>
                <th className="px-3 py-3 font-semibold">Last booking</th>
                <th className="px-5 py-3 font-semibold">Last status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((p) => (
                <tr key={`${p.name}-${p.phone}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-xs font-bold text-brand-700">{initials(p.name)}</span>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs capitalize text-ink-muted">{p.age} yrs · {p.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><a className="font-medium text-brand-700" href={`tel:${p.phone}`}>{p.phone}</a></td>
                  <td className="px-3 py-3 text-right font-semibold">{p.bookings}</td>
                  <td className="px-3 py-3 text-right">{inr(p.spent)}</td>
                  <td className="px-3 py-3 text-ink-soft">{shortDate(p.lastBooking)}</td>
                  <td className="px-5 py-3"><StatusBadge status={p.lastStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
