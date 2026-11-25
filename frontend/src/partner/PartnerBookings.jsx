import { useMemo, useState } from 'react';
import { Building2, CarFront, ClipboardList, FileCheck2, House, Phone, Route, Search, Upload } from 'lucide-react';
import { Badge, Button, EmptyState, PaymentBadge, ErrorState, Field, Modal, PageHeader, Spinner, StatusBadge, Tabs } from '../components/ui';
import { useApp } from '../context/AppContext';
import { api, apiUpload } from '../lib/api';
import { COLLECTION_TYPES, FIELD_STATUS, NEXT_ACTION, STATUS, dateTime, inr, slotDate, slotTime } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const TABS = ['all', 'pending', 'confirmed', 'sample_collected', 'report_ready', 'completed', 'cancelled'];

export default function PartnerBookings() {
  const { toast } = useApp();
  const { data, loading, error, reload, setData } = useAsync(() => api('/partner/bookings'), []);
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [dialog, setDialog] = useState(null); // { booking, status }
  const [note, setNote] = useState('');
  const collectors = useAsync(() => api('/partner/collectors').catch(() => ({ items: [] })), []);
  const activeCollectors = (collectors.data?.items || []).filter((c) => c.isActive);

  const assign = async (booking, collectorId) => {
    setBusyId(booking._id);
    try {
      const res = await api(`/partner/bookings/${booking._id}/assign`, { method: 'PATCH', body: { collectorId: collectorId || null } });
      setData((d) => ({ ...d, items: d.items.map((b) => (b._id === booking._id ? res.booking : b)) }));
      toast(collectorId ? `Assigned to ${res.booking.collector?.name}` : 'Collector unassigned');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const items = useMemo(() => data?.items || [], [data]);
  const counts = useMemo(() => {
    const c = { all: items.length };
    items.forEach((b) => (c[b.status] = (c[b.status] || 0) + 1));
    return c;
  }, [items]);
  const filtered = useMemo(() => {
    const rx = q.trim().toLowerCase();
    return items.filter(
      (b) =>
        (tab === 'all' || b.status === tab) &&
        (!rx || b.code.toLowerCase().includes(rx) || b.patient.name.toLowerCase().includes(rx) || b.patient.phone.includes(rx))
    );
  }, [items, tab, q]);

  const updateStatus = async (booking, status, noteText) => {
    setBusyId(booking._id);
    try {
      const res = await api(`/partner/bookings/${booking._id}/status`, { method: 'PATCH', body: { status, note: noteText || undefined } });
      setData((d) => ({ ...d, items: d.items.map((b) => (b._id === booking._id ? res.booking : b)) }));
      toast(`Booking #${booking.code} → ${STATUS[status].label}`);
      setDialog(null);
      setNote('');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const uploadReport = async (booking, file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') return toast('Please choose a PDF file', 'error');
    if (file.size > 5 * 1024 * 1024) return toast('Report must be 5 MB or smaller', 'error');
    setBusyId(booking._id);
    try {
      const fd = new FormData();
      fd.append('report', file);
      const res = await apiUpload(`/partner/bookings/${booking._id}/report`, fd);
      setData((d) => ({ ...d, items: d.items.map((b) => (b._id === booking._id ? res.booking : b)) }));
      toast(`Report uploaded for #${booking.code}`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const act = (booking, status) => {
    if (status === 'report_ready' || status === 'cancelled') {
      setNote(status === 'report_ready' ? 'Report shared on your registered email and WhatsApp.' : '');
      setDialog({ booking, status });
    } else updateStatus(booking, status);
  };

  return (
    <>
      <PageHeader title="Bookings" subtitle="Move each booking forward: confirm → collect sample → share report → complete" />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onChange={setTab} tabs={TABS.map((t) => ({ value: t, label: t === 'all' ? 'All' : STATUS[t].label, count: counts[t] || 0 }))} />
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-10" placeholder="Search code, name or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search bookings" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No bookings here" text={tab === 'pending' ? 'New bookings from patients will appear in this tab.' : 'Try another tab.'} />
        ) : (
          filtered.map((b) => {
            const next = NEXT_ACTION[b.status];
            return (
              <div key={b._id} className="card p-4 sm:p-5" data-testid="partner-booking">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{b.patient.name}</p>
                      <span className="text-sm text-ink-muted">{b.patient.age} yrs · {b.patient.gender}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">#{b.code} · booked {dateTime(b.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold">{inr(b.total)}</p>
                    <PaymentBadge booking={b} />
                  </div>
                </div>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Tests</p>
                    <p className="mt-0.5">{b.items.map((i) => i.name).join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Slot</p>
                    <p className="mt-0.5 font-semibold">{slotDate(b.slot.date)} · {slotTime(b.slot.time)}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      {b.collectionType === 'home' ? <House className="h-3.5 w-3.5" /> : b.collectionType === 'assisted_visit' ? <CarFront className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                      {COLLECTION_TYPES[b.collectionType]?.label}
                    </p>
                    <p className="mt-0.5">
                      {b.collectionType === 'lab_visit'
                        ? 'Patient visits your lab'
                        : `${b.collectionType === 'assisted_visit' ? 'Pickup: ' : ''}${[b.address?.line, b.address?.area, b.address?.city, b.address?.pincode].filter(Boolean).join(', ')}`}
                    </p>
                  </div>
                </div>
                {b.collectionType !== 'lab_visit' && b.status !== 'cancelled' && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm" data-testid="assign-row">
                    <Route className="h-4 w-4 text-brand-600" />
                    {b.collector ? (
                      <>
                        <span>
                          Collector: <b>{b.collector.name}</b> · <a className="text-brand-700" href={`tel:${b.collector.phone}`}>{b.collector.phone}</a>
                        </span>
                        {b.fieldStatus && <Badge tone="amber">{FIELD_STATUS[b.fieldStatus]?.label}</Badge>}
                      </>
                    ) : (
                      <span className="text-ink-muted">No collector assigned</span>
                    )}
                    {['pending', 'confirmed'].includes(b.status) && (
                      <select
                        className="input ml-auto h-9 w-auto py-1 text-sm"
                        value={b.collector?._id || ''}
                        disabled={busyId === b._id}
                        onChange={(e) => assign(b, e.target.value)}
                        aria-label="Assign collector"
                        data-testid="assign-collector"
                      >
                        <option value="">{b.collector ? 'Unassign' : activeCollectors.length ? 'Assign collector…' : 'Add collectors first'}</option>
                        {activeCollectors.map((c) => (
                          <option key={c._id} value={c._id}>{c.name} ({c.activeJobs || 0} jobs)</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
                {b.notes && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Note: {b.notes}</p>}
                {b.status === 'cancelled' && b.cancelReason && <p className="mt-3 text-sm text-red-600">Cancelled by {b.cancelledBy}: {b.cancelReason}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <a href={`tel:${b.patient.phone}`} className="mr-auto flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                    <Phone className="h-4 w-4" /> {b.patient.phone}
                  </a>
                  {b.report && (
                    <span className="flex items-center gap-1 rounded-lg bg-coral-50 px-2 py-1 text-xs font-semibold text-coral-700" title={b.report.originalName}>
                      <FileCheck2 className="h-4 w-4" /> Report uploaded
                    </span>
                  )}
                  {['sample_collected', 'report_ready', 'completed'].includes(b.status) && (
                    <label className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-ink hover:border-brand-300 hover:text-brand-700 ${busyId === b._id ? 'pointer-events-none opacity-60' : ''}`}>
                      <Upload className="h-4 w-4" /> {b.report ? 'Replace PDF' : 'Upload report PDF'}
                      <input
                        type="file"
                        accept="application/pdf"
                        className="sr-only"
                        data-testid="report-input"
                        onChange={(e) => {
                          uploadReport(b, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                  {['pending', 'confirmed'].includes(b.status) && (
                    <Button variant="ghost" size="sm" onClick={() => act(b, 'cancelled')} disabled={busyId === b._id}>
                      Cancel
                    </Button>
                  )}
                  {next && (
                    <Button size="sm" onClick={() => act(b, next.status)} loading={busyId === b._id} data-testid="advance-booking">
                      {next.label}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog?.status === 'report_ready' ? 'Share report' : 'Cancel booking'}
        footer={
          <>
            <Button variant="outline" onClick={() => setDialog(null)}>Back</Button>
            <Button variant={dialog?.status === 'cancelled' ? 'accent' : 'primary'} loading={busyId === dialog?.booking._id} onClick={() => updateStatus(dialog.booking, dialog.status, note)} data-testid="confirm-status">
              {dialog?.status === 'report_ready' ? 'Mark report ready' : 'Cancel booking'}
            </Button>
          </>
        }
      >
        <Field label={dialog?.status === 'report_ready' ? 'Message to patient' : 'Reason for cancellation'} hint={dialog?.status === 'report_ready' ? 'E.g. where the report was sent, or any values to discuss with a doctor' : undefined}>
          <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        </Field>
      </Modal>
    </>
  );
}
