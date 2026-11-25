/**
 * Email notifications for every step of the marketplace flow.
 * Each export is fire-and-forget: call it after saving, it loads what it needs and emails
 * the patient, the lab (lab email, else the partner's account email), the collector and/or admins.
 * Collector emails never contain prices.
 */
import Booking from '../models/bookingModel.js';
import Lab from '../models/labModel.js';
import Review from '../models/reviewModel.js';
import User from '../models/userModel.js';
import { BRAND, esc, layout, sendEmail } from './notify.js';

const pending = new Set();
function fire(task) {
  const p = Promise.resolve()
    .then(task)
    .catch((e) => console.error('[email:event]', e.message))
    .finally(() => pending.delete(p));
  pending.add(p);
}
/** Wait for queued emails (used by tests). */
export async function flushEmails() {
  while (pending.size) await Promise.all([...pending]);
}

function appUrl(path = '') {
  const base = (process.env.APP_URL || (process.env.CLIENT_ORIGINS || '').split(',')[0] || 'http://localhost:5173').trim();
  return base.replace(/\/$/, '') + path;
}
const button = (href, label) =>
  `<p style="margin:20px 0 4px"><a href="${href}" style="background:#ea580c;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block">${esc(label)}</a></p>`;
const p = (html) => `<p style="margin:0 0 10px;line-height:1.5">${html}</p>`;
const send = (to, subject, title, body, replyTo) => to && sendEmail({ to, subject, html: layout(title, body), replyTo });
// Replies go to the right team: lab partners → labs@, payments → payments@, everyone else → care@ (default).
const toLabs = (to, subject, title, body) => send(to, subject, title, body, BRAND.labsEmail || undefined);
const toPayments = (to, subject, title, body) => send(to, subject, title, body, BRAND.paymentsEmail || undefined);

const TYPE = { home: 'Home collection', lab_visit: 'Lab visit', assisted_visit: 'Assisted visit (pickup, lab visit & drop)' };
const addr = (a) => [a?.line, a?.area, a?.city, a?.pincode].filter(Boolean).join(', ');

async function labEmail(lab) {
  if (!lab) return null;
  if (lab.email) return lab.email;
  const owner = await User.findById(lab.owner).select('email');
  return owner?.email || null;
}
async function adminEmails() {
  return (await User.find({ role: 'admin', isActive: true }).select('email')).map((u) => u.email);
}
function loadBooking(id) {
  return Booking.findById(id)
    .populate('user', 'name email')
    .populate('lab', 'name email owner phone address reportTime')
    .populate('collector', 'name email phone');
}

/** Booking details with prices — for the patient and the lab. */
function bookingBlock(b, { forLab = false } = {}) {
  const items = b.items.map((i) => `<li>${esc(i.name)} — ₹${i.price}</li>`).join('');
  const where = b.collectionType === 'lab_visit' ? `At ${esc(b.lab?.name)}, ${esc(addr(b.lab?.address))}` : esc(addr(b.address));
  return `<table cellpadding="0" cellspacing="0" style="width:100%;background:#fff7ed;border-radius:12px;padding:14px;margin:10px 0">
<tr><td style="padding:2px 14px"><b>Booking #${esc(b.code)}</b> · ${esc(b.lab?.name)}</td></tr>
<tr><td style="padding:2px 14px">${esc(b.slot.date)} · ${esc(b.slot.time)} · ${TYPE[b.collectionType] || ''}</td></tr>
<tr><td style="padding:2px 14px">${where}</td></tr>
${forLab ? `<tr><td style="padding:2px 14px">Patient: ${esc(b.patient.name)}, ${b.patient.age} yrs, ${esc(b.patient.gender)} · ${esc(b.patient.phone)}</td></tr>` : ''}
<tr><td style="padding:2px 14px"><ul style="padding-left:18px;margin:6px 0">${items}</ul></td></tr>
${b.collectionFee ? `<tr><td style="padding:2px 14px">${b.collectionType === 'assisted_visit' ? 'Assisted visit' : 'Home collection'} fee — ₹${b.collectionFee}</td></tr>` : ''}
${b.discount ? `<tr><td style="padding:2px 14px">Coupon ${esc(b.couponCode)} — −₹${b.discount}</td></tr>` : ''}
<tr><td style="padding:2px 14px"><b>Total ₹${b.total}</b> · ${b.paymentStatus === 'paid' ? 'Paid' : 'Pay at collection'}</td></tr>
</table>`;
}

