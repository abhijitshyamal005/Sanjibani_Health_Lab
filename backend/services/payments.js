/**
 * Payments are free: patients pay by UPI directly (to the lab's own UPI ID, or the platform's)
 * and the receiver confirms it, or they pay at collection. No payment gateway or fees.
 */

const UPI_RE = /^[\w.\-]{2,256}@[a-z]{2,64}$/;

/** Platform-wide UPI ID used when a lab has not set its own (UPI_ID / UPI_NAME env vars). */
export function platformUpi() {
  const id = (process.env.UPI_ID || '').trim().toLowerCase();
  return UPI_RE.test(id) ? { upiId: id, upiName: (process.env.UPI_NAME || 'Patholy').trim() } : null;
}

/** Which UPI ID a booking at this lab should be paid to: the lab's own, else the platform's. */
export function upiPayeeFor(lab) {
  if (lab?.upiId) return { upiId: lab.upiId, payee: lab.upiName || lab.name, owner: 'lab' };
  const p = platformUpi();
  return p ? { upiId: p.upiId, payee: p.upiName, owner: 'platform' } : null;
}

/** Standard UPI deep link (opens Google Pay / PhonePe / Paytm with amount and note filled in). */
export function upiUri({ upiId, payee, amount, note }) {
  const q = new URLSearchParams({ pa: upiId, pn: payee, am: Number(amount).toFixed(2), cu: 'INR', tn: note });
  return `upi://pay?${q.toString()}`;
}
