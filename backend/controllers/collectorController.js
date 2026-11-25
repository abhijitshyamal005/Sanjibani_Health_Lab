import Booking from '../models/bookingModel.js';
import Lab from '../models/labModel.js';
import * as events from '../services/events.js';
import { FIELD_FLOW } from '../utils/constants.js';
import { ApiError, todayIST } from '../utils/helpers.js';

const DONE_STATUSES = ['sample_collected', 'report_ready', 'completed'];
const LAB_FIELDS = 'name phone address';

/**
 * What a collector is allowed to see about a job. Collectors never receive prices, discounts or
 * other commercial details — only what they need to do the visit, and the cash to collect.
 */
export function sanitizeJob(b) {
  const lab = b.lab && typeof b.lab === 'object' && b.lab.name ? b.lab : null;
  return {
    _id: b._id,
    code: b.code,
    status: b.status,
    fieldStatus: b.fieldStatus,
    fieldHistory: (b.fieldHistory || []).map((h) => ({ status: h.status, at: h.at })),
    collectionType: b.collectionType,
    slot: b.slot ? { date: b.slot.date, time: b.slot.time } : undefined,
    patient: b.patient
      ? { name: b.patient.name, age: b.patient.age, gender: b.patient.gender, phone: b.patient.phone }
      : undefined,
    address: b.address ? { line: b.address.line, area: b.address.area, city: b.address.city, pincode: b.address.pincode } : undefined,
    notes: b.notes,
    items: (b.items || []).map((i) => ({ name: i.name, sampleType: i.sampleType, preparation: i.preparation })),
    lab: lab ? { name: lab.name, phone: lab.phone, address: lab.address } : null,
    paymentStatus: b.paymentStatus,
    amountToCollect: b.paymentStatus === 'unpaid' ? b.total : 0,
    collectorEarning: b.collectorEarning ?? 0,
    statusHistory: (b.statusHistory || []).map((h) => ({ status: h.status, at: h.at })),
    createdAt: b.createdAt,
  };
}

/** Monday-agnostic "last 7 days incl. today" start date, in IST. */
const weekStart = () => todayIST(-6);
const monthPrefix = () => todayIST().slice(0, 7);

async function earningsTotals(collectorId) {
  const done = await Booking.find({ collector: collectorId, status: { $in: DONE_STATUSES } })
    .select('slot.date collectorEarning')
    .lean();
  const today = todayIST();
  const week = weekStart();
  const month = monthPrefix();
  const sum = (pred) => done.filter(pred).reduce((s, b) => s + (b.collectorEarning || 0), 0);
  return {
    today: sum((b) => b.slot?.date === today),
    week: sum((b) => b.slot?.date >= week && b.slot?.date <= today),
    month: sum((b) => b.slot?.date?.startsWith(month)),
    total: sum(() => true),
  };
}

/** GET /api/collector/summary */
export async function summary(req, res) {
  const today = todayIST();
  const [lab, todays, upcoming, earnings] = await Promise.all([
    Lab.findById(req.user.lab).select(`${LAB_FIELDS} collectorPayoutHome collectorPayoutAssisted`).lean(),
    Booking.find({ collector: req.user._id, 'slot.date': today, status: { $ne: 'cancelled' } })
      .select('status paymentStatus total')
      .lean(),
    Booking.countDocuments({ collector: req.user._id, status: 'confirmed', 'slot.date': { $gt: today } }),
    earningsTotals(req.user._id),
  ]);
  const pending = todays.filter((b) => b.status === 'confirmed').length;
  res.json({
    lab: lab ? { name: lab.name, phone: lab.phone, address: lab.address } : null,
    today: {
      total: todays.length,
      done: todays.length - pending,
      pending,
      amountToCollect: todays.filter((b) => b.paymentStatus === 'unpaid').reduce((s, b) => s + (b.total || 0), 0),
    },
    upcoming,
    earnings: {
      ...earnings,
      payoutHome: lab?.collectorPayoutHome ?? 60,
      payoutAssisted: lab?.collectorPayoutAssisted ?? 120,
    },
  });
}