/** Job details without any prices — for the sample collector. */
function jobBlock(b) {
  const tests = b.items.map((i) => `<li>${esc(i.name)}${i.sampleType && i.sampleType !== 'None' ? ` — ${esc(i.sampleType)}` : ''}</li>`).join('');
  const toCollect =
    b.paymentStatus === 'paid'
      ? 'Prepaid — nothing to collect'
      : b.paymentStatus === 'verifying'
        ? 'Paid by UPI (lab is verifying) — do not collect cash'
        : `Collect ₹${b.total} from the patient`;
  return `<table cellpadding="0" cellspacing="0" style="width:100%;background:#f0fdf4;border-radius:12px;padding:14px;margin:10px 0">
<tr><td style="padding:2px 14px"><b>Job #${esc(b.code)}</b> · ${TYPE[b.collectionType] || ''}</td></tr>
<tr><td style="padding:2px 14px">${esc(b.slot.date)} · ${esc(b.slot.time)}</td></tr>
<tr><td style="padding:2px 14px">Patient: ${esc(b.patient.name)} · ${esc(b.patient.phone)}</td></tr>
<tr><td style="padding:2px 14px">${b.collectionType === 'assisted_visit' ? 'Pickup' : 'Address'}: ${esc(addr(b.address))}</td></tr>
<tr><td style="padding:2px 14px">Samples:<ul style="padding-left:18px;margin:6px 0">${tests}</ul></td></tr>
<tr><td style="padding:2px 14px">${toCollect}</td></tr>
</table>`;
}

const bookingLink = (b) => appUrl(`/bookings/${b._id}`);

/* ---------------- Accounts ---------------- */

export function userRegistered(user) {
  fire(async () => {
    if (user.role === 'lab') {
      await toLabs(
        user.email,
        'Welcome to SanjiBani for labs',
        `Welcome, ${user.name}!`,
        p('Thanks for registering your lab with SanjiBani.') +
          p('<b>Next steps:</b> 1) add your lab details, 2) add your tests and prices, 3) our team verifies your lab and it goes live for patients.') +
          button(appUrl('/partner'), 'Complete your lab profile')
      );
    } else {
      await send(
        user.email,
        'Welcome to SanjiBani',
        `Welcome, ${user.name}!`,
        p('Compare lab test prices across verified labs, book home sample collection or a lab visit, and get your reports online.') +
          button(appUrl('/tests'), 'Find a test')
      );
    }
  });
}

export function passwordChanged(user) {
  fire(() =>
    send(
      user.email,
      'Your SanjiBani password was changed',
      'Password changed',
      p(`Hi ${esc(user.name)}, the password for your SanjiBani account was just changed.`) +
        p("If this wasn't you, reset your password immediately and contact support.") +
        button(appUrl('/forgot-password'), 'Reset password')
    )
  );
}

export function collectorAccountCreated(collectorId) {
  fire(async () => {
    const c = await User.findById(collectorId).populate('lab', 'name phone');
    if (!c) return;
    await toLabs(
      c.email,
      `You're now a sample collector for ${c.lab?.name}`,
      `Welcome, ${c.name}!`,
      p(`<b>${esc(c.lab?.name)}</b> has added you as a sample collector on SanjiBani.`) +
        p(`Log in with <b>${esc(c.email)}</b> and the password your lab gave you (or use "Forgot password"). You'll see the jobs assigned to you, directions and your earnings.`) +
        button(appUrl('/login'), 'Open the collector app')
    );
  });
}

/* ---------------- Labs ---------------- */

