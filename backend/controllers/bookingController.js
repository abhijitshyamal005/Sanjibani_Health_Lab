import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Booking from '../models/bookingModel.js';
import Coupon from '../models/couponModel.js';
import Lab from '../models/labModel.js';
import LabTest from '../models/labTestModel.js';
import Review from '../models/reviewModel.js';
import * as events from '../services/events.js';
import { storage } from '../services/storage.js';
import { CANCELLABLE_BY_PATIENT, COLLECTION_TYPES, MAX_BOOKING_DAYS_AHEAD, TIME_SLOTS } from '../utils/constants.js';
import { resolveCoupon } from '../utils/coupons.js';
import { ApiError, pick, slotPassed, todayIST } from '../utils/helpers.js';

const LAB_SUMMARY = 'name slug address phone coverTheme reportTime upiId';
const COLLECTOR_SUMMARY = 'name phone';

const hasFullAddress = (a = {}) => Boolean(a.line && a.city && /^\d{6}$/.test(String(a.pincode || '')));

/**
 * Validate a cart (lab + test ids) and load it from the database.
 * Prices always come from the server, never from the client.
 */
export async function loadCart(labId, items) {
  if (!mongoose.isValidObjectId(labId)) throw new ApiError(400, 'Select a lab');
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Add at least one test');
  if (items.length > 20) throw new ApiError(400, 'You can book up to 20 tests at a time');
  const testIds = [...new Set(items.map((i) => String(typeof i === 'object' ? i?.test ?? i?._id : i)))];
  if (!testIds.every((id) => mongoose.isValidObjectId(id))) throw new ApiError(400, 'Invalid test in cart');

  const lab = await Lab.findOne({ _id: labId, status: 'approved' });
  if (!lab) throw new ApiError(400, 'This lab is not accepting bookings right now');

  const tests = await LabTest.find({ _id: { $in: testIds }, lab: lab._id, isActive: true });
  if (tests.length !== testIds.length) {
    throw new ApiError(400, 'Some tests in your cart are no longer available at this lab');
  }
  return { lab, tests, subtotal: tests.reduce((sum, t) => sum + t.price, 0) };
}

/**
 * Give a coupon use back when a booking is cancelled. In a multi-lab order the coupon is shared,
 * so it is only released once every booking that carries it is cancelled.
 */
