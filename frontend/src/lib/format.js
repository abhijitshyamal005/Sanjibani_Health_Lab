export function inr(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export function compactInr(n) {
  const v = Number(n) || 0;
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `₹${(v / 1e3).toFixed(1)}k`;
  return `₹${v}`;
}

/** "2026-11-26" → "Thu, 26 Nov" */
export function slotDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function slotTime(range = '') {
  return range
    .split('-')
    .map((t) => {
      const [h, m] = t.split(':').map(Number);
      const hh = ((h + 11) % 12) + 1;
      return `${hh}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
    })
    .join(' – ');
}

export function dateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function shortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Local YYYY-MM-DD for today + offset days. */
export function ymd(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const STATUS = {
  pending: { label: 'Pending', tone: 'amber', step: 0 },
  confirmed: { label: 'Confirmed', tone: 'blue', step: 1 },
  sample_collected: { label: 'Sample collected', tone: 'violet', step: 2 },
  report_ready: { label: 'Report ready', tone: 'brand', step: 3 },
  completed: { label: 'Completed', tone: 'green', step: 4 },
  cancelled: { label: 'Cancelled', tone: 'red', step: -1 },
};

export const FLOW = ['pending', 'confirmed', 'sample_collected', 'report_ready', 'completed'];

/** Next action a lab can take on a booking. */
export const NEXT_ACTION = {
  pending: { status: 'confirmed', label: 'Confirm booking' },
  confirmed: { status: 'sample_collected', label: 'Mark sample collected' },
  sample_collected: { status: 'report_ready', label: 'Mark report ready' },
  report_ready: { status: 'completed', label: 'Complete & mark paid' },
};

export const LAB_STATUS = {
  pending: { label: 'Pending approval', tone: 'amber' },
  approved: { label: 'Live', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
  suspended: { label: 'Suspended', tone: 'slate' },
};

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export const COLLECTION_TYPES = {
  home: { label: 'Home collection', short: 'Home' },
  lab_visit: { label: 'Lab visit', short: 'Lab visit' },
  assisted_visit: { label: 'Assisted visit', short: 'Assisted' },
};

/** Field steps a collector moves through, per collection type. */
export const FIELD_FLOW = {
  home: ['assigned', 'on_the_way', 'arrived'],
  assisted_visit: ['assigned', 'on_the_way', 'arrived', 'picked_up', 'reached_lab'],
};

export const FIELD_STATUS = {
  assigned: { label: 'Collector assigned', action: null },
  on_the_way: { label: 'On the way', action: 'Start — on the way' },
  arrived: { label: 'Arrived', action: 'I have arrived' },
  picked_up: { label: 'Patient picked up', action: 'Patient picked up' },
  reached_lab: { label: 'Reached the lab', action: 'Reached the lab with patient' },
  dropped_home: { label: 'Dropped home', action: 'Patient dropped home' },
};

/** Next step the collector should take, or null when done. */
export function nextFieldStep(booking) {
  // Assisted visit: after the sample is taken at the lab, the staff member drops the patient home.
  if (booking.collectionType === 'assisted_visit' && ['sample_collected', 'report_ready', 'completed'].includes(booking.status)) {
    return booking.fieldStatus === 'dropped_home' ? null : { step: 'dropped_home', label: FIELD_STATUS.dropped_home.action };
  }
  if (booking.status !== 'confirmed') return null;
  const flow = FIELD_FLOW[booking.collectionType] || [];
  const i = flow.indexOf(booking.fieldStatus || 'assigned');
  if (i < flow.length - 1) return { step: flow[i + 1], label: FIELD_STATUS[flow[i + 1]].action };
  return { step: 'sample_collected', label: booking.collectionType === 'assisted_visit' ? 'Sample taken at the lab' : 'Sample collected' };
}
