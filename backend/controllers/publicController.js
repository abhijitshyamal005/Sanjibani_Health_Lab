import Booking from '../models/bookingModel.js';
import Lab from '../models/labModel.js';
import LabTest from '../models/labTestModel.js';
import Review from '../models/reviewModel.js';
import { ACCREDITATIONS, CATEGORIES, COLLECTION_TYPES, SAMPLE_TYPES, TIME_SLOTS } from '../utils/constants.js';
import { paymentsEnabled, razorpayKeyId } from '../services/payments.js';
import { featuredCoupon } from '../utils/coupons.js';
import { ApiError, escapeRegex, paginate, slotPassed, toPositiveInt } from '../utils/helpers.js';

const LAB_CARD_FIELDS =
  'name slug tagline address rating ratingCount accreditations homeCollection homeCollectionFee assistedVisit assistedVisitFee reportTime coverTheme opensAt closesAt';

function cityFilter(city) {
  return city ? { 'address.city': new RegExp(`^${escapeRegex(city.trim())}$`, 'i') } : {};
}

async function approvedLabIds(city) {
  const labs = await Lab.find({ status: 'approved', ...cityFilter(city) }).select('_id').lean();
  return labs.map((l) => l._id);
}

/** GET /api/meta — categories, cities, counts and popular tests for the home page. */
export async function meta(_req, res) {
  const labIds = await approvedLabIds();
  const activeMatch = { lab: { $in: labIds }, isActive: true };

  const [cities, categoryCounts, popularTests, testCount, coupon] = await Promise.all([
    Lab.distinct('address.city', { status: 'approved' }),
    LabTest.aggregate([
      { $match: activeMatch },
      { $group: { _id: '$category', count: { $sum: 1 }, minPrice: { $min: '$price' } } },
    ]),
    LabTest.aggregate([
      { $match: activeMatch },
      {
        $group: {
          _id: '$name',
          category: { $first: '$category' },
          type: { $first: '$type' },
          labs: { $addToSet: '$lab' },
          minPrice: { $min: '$price' },
          maxMrp: { $max: '$mrp' },
          popularVotes: { $sum: { $cond: ['$isPopular', 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          category: 1,
          type: 1,
          minPrice: 1,
          maxMrp: 1,
          labCount: { $size: '$labs' },
          popularVotes: 1,
        },
      },
      { $sort: { popularVotes: -1, labCount: -1, name: 1 } },
      { $limit: 8 },
    ]),
    LabTest.countDocuments(activeMatch),
    featuredCoupon(),
  ]);

  const counts = Object.fromEntries(categoryCounts.map((c) => [c._id, c]));
  res.json({
    categories: CATEGORIES.map((name) => ({
      name,
      count: counts[name]?.count || 0,
      minPrice: counts[name]?.minPrice ?? null,
    })),
    cities: cities.sort(),
    accreditations: ACCREDITATIONS,
    sampleTypes: SAMPLE_TYPES,
    timeSlots: TIME_SLOTS,
    popularTests,
    stats: { labs: labIds.length, tests: testCount, cities: cities.length },
    paymentsEnabled: paymentsEnabled(),
    razorpayKeyId: razorpayKeyId(),
    featuredCoupon: coupon,
  });
}

/** GET /api/labs — approved labs with filters. */
export async function listLabs(req, res) {
  const { q, city, category, homeCollection, sort = 'rating' } = req.query;
  const page = toPositiveInt(req.query.page, 1);
  const limit = toPositiveInt(req.query.limit, 12, 50);

  const filter = { status: 'approved', ...cityFilter(city) };
  if (q) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ name: rx }, { tagline: rx }, { 'address.area': rx }];
  }
  if (homeCollection === 'true') filter.homeCollection = true;

  const labs = await Lab.find(filter).select(LAB_CARD_FIELDS).lean();
  const testMatch = { lab: { $in: labs.map((l) => l._id) }, isActive: true };
  if (category) testMatch.category = category;

  const stats = await LabTest.aggregate([
    { $match: testMatch },
    { $group: { _id: '$lab', minPrice: { $min: '$price' }, testCount: { $sum: 1 } } },
  ]);
  const byLab = new Map(stats.map((s) => [String(s._id), s]));

  let items = labs
    .map((lab) => ({
      ...lab,
      minPrice: byLab.get(String(lab._id))?.minPrice ?? null,
      testCount: byLab.get(String(lab._id))?.testCount ?? 0,
    }))
    .filter((lab) => (category ? lab.testCount > 0 : true));

  const sorters = {
    rating: (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount,
    price: (a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity),
    name: (a, b) => a.name.localeCompare(b.name),
    fee: (a, b) => a.homeCollectionFee - b.homeCollectionFee,
  };
  items = items.sort(sorters[sort] || sorters.rating);

  res.json(paginate(items, page, limit));
}

/** GET /api/labs/:slug — lab page with its test catalogue and reviews. */
export async function getLab(req, res) {
  const lab = await Lab.findOne({ slug: req.params.slug, status: 'approved' })
    .select('-owner -statusNote -collectorPayoutHome -collectorPayoutAssisted')
    .lean();
  if (!lab) throw new ApiError(404, 'Lab not found');

  const [tests, reviews] = await Promise.all([
    LabTest.find({ lab: lab._id, isActive: true }).sort({ isPopular: -1, category: 1, price: 1 }),
    Review.find({ lab: lab._id }).sort({ createdAt: -1 }).limit(10).populate('user', 'name').lean(),
  ]);

  res.json({
    lab,
    tests: tests.map((t) => t.toJSON()),
    reviews: reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      userName: r.user?.name?.split(' ')[0] || 'Patient',
    })),
  });
}

