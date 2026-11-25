/**
 * Email notifications for every step of the marketplace flow.
 * Each export is fire-and-forget: call it after saving, it loads what it needs and emails
 * the patient, the lab (lab email, else the partner's account email), the collector and/or admins.
 * Collector emails never contain prices.
 */
import Booking from '../models/bookingModel.js';
import Lab from '../models/labModel.js';
import LabInvite from '../models/labInviteModel.js';
import Review from '../models/reviewModel.js';
import User from '../models/userModel.js';
import { BRAND, MAIL, emailBaseUrl, esc, layout, sendEmail } from './notify.js';

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
  return emailBaseUrl() + path;
}
const button = (href, label) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px"><tr><td style="background:${MAIL.accent};border-radius:6px"><a href="${href}" style="display:inline-block;padding:11px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600">${esc(label)}</a></td></tr></table>`;
const p = (html) => `<p style="margin:0 0 12px;line-height:1.6">${html}</p>`;
/** Send one email. `banner` picks the header photo for the audience: patient | lab | collector. */
const send = (to, subject, title, body, { replyTo, banner = 'patient' } = {}) =>
  to && sendEmail({ to, subject, html: layout(title, body, { banner }), replyTo });
// Replies go to the right team: lab partners and collectors → labs@, payments → payments@, everyone else → care@ (default).
const toLabs = (to, subject, title, body) => send(to, subject, title, body, { replyTo: BRAND.labsEmail || undefined, banner: 'lab' });
const toCollector = (to, subject, title, body) => send(to, subject, title, body, { replyTo: BRAND.labsEmail || undefined, banner: 'collector' });
const toAdmin = (to, subject, title, body) => send(to, subject, title, body, { banner: 'lab' });
const toPayments = (to, subject, title, body) => send(to, subject, title, body, { replyTo: BRAND.paymentsEmail || undefined });
const labHi = (lab) => p(`Hello ${esc(lab?.name || '')} team,`);
const hi = (name) => p(`Hi ${esc(String(name || 'there').split(' ')[0])},`);
/** A short numbered "What happens next" list. */
const next = (steps, heading = 'What happens next') =>
  `<p style="margin:20px 0 6px;font-weight:600;color:#111827">${heading}</p><ol style="margin:0 0 12px;padding-left:20px;line-height:1.7">${steps.filter(Boolean).map((x) => `<li>${x}</li>`).join('')}</ol>`;

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

/** Plain label/value lines for booking and job details — no boxes, just a heading and aligned text. */
const row = (label, value) =>
  `<tr><td style="padding:4px 16px 4px 0;width:110px;vertical-align:top;font-size:14px;color:${MAIL.muted}">${label}</td><td style="padding:4px 0;vertical-align:top;font-size:14px;color:${MAIL.text}">${value}</td></tr>`;
const details = (heading, rows) =>
  `<p style="margin:24px 0 8px;font-size:14px;font-weight:600;color:${MAIL.text}">${heading}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px">
${rows.filter(Boolean).join('')}
</table>`;

/** Booking details with prices — for the patient and the lab. */
function bookingBlock(b, { forLab = false } = {}) {
  const items = b.items.map((i) => `${esc(i.name)} <span style="color:${MAIL.muted}">— ₹${i.price}</span>`).join('<br>');
  const where = b.collectionType === 'lab_visit' ? `${esc(b.lab?.name)}, ${esc(addr(b.lab?.address))}` : esc(addr(b.address));
  return details(`Booking #${esc(b.code)}`, [
    row('Lab', esc(b.lab?.name)),
    row('Date &amp; time', `${esc(b.slot.date)}, ${esc(b.slot.time)}`),
    row('Service', TYPE[b.collectionType] || ''),
    row(b.collectionType === 'lab_visit' ? 'Lab address' : 'Address', where),
    forLab && row('Patient', `${esc(b.patient.name)}, ${b.patient.age} yrs, ${esc(b.patient.gender)}<br>${esc(b.patient.phone)}`),
    row('Tests', items),
    b.collectionFee && row(b.collectionType === 'assisted_visit' ? 'Assisted visit fee' : 'Collection fee', `₹${b.collectionFee}`),
    b.discount && row('Coupon', `${esc(b.couponCode)} (−₹${b.discount})`),
    row('Total', `<b>₹${b.total}</b> <span style="color:${MAIL.muted}">· ${b.paymentStatus === 'paid' ? 'Paid' : 'Pay at collection'}</span>`),
  ]);
}