export function labSubmitted(labId, { resubmitted = false } = {}) {
  fire(async () => {
    const lab = await Lab.findById(labId);
    if (!lab) return;
    await toLabs(
      await labEmail(lab),
      `${lab.name} ${resubmitted ? 're-submitted' : 'submitted'} for verification`,
      'Your lab is under review',
      p(`Thanks! <b>${esc(lab.name)}</b> is now being verified by the SanjiBani team. This usually takes up to 24 hours.`) +
        p('Meanwhile, add your tests and prices so you are ready to go live.') +
        button(appUrl('/partner/tests'), 'Add tests & prices')
    );
    const admins = await adminEmails();
    await Promise.all(
      admins.map((to) =>
        send(
          to,
          `New lab to review: ${lab.name}${resubmitted ? ' (re-submitted)' : ''}`,
          'A lab is waiting for approval',
          p(`<b>${esc(lab.name)}</b>, ${esc(addr(lab.address))} · ${esc(lab.phone)}`) +
            p(`Accreditations: ${esc(lab.accreditations?.join(', ') || 'none listed')}`) +
            button(appUrl('/admin/labs?status=pending'), 'Review labs')
        )
      )
    );
  });
}

export function labStatusChanged(labId) {
  fire(async () => {
    const lab = await Lab.findById(labId);
    if (!lab) return;
    const to = await labEmail(lab);
    const note = lab.statusNote ? p(`<b>Note from SanjiBani:</b> ${esc(lab.statusNote)}`) : '';
    if (lab.status === 'approved') {
      await send(to, `${lab.name} is now live on SanjiBani 🎉`, 'Your lab is live!', p('Patients can now find your lab, compare your prices and book tests.') + note + button(appUrl('/partner'), 'Open your dashboard'));
    } else if (lab.status === 'rejected') {
      await send(to, `${lab.name} was not approved`, 'Your lab needs changes', p('Please update your lab profile based on the note below and save it — it will be re-submitted automatically.') + note + button(appUrl('/partner/profile'), 'Update lab profile'));
    } else if (lab.status === 'suspended') {
      await send(to, `${lab.name} has been suspended`, 'Your lab is suspended', p('Your lab is temporarily hidden from patients.') + note + p('Reply to this email or contact SanjiBani support to resolve it.'));
    } else {
      await send(to, `${lab.name} is under review`, 'Your lab is under review', p('Your lab is waiting for verification.') + note);
    }
  });
}

/* ---------------- Bookings ---------------- */

export function bookingPlaced(bookingId) {
  fire(async () => {
    const b = await loadBooking(bookingId);
    if (!b) return;
    await send(
      b.user?.email,
      `Booking #${b.code} placed with ${b.lab.name}`,
      'Your booking is placed',
      p(`Hi ${esc(b.patient.name)}, ${esc(b.lab.name)} will confirm your booking shortly.`) + bookingBlock(b) + button(bookingLink(b), 'Track your booking')
    );
    await toLabs(
      await labEmail(b.lab),
      `New booking #${b.code} — ${b.patient.name}`,
      'You have a new booking',
      p(b.collectionType === 'lab_visit' ? 'Please confirm it.' : 'Please confirm it and assign a sample collector.') +
        bookingBlock(b, { forLab: true }) +
        (b.notes ? p(`<b>Patient note:</b> ${esc(b.notes)}`) : '') +
        button(appUrl('/partner/bookings'), 'Open bookings')
    );
  });
}

