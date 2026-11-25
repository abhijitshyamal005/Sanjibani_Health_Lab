import { Link } from 'react-router-dom';
import { CalendarClock, ClipboardList, FlaskConical, IndianRupee, Star, Users, Wallet } from 'lucide-react';
import { BarChart, ErrorState, PageHeader, Spinner, StatCard, StatusBadge } from '../components/ui';
import { api } from '../lib/api';
import { FLOW, STATUS, compactInr, inr, slotDate, slotTime } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { usePartner } from './PartnerApp';

function StatusBanner({ lab, totalTests }) {
  if (lab.status === 'approved') return null;
  const content = {
    pending: ['Your lab is under review', 'Our team usually verifies new labs within 24 hours. Meanwhile, add your tests and prices so you’re ready to go live.', 'bg-amber-50 text-amber-900 border-amber-200'],
    rejected: ['Your lab was not approved', lab.statusNote ? `Reason: ${lab.statusNote}. Update your profile to resubmit.` : 'Update your profile to resubmit.', 'bg-red-50 text-red-900 border-red-200'],
    suspended: ['Your lab is suspended', lab.statusNote || 'Contact Sanjibani support to restore your listing.', 'bg-slate-100 text-slate-800 border-slate-200'],
  }[lab.status];
  return (
    <div className={`mb-6 rounded-2xl border p-4 ${content[2]}`}>
      <p className="font-bold">{content[0]}</p>
      <p className="mt-1 text-sm opacity-90">{content[1]}</p>
      {totalTests === 0 && (
        <Link to="/partner/tests" className="mt-3 inline-block text-sm font-bold underline">
          Add your first test →
        </Link>
      )}
    </div>
  );
}

export default function PartnerDashboard() {
  const { lab } = usePartner();
  const { data, loading, error, reload } = useAsync(() => api('/partner/stats'), []);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Spinner />;
  const { totals, statusCounts, last7Days, topTests, recentBookings, recentReviews } = data;
  const actionable = statusCounts.pending + statusCounts.confirmed + statusCounts.sample_collected + statusCounts.report_ready;

  return (
    <>
      <PageHeader title={`Hello, ${lab.name}`} subtitle="Here’s how your lab is doing" />
      <StatusBanner lab={data.lab} totalTests={totals.totalTests} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total bookings" value={totals.bookings} hint={`${actionable} in progress`} />
        <StatCard icon={IndianRupee} tone="coral" label="Revenue (completed)" value={compactInr(totals.revenue)} hint={`${inr(totals.pipelineValue)} in pipeline`} />
        <StatCard icon={Users} tone="violet" label="Patients served" value={totals.patients} />
        <StatCard icon={CalendarClock} tone="amber" label="Collections today" value={totals.todaysCollections} />
        <StatCard icon={FlaskConical} tone="sky" label="Active tests" value={totals.activeTests} hint={`${totals.totalTests} listed`} />
        <StatCard icon={Star} tone="amber" label="Rating" value={data.lab.ratingCount ? `${data.lab.rating} ★` : '—'} hint={`${data.lab.ratingCount} reviews`} />
        <StatCard icon={Wallet} tone="slate" label="Avg booking value" value={totals.bookings ? inr(Math.round((totals.revenue + totals.pipelineValue) / Math.max(1, totals.bookings - statusCounts.cancelled))) : '—'} />
        <StatCard icon={ClipboardList} tone="slate" label="Cancelled" value={statusCounts.cancelled} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-bold">Bookings, last 7 days</h2>
          <div className="mt-5">
            <BarChart data={last7Days.map((d) => ({ label: slotDate(d.date).split(',')[0], value: d.count, title: `${slotDate(d.date)}: ${d.count} bookings, ${inr(d.revenue)}` }))} />
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Booking pipeline</h2>
          <ul className="mt-4 space-y-3">
            {[...FLOW, 'cancelled'].map((s) => {
              const total = Math.max(1, totals.bookings);
              return (
                <li key={s}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{STATUS[s].label}</span>
                    <span className="font-bold">{statusCounts[s]}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${s === 'cancelled' ? 'bg-red-400' : 'bg-brand-500'}`} style={{ width: `${(statusCounts[s] / total) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="font-bold">Recent bookings</h2>
            <Link to="/partner/bookings" className="text-sm font-bold text-brand-700 hover:underline">View all</Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-ink-muted">No bookings yet. They’ll show up here as soon as patients book.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Patient</th>
                    <th className="px-3 py-2.5 font-semibold">Slot</th>
                    <th className="px-3 py-2.5 font-semibold">Amount</th>
                    <th className="px-5 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.map((b) => (
                    <tr key={b._id}>
                      <td className="px-5 py-3">
                        <p className="font-semibold">{b.patient.name}</p>
                        <p className="max-w-[220px] truncate text-xs text-ink-muted">{b.items.map((i) => i.name).join(', ')}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink-soft">{slotDate(b.slot.date)}<br /><span className="text-xs text-ink-muted">{slotTime(b.slot.time)}</span></td>
                      <td className="px-3 py-3 font-semibold">{inr(b.total)}</td>
                      <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-bold">Top tests</h2>
            {topTests.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No data yet.</p>
            ) : (
              <ol className="mt-3 space-y-2.5">
                {topTests.map((t, i) => (
                  <li key={t.name} className="flex items-center gap-3 text-sm">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span>
                    <span className="flex-1 truncate">{t.name}</span>
                    <span className="font-semibold">{t.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="card p-5">
            <h2 className="font-bold">Latest reviews</h2>
            {recentReviews.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No reviews yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {recentReviews.map((r) => (
                  <li key={r._id} className="text-sm">
                    <p className="font-semibold">{'★'.repeat(r.rating)}<span className="text-slate-300">{'★'.repeat(5 - r.rating)}</span> <span className="text-ink-muted">· {r.user?.name}</span></p>
                    {r.comment && <p className="mt-0.5 text-ink-soft">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