/** GET /api/collector/jobs?date=&scope=active|done|all */
export async function jobs(req, res) {
  const scope = ['active', 'done', 'all'].includes(req.query.scope) ? req.query.scope : 'active';
  const filter = { collector: req.user._id, status: { $ne: 'cancelled' } };
  if (scope === 'active') {
    // Confirmed jobs, plus assisted visits where the patient still has to be dropped home.
    delete filter.status;
    filter.$or = [
      { status: 'confirmed' },
      { collectionType: 'assisted_visit', status: { $in: DONE_STATUSES }, fieldStatus: { $ne: 'dropped_home' } },
    ];
  }
  if (scope === 'done') filter.status = { $in: DONE_STATUSES };
  if (req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date))) filter['slot.date'] = String(req.query.date);

  const dir = scope === 'done' ? -1 : 1;
  const items = await Booking.find(filter)
    .sort({ 'slot.date': dir, 'slot.time': dir })
    .limit(200)
    .populate('lab', LAB_FIELDS)
    .lean();
  res.json({ items: items.map(sanitizeJob) });
}

/** GET /api/collector/earnings?month=YYYY-MM */
export async function earnings(req, res) {
  const month = /^\d{4}-\d{2}$/.test(String(req.query.month || '')) ? String(req.query.month) : monthPrefix();
  const done = await Booking.find({
    collector: req.user._id,
    status: { $in: DONE_STATUSES },
    'slot.date': { $regex: `^${month}` },
  })
    .sort({ 'slot.date': -1, 'slot.time': -1 })
    .select('code slot collectionType patient.name address.area collectorEarning')
    .lean();
  res.json({
    month,
    total: done.reduce((s, b) => s + (b.collectorEarning || 0), 0),
    jobs: done.map((b) => ({
      _id: b._id,
      code: b.code,
      slot: b.slot,
      collectionType: b.collectionType,
      patientName: b.patient?.name,
      area: b.address?.area,
      collectorEarning: b.collectorEarning || 0,
    })),
  });
}

/** PATCH /api/collector/jobs/:id/progress { step } */
export async function progress(req, res) {
  const { step } = req.body || {};
  const booking = await Booking.findOne({ _id: req.params.id, collector: req.user._id });
  if (!booking) throw new ApiError(404, 'Job not found');

  if (step === 'dropped_home') {
    if (booking.collectionType !== 'assisted_visit') throw new ApiError(400, 'Only assisted visits have a drop-off');
    if (!DONE_STATUSES.includes(booking.status)) throw new ApiError(400, 'Drop the patient home after the sample is collected');
    if (booking.fieldStatus === 'dropped_home') throw new ApiError(400, 'Drop-off already recorded');
    booking.fieldStatus = 'dropped_home';
    booking.fieldHistory.push({ status: 'dropped_home', at: new Date() });
  } else if (step === 'payment_collected') {
    if (!DONE_STATUSES.includes(booking.status)) throw new ApiError(400, 'Collect payment after the sample');
    if (booking.paymentStatus === 'paid') throw new ApiError(400, 'Payment already recorded');
    booking.paymentStatus = 'paid';
  } else {
    if (booking.status !== 'confirmed') throw new ApiError(400, 'This job is not active');
    const flow = FIELD_FLOW[booking.collectionType];
    if (!flow) throw new ApiError(400, 'This booking does not need a collector');
    const current = flow.indexOf(booking.fieldStatus || 'assigned');
    const expected = current < flow.length - 1 ? flow[current + 1] : 'sample_collected';
    if (step !== expected) throw new ApiError(400, `Next step should be ${expected}`);

    if (step === 'sample_collected') {
      booking.setStatus('sample_collected', `Sample collected by ${req.user.name}`);
    } else {
      booking.fieldStatus = step;
      booking.fieldHistory.push({ status: step, at: new Date() });
    }
  }
  await booking.save();

  if (step === 'sample_collected') events.bookingStatusChanged(booking._id, { by: 'collector' });
  else if (step === 'payment_collected') events.paymentReceived(booking._id);
  else events.fieldProgress(booking._id, step);

  await booking.populate('lab', LAB_FIELDS);
  res.json({ booking: sanitizeJob(booking.toObject()) });
}