const PATIENT_STATUS = {
  confirmed: (b) => ({
    subject: `Booking #${b.code} confirmed`,
    title: 'Your booking is confirmed ✅',
    body:
      b.collectionType === 'lab_visit'
        ? p(`Please reach ${esc(b.lab.name)} at your slot time. Address: ${esc(addr(b.lab.address))}. Phone: ${esc(b.lab.phone)}.`)
        : p('A sample collector will be assigned and you will get their name and phone number by email.'),
  }),
  sample_collected: (b) => ({
    subject: `Sample collected — booking #${b.code}`,
    title: 'Your sample has been collected',
    body: p(`Your sample is on its way to ${esc(b.lab.name)}. Reports are usually ready in <b>${esc(b.lab.reportTime || '24 hours')}</b>.`),
  }),
  report_ready: (b) => ({
    subject: `Your report is ready — booking #${b.code}`,
    title: 'Your report is ready 📄',
    body:
      (b.reportNote ? p(esc(b.reportNote)) : '') +
      p(b.report ? 'You can download your report PDF from your booking page.' : 'The lab has shared your report. Open your booking for details.') +
      p('Please discuss your results with a doctor.'),
    cta: 'View & download report',
  }),
  completed: (b) => ({
    subject: `Thank you — booking #${b.code} completed`,
    title: 'Thank you for choosing SanjiBani',
    body: p(`Your booking with ${esc(b.lab.name)} is complete.`) + p('How was your experience? Your rating helps other patients choose the right lab.'),
    cta: 'Rate your experience',
  }),
  cancelled: (b, by) => ({
    subject: `Booking #${b.code} cancelled`,
    title: 'Your booking was cancelled',
    body:
      p(by === 'patient' ? 'Your booking has been cancelled as requested.' : `${esc(b.lab.name)} had to cancel your booking.`) +
      (b.cancelReason ? p(`<b>Reason:</b> ${esc(b.cancelReason)}`) : '') +
      (b.paymentMethod === 'upi_direct' && b.paymentStatus === 'paid'
        ? p(`Your UPI payment of <b>₹${b.total}</b> will be refunded to your UPI account within 3 working days. Contact ${b.upiPayee === 'lab' ? `${esc(b.lab.name)} at ${esc(b.lab.phone)}` : 'SanjiBani support'} if you don't receive it.`)
        : ''),
    cta: 'Book again',
    href: appUrl('/tests'),
  }),
};

/** A booking moved to a new status. `by` = who changed it: 'lab' | 'patient' | 'collector'. */
export function bookingStatusChanged(bookingId, { by = 'lab' } = {}) {
  fire(async () => {
    const b = await loadBooking(bookingId);
    if (!b) return;
    const tpl = PATIENT_STATUS[b.status]?.(b, by);
    if (tpl) {
      await send(b.user?.email, tpl.subject, tpl.title, tpl.body + bookingBlock(b) + button(tpl.href || bookingLink(b), tpl.cta || 'View booking'));
    }
    // Keep the lab informed of changes it didn't make itself.
    if (by !== 'lab' && ['cancelled', 'sample_collected'].includes(b.status)) {
      await toLabs(
        await labEmail(b.lab),
        b.status === 'cancelled' ? `Booking #${b.code} cancelled by patient` : `Sample collected — booking #${b.code}`,
        b.status === 'cancelled' ? 'A patient cancelled a booking' : `${b.collector?.name || 'Your collector'} collected the sample`,
        (b.cancelReason && b.status === 'cancelled' ? p(`<b>Reason:</b> ${esc(b.cancelReason)}`) : '') + bookingBlock(b, { forLab: true }) + button(appUrl('/partner/bookings'), 'Open bookings')
      );
    }
    // Tell the assigned collector their job was cancelled.
    if (b.status === 'cancelled' && b.collector?.email) {
      await send(b.collector.email, `Job #${b.code} cancelled`, 'This job was cancelled', p('You no longer need to visit this patient.') + jobBlock(b));
    }
  });
}

export function collectorAssigned(bookingId) {
  fire(async () => {
    const b = await loadBooking(bookingId);
    if (!b?.collector) return;
    const assisted = b.collectionType === 'assisted_visit';
    await send(
      b.user?.email,
      `${b.collector.name} will ${assisted ? 'take you to the lab' : 'collect your sample'} — #${b.code}`,
      assisted ? 'Your assistant is assigned' : 'Your sample collector is assigned',
      p(`<b>${esc(b.collector.name)}</b> (${esc(b.collector.phone)}) from ${esc(b.lab.name)} will ${assisted ? 'pick you up, stay with you at the lab and drop you back home' : 'visit you to collect your sample'}.`) +
        bookingBlock(b) +
        button(bookingLink(b), 'Track live')
    );
    await send(
      b.collector.email,
      `New job #${b.code} — ${b.slot.date} ${b.slot.time}`,
      'You have a new job',
      p(`${esc(b.lab.name)} assigned you a ${assisted ? 'patient pickup (assisted visit)' : 'home sample collection'}.`) + jobBlock(b) + button(appUrl('/collector'), 'Open your jobs')
    );
  });
}

