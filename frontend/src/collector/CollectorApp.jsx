import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  CalendarClock,
  CircleCheck,
  Droplet,
  IndianRupee,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Route,
  TestTube,
  Wallet,
  Gift,
} from 'lucide-react';
import { Logo } from '../components/Brand';
import { Badge, Button, EmptyState, ErrorState, Spinner, StatusBadge, Tabs } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { COLLECTION_TYPES, FIELD_FLOW, FIELD_STATUS, inr, initials, nextFieldStep, slotDate, slotTime, ymd } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const fullAddress = (a) => [a?.line, a?.area, a?.city, a?.pincode].filter(Boolean).join(', ');
const mapsUrl = (a) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(a))}`;

/** Google Maps directions through all of today's pending stops, in slot order. */
function routeUrl(jobs) {
  const stops = jobs.filter((j) => j.status === 'confirmed').map((j) => fullAddress(j.address)).filter(Boolean);
  if (stops.length === 0) return null;
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(0, -1).slice(0, 9).join('|');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''}&travelmode=driving`;
}

function FieldProgress({ job }) {
  const flow = FIELD_FLOW[job.collectionType] || [];
  const current = job.status === 'confirmed' ? flow.indexOf(job.fieldStatus || 'assigned') : flow.length;
  return (
    <ol className="flex items-center gap-1" aria-label="Job progress">
      {[...flow, 'collected'].map((s, i) => (
        <li key={s} className="flex-1">
          <span className={`block h-1.5 rounded-full ${i <= current ? 'bg-brand-500' : 'bg-slate-200'}`} title={FIELD_STATUS[s]?.label || 'Sample collected'} />
        </li>
      ))}
    </ol>
  );
}

/** Group tests by sample type so the collector knows which tubes/containers to carry. */
function SampleChecklist({ items }) {
  const bySample = {};
  items.forEach((i) => {
    const key = i.sampleType || 'Blood';
    (bySample[key] = bySample[key] || []).push(i);
  });
  const preps = [...new Set(items.map((i) => i.preparation).filter((p) => p && p !== 'No special preparation'))];
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Samples to collect</p>
      <ul className="mt-2 space-y-1.5">
        {Object.entries(bySample).map(([type, tests]) => (
          <li key={type} className="flex gap-2 text-sm">
            {type === 'Blood' ? <Droplet className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /> : <TestTube className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
            <span>
              <b>{type === 'None' ? 'At lab (no sample)' : type}</b> — {tests.map((t) => t.name).join(', ')}
            </span>
          </li>
        ))}
      </ul>
      {preps.length > 0 && <p className="mt-2 text-xs text-amber-800">Check with patient: {preps.join(' · ')}</p>}
    </div>
  );
}