/** GET /api/tests/search — the same test across labs, for price comparison. */
export async function searchTests(req, res) {
  const { q, category, city, sort = 'price', type } = req.query;
  const page = toPositiveInt(req.query.page, 1);
  const limit = toPositiveInt(req.query.limit, 24, 100);

  const filter = { lab: { $in: await approvedLabIds(city) }, isActive: true };
  if (q) filter.name = new RegExp(escapeRegex(q.trim()), 'i');
  if (category) filter.category = category;
  if (type === 'test' || type === 'package') filter.type = type;

  const tests = await LabTest.find(filter).populate('lab', LAB_CARD_FIELDS);
  let items = tests.map((t) => t.toJSON());

  const sorters = {
    price: (a, b) => a.price - b.price,
    rating: (a, b) => b.lab.rating - a.lab.rating || a.price - b.price,
    discount: (a, b) => b.discount - a.discount,
    name: (a, b) => a.name.localeCompare(b.name) || a.price - b.price,
  };
  items = items.sort(sorters[sort] || sorters.price);

  res.json(paginate(items, page, limit));
}

/** GET /api/tests/suggest?q= — autocomplete for the search box. */
export async function suggestTests(req, res) {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ items: [] });
  const items = await LabTest.aggregate([
    { $match: { lab: { $in: await approvedLabIds() }, isActive: true, name: new RegExp(escapeRegex(q), 'i') } },
    { $group: { _id: '$name', category: { $first: '$category' }, minPrice: { $min: '$price' }, labs: { $addToSet: '$lab' } } },
    { $project: { _id: 0, name: '$_id', category: 1, minPrice: 1, labCount: { $size: '$labs' } } },
    { $sort: { labCount: -1, name: 1 } },
    { $limit: 8 },
  ]);
  res.json({ items });
}

/** GET /api/labs/:slug/availability?date=&type= — free capacity per time slot. */
export async function labAvailability(req, res) {
  const date = String(req.query.date || '');
  const type = String(req.query.type || 'lab_visit');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new ApiError(400, 'Invalid date');
  if (!COLLECTION_TYPES.includes(type)) throw new ApiError(400, 'Invalid visit type');

  const lab = await Lab.findOne({ slug: req.params.slug, status: 'approved' }).select('_id slotCapacity').lean();
  if (!lab) throw new ApiError(404, 'Lab not found');
  const capacity = lab.slotCapacity || 4;

  const counts = await Booking.aggregate([
    { $match: { lab: lab._id, 'slot.date': date, collectionType: type, status: { $ne: 'cancelled' } } },
    { $group: { _id: '$slot.time', count: { $sum: 1 } } },
  ]);
  const booked = new Map(counts.map((c) => [c._id, c.count]));
  res.json({
    date,
    type,
    capacity,
    slots: TIME_SLOTS.map((time) => {
      const n = booked.get(time) || 0;
      return { time, booked: n, available: Math.max(0, capacity - n), past: slotPassed(date, time) };
    }),
  });
}