const FIELD_MSG = {
  on_the_way: (b) => ['Your collector is on the way', `<b>${esc(b.collector.name)}</b> (${esc(b.collector.phone)}) is on the way. Please keep your booking code <b>${esc(b.code)}</b> handy.`],
  arrived: (b) => ['Your collector has arrived', `<b>${esc(b.collector.name)}</b> has reached your address.`],
  picked_up: (b) => ['On the way to the lab', `You're on your way to ${esc(b.lab.name)} with ${esc(b.collector.name)}.`],
  reached_lab: (b) => ['Reached the lab', `You've reached ${esc(b.lab.name)}. ${esc(b.collector.name)} will stay with you.`],
  dropped_home: (b) => ['Dropped home safely', `${esc(b.collector.name)} has dropped you home. We'll email you as soon as your report is ready.`],
};

/** Collector moved a field step forward (on the way, arrived, picked up, …). */
export function fieldProgress(bookingId, step) {
  fire(async () => {
    const b = await loadBooking(bookingId);
    if (!b?.collector || !FIELD_MSG[step]) return;
    const [title, text] = FIELD_MSG[step](b);
    await send(b.user?.email, `${title} — booking #${b.code}`, title, p(text) + button(bookingLink(b), 'Track live'));
    // The lab follows every step its collector takes.
    const STEP = { on_the_way: 'is on the way to', arrived: 'has reached', picked_up: 'has picked up', reached_lab: 'has reached the lab with', dropped_home: 'has dropped home' };
    await toLabs(
      await labEmail(b.lab),
      `${b.collector.name} ${STEP[step]} ${b.patient.name} — #${b.code}`,
      'Collector update',
      p(`<b>${esc(b.collector.name)}</b> ${STEP[step]} <b>${esc(b.patient.name)}</b>.`) + bookingBlock(b, { forLab: true }) + button(appUrl('/partner/bookings'), 'Open bookings')
    );
  });
}

/** A report PDF was uploaded (or replaced) after the booking was already marked report ready. */
export function reportUploaded(bookingId) {
  fire(async () => {
    const b = await loadBooking(bookingId);
    if (!b || !['report_ready', 'completed'].includes(b.status)) return; // otherwise the "report ready" email covers it
    await send(
      b.user?.email,
      `Your report PDF is available — booking #${b.code}`,
      'Your report is ready to download 📄',
      p(`${esc(b.lab.name)} has uploaded your report.`) + button(bookingLink(b), 'Download report')
    );
  });
}

/** Payment recorded — UPI confirmed by the receiver, or cash/UPI collected at the visit. */
export function paymentReceived(bookingId) {
  fire(async () => {
    const b = await loadBooking(bookingId);
    if (!b) return;
    const how =
      b.paymentMethod === 'upi_direct' ? `by UPI (transaction ID ${esc(b.upiRef)})` : 'at collection';
    await toPayments(b.user?.email, `Payment received — ₹${b.total} for booking #${b.code}`, 'Payment received ✅', p(`We received your payment of <b>₹${b.total}</b> ${how}.`) + bookingBlock(b) + button(bookingLink(b), 'View booking'));
    await toLabs(await labEmail(b.lab), `Payment received for booking #${b.code}`, 'Payment received', p(`₹${b.total} received ${how} from ${esc(b.patient.name)}.`) + button(appUrl('/partner/bookings'), 'Open bookings'));
  });
}

export function reviewPosted(reviewId) {
  fire(async () => {
    const r = await Review.findById(reviewId).populate('lab', 'name email owner').populate('user', 'name');
    if (!r) return;
    await toLabs(
      await labEmail(r.lab),
      `New ${r.rating}★ review for ${r.lab.name}`,
      'You received a new review',
      p(`<b>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</b> from ${esc(r.user?.name?.split(' ')[0] || 'a patient')}`) + (r.comment ? p(`“${esc(r.comment)}”`) : '') + button(appUrl('/partner'), 'Open dashboard')
    );
  });
}