function JobCard({ job, onUpdate }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const next = nextFieldStep(job);
  const assisted = job.collectionType === 'assisted_visit';
  // After pickup, directions point to the lab; otherwise to the patient's address.
  const heading = assisted && ['picked_up'].includes(job.fieldStatus) ? job.lab?.address : job.address;
  const progress = async (step) => {
    setBusy(true);
    try {
      const { booking } = await api(`/collector/jobs/${job._id}/progress`, { method: 'PATCH', body: { step } });
      onUpdate(booking);
      toast(step === 'payment_collected' ? 'Payment recorded' : step === 'sample_collected' ? 'Sample marked as collected' : FIELD_STATUS[step]?.label || 'Updated');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card overflow-hidden" data-testid="collector-job">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={assisted ? 'violet' : 'coral'}>{COLLECTION_TYPES[job.collectionType]?.label}</Badge>
            {job.status === 'confirmed' ? <Badge tone="amber">{FIELD_STATUS[job.fieldStatus || 'assigned']?.label}</Badge> : <StatusBadge status={job.status} />}
          </div>
          <p className="mt-2 text-lg font-extrabold leading-tight">{job.patient.name}</p>
          <p className="text-sm text-ink-muted">
            {job.patient.age} yrs · <span className="capitalize">{job.patient.gender}</span> · #{job.code}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-brand-50 px-3 py-2 text-center">
          <p className="text-[11px] font-semibold uppercase text-brand-700">{slotDate(job.slot.date).split(',')[0]}</p>
          <p className="text-sm font-extrabold text-brand-800">{slotTime(job.slot.time).split(' – ')[0]}</p>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 px-4 py-3 text-sm">
        <p className="flex gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
          <span>
            <span className="text-xs font-semibold uppercase text-ink-muted">{assisted ? 'Pick up & drop back at' : 'Collect at'}</span>
            <br />
            {fullAddress(job.address)}
          </span>
        </p>
        {assisted && (
          <p className="flex gap-2">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
            <span>
              <span className="text-xs font-semibold uppercase text-ink-muted">Accompany patient to</span>
              <br />
              {job.lab?.name}, {fullAddress(job.lab?.address)}
            </span>
          </p>
        )}
        <SampleChecklist items={job.items} />
        {job.notes && <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">Patient note: {job.notes}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {job.amountToCollect > 0 ? (
            <span className="rounded-lg bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">Collect {inr(job.amountToCollect)} (cash/UPI)</span>
          ) : job.paymentStatus === 'verifying' ? (
            <span className="rounded-lg bg-violet-50 px-2.5 py-1 font-semibold text-violet-700">Paid by UPI (lab verifying) — don’t collect cash</span>
          ) : (
            <span className="rounded-lg bg-coral-50 px-2.5 py-1 font-semibold text-coral-700">Prepaid — nothing to collect</span>
          )}
          {job.collectorEarning > 0 && (
            <span className="flex items-center gap-1 text-sm font-semibold text-brand-700">
              <Wallet className="h-4 w-4" /> You earn {inr(job.collectorEarning)}
            </span>
          )}
        </div>
        {job.status === 'confirmed' && <FieldProgress job={job} />}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3">
        <a href={`tel:${job.patient.phone}`} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-bold text-ink hover:bg-slate-200">
          <Phone className="h-4 w-4" /> Call patient
        </a>
        <a href={mapsUrl(heading)} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-bold text-ink hover:bg-slate-200">
          <Navigation className="h-4 w-4" /> Directions
        </a>
        {next && next.step === 'dropped_home' && job.amountToCollect > 0 && (
          <Button size="lg" variant="accent" className="col-span-2" loading={busy} onClick={() => progress('payment_collected')} data-testid="collector-payment">
            <IndianRupee className="h-5 w-5" /> {inr(job.amountToCollect)} collected from patient
          </Button>
        )}
        {next && (
          <Button size="lg" className="col-span-2" loading={busy} onClick={() => progress(next.step)} data-testid="collector-next">
            {next.step === 'sample_collected' && <CircleCheck className="h-5 w-5" />}
            {next.label}
          </Button>
        )}
        {!next && job.amountToCollect > 0 && job.status !== 'cancelled' && (
          <Button size="lg" variant="accent" className="col-span-2" loading={busy} onClick={() => progress('payment_collected')} data-testid="collector-payment">
            <IndianRupee className="h-5 w-5" /> {inr(job.amountToCollect)} collected from patient
          </Button>
        )}
      </div>
    </article>
  );
}