export async function releaseCoupon(booking) {
  if (!booking.couponCode) return;
  if (booking.orderCode) {
    const stillActive = await Booking.exists({
      orderCode: booking.orderCode,
      couponCode: booking.couponCode,
      _id: { $ne: booking._id },
      status: { $ne: 'cancelled' },
    });
    if (stillActive) return;
  }
  await Coupon.updateOne({ code: booking.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}

export const MAX_LABS_PER_ORDER = 5;
const MAX_TESTS_PER_ORDER = 20;
const IN_PERSON = new Set(['lab_visit', 'assisted_visit']);

/**
 * A checkout is one or more lab groups: [{ labId, items, collectionType, slot }].
 * The legacy single-lab body ({ labId, items, collectionType, slot }) is treated as one group.
 */
function readGroups(body = {}) {
  const groups = Array.isArray(body.groups)
    ? body.groups.map((g) => ({
        labId: g?.labId,
        items: g?.items,
        collectionType: g?.collectionType ?? body.collectionType,
        slot: g?.slot ?? body.slot ?? {},
      }))
    : [{ labId: body.labId, items: body.items, collectionType: body.collectionType, slot: body.slot || {} }];
  if (groups.length === 0) throw new ApiError(400, 'Add at least one test');
  if (groups.length > MAX_LABS_PER_ORDER) throw new ApiError(400, `You can book from up to ${MAX_LABS_PER_ORDER} labs at a time`);
  const labIds = groups.map((g) => String(g.labId));
  if (new Set(labIds).size !== labIds.length) throw new ApiError(400, 'Each lab can appear only once in an order');
  const testCount = groups.reduce((n, g) => n + (Array.isArray(g.items) ? g.items.length : 0), 0);
  if (testCount > MAX_TESTS_PER_ORDER) throw new ApiError(400, `You can book up to ${MAX_TESTS_PER_ORDER} tests at a time`);
  return groups;
}

/** POST /api/coupons/validate — works for a single lab ({ labId, items }) or a multi-lab cart ({ groups }). */
export async function validateCoupon(req, res) {
  const groups = readGroups(req.body);
  let subtotal = 0;
  for (const g of groups) subtotal += (await loadCart(g.labId, g.items)).subtotal;
  const { coupon, discount } = await resolveCoupon(req.body?.code, subtotal);
  res.json({ code: coupon.code, description: coupon.description, discount, subtotal });
}

const collectionFeeFor = (lab, type) =>
  type === 'home' ? lab.homeCollectionFee || 0 : type === 'assisted_visit' ? lab.assistedVisitFee || 0 : 0;

/** Validate one lab's part of a checkout: tests, visit type, address and slot availability. */
async function prepareLabPart({ labId, items, collectionType, slot = {} }, address) {
  const { lab, tests, subtotal } = await loadCart(labId, items);
  const at = (msg) => `${lab.name}: ${msg}`;

  if (!COLLECTION_TYPES.includes(collectionType)) {
    throw new ApiError(400, at('Choose home collection, lab visit or assisted visit'));
  }
  if (collectionType === 'home') {
    if (!lab.homeCollection) throw new ApiError(400, at('This lab does not offer home collection'));
    const notHome = tests.filter((t) => !t.homeCollection);
    if (notHome.length) {
      throw new ApiError(400, at(`Home collection is not available for: ${notHome.map((t) => t.name).join(', ')}`));
    }
    if (!hasFullAddress(address)) {
      throw new ApiError(400, 'Enter a full address with a 6-digit pincode for home collection');
    }
  }
  if (collectionType === 'assisted_visit') {
    // Field staff escorts the patient to the lab, so any active test is fine (including lab-only ones).
    if (!lab.assistedVisit) throw new ApiError(400, at('This lab does not offer assisted visits'));
    if (!hasFullAddress(address)) throw new ApiError(400, 'Enter a full pickup address with a 6-digit pincode');
  }

  const today = todayIST();
  const lastDay = todayIST(MAX_BOOKING_DAYS_AHEAD);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date || '') || slot.date < today || slot.date > lastDay) {
    throw new ApiError(400, `Pick a date between today and the next ${MAX_BOOKING_DAYS_AHEAD} days`);
  }
  if (!TIME_SLOTS.includes(slot.time)) throw new ApiError(400, 'Pick a valid time slot');
  if (slotPassed(slot.date, slot.time)) throw new ApiError(400, 'This time slot has already passed');

  const taken = await Booking.countDocuments({
    lab: lab._id,
    'slot.date': slot.date,
    'slot.time': slot.time,
    collectionType,
    status: { $ne: 'cancelled' },
  });
  if (taken >= (lab.slotCapacity || 4)) {
    throw new ApiError(409, at('This slot is fully booked. Please pick another time.'));
  }
  return { lab, tests, subtotal, collectionType, slot: { date: slot.date, time: slot.time }, collectionFee: collectionFeeFor(lab, collectionType) };
}

/** Split an order-level discount across lab bookings in proportion to their test totals. */
function splitDiscount(discount, subtotals) {
  const total = subtotals.reduce((a, b) => a + b, 0);
  if (!discount || !total) return subtotals.map(() => 0);
  const shares = subtotals.map((s) => Math.floor((discount * s) / total));
  let rest = discount - shares.reduce((a, b) => a + b, 0);
  for (let i = 0; rest > 0; i = (i + 1) % shares.length) {
    if (shares[i] < subtotals[i]) {
      shares[i] += 1;
      rest -= 1;
    }
  }
  return shares;
}

const newOrderCode = () => `ORD${crypto.randomInt(100000, 999999)}${crypto.randomBytes(1).toString('hex').toUpperCase()}`;