/** Job details without any prices — for the sample collector. */
function jobBlock(b) {
  const tests = b.items.map((i) => `${esc(i.name)}${i.sampleType && i.sampleType !== 'None' ? ` <span style="color:${MAIL.muted}">— ${esc(i.sampleType)}</span>` : ''}`).join('<br>');
  const toCollect =
    b.paymentStatus === 'paid'
      ? 'Prepaid — nothing to collect'
      : b.paymentStatus === 'verifying'
        ? 'Paid by UPI (lab is verifying) — do not collect cash'
        : `Collect ₹${b.total} from the patient`;
  return details(`Job #${esc(b.code)}`, [
    row('Service', TYPE[b.collectionType] || ''),
    row('Date &amp; time', `${esc(b.slot.date)}, ${esc(b.slot.time)}`),
    row('Patient', `${esc(b.patient.name)}<br>${esc(b.patient.phone)}`),
    row(b.collectionType === 'assisted_visit' ? 'Pickup' : 'Address', esc(addr(b.address))),
    row('Samples', tests),
    row('Payment', toCollect),
  ]);
}

const bookingLink = (b) => appUrl(`/bookings/${b._id}`);

/* ---------------- Accounts ---------------- */

/** A coupon code shown large, with what it's worth and when it expires. */
function couponBlock(c) {
  const until = c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : null;
  return details('Your coupon', [
    row('Code', `<span style="font-family:monospace;font-size:18px;font-weight:700;letter-spacing:1px;color:${MAIL.text}">${esc(c.code)}</span>`),
    row('Discount', `₹${c.value} off${c.minOrder ? ` on bookings of ₹${c.minOrder} or more` : ''}`),
    until && row('Valid till', esc(until)),
  ]);
}

