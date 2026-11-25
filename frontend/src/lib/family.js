export const RELATIONS = {
  spouse: 'Spouse',
  father: 'Father',
  mother: 'Mother',
  son: 'Son',
  daughter: 'Daughter',
  brother: 'Brother',
  sister: 'Sister',
  grandparent: 'Grandparent',
  other: 'Other',
};

/** Age in whole years today, from a YYYY-MM-DD date of birth ('' when unknown). */
export function ageFrom(dob) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob || '')) return '';
  const [y, m, d] = dob.split('-').map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age >= 0 ? age : '';
}

// Booking statuses a patient can still change (mirrors the API).
export const RESCHEDULABLE = ['pending', 'confirmed'];
export const MAX_RESCHEDULES = 3;
export const canReschedule = (b) =>
  RESCHEDULABLE.includes(b.status) && (!b.fieldStatus || b.fieldStatus === 'assigned') && (b.reschedules?.length || 0) < MAX_RESCHEDULES;