/**
 * POST /api/bookings — patient books tests for one patient, from one lab or several.
 * Each lab gets its own booking (its own lab team, collector, payment and report);
 * bookings placed together share an orderCode.
 */
export async function createBooking(req, res) {
  const body = req.body || {};
  const { patient = {}, address = {}, notes, couponCode } = body;
  const groups = readGroups(body);

  const parts = [];
  for (const g of groups) parts.push(await prepareLabPart(g, address));

  // The patient cannot be in two places at once: only home collections may share a time slot.
  for (let i = 0; i < parts.length; i += 1) {
    for (let j = i + 1; j < parts.length; j += 1) {
      const a = parts[i];
      const b = parts[j];
      const sameTime = a.slot.date === b.slot.date && a.slot.time === b.slot.time;
      if (sameTime && (IN_PERSON.has(a.collectionType) || IN_PERSON.has(b.collectionType))) {
        throw new ApiError(400, `${a.lab.name} and ${b.lab.name} are at the same time. Pick different slots for a lab visit.`);
      }
    }
  }

  const subtotal = parts.reduce((s, p) => s + p.subtotal, 0);
  let coupon = null;
  let discount = 0;
  if (couponCode && String(couponCode).trim()) {
    ({ coupon, discount } = await resolveCoupon(couponCode, subtotal));
  }
  const discounts = splitDiscount(discount, parts.map((p) => p.subtotal));
  const orderCode = parts.length > 1 ? newOrderCode() : undefined;

  const bookings = parts.map((p, i) => {
    const booking = new Booking({
      user: req.user._id,
      orderCode,
      lab: p.lab._id,
      items: p.tests.map((t) => ({
        test: t._id,
        name: t.name,
        category: t.category,
        type: t.type,
        mrp: t.mrp,
        price: t.price,
        sampleType: t.sampleType,
        preparation: t.preparation,
      })),
      subtotal: p.subtotal,
      collectionFee: p.collectionFee,
      discount: discounts[i],
      couponCode: coupon ? coupon.code : undefined,
      total: p.subtotal + p.collectionFee - discounts[i],
      collectionType: p.collectionType,
      slot: p.slot,
      patient: pick(patient, ['name', 'age', 'gender', 'phone']),
      address: p.collectionType === 'lab_visit' ? undefined : pick(address, ['line', 'area', 'city', 'pincode']),
      notes,
    });
    booking.setStatus('pending', parts.length > 1 ? `Booking placed (order #${orderCode}, ${parts.length} labs)` : 'Booking placed');
    return booking;
  });
  for (const b of bookings) await b.validate();

  if (coupon) {
    // Atomically claim one use of the coupon for the whole order (respects usageLimit under concurrency).
    const claimed = await Coupon.findOneAndUpdate(
      {
        _id: coupon._id,
        $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
      },
      { $inc: { usedCount: 1 } }
    );
    if (!claimed) throw new ApiError(400, 'This coupon has reached its usage limit');
  }
  const saved = [];
  try {
    for (const b of bookings) saved.push(await b.save());
  } catch (err) {
    if (saved.length) await Booking.deleteMany({ _id: { $in: saved.map((b) => b._id) } });
    if (coupon) await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: -1 } });
    throw err;
  }

  for (const b of saved) events.bookingPlaced(b._id);

  await Booking.populate(saved, { path: 'lab', select: LAB_SUMMARY });
  res.status(201).json({ booking: saved[0], bookings: saved, orderCode });
}

/** GET /api/bookings/me */
export async function myBookings(req, res) {
  const bookings = await Booking.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('lab', LAB_SUMMARY)
    .populate('collector', COLLECTOR_SUMMARY);
  res.json({ items: bookings });
}

