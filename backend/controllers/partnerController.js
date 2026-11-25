import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Booking from '../models/bookingModel.js';
import Lab from '../models/labModel.js';
import LabTest from '../models/labTestModel.js';
import Review from '../models/reviewModel.js';
import User from '../models/userModel.js';
import * as events from '../services/events.js';
import { storage } from '../services/storage.js';
import { BOOKING_STATUSES, BOOKING_TRANSITIONS } from '../utils/constants.js';
import { releaseCoupon } from './bookingController.js';
import { refundIfPaidOnline } from './paymentController.js';
import { ApiError, escapeRegex, pick, todayIST } from '../utils/helpers.js';

const LAB_FIELDS = [
  'name',
  'tagline',
  'description',
  'phone',
  'email',
  'opensAt',
  'closesAt',
  'accreditations',
  'homeCollection',
  'homeCollectionFee',
  'reportTime',
  'establishedYear',
  'coverTheme',
  'slotCapacity',
  'assistedVisit',
  'assistedVisitFee',
  'collectorPayoutHome',
  'collectorPayoutAssisted',
];
const TEST_FIELDS = [
  'name',
  'category',
  'type',
  'description',
  'parameters',
  'sampleType',
  'preparation',
  'reportTime',
  'mrp',
  'price',
  'homeCollection',
  'isPopular',
  'isActive',
];

async function myLab(userId) {
  const lab = await Lab.findOne({ owner: userId });
  if (!lab) throw new ApiError(404, 'Create your lab profile first');
  return lab;
}

function labUpdate(body) {
  const data = pick(body, LAB_FIELDS);
  if (body?.address && typeof body.address === 'object') {
    data.address = pick(body.address, ['line', 'area', 'city', 'pincode']);
  }
  return data;
}

function cleanTestBody(body) {
  const data = pick(body, TEST_FIELDS);
  if (Array.isArray(data.parameters)) {
    data.parameters = data.parameters.map((p) => String(p).trim()).filter(Boolean).slice(0, 100);
  }
  return data;
}

/* ---------- Lab profile ---------- */

export async function getMyLab(req, res) {
  const lab = await Lab.findOne({ owner: req.user._id });
  res.json({ lab });
}

export async function createMyLab(req, res) {
  if (await Lab.exists({ owner: req.user._id })) {
    throw new ApiError(409, 'You have already registered a lab');
  }
  const lab = await Lab.create({ ...labUpdate(req.body), owner: req.user._id, status: 'pending' });
  events.labSubmitted(lab._id);
  res.status(201).json({ lab });
}

export async function updateMyLab(req, res) {
  const lab = await myLab(req.user._id);
  const data = labUpdate(req.body);
  if (data.address) data.address = { ...lab.address.toObject(), ...data.address };
  lab.set(data);
  // A rejected lab that edits its profile goes back into the review queue.
  const resubmitted = lab.status === 'rejected';
  if (resubmitted) {
    lab.status = 'pending';
    lab.statusNote = undefined;
  }
  await lab.save();
  if (resubmitted) events.labSubmitted(lab._id, { resubmitted: true });
  res.json({ lab });
}

/* ---------- Tests catalogue ---------- */

export async function listMyTests(req, res) {
  const lab = await myLab(req.user._id);
  const filter = { lab: lab._id };
  if (req.query.q) filter.name = new RegExp(escapeRegex(req.query.q), 'i');
  if (req.query.category) filter.category = req.query.category;
  const tests = await LabTest.find(filter).sort({ category: 1, name: 1 });
  res.json({ items: tests });
}

export async function createTest(req, res) {
  const lab = await myLab(req.user._id);
  const test = await LabTest.create({ ...cleanTestBody(req.body), lab: lab._id });
  res.status(201).json({ test });
}

export async function updateTest(req, res) {
  const lab = await myLab(req.user._id);
  const test = await LabTest.findOne({ _id: req.params.id, lab: lab._id });
  if (!test) throw new ApiError(404, 'Test not found');
  test.set(cleanTestBody(req.body));
  await test.save();
  res.json({ test });
}

export async function deleteTest(req, res) {
  const lab = await myLab(req.user._id);
  const test = await LabTest.findOneAndDelete({ _id: req.params.id, lab: lab._id });
  if (!test) throw new ApiError(404, 'Test not found');
  res.json({ ok: true });
}

/* ---------- Bookings ---------- */

export async function listLabBookings(req, res) {
  const lab = await myLab(req.user._id);
  const filter = { lab: lab._id };
  if (BOOKING_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.date) filter['slot.date'] = String(req.query.date);
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ code: rx }, { 'patient.name': rx }, { 'patient.phone': rx }];
  }
  const bookings = await Booking.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('user', 'name email phone')
    .populate('collector', 'name phone');
  res.json({ items: bookings });
}

