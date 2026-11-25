import { useMemo, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import {
  Building2,
  CircleCheck,
  ClipboardList,
  FlaskConical,
  IndianRupee,
  LayoutDashboard,
  MapPin,
  Search,
  Store,
  Ticket,
  UserRound,
  Users,
} from 'lucide-react';
import { DashboardShell } from '../components/Layouts';
import AdminCoupons from './AdminCoupons';
import {
  Badge,
  BarChart,
  Button,
  EmptyState,
  ErrorState,
  Field,
  LabStatusBadge,
  Modal,
  PageHeader,
  PaymentBadge,
  Spinner,
  StatCard,
  StatusBadge,
  Tabs,
} from '../components/ui';
import { LabCover } from '../components/Brand';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { LAB_STATUS, STATUS, compactInr, dateTime, inr, shortDate, slotDate } from '../lib/format';
import { useAsync } from '../lib/useAsync';

function Overview() {
  const { data, loading, error, reload } = useAsync(() => api('/admin/stats'), []);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Spinner />;
  const { users, labs, bookings, totals, last14Days, labsByCity, topLabs, recentUsers } = data;

  return (
    <>
      <PageHeader title="Platform overview" subtitle="Everything happening on Patholy" />
      {labs.pending > 0 && (
        <Link to="/admin/labs?status=pending" className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 hover:bg-amber-100">
          <span className="font-semibold">{labs.pending} {labs.pending === 1 ? 'lab is' : 'labs are'} waiting for approval</span>
          <span className="text-sm font-bold">Review →</span>
        </Link>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={totals.users} hint={`${users.admin} admin${users.admin === 1 ? '' : 's'}`} />
        <StatCard icon={UserRound} tone="sky" label="Patients" value={users.patient} />
        <StatCard icon={Store} tone="violet" label="Lab partners" value={users.lab} />
        <StatCard icon={Building2} tone="amber" label="Labs" value={totals.labs} hint={`${labs.approved} live · ${labs.pending} pending`} />
        <StatCard icon={ClipboardList} tone="brand" label="Bookings" value={totals.bookings} hint={`${bookings.completed} completed`} />
        <StatCard icon={IndianRupee} tone="coral" label="Gross booking value" value={compactInr(totals.gbv)} hint={`${inr(totals.completedValue)} completed`} />
        <StatCard icon={FlaskConical} tone="slate" label="Tests listed" value={totals.tests} />
        <StatCard icon={MapPin} tone="slate" label="Cities live" value={labsByCity.length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-bold">Bookings, last 14 days</h2>
          <div className="mt-5">
            <BarChart data={last14Days.map((d) => ({ label: d.date.slice(8), value: d.count, title: `${slotDate(d.date)}: ${d.count}` }))} color="bg-coral-500" />
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Bookings by status</h2>
          <ul className="mt-4 space-y-2.5">
            {Object.keys(STATUS).map((s) => (
              <li key={s} className="flex items-center justify-between text-sm">
                <StatusBadge status={s} />
                <span className="font-bold">{bookings[s] || 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="font-bold">Top labs</h2>
          <ol className="mt-4 space-y-3">
            {topLabs.map((l, i) => (
              <li key={l.name} className="flex items-center gap-3 text-sm">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{l.name}</p>
                  <p className="text-xs text-ink-muted">{l.city} · {l.rating}★</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{l.bookings}</p>
                  <p className="text-xs text-ink-muted">{compactInr(l.value)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Live labs by city</h2>
          <ul className="mt-4 space-y-3">
            {labsByCity.map((c) => (
              <li key={c.city}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{c.city}</span>
                  <span className="font-bold">{c.count}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${(c.count / Math.max(...labsByCity.map((x) => x.count))) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">New sign-ups</h2>
          <ul className="mt-4 space-y-3">
            {recentUsers.map((u) => (
              <li key={u._id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{u.name}</p>
                  <p className="truncate text-xs text-ink-muted">{u.email}</p>
                </div>
                <Badge tone={u.role === 'lab' ? 'violet' : u.role === 'admin' ? 'slate' : 'blue'}>{u.role === 'lab' ? 'Lab' : u.role}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function AdminLabs() {
  const { toast, reloadMeta } = useApp();
  const initial = new URLSearchParams(window.location.search).get('status') || 'all';
  const [tab, setTab] = useState(initial);
  const { data, loading, error, reload, setData } = useAsync(() => api('/admin/labs'), []);
  const [dialog, setDialog] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const items = useMemo(() => data?.items || [], [data]);
  const counts = useMemo(() => {
    const c = { all: items.length };
    items.forEach((l) => (c[l.status] = (c[l.status] || 0) + 1));
    return c;
  }, [items]);

  const setStatus = async (lab, status, statusNote) => {
    setBusy(true);
    try {
      const res = await api(`/admin/labs/${lab._id}/status`, { method: 'PATCH', body: { status, note: statusNote || undefined } });
      setData((d) => ({ ...d, items: d.items.map((l) => (l._id === lab._id ? { ...l, ...res.lab, owner: l.owner } : l)) }));
      toast(`${lab.name} → ${LAB_STATUS[status].label}`);
      reloadMeta();
      setDialog(null);
      setNote('');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const filtered = items.filter((l) => tab === 'all' || l.status === tab);

  return (
    <>
      <PageHeader title="Labs" subtitle="Approve new labs and manage existing ones" />
      <Tabs value={tab} onChange={setTab} tabs={['all', 'pending', 'approved', 'rejected', 'suspended'].map((s) => ({ value: s, label: s === 'all' ? 'All' : LAB_STATUS[s].label, count: counts[s] || 0 }))} />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <div className="md:col-span-2"><EmptyState icon={Building2} title="No labs here" /></div>
        ) : (
          filtered.map((l) => (
            <div key={l._id} className="card overflow-hidden" data-testid="admin-lab">
              <div className="flex gap-4 p-4">
                <LabCover lab={l} className="h-16 w-16 shrink-0 rounded-xl [&>div]:hidden" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{l.name}</p>
                    <LabStatusBadge status={l.status} />
                  </div>
                  <p className="text-sm text-ink-muted">{[l.address?.area, l.address?.city, l.address?.pincode].filter(Boolean).join(', ')}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Owner: {l.owner?.name} · {l.owner?.email} · {l.owner?.phone}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 border-y border-slate-100 text-center text-sm">
                {[
                  ['Tests', l.testCount],
                  ['Bookings', l.bookingCount],
                  ['Rating', l.ratingCount ? `${l.rating}★` : '—'],
                  ['Joined', shortDate(l.createdAt).replace(/ \d{4}$/, '')],
                ].map(([k, v]) => (
                  <div key={k} className="py-2.5">
                    <p className="font-bold">{v}</p>
                    <p className="text-xs text-ink-muted">{k}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 p-3">
                {l.accreditations?.map((a) => <Badge key={a} tone="brand">{a}</Badge>)}
                {l.statusNote && <span className="text-xs text-ink-muted">Note: {l.statusNote}</span>}
                <div className="ml-auto flex gap-2">
                  {l.status !== 'approved' && (
                    <Button size="sm" onClick={() => setStatus(l, 'approved')} disabled={busy} data-testid="approve-lab">
                      <CircleCheck className="h-4 w-4" /> Approve
                    </Button>
                  )}
                  {l.status === 'pending' && <Button size="sm" variant="danger" onClick={() => setDialog({ lab: l, status: 'rejected' })}>Reject</Button>}
                  {l.status === 'approved' && <Button size="sm" variant="outline" onClick={() => setDialog({ lab: l, status: 'suspended' })}>Suspend</Button>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <Modal
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog?.status === 'rejected' ? `Reject ${dialog?.lab.name}?` : `Suspend ${dialog?.lab.name}?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDialog(null)}>Back</Button>
            <Button variant="accent" loading={busy} onClick={() => setStatus(dialog.lab, dialog.status, note)}>Confirm</Button>
          </>
        }
      >
        <Field label="Reason (shown to the lab)">
          <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please upload a valid NABL certificate" />
        </Field>
      </Modal>
    </>
  );
}

function AdminUsers() {
  const { toast } = useApp();
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const { data, loading, error, reload, setData } = useAsync(() => api('/admin/users', { params: { role } }), [role]);

  const toggle = async (u) => {
    try {
      const res = await api(`/admin/users/${u._id}`, { method: 'PATCH', body: { isActive: !u.isActive } });
      setData((d) => ({ ...d, items: d.items.map((x) => (x._id === u._id ? { ...x, isActive: res.user.isActive } : x)) }));
      toast(res.user.isActive ? `${u.name} reactivated` : `${u.name} deactivated`);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const rx = q.trim().toLowerCase();
  const items = (data?.items || []).filter((u) => !rx || u.name.toLowerCase().includes(rx) || u.email.includes(rx) || u.phone.includes(rx));

  return (
    <>
      <PageHeader title="Users" subtitle="Patients, lab partners and admins" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={role} onChange={setRole} tabs={[{ value: '', label: 'All' }, { value: 'patient', label: 'Patients' }, { value: 'lab', label: 'Lab partners' }, { value: 'collector', label: 'Collectors' }, { value: 'admin', label: 'Admins' }]} />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-10" placeholder="Search name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
        </div>
      </div>
      <div className="mt-5">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <Spinner />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-3 py-3 font-semibold">Contact</th>
                  <th className="px-3 py-3 font-semibold">Role</th>
                  <th className="px-3 py-3 text-right font-semibold">Bookings</th>
                  <th className="px-3 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((u) => (
                  <tr key={u._id} data-testid="admin-user-row">
                    <td className="px-5 py-3 font-semibold">{u.name}</td>
                    <td className="px-3 py-3"><p>{u.email}</p><p className="text-xs text-ink-muted">{u.phone}</p></td>
                    <td className="px-3 py-3"><Badge tone={u.role === 'lab' ? 'violet' : u.role === 'admin' ? 'slate' : u.role === 'collector' ? 'amber' : 'blue'}>{u.role === 'lab' ? 'Lab partner' : u.role}</Badge>
                      {u.role === 'collector' && u.lab?.name && <p className="mt-1 text-xs text-ink-muted">{u.lab.name}</p>}</td>
                    <td className="px-3 py-3 text-right">{u.role === 'patient' ? u.bookingCount : '—'}</td>
                    <td className="px-3 py-3 text-ink-soft">{shortDate(u.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      {u.role === 'admin' ? (
                        <Badge tone="green">Active</Badge>
                      ) : (
                        <button onClick={() => toggle(u)} className={`rounded-lg px-2.5 py-1 text-xs font-bold ${u.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700' : 'bg-red-50 text-red-700 hover:bg-emerald-50 hover:text-emerald-700'}`} title={u.isActive ? 'Click to deactivate' : 'Click to reactivate'}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && <p className="p-8 text-center text-sm text-ink-muted">No users found.</p>}
          </div>
        )}
      </div>
    </>
  );
}

function AdminBookings() {
  const { toast } = useApp();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(null);
  const { data, loading, error, reload, setData } = useAsync(() => api('/admin/bookings', { params: { status } }), [status]);
  const verify = async (b, action) => {
    setBusy(b._id);
    try {
      const res = await api(`/admin/bookings/${b._id}/payment`, { method: 'PATCH', body: { action } });
      setData((d) => ({ ...d, items: d.items.map((x) => (x._id === b._id ? { ...x, ...res.booking } : x)) }));
      toast(action === 'confirm' ? `Payment confirmed for #${b.code}` : `Patient asked to pay again for #${b.code}`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  };
  const waiting = (data?.items || []).filter((b) => b.paymentStatus === 'verifying' && b.upiPayee === 'platform');
  return (
    <>
      <PageHeader title="All bookings" subtitle="Every booking across every lab" />
      {waiting.length > 0 && (
        <div className="mb-5 space-y-2" data-testid="admin-upi-queue">
          <p className="text-sm font-bold text-violet-800">UPI payments to your account waiting for confirmation</p>
          {waiting.map((b) => (
            <div key={b._id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-violet-50 px-4 py-3 text-sm text-violet-900 ring-1 ring-violet-200">
              <span className="flex-1">
                <b>{inr(b.total)}</b> from {b.patient.name} · #{b.code} · {b.lab?.name} · UTR <b className="font-mono">{b.upiRef}</b>
              </span>
              <Button size="sm" variant="ghost" onClick={() => verify(b, 'reject')} disabled={busy === b._id}>Not received</Button>
              <Button size="sm" onClick={() => verify(b, 'confirm')} loading={busy === b._id} data-testid="admin-confirm-upi">Payment received</Button>
            </div>
          ))}
        </div>
      )}
      <Tabs value={status} onChange={setStatus} tabs={[{ value: '', label: 'All' }, ...Object.entries(STATUS).map(([v, s]) => ({ value: v, label: s.label }))]} />
      <div className="mt-5">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No bookings" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Booking</th>
                  <th className="px-3 py-3 font-semibold">Patient</th>
                  <th className="px-3 py-3 font-semibold">Lab</th>
                  <th className="px-3 py-3 font-semibold">Slot</th>
                  <th className="px-3 py-3 text-right font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((b) => (
                  <tr key={b._id}>
                    <td className="px-5 py-3"><p className="font-semibold">#{b.code}</p><p className="text-xs text-ink-muted">{dateTime(b.createdAt)}</p></td>
                    <td className="px-3 py-3"><p>{b.patient.name}</p><p className="text-xs text-ink-muted">{b.user?.email}</p></td>
                    <td className="px-3 py-3"><p>{b.lab?.name}</p><p className="text-xs text-ink-muted">{b.lab?.address?.city}</p></td>
                    <td className="px-3 py-3 text-ink-soft">{slotDate(b.slot.date)}<br /><span className="text-xs">{b.collectionType === 'home' ? 'Home' : 'Lab visit'}</span></td>
                    <td className="px-3 py-3 text-right font-semibold">{inr(b.total)}<div className="mt-1"><PaymentBadge booking={b} /></div></td>
                    <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminApp() {
  const nav = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/labs', label: 'Labs', icon: Building2 },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/bookings', label: 'Bookings', icon: ClipboardList },
    { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  ];
  return (
    <DashboardShell title="Admin" nav={nav} badge={<p className="font-bold">Admin console</p>}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="labs" element={<AdminLabs />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="coupons" element={<AdminCoupons />} />
      </Routes>
    </DashboardShell>
  );
}