/** Patient paid the lab's UPI ID directly — ask the lab to confirm. */
export function upiSubmitted(bookingId) {
  fire(async () => {
    const b = await loadBooking(bookingId);
    if (!b) return;
    const verifiers = b.upiPayee === 'platform' ? await adminEmails() : [await labEmail(b.lab)];
    for (const to of verifiers) await send(
      to,
      `Confirm UPI payment ₹${b.total} — booking #${b.code}`,
      'Please confirm a UPI payment',
      p(`${esc(b.patient.name)} says they paid <b>₹${b.total}</b> to ${b.upiPayee === 'platform' ? 'the SanjiBani UPI ID' : 'your UPI ID'} for ${esc(b.lab.name)}.`) +
        p(`UPI transaction ID (UTR): <b style="font-size:17px;letter-spacing:1px">${esc(b.upiRef)}</b>`) +
        p('Check your bank or UPI app for this transaction, then mark it as received (or not received) on the booking.') +
        button(appUrl(b.upiPayee === 'platform' ? '/admin/bookings' : '/partner/bookings'), 'Verify payment')
    );
    await toPayments(
      b.user?.email,
      `UPI payment submitted — booking #${b.code}`,
      'We are verifying your payment',
      p(`Thanks! ${esc(b.lab.name)} will confirm your UPI payment of <b>₹${b.total}</b> (transaction ID ${esc(b.upiRef)}) shortly. You'll get a receipt by email.`) +
        button(bookingLink(b), 'View booking')
    );
  });
}

/** Lab could not find the UPI payment. */
export function upiRejected(bookingId, utr) {
  fire(async () => {
    const b = await loadBooking(bookingId);
    if (!b) return;
    await toPayments(
      b.user?.email,
      `UPI payment not found — booking #${b.code}`,
      'We could not verify your UPI payment',
      p(`${esc(b.lab.name)} could not find a payment with transaction ID <b>${esc(utr)}</b>.`) +
        p(`Please check the transaction ID in your UPI app and submit it again, pay at collection, or call the lab at ${esc(b.lab.phone)}.`) +
        button(bookingLink(b), 'Pay again')
    );
  });
}

/* ---------------- Admin & account actions ---------------- */

const ROLE_HOME = { lab: '/partner', collector: '/collector', admin: '/admin', patient: '/profile' };

/**
 * An account was deactivated or re-activated. `by` = 'admin' (SanjiBani team) or 'lab' (the collector's lab).
 * Lab owners and collectors get replies routed to labs@.
 */
export function accountStatusChanged(userId, { by = 'admin' } = {}) {
  fire(async () => {
    const u = await User.findById(userId).populate('lab', 'name');
    if (!u) return;
    const who = by === 'lab' ? esc(u.lab?.name || 'Your lab') : 'The SanjiBani team';
    const mail = ['lab', 'collector'].includes(u.role) ? toLabs : send;
    if (u.isActive) {
      await mail(
        u.email,
        'Your SanjiBani account is active again',
        'Your account is active again',
        p(`Hi ${esc(u.name)}, ${who} has re-activated your SanjiBani account. You can log in again.`) + button(appUrl('/login'), 'Log in')
      );
    } else {
      await mail(
        u.email,
        'Your SanjiBani account has been deactivated',
        'Your account has been deactivated',
        p(`Hi ${esc(u.name)}, ${who} has deactivated your SanjiBani account, so you can no longer log in.`) +
          p(by === 'lab' ? 'Please contact your lab if you think this is a mistake.' : 'Reply to this email if you think this is a mistake.')
      );
    }
  });
}

/** A patient, lab owner or collector edited their own profile (password changes have their own email). */
export function profileUpdated(user) {
  fire(() =>
    send(
      user.email,
      'Your SanjiBani profile was updated',
      'Profile updated',
      p(`Hi ${esc(user.name)}, the details on your SanjiBani account were just updated.`) +
        p("If this wasn't you, change your password and contact support.") +
        button(appUrl(ROLE_HOME[user.role] || '/'), 'Review your account')
    )
  );
}