async function loadVisibleBooking(req) {
  const booking = await Booking.findById(req.params.id)
    .populate('lab', `${LAB_SUMMARY} owner`)
    .populate('user', 'name email phone')
    .populate('collector', COLLECTOR_SUMMARY);
  if (!booking) throw new ApiError(404, 'Booking not found');
  const me = String(req.user._id);
  const allowed = req.user.role === 'admin' || String(booking.user?._id) === me || String(booking.lab?.owner) === me;
  if (!allowed) throw new ApiError(404, 'Booking not found');
  return booking;
}

/** GET /api/bookings/:id — visible to the patient, the lab owner, and admins. */
export async function getBooking(req, res) {
  const booking = await loadVisibleBooking(req);
  const json = booking.toJSON();
  delete json.lab.owner;
  // Other labs' bookings in the same order — shown to the patient and admins, not to other labs.
  let order;
  const me = String(req.user._id);
  if (booking.orderCode && (req.user.role === 'admin' || String(booking.user?._id) === me)) {
    const siblings = await Booking.find({ orderCode: booking.orderCode, user: booking.user._id, _id: { $ne: booking._id } })
      .select('code status lab items.name slot collectionType total collector fieldStatus')
      .populate('lab', 'name slug coverTheme')
      .populate('collector', COLLECTOR_SUMMARY)
      .sort({ createdAt: 1 });
    order = { code: booking.orderCode, bookings: siblings };
  }
  res.json({ booking: json, order });
}

/** GET /api/bookings/:id/report — download the uploaded PDF report. */
export async function downloadReport(req, res) {
  const booking = await loadVisibleBooking(req);
  if (!booking.report?.fileName) throw new ApiError(404, 'No report has been uploaded yet');
  let stream;
  try {
    stream = await storage.stream(booking.report.fileName);
  } catch {
    throw new ApiError(404, 'Report file not found');
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Sanjibani-Report-${booking.code}.pdf"`);
  if (booking.report.size) res.setHeader('Content-Length', String(booking.report.size));
  stream.on('error', () => res.destroy());
  stream.pipe(res);
}

/** PATCH /api/bookings/:id/cancel — patient cancels before sample collection. */
export async function cancelBooking(req, res) {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (!CANCELLABLE_BY_PATIENT.includes(booking.status)) {
    throw new ApiError(400, 'This booking can no longer be cancelled');
  }
  const reason = String(req.body?.reason || 'Cancelled by patient').slice(0, 300);
  booking.cancelReason = reason;
  booking.cancelledBy = 'patient';
  booking.setStatus('cancelled', reason);
  await booking.save();
  await releaseCoupon(booking);
  events.bookingStatusChanged(booking._id, { by: 'patient' });
  res.json({ booking: await booking.populate('lab', LAB_SUMMARY) });
}

/** POST /api/reviews — one review per completed booking. */
export async function createReview(req, res) {
  const { bookingId, rating, comment } = req.body || {};
  if (!mongoose.isValidObjectId(bookingId)) throw new ApiError(400, 'Invalid booking');

  const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status !== 'completed') throw new ApiError(400, 'You can review a lab after your booking is completed');
  if (booking.reviewed) throw new ApiError(409, 'You have already reviewed this booking');

  const review = await Review.create({ lab: booking.lab, user: req.user._id, booking: booking._id, rating: Number(rating), comment });
  booking.reviewed = true;
  await booking.save();
  await Review.recalculateLabRating(booking.lab);
  events.reviewPosted(review._id);

  res.status(201).json({ review });
}

/** GET /api/reviews/recent — testimonials for the home page. */
export async function recentReviews(_req, res) {
  const approved = await Lab.find({ status: 'approved' }).select('_id').lean();
  const reviews = await Review.find({
    lab: { $in: approved.map((l) => l._id) },
    rating: { $gte: 4 },
    comment: { $exists: true, $nin: [null, ''] },
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .populate('user', 'name')
    .populate('lab', 'name slug')
    .lean();
  res.json({
    items: reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      userName: r.user?.name?.split(' ')[0] || 'Patient',
      labName: r.lab?.name,
      labSlug: r.lab?.slug,
      createdAt: r.createdAt,
    })),
  });
}
