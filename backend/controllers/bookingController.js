import mongoose from 'mongoose';
import Booking from '../models/bookingModel.js';
import Coupon from '../models/couponModel.js';
import Lab from '../models/labModel.js';
import LabTest from '../models/labTestModel.js';
import Review from '../models/reviewModel.js';
import * as events from '../services/events.js';
import { refundIfPaidOnline } from './paymentController.js';
import { storage } from '../services/storage.js';
import { CANCELLABLE_BY_PATIENT, COLLECTION_TYPES, MAX_BOOKING_DAYS_AHEAD, TIME_SLOTS } from '../utils/constants.js';
import { resolveCoupon } from '../utils/coupons.js';
import { ApiError, pick, slotPassed, todayIST } from '../utils/helpers.js';

const LAB_SUMMARY = 'name slug address phone coverTheme reportTime';
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

export async function releaseCoupon(booking) {
  if (booking.couponCode) {
    await Coupon.updateOne({ code: booking.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  }
}

/** POST /api/coupons/validate */
export async function validateCoupon(req, res) {
  const { code, labId, items } = req.body || {};
  const { subtotal } = await loadCart(labId, items);
  const { coupon, discount } = await resolveCoupon(code, subtotal);
  res.json({ code: coupon.code, description: coupon.description, discount, subtotal });
}

/** POST /api/bookings — patient books tests from a single lab. */
export async function createBooking(req, res) {
  const { labId, items, collectionType, slot = {}, patient = {}, address = {}, notes, couponCode } = req.body || {};

  if (!COLLECTION_TYPES.includes(collectionType)) {
    throw new ApiError(400, 'Choose home collection, lab visit or assisted visit');
  }
  const { lab, tests, subtotal } = await loadCart(labId, items);

  if (collectionType === 'home') {
    if (!lab.homeCollection) throw new ApiError(400, 'This lab does not offer home collection');
    const notHome = tests.filter((t) => !t.homeCollection);
    if (notHome.length) {
      throw new ApiError(400, `Home collection is not available for: ${notHome.map((t) => t.name).join(', ')}`);
    }
    if (!hasFullAddress(address)) {
      throw new ApiError(400, 'Enter a full address with a 6-digit pincode for home collection');
    }
  }


  if (collectionType === 'assisted_visit') {
    // Field staff escorts the patient to the lab, so any active test is fine (including lab-only ones).
    if (!lab.assistedVisit) throw new ApiError(400, 'This lab does not offer assisted visits');
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
    throw new ApiError(409, 'This slot is fully booked. Please pick another time.');
  }

  let coupon = null;
  let discount = 0;
  if (couponCode && String(couponCode).trim()) {
    ({ coupon, discount } = await resolveCoupon(couponCode, subtotal));
  }
  const collectionFee =
    collectionType === 'home' ? lab.homeCollectionFee : collectionType === 'assisted_visit' ? lab.assistedVisitFee || 0 : 0;

  const booking = new Booking({
    user: req.user._id,
    lab: lab._id,
    items: tests.map((t) => ({
      test: t._id,
      name: t.name,
      category: t.category,
      type: t.type,
      mrp: t.mrp,
      price: t.price,
      sampleType: t.sampleType,
      preparation: t.preparation,
    })),
    subtotal,
    collectionFee,
    discount,
    couponCode: coupon?.code,
    total: subtotal + collectionFee - discount,
    collectionType,
    slot: { date: slot.date, time: slot.time },
    patient: pick(patient, ['name', 'age', 'gender', 'phone']),
    address: collectionType === 'lab_visit' ? undefined : pick(address, ['line', 'area', 'city', 'pincode']),
    notes,
  });
  booking.setStatus('pending', 'Booking placed');
  await booking.validate();

  if (coupon) {
    // Atomically claim one use of the coupon (respects usageLimit under concurrency).
    const claimed = await Coupon.findOneAndUpdate(
      {
        _id: coupon._id,
        $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
      },
      { $inc: { usedCount: 1 } }
    );
    if (!claimed) throw new ApiError(400, 'This coupon has reached its usage limit');
  }
  try {
    await booking.save();
  } catch (err) {
    if (coupon) await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: -1 } });
    throw err;
  }

  events.bookingPlaced(booking._id);

  res.status(201).json({ booking: await booking.populate('lab', LAB_SUMMARY) });
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
  res.json({ booking: json });
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
  await refundIfPaidOnline(booking);
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