export async function updateBookingStatus(req, res) {
  const lab = await myLab(req.user._id);
  const { status, note } = req.body || {};
  const booking = await Booking.findOne({ _id: req.params.id, lab: lab._id });
  if (!booking) throw new ApiError(404, 'Booking not found');

  const allowed = BOOKING_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Cannot change status from ${booking.status} to ${status}`);
  }

  const cleanNote = note ? String(note).slice(0, 1000) : undefined;
  if (status === 'report_ready' && cleanNote) booking.reportNote = cleanNote;
  const wasUnpaid = booking.paymentStatus !== 'paid';
  if (status === 'completed') booking.paymentStatus = 'paid';
  if (status === 'cancelled') {
    booking.cancelledBy = 'lab';
    booking.cancelReason = cleanNote || 'Cancelled by lab';
  }
  booking.setStatus(status, cleanNote);
  await booking.save();
  if (status === 'cancelled') {
    await releaseCoupon(booking);
    await refundIfPaidOnline(booking);
  }
  await booking.populate([{ path: 'user', select: 'name email phone' }, { path: 'collector', select: 'name phone' }]);
  events.bookingStatusChanged(booking._id, { by: 'lab' });
  if (status === 'completed' && wasUnpaid) events.paymentReceived(booking._id);
  res.json({ booking });
}

const REPORT_STATUSES = ['sample_collected', 'report_ready', 'completed'];

/** POST /api/partner/bookings/:id/report — upload a PDF report (multer puts it in req.file). */
export async function uploadReport(req, res) {
  const lab = await myLab(req.user._id);
  const booking = await Booking.findOne({ _id: req.params.id, lab: lab._id });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (!REPORT_STATUSES.includes(booking.status)) throw new ApiError(400, 'Upload the report after the sample is collected');
  if (!req.file) throw new ApiError(400, 'Attach the report as a PDF file');

  const fileName = `${booking._id}-${crypto.randomBytes(6).toString('hex')}.pdf`;
  await storage.put(fileName, req.file.buffer, 'application/pdf');
  const previous = booking.report?.fileName;
  booking.report = {
    fileName,
    originalName: String(req.file.originalname || 'report.pdf').slice(0, 200),
    size: req.file.size,
    uploadedAt: new Date(),
  };
  await booking.save();
  if (previous && previous !== fileName) await storage.remove(previous);
  events.reportUploaded(booking._id);
  res.json({ booking: await booking.populate([{ path: 'user', select: 'name email phone' }, { path: 'collector', select: 'name phone' }]) });
}

/* ---------- Patients & dashboard ---------- */

/** Unique patients who booked with this lab. */
export async function listLabPatients(req, res) {
  const lab = await myLab(req.user._id);
  const patients = await Booking.aggregate([
    { $match: { lab: lab._id } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { name: { $toLower: '$patient.name' }, phone: '$patient.phone' },
        name: { $first: '$patient.name' },
        phone: { $first: '$patient.phone' },
        age: { $first: '$patient.age' },
        gender: { $first: '$patient.gender' },
        bookings: { $sum: 1 },
        spent: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$total', 0] } },
        lastBooking: { $first: '$createdAt' },
        lastStatus: { $first: '$status' },
      },
    },
    { $sort: { lastBooking: -1 } },
    { $limit: 500 },
    { $project: { _id: 0 } },
  ]);
  res.json({ items: patients });
}

export async function labStats(req, res) {
  const lab = await myLab(req.user._id);
  const since = new Date(Date.now() - 6 * 86400000);
  since.setHours(0, 0, 0, 0);

  const [byStatus, totals, daily, testCounts, topTests, recent, recentReviews] = await Promise.all([
    Booking.aggregate([{ $match: { lab: lab._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { lab: lab._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$total', 0] } },
          pipeline: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed', 'sample_collected', 'report_ready']] }, '$total', 0] },
          },
          patients: { $addToSet: '$patient.phone' },
        },
      },
    ]),
    Booking.aggregate([
      { $match: { lab: lab._id, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
          count: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$total', 0] } },
        },
      },
    ]),
    LabTest.aggregate([{ $match: { lab: lab._id } }, { $group: { _id: '$isActive', count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { lab: lab._id, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', count: { $sum: 1 }, revenue: { $sum: '$items.price' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, name: '$_id', count: 1, revenue: 1 } },
    ]),
    Booking.find({ lab: lab._id }).sort({ createdAt: -1 }).limit(6),
    Review.find({ lab: lab._id }).sort({ createdAt: -1 }).limit(4).populate('user', 'name').lean(),
  ]);

  const statusCounts = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, 0]));
  byStatus.forEach((s) => (statusCounts[s._id] = s.count));
  const dailyMap = new Map(daily.map((d) => [d._id, d]));
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = todayIST(i - 6);
    return { date, count: dailyMap.get(date)?.count || 0, revenue: dailyMap.get(date)?.revenue || 0 };
  });
  const active = testCounts.find((t) => t._id === true)?.count || 0;
  const inactive = testCounts.find((t) => t._id === false)?.count || 0;

  res.json({
    lab: { name: lab.name, status: lab.status, statusNote: lab.statusNote, rating: lab.rating, ratingCount: lab.ratingCount, slug: lab.slug },
    totals: {
      bookings: totals[0]?.total || 0,
      revenue: totals[0]?.revenue || 0,
      pipelineValue: totals[0]?.pipeline || 0,
      patients: totals[0]?.patients?.length || 0,
      activeTests: active,
      totalTests: active + inactive,
      todaysCollections: await Booking.countDocuments({
        lab: lab._id,
        'slot.date': todayIST(),
        status: { $in: ['pending', 'confirmed'] },
      }),
    },
    statusCounts,
    last7Days,
    topTests,
    recentBookings: recent,
    recentReviews: recentReviews.map((r) => ({ ...r, user: { name: r.user?.name } })),
  });
}

export function assertObjectId(req, _res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid id');
  next();
}

/* ---------- Sample collectors ---------- */

const DONE_STATUSES = ['sample_collected', 'report_ready', 'completed'];

async function myCollector(labId, id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid id');
  const collector = await User.findOne({ _id: id, role: 'collector', lab: labId });
  if (!collector) throw new ApiError(404, 'Collector not found');
  return collector;
}

/** GET /api/partner/collectors */
export async function listCollectors(req, res) {
  const lab = await myLab(req.user._id);
  const collectors = await User.find({ role: 'collector', lab: lab._id }).sort({ createdAt: 1 });
  const ids = collectors.map((c) => c._id);
  const stats = await Booking.aggregate([
    { $match: { collector: { $in: ids } } },
    {
      $group: {
        _id: '$collector',
        activeJobs: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        completedJobs: { $sum: { $cond: [{ $in: ['$status', DONE_STATUSES] }, 1, 0] } },
        monthEarnings: {
          $sum: {
            $cond: [
              { $and: [{ $in: ['$status', DONE_STATUSES] }, { $eq: [{ $substrCP: ['$slot.date', 0, 7] }, todayIST().slice(0, 7)] }] },
              { $ifNull: ['$collectorEarning', 0] },
              0,
            ],
          },
        },
      },
    },
  ]);
  const byId = new Map(stats.map((s) => [String(s._id), s]));
  res.json({
    items: collectors.map((c) => ({
      ...c.toJSON(),
      activeJobs: byId.get(String(c._id))?.activeJobs || 0,
      completedJobs: byId.get(String(c._id))?.completedJobs || 0,
      monthEarnings: byId.get(String(c._id))?.monthEarnings || 0,
    })),
  });
}

/** POST /api/partner/collectors — the lab creates a login for its sample collector. */
export async function createCollector(req, res) {
  const lab = await myLab(req.user._id);
  const { name, email, phone, password } = req.body || {};
  if (email && (await User.exists({ email: String(email).toLowerCase().trim() }))) {
    throw new ApiError(409, 'An account with this email already exists');
  }
  const collector = await User.create({ name, email, phone, password, role: 'collector', lab: lab._id, city: lab.address?.city });
  events.collectorAccountCreated(collector._id);
  res.status(201).json({ collector });
}

/** PATCH /api/partner/collectors/:id */
export async function updateCollector(req, res) {
  const lab = await myLab(req.user._id);
  const collector = await myCollector(lab._id, req.params.id);
  const { name, phone, isActive, password } = req.body || {};
  if (name !== undefined) collector.name = name;
  if (phone !== undefined) collector.phone = phone;
  if (isActive !== undefined) collector.isActive = Boolean(isActive);
  if (password) collector.password = String(password);
  await collector.save();
  res.json({ collector });
}

/** PATCH /api/partner/bookings/:id/assign { collectorId } — assign (or clear with null) a sample collector. */
export async function assignCollector(req, res) {
  const lab = await myLab(req.user._id);
  const booking = await Booking.findOne({ _id: req.params.id, lab: lab._id });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (!['home', 'assisted_visit'].includes(booking.collectionType)) {
    throw new ApiError(400, 'Only home collections and assisted visits need a collector');
  }
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new ApiError(400, 'Collector can only be assigned before the sample is collected');
  }

  const { collectorId } = req.body || {};
  if (!collectorId) {
    booking.collector = undefined;
    booking.collectorAssignedAt = undefined;
    booking.fieldStatus = undefined;
    booking.collectorEarning = undefined;
  } else {
    const collector = mongoose.isValidObjectId(collectorId)
      ? await User.findOne({ _id: collectorId, role: 'collector', lab: lab._id, isActive: true })
      : null;
    if (!collector) throw new ApiError(400, 'Choose an active collector from your lab');
    if (booking.status === 'pending') booking.setStatus('confirmed', 'Confirmed and collector assigned');
    booking.collector = collector._id;
    booking.collectorAssignedAt = new Date();
    booking.fieldStatus = 'assigned';
    booking.fieldHistory.push({ status: 'assigned', at: new Date() });
    booking.collectorEarning =
      booking.collectionType === 'assisted_visit' ? lab.collectorPayoutAssisted ?? 120 : lab.collectorPayoutHome ?? 60;
  }
  await booking.save();
  await booking.populate([{ path: 'user', select: 'name email phone' }, { path: 'collector', select: 'name phone' }]);
  if (booking.collector) events.collectorAssigned(booking._id);
  res.json({ booking });
}