/** A lab changed a collector's details or password. */
export function collectorUpdated(collectorId, { passwordChanged: pw = false } = {}) {
  fire(async () => {
    const c = await User.findById(collectorId).populate('lab', 'name');
    if (!c) return;
    await toLabs(
      c.email,
      pw ? 'Your collector password was reset' : 'Your collector details were updated',
      pw ? 'Password reset by your lab' : 'Details updated',
      p(`Hi ${esc(c.name)}, <b>${esc(c.lab?.name || 'your lab')}</b> ${pw ? 'has set a new password for your account. Ask your lab for it, or use "Forgot password".' : `updated your details: ${esc(c.name)} · ${esc(c.phone)}.`}`) +
        button(appUrl('/login'), 'Open the collector app')
    );
  });
}

/** A collector was taken off a job (cleared, or replaced by another collector). */
export function collectorUnassigned(bookingId, previousCollectorId) {
  fire(async () => {
    const [b, prev] = await Promise.all([loadBooking(bookingId), User.findById(previousCollectorId).select('name email')]);
    if (!b || !prev) return;
    await send(prev.email, `Job #${b.code} removed`, 'This job was taken off your list', p(`${esc(b.lab.name)} has removed you from this job. You no longer need to visit this patient.`) + jobBlock(b) + button(appUrl('/collector'), 'Open your jobs'));
    if (!b.collector) {
      await send(
        b.user?.email,
        `Collector changed — booking #${b.code}`,
        'Your collector has changed',
        p(`${esc(b.lab.name)} will assign a new ${b.collectionType === 'assisted_visit' ? 'assistant' : 'sample collector'} for your booking. You'll get their name and phone number by email.`) +
          bookingBlock(b) +
          button(bookingLink(b), 'Track your booking')
      );
    }
  });
}

/** A lab added, edited or removed a test in its catalogue. */
export function testCatalogChanged(labId, test, action) {
  fire(async () => {
    const lab = await Lab.findById(labId);
    if (!lab) return;
    const verb = { added: 'added', updated: 'updated', removed: 'removed' }[action] || 'updated';
    const line = `<b>${esc(test.name)}</b>${action === 'removed' ? '' : ` — ₹${test.price}${test.mrp && test.mrp > test.price ? ` (MRP ₹${test.mrp})` : ''}`}`;
    await toLabs(
      await labEmail(lab),
      `Test ${verb}: ${test.name}`,
      `Test ${verb}`,
      p(`${line} was ${verb} ${action === 'removed' ? 'from' : 'in'} the ${esc(lab.name)} catalogue.`) +
        p(action === 'removed' ? 'Patients can no longer book it.' : lab.status === 'approved' ? 'Patients see this price now.' : 'Patients will see it once your lab is live.') +
        button(appUrl('/partner/tests'), 'Manage tests')
    );
  });
}

/** A lab saved its profile without needing re-review. */
export function labProfileUpdated(labId) {
  fire(async () => {
    const lab = await Lab.findById(labId);
    if (!lab) return;
    await toLabs(
      await labEmail(lab),
      `${lab.name} profile updated`,
      'Lab profile updated',
      p(`The profile of <b>${esc(lab.name)}</b> was updated. Patients see the new details right away.`) +
        p("If you didn't make this change, change your password and contact SanjiBani.") +
        button(appUrl('/partner/profile'), 'Review profile')
    );
  });
}

/** The SanjiBani team rejected a UPI payment that went to the platform — keep the lab in the loop. */
export function upiRejectedForLab(bookingId) {
  fire(async () => {
    const b = await loadBooking(bookingId);
    if (!b) return;
    await toLabs(
      await labEmail(b.lab),
      `UPI payment not verified — booking #${b.code}`,
      'Payment not verified',
      p(`The SanjiBani team could not verify ${esc(b.patient.name)}'s UPI payment. The booking is now <b>pay at collection</b> — please collect ₹${b.total}.`) +
        button(appUrl('/partner/bookings'), 'Open bookings')
    );
  });
}