/** `coupon`: the welcome coupon of a patient who signed up through a friend's invite. */
export function userRegistered(user, { coupon } = {}) {
  fire(async () => {
    if (user.role === 'lab') {
      await toLabs(
        user.email,
        'Welcome to SanjiBani for labs',
        'Welcome to SanjiBani',
        hi(user.name) +
          p('Thank you for registering your lab with SanjiBani. Your partner account is ready.') +
          next(['Add your lab details: address, timings and accreditations.', 'Add your tests and prices.', 'Our team verifies your lab, usually within 24 hours, and it goes live for patients.'], 'Your next steps') +
          button(appUrl('/partner'), 'Complete your lab profile')
      );
    } else {
      await send(
        user.email,
        'Welcome to SanjiBani',
        'Welcome to SanjiBani',
        hi(user.name) +
          p('Thank you for signing up. Your SanjiBani account is ready to use.') +
          (coupon ? p(`Because a friend invited you, here is <b>₹${coupon.value} off</b> your booking. Enter the code at checkout.`) + couponBlock(coupon) : '') +
          next(['Compare the price of any test across verified labs near you.', 'Book a home sample collection or a lab visit at a time that suits you.', 'Get your reports online, right in your account.'], 'With SanjiBani you can') +
          button(appUrl('/tests'), 'Book a test')
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
      hi(user.name) +
        p('The password for your SanjiBani account was changed just now.') +
        p("If you made this change, no action is needed. If you didn't, reset your password right away and reply to this email so we can secure your account.") +
        button(appUrl('/forgot-password'), 'Reset password')
    )
  );
}

/* ---------------- Invitations ---------------- */

/** Admin invited a laboratory to create its partner account. */
export function labInvited(inviteId) {
  fire(async () => {
    const inv = await LabInvite.findById(inviteId);
    if (!inv) return;
    const signUp = appUrl(`/register?role=lab&email=${encodeURIComponent(inv.email)}`);
    await toLabs(
      inv.email,
      `Invitation: list ${inv.labName} on SanjiBani`,
      'Grow your lab with SanjiBani',
      (inv.contactName ? p(`Hello ${esc(inv.contactName)},`) : labHi({ name: inv.labName })) +
        p(`We would like to invite <b>${esc(inv.labName)}</b> to join SanjiBani, an online marketplace where patients compare test prices and book home sample collection or lab visits with verified labs near them.`) +
        (inv.note ? p(`<i>“${esc(inv.note)}”</i>`) : '') +
        next(
          [
            '<b>Free listing</b>: no joining fee to create your lab page.',
            '<b>New patients</b>: appear when people in your city search for tests.',
            '<b>One dashboard</b>: bookings, sample collectors and reports in one place.',
            '<b>Paid directly</b>: patients pay to your own UPI or at collection.',
          ],
          'Why labs join SanjiBani'
        ) +
        next(
          ['Create your partner account (takes 2 minutes).', 'Add your lab details, tests and prices.', 'Our team verifies your lab, usually within 24 hours, and you go live.'],
          'How to get started'
        ) +
        button(signUp, 'Create your lab account') +
        p(`<span style="font-size:13px;color:${MAIL.muted}">Questions? Just reply to this email and our partner team will help.</span>`)
    );
  });
}

/** A friend the user invited completed their first booking: thank the inviter with a coupon. */
export function inviteRewarded(inviter, friend, coupon) {
  fire(() =>
    send(
      inviter.email,
      `You earned ₹${coupon.value} off — thanks for inviting ${String(friend.name || 'a friend').split(' ')[0]}`,
      'Thanks for spreading the word',
      hi(inviter.name) +
        p(`${esc(String(friend.name || 'Your friend').split(' ')[0])} joined SanjiBani with your invite and just completed their first booking. As a thank-you, here is <b>₹${coupon.value} off</b> your next booking.`) +
        couponBlock(coupon) +
        button(appUrl('/invite'), 'Invite more friends')
    )
  );
}

export function collectorAccountCreated(collectorId) {
  fire(async () => {
    const c = await User.findById(collectorId).populate('lab', 'name phone');
    if (!c) return;
    await toCollector(
      c.email,
      `You're now a sample collector for ${c.lab?.name}`,
      'Welcome to the team',
      hi(c.name) +
        p(`<b>${esc(c.lab?.name)}</b> has added you as a sample collector on SanjiBani.`) +
        next([`Log in with <b>${esc(c.email)}</b> and the password your lab gave you (or use "Forgot password").`, 'See the jobs assigned to you, with the patient address and directions.', 'Update each step as you go, and track your earnings.'], 'Getting started') +
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
      labHi(lab) +
        p(`Thank you. We have received the details of <b>${esc(lab.name)}</b> and our team is now verifying them. This usually takes up to 24 hours.`) +
        p("We will email you as soon as your lab is approved. Meanwhile, add your tests and prices so you're ready to go live.") +
        button(appUrl('/partner/tests'), 'Add tests & prices')
    );
    const admins = await adminEmails();
    await Promise.all(
      admins.map((to) =>
        toAdmin(
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
    const note = lab.statusNote ? p(`<b>Note from our team:</b> ${esc(lab.statusNote)}`) : '';
    if (lab.status === 'approved') {
      await toLabs(to, `${lab.name} is now live on SanjiBani`, 'Your lab is now live', labHi(lab) + p(`Congratulations! <b>${esc(lab.name)}</b> has been approved and is now visible to patients on SanjiBani. They can find your lab, compare your prices and book tests.`) + note + button(appUrl('/partner'), 'Open your dashboard'));
    } else if (lab.status === 'rejected') {
      await toLabs(to, `${lab.name} was not approved`, 'Your lab needs changes', labHi(lab) + p(`We could not approve <b>${esc(lab.name)}</b> yet. Please update your lab profile based on the note below and save it. It will be sent for review again automatically.`) + note + button(appUrl('/partner/profile'), 'Update lab profile'));
    } else if (lab.status === 'suspended') {
      await toLabs(to, `${lab.name} has been suspended`, 'Your lab is suspended', labHi(lab) + p(`<b>${esc(lab.name)}</b> is temporarily hidden from patients, and new bookings are paused.`) + note + p('Please reply to this email so we can help you resolve it.'));
    } else {
      await toLabs(to, `${lab.name} is under review`, 'Your lab is under review', labHi(lab) + p(`<b>${esc(lab.name)}</b> is waiting for verification. We will email you once it is reviewed.`) + note);
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
      hi(b.patient.name) +
        p(`Thank you for booking with SanjiBani. Your booking <b>#${esc(b.code)}</b> has been sent to <b>${esc(b.lab.name)}</b>.`) +
        bookingBlock(b) +
        next([
          `${esc(b.lab.name)} confirms your booking. We'll email you when it does.`,
          b.collectionType === 'lab_visit' ? `Visit the lab at your slot time: ${esc(b.slot.date)}, ${esc(b.slot.time)}.` : "A sample collector is assigned, and we'll send you their name and phone number.",
          "Your report is shared online. We'll email you as soon as it is ready.",
        ]) +
        button(bookingLink(b), 'Track your booking')
    );
    await toLabs(
      await labEmail(b.lab),
      `New booking #${b.code} — ${b.patient.name}`,
      'You have a new booking',
      labHi(b.lab) +
      p(`<b>${esc(b.patient.name)}</b> has booked ${b.items.length === 1 ? 'a test' : `${b.items.length} tests`} for ${esc(b.slot.date)}, ${esc(b.slot.time)}.`) +
      p(b.collectionType === 'lab_visit' ? '<b>Action needed:</b> please confirm the booking.' : '<b>Action needed:</b> please confirm the booking and assign a sample collector.') +
        bookingBlock(b, { forLab: true }) +
        (b.notes ? p(`<b>Patient note:</b> ${esc(b.notes)}`) : '') +
        button(appUrl('/partner/bookings'), 'Open bookings')
    );
  });
}

const PATIENT_STATUS = {
  confirmed: (b) => ({
    subject: `Booking #${b.code} confirmed`,
    title: 'Your booking is confirmed',
    body:
      b.collectionType === 'lab_visit'
        ? p(`${esc(b.lab.name)} has confirmed your booking. Please reach the lab at your slot time. Address: ${esc(addr(b.lab.address))}. Phone: ${esc(b.lab.phone)}.`)
        : p(`${esc(b.lab.name)} has confirmed your booking. A sample collector will be assigned shortly, and we'll email you their name and phone number.`),
  }),
  sample_collected: (b) => ({
    subject: `Sample collected — booking #${b.code}`,
    title: 'Your sample has been collected',
    body: p(`Your sample has been collected and is on its way to ${esc(b.lab.name)}. Reports are usually ready within <b>${esc(b.lab.reportTime || '24 hours')}</b>, and we'll email you as soon as yours is.`),
  }),
  report_ready: (b) => ({
    subject: `Your report is ready — booking #${b.code}`,
    title: 'Your report is ready',
    body:
      (b.reportNote ? p(esc(b.reportNote)) : '') +
      p(b.report ? `${esc(b.lab.name)} has shared your report. You can view and download the PDF from your booking page.` : `${esc(b.lab.name)} has shared your report. Open your booking to see the details.`) +
      p('Please discuss your results with your doctor.'),
    cta: 'View & download report',
  }),
  completed: (b) => ({
    subject: `Thank you — booking #${b.code} completed`,
    title: 'Thank you for choosing SanjiBani',
    body: p(`Your booking with ${esc(b.lab.name)} is now complete. Thank you for trusting us with your care.`) + p('How was your experience? A quick rating helps other patients choose the right lab.'),
    cta: 'Rate your experience',
  }),
  cancelled: (b, by) => ({
    subject: `Booking #${b.code} cancelled`,
    title: 'Your booking was cancelled',
    body:
      p(by === 'patient' ? `Your booking <b>#${esc(b.code)}</b> with ${esc(b.lab.name)} has been cancelled, as you requested.` : `We're sorry: ${esc(b.lab.name)} had to cancel your booking <b>#${esc(b.code)}</b>.`) +
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
      await send(b.user?.email, tpl.subject, tpl.title, hi(b.patient.name) + tpl.body + bookingBlock(b) + button(tpl.href || bookingLink(b), tpl.cta || 'View booking'));
    }
    // Keep the lab informed of changes it didn't make itself.
    if (by !== 'lab' && ['cancelled', 'sample_collected'].includes(b.status)) {
      await toLabs(
        await labEmail(b.lab),
        b.status === 'cancelled' ? `Booking #${b.code} cancelled by patient` : `Sample collected — booking #${b.code}`,
        b.status === 'cancelled' ? 'A patient cancelled a booking' : `${b.collector?.name || 'Your collector'} collected the sample`,
        (b.status === 'cancelled' ? p(`${esc(b.patient.name)} has cancelled booking <b>#${esc(b.code)}</b>. No action is needed.`) + (b.cancelReason ? p(`<b>Reason:</b> ${esc(b.cancelReason)}`) : '') : p(`${esc(b.collector?.name || 'Your collector')} has collected the sample for booking <b>#${esc(b.code)}</b>. It is on its way to your lab.`)) + bookingBlock(b, { forLab: true }) + button(appUrl('/partner/bookings'), 'Open bookings')
      );
    }
    // Tell the assigned collector their job was cancelled.
    if (b.status === 'cancelled' && b.collector?.email) {
      await toCollector(b.collector.email, `Job #${b.code} cancelled`, 'This job was cancelled', hi(b.collector.name) + p(`Job <b>#${esc(b.code)}</b> has been cancelled. You no longer need to visit this patient.`) + jobBlock(b));
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
      hi(b.patient.name) +
        p(`<b>${esc(b.collector.name)}</b> (${esc(b.collector.phone)}) from ${esc(b.lab.name)} will ${assisted ? 'pick you up, stay with you at the lab and drop you back home' : 'visit you to collect your sample'}.`) +
        bookingBlock(b) +
        button(bookingLink(b), 'Track live')
    );
    await toCollector(
      b.collector.email,
      `New job #${b.code} — ${b.slot.date} ${b.slot.time}`,
      'You have a new job',
      hi(b.collector.name) + p(`${esc(b.lab.name)} has assigned you a ${assisted ? 'patient pickup (assisted visit)' : 'home sample collection'}. Please reach the patient on time.`) + jobBlock(b) + button(appUrl('/collector'), 'Open your jobs')
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
    await send(b.user?.email, `${title} — booking #${b.code}`, title, hi(b.patient.name) + p(text) + button(bookingLink(b), 'Track live'));
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
      'Your report is ready to download',
      hi(b.patient.name) + p(`${esc(b.lab.name)} has uploaded your report PDF. You can view and download it from your booking page.`) + button(bookingLink(b), 'Download report')
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
    await toPayments(b.user?.email, `Payment received — ₹${b.total} for booking #${b.code}`, 'Payment received', hi(b.patient.name) + p(`Thank you. We have received your payment of <b>₹${b.total}</b> ${how} for booking <b>#${esc(b.code)}</b>. Please keep this email as your receipt.`) + bookingBlock(b) + button(bookingLink(b), 'View booking'));
    await toLabs(await labEmail(b.lab), `Payment received for booking #${b.code}`, 'Payment received', p(`₹${b.total} has been received ${how} from ${esc(b.patient.name)} for booking <b>#${esc(b.code)}</b>.`) + button(appUrl('/partner/bookings'), 'Open bookings'));
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
    const verify = b.upiPayee === 'platform' ? toAdmin : toLabs;
    for (const to of verifiers) await verify(
      to,
      `Confirm UPI payment ₹${b.total} — booking #${b.code}`,
      'Please confirm a UPI payment',
      p(`${esc(b.patient.name)} says they paid <b>₹${b.total}</b> to ${b.upiPayee === 'platform' ? 'the SanjiBani UPI ID' : 'your UPI ID'} for ${esc(b.lab.name)}.`) +
        p(`UPI transaction ID (UTR): <b style="font-size:17px;letter-spacing:1px">${esc(b.upiRef)}</b>`) +
        p('<b>Action needed:</b> check your bank or UPI app for this transaction, then mark it as received or not received on the booking.') +
        button(appUrl(b.upiPayee === 'platform' ? '/admin/bookings' : '/partner/bookings'), 'Verify payment')
    );
    await toPayments(
      b.user?.email,
      `UPI payment submitted — booking #${b.code}`,
      'We are verifying your payment',
      hi(b.patient.name) + p(`Thank you. We have received your UPI transaction ID <b>${esc(b.upiRef)}</b> for <b>₹${b.total}</b>. The payment is being verified, and we'll email your receipt as soon as it is confirmed.`) +
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
      hi(b.patient.name) + p(`We could not find a payment with transaction ID <b>${esc(utr)}</b> for booking <b>#${esc(b.code)}</b>.`) +
        p(`Please check the transaction ID in your UPI app and submit it again. You can also pay at collection, or call the lab at ${esc(b.lab.phone)}.`) +
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
    const mail = u.role === 'collector' ? toCollector : u.role === 'lab' ? toLabs : send;
    if (u.isActive) {
      await mail(
        u.email,
        'Your SanjiBani account is active again',
        'Your account is active again',
        hi(u.name) + p(`${who} has re-activated your SanjiBani account. You can log in and use it again as before.`) + button(appUrl('/login'), 'Log in')
      );
    } else {
      await mail(
        u.email,
        'Your SanjiBani account has been deactivated',
        'Your account has been deactivated',
        hi(u.name) + p(`${who} has deactivated your SanjiBani account. You will not be able to log in until it is re-activated.`) +
          p(by === 'lab' ? 'If you think this is a mistake, please contact your lab.' : 'If you think this is a mistake, simply reply to this email and our team will look into it.')
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
      hi(user.name) +
        p('The details on your SanjiBani account were updated just now.') +
        p("If you made this change, no action is needed. If you didn't, please change your password and reply to this email.") +
        button(appUrl(ROLE_HOME[user.role] || '/'), 'Review your account')
    )
  );
}

/** A lab changed a collector's details or password. */
export function collectorUpdated(collectorId, { passwordChanged: pw = false } = {}) {
  fire(async () => {
    const c = await User.findById(collectorId).populate('lab', 'name');
    if (!c) return;
    await toCollector(
      c.email,
      pw ? 'Your collector password was reset' : 'Your collector details were updated',
      pw ? 'Password reset by your lab' : 'Details updated',
      hi(c.name) + p(`<b>${esc(c.lab?.name || 'Your lab')}</b> ${pw ? 'has set a new password for your account. Ask your lab for it, or use "Forgot password".' : `updated your details: ${esc(c.name)} · ${esc(c.phone)}.`}`) +
        button(appUrl('/login'), 'Open the collector app')
    );
  });
}

/** A collector was taken off a job (cleared, or replaced by another collector). */
export function collectorUnassigned(bookingId, previousCollectorId) {
  fire(async () => {
    const [b, prev] = await Promise.all([loadBooking(bookingId), User.findById(previousCollectorId).select('name email')]);
    if (!b || !prev) return;
    await toCollector(prev.email, `Job #${b.code} removed`, 'This job was taken off your list', hi(prev.name) + p(`${esc(b.lab.name)} has removed you from job <b>#${esc(b.code)}</b>. You no longer need to visit this patient.`) + jobBlock(b) + button(appUrl('/collector'), 'Open your jobs'));
    if (!b.collector) {
      await send(
        b.user?.email,
        `Collector changed — booking #${b.code}`,
        'Your collector has changed',
        hi(b.patient.name) + p(`${esc(b.lab.name)} will assign a new ${b.collectionType === 'assisted_visit' ? 'assistant' : 'sample collector'} for your booking. You'll get their name and phone number by email.`) +
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

/** The patient moved a booking to another slot. `from` = the old { date, time }. */
export function bookingRescheduled(bookingId, { from, previousCollectorId } = {}) {
  fire(async () => {
    const b = await loadBooking(bookingId);
    if (!b) return;
    const was = from ? `${esc(from.date)}, ${esc(from.time)}` : 'the earlier slot';
    const now = `${esc(b.slot.date)}, ${esc(b.slot.time)}`;
    await send(
      b.user?.email,
      `Booking #${b.code} moved to ${b.slot.date}, ${b.slot.time}`,
      'Your booking is rescheduled',
      hi(b.patient.name) +
        p(`Your booking with ${esc(b.lab.name)} has moved from <b>${was}</b> to <b>${now}</b>.`) +
        (previousCollectorId ? p(`The lab will assign a ${b.collectionType === 'assisted_visit' ? 'staff member' : 'sample collector'} for the new time and we'll email you their details.`) : '') +
        bookingBlock(b) +
        button(bookingLink(b), 'View booking')
    );
    await toLabs(
      await labEmail(b.lab),
      `Booking #${b.code} rescheduled to ${b.slot.date}, ${b.slot.time}`,
      'A patient changed their slot',
      labHi(b.lab) +
        p(`${esc(b.patient.name)} moved booking <b>#${esc(b.code)}</b> from <b>${was}</b> to <b>${now}</b>.`) +
        (previousCollectorId ? p('The collector you had assigned has been released. <b>Please assign a collector for the new time.</b>') : '') +
        bookingBlock(b, { forLab: true }) +
        button(appUrl('/partner/bookings'), 'Open bookings')
    );
    if (previousCollectorId) {
      const prev = await User.findById(previousCollectorId).select('name email');
      if (prev?.email) {
        await toCollector(
          prev.email,
          `Job #${b.code} rescheduled — removed from your list`,
          'This job moved to another time',
          hi(prev.name) + p(`The patient moved job <b>#${esc(b.code)}</b> from ${was} to ${now}. You no longer need to visit at the old time; ${esc(b.lab.name)} will reassign it.`) + button(appUrl('/collector'), 'Open your jobs')
        );
      }
    }
  });
}
