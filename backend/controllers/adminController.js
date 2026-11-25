import Booking from '../models/bookingModel.js';
import Coupon from '../models/couponModel.js';
import * as events from '../services/events.js';
import { applyUpiDecision } from './partnerController.js';
import Lab from '../models/labModel.js';
import LabTest from '../models/labTestModel.js';
import User from '../models/userModel.js';
import { BOOKING_STATUSES, LAB_STATUSES, ROLES } from '../utils/constants.js';
import { ApiError, escapeRegex, pick, todayIST } from '../utils/helpers.js';

function countMap(rows, keys) {
  const out = Object.fromEntries(keys.map((k) => [k, 0]));
  rows.forEach((r) => (out[r._id] = r.count));
  return out;
}

export async function stats(_req, res) {
  const since = new Date(Date.now() - 13 * 86400000);
  since.setHours(0, 0, 0, 0);

  const [usersByRole, labsByStatus, bookingsByStatus, money, daily, byCity, topLabs, recentUsers] =
    await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Lab.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Booking.aggregate([
        {
          $group: {
            _id: null,
            gbv: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$total', 0] } },
            completedValue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$total', 0] } },
          },
        },
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
            count: { $sum: 1 },
          },
        },
      ]),
      Lab.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$address.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Booking.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: '$lab', bookings: { $sum: 1 }, value: { $sum: '$total' } } },
        { $sort: { bookings: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'labs', localField: '_id', foreignField: '_id', as: 'lab' } },
        { $unwind: '$lab' },
        { $project: { _id: 0, name: '$lab.name', city: '$lab.address.city', rating: '$lab.rating', bookings: 1, value: 1 } },
      ]),
      User.find().sort({ createdAt: -1 }).limit(5),
    ]);

  const dailyMap = new Map(daily.map((d) => [d._id, d.count]));
  res.json({
    users: countMap(usersByRole, ROLES),
    labs: countMap(labsByStatus, LAB_STATUSES),
    bookings: countMap(bookingsByStatus, BOOKING_STATUSES),
    totals: {
      users: usersByRole.reduce((s, r) => s + r.count, 0),
      labs: labsByStatus.reduce((s, r) => s + r.count, 0),
      bookings: bookingsByStatus.reduce((s, r) => s + r.count, 0),
      tests: await LabTest.countDocuments(),
      gbv: money[0]?.gbv || 0,
      completedValue: money[0]?.completedValue || 0,
    },
    last14Days: Array.from({ length: 14 }, (_, i) => {
      const date = todayIST(i - 13);
      return { date, count: dailyMap.get(date) || 0 };
    }),
    labsByCity: byCity.map((c) => ({ city: c._id, count: c.count })),
    topLabs,
    recentUsers,
  });
}

export async function listLabs(req, res) {
  const filter = {};
  if (LAB_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.q) filter.name = new RegExp(escapeRegex(req.query.q), 'i');

  const labs = await Lab.find(filter).sort({ createdAt: -1 }).populate('owner', 'name email phone').lean();
  const ids = labs.map((l) => l._id);
  const [testCounts, bookingCounts] = await Promise.all([
    LabTest.aggregate([{ $match: { lab: { $in: ids } } }, { $group: { _id: '$lab', count: { $sum: 1 } } }]),
    Booking.aggregate([{ $match: { lab: { $in: ids } } }, { $group: { _id: '$lab', count: { $sum: 1 } } }]),
  ]);
  const tc = new Map(testCounts.map((t) => [String(t._id), t.count]));
  const bc = new Map(bookingCounts.map((t) => [String(t._id), t.count]));
  res.json({
    items: labs.map((l) => ({ ...l, testCount: tc.get(String(l._id)) || 0, bookingCount: bc.get(String(l._id)) || 0 })),
  });
}

export async function setLabStatus(req, res) {
  const { status, note } = req.body || {};
  if (!LAB_STATUSES.includes(status)) throw new ApiError(400, 'Invalid status');
  const lab = await Lab.findById(req.params.id);
  if (!lab) throw new ApiError(404, 'Lab not found');
  lab.status = status;
  lab.statusNote = note ? String(note).slice(0, 300) : undefined;
  await lab.save();
  events.labStatusChanged(lab._id);
  res.json({ lab });
}

export async function listUsers(req, res) {
  const filter = {};
  if (ROLES.includes(req.query.role)) filter.role = req.query.role;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(500).populate('lab', 'name').lean();
  const counts = await Booking.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);
  const bc = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json({
    items: users.map(({ password: _p, __v: _v, ...u }) => ({ ...u, bookingCount: bc.get(String(u._id)) || 0 })),
  });
}

export async function setUserActive(req, res) {
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: Boolean(req.body?.isActive) },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found');
  events.accountStatusChanged(user._id, { by: 'admin' });
  res.json({ user });
}

export async function listBookings(req, res) {
  const filter = {};
  if (BOOKING_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ code: rx }, { 'patient.name': rx }];
  }
  const bookings = await Booking.find(filter)
    .sort({ createdAt: -1 })
    .limit(300)
    .populate('lab', 'name address.city')
    .populate('user', 'name email');
  res.json({ items: bookings });
}

/* ---------- Coupons ---------- */

const COUPON_FIELDS = ['code', 'description', 'type', 'value', 'maxDiscount', 'minOrder', 'isActive', 'featured', 'expiresAt', 'usageLimit'];

function couponBody(body) {
  const data = pick(body, COUPON_FIELDS);
  for (const k of ['maxDiscount', 'usageLimit', 'expiresAt']) if (data[k] === '') data[k] = null;
  return data;
}

export async function listCoupons(_req, res) {
  // Personal invite coupons are issued automatically; the admin list shows only shared coupons.
  res.json({ items: await Coupon.find({ owner: null }).sort({ createdAt: -1 }) });
}

export async function createCoupon(req, res) {
  const coupon = await Coupon.create(couponBody(req.body));
  res.status(201).json({ coupon });
}

export async function updateCoupon(req, res) {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  coupon.set(couponBody(req.body));
  await coupon.save();
  res.json({ coupon });
}

export async function deleteCoupon(req, res) {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ ok: true });
}

/** PATCH /api/admin/bookings/:id/payment { action } — admin verifies UPI payments (e.g. to the platform UPI ID). */
export async function verifyBookingPayment(req, res) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  const toLab = booking.paymentStatus === 'verifying' && booking.upiPayee === 'platform';
  await applyUpiDecision(booking, req.body?.action);
  if (toLab && req.body?.action === 'reject') events.upiRejectedForLab(booking._id);
  await booking.populate([{ path: 'lab', select: 'name address.city' }, { path: 'user', select: 'name email' }]);
  res.json({ booking });
}