function Earnings({ summary }) {
  const e = summary?.earnings;
  const { data, loading, error, reload } = useAsync(() => api('/collector/earnings'), []);
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-forest-from to-forest-to p-5 text-white shadow-lift">
        <p className="text-sm text-white/75">Earned this month</p>
        <p className="mt-1 text-4xl font-extrabold" data-testid="earnings-month">{inr(e?.month ?? 0)}</p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div><p className="text-white/70">Today</p><p className="font-bold">{inr(e?.today ?? 0)}</p></div>
          <div><p className="text-white/70">Last 7 days</p><p className="font-bold">{inr(e?.week ?? 0)}</p></div>
          <div><p className="text-white/70">All time</p><p className="font-bold">{inr(e?.total ?? 0)}</p></div>
        </div>
        <p className="mt-4 text-xs text-white/70">
          Your rate: {inr(e?.payoutHome ?? 0)} per home collection · {inr(e?.payoutAssisted ?? 0)} per assisted visit
        </p>
      </div>
      <div className="card overflow-hidden">
        <p className="border-b border-slate-100 px-4 py-3 font-bold">This month’s collections</p>
        {error ? (
          <div className="p-4"><ErrorState error={error} onRetry={reload} /></div>
        ) : loading && !data ? (
          <Spinner />
        ) : data.jobs.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-muted">No completed collections this month yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.jobs.map((j) => (
              <li key={j._id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{j.patientName}{j.area ? ` · ${j.area}` : ''}</p>
                  <p className="text-xs text-ink-muted">{slotDate(j.slot.date)} · {COLLECTION_TYPES[j.collectionType]?.short} · #{j.code}</p>
                </div>
                <span className="font-bold text-brand-700">+{inr(j.collectorEarning || 0)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function CollectorApp() {
  const { user, lab, logout } = useAuth();
  const navigate = useNavigate();
  const [scope, setScope] = useState('today');
  const summary = useAsync(() => api('/collector/summary'), []);
  const jobs = useAsync(
    () =>
      scope === 'earnings'
        ? Promise.resolve({ items: [] })
        : api('/collector/jobs', { params: scope === 'today' ? { date: ymd(0), scope: 'all' } : { scope: scope === 'upcoming' ? 'active' : 'done' } }),
    [scope]
  );

  const items = (jobs.data?.items || []).filter((j) => (scope === 'upcoming' ? j.slot.date > ymd(0) : true));
  const update = (booking) => {
    jobs.setData((d) => ({ ...d, items: d.items.map((j) => (j._id === booking._id ? { ...j, ...booking } : j)) }));
    summary.reload();
  };
  const today = summary.data?.today;
  const route = scope === 'today' ? routeUrl(items) : null;

  return (
    <div className="min-h-screen bg-canvas pb-10">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4">
          <Logo to="/collector" suffix="Collector" />
          <Link to="/invite" className="ml-auto flex items-center gap-1.5 rounded-lg p-2 text-sm font-semibold text-coral-700 hover:bg-coral-50" aria-label="Invite friends" data-testid="invite-button">
            <Gift className="h-5 w-5" /> <span className="hidden sm:inline">Invite</span>
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="rounded-lg p-2 text-ink-muted hover:bg-slate-100"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-5">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 text-lg font-extrabold text-white">{initials(user?.name)}</span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold">Hi, {user?.name?.split(' ')[0]}</h1>
            <p className="truncate text-sm text-ink-muted">{summary.data?.lab?.name || lab?.name}</p>
          </div>
          <button onClick={() => { jobs.reload(); summary.reload(); }} className="ml-auto rounded-xl border border-slate-200 bg-white p-2.5 text-ink-muted hover:text-brand-600" aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Route, label: 'Jobs today', value: today?.total ?? '—' },
            { icon: CalendarClock, label: 'Pending', value: today?.pending ?? '—' },
            { icon: IndianRupee, label: 'Cash to collect', value: today ? inr(today.amountToCollect || 0) : '—' },
            { icon: Wallet, label: 'Earned today', value: summary.data ? inr(summary.data.earnings?.today || 0) : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-3 text-center">
              <Icon className="mx-auto h-5 w-5 text-brand-500" />
              <p className="mt-1 text-xl font-extrabold">{value}</p>
              <p className="text-xs font-medium text-ink-muted">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Tabs
            value={scope}
            onChange={setScope}
            tabs={[
              { value: 'today', label: 'Today' },
              { value: 'upcoming', label: 'Upcoming', count: summary.data?.upcoming },
              { value: 'done', label: 'Completed' },
              { value: 'earnings', label: 'Earnings' },
            ]}
          />
        </div>

        {route && (
          <a href={route} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 py-3 text-sm font-bold text-brand-700 hover:bg-brand-100">
            <Route className="h-4 w-4" /> Open today’s route in Google Maps
          </a>
        )}

        <div className="mt-4 space-y-4">
          {scope === 'earnings' ? (
            <Earnings summary={summary.data} />
          ) : jobs.error ? (
            <ErrorState error={jobs.error} onRetry={jobs.reload} />
          ) : jobs.loading && !jobs.data ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState icon={Route} title={scope === 'today' ? 'No jobs today' : scope === 'upcoming' ? 'No upcoming jobs' : 'Nothing completed yet'} text="Jobs assigned by your lab will show up here." />
          ) : (
            items.map((job) => <JobCard key={job._id} job={job} onUpdate={update} />)
          )}
        </div>
      </main>
    </div>
  );
}
