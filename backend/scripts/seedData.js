import Booking from '../models/bookingModel.js';
import Coupon from '../models/couponModel.js';
import Lab from '../models/labModel.js';
import LabTest from '../models/labTestModel.js';
import Review from '../models/reviewModel.js';
import User from '../models/userModel.js';
import { TIME_SLOTS } from '../utils/constants.js';
import { todayIST } from '../utils/helpers.js';
import { LAB_CATALOG } from './labCatalog.js';

export const DEMO_ACCOUNTS = {
  admin: { email: 'admin@sanjibani.in', password: 'Admin@123' },
  patient: { email: 'patient@sanjibani.in', password: 'Patient@123' },
  lab: { email: 'lab1@sanjibani.in', password: 'Lab@1234' },
  collector: { email: 'collector1@sanjibani.in', password: 'Collector@123' },
};

// Deterministic pseudo-random so the demo data looks the same on every seed.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Specialty tests and packages not covered by the reference listing in labCatalog.js.
const EXTRA_CATALOG = [
  { name: 'Dengue NS1 Antigen', category: 'Fever & Infection', type: 'test', mrp: 900, price: 599, sampleType: 'Blood',
    preparation: 'No special preparation required', reportTime: '24 hours', parameters: ['Dengue NS1 Antigen'],
    description: 'Early detection of dengue in the first 5 days of fever.', popular: false },
  { name: 'PCOD Screening Panel', category: "Women's Health", type: 'package', mrp: 2500, price: 1499, sampleType: 'Blood',
    preparation: 'Day 2–5 of cycle preferred', reportTime: '48 hours',
    parameters: ['LH', 'FSH', 'Prolactin', 'Testosterone', 'TSH', 'Fasting Glucose', 'Insulin Fasting'],
    description: 'Hormone panel to evaluate polycystic ovarian disease.', popular: false },
  { name: 'Diabetes Care Package', category: 'Diabetes', type: 'package', mrp: 2200, price: 999, sampleType: 'Blood',
    preparation: '10–12 hours fasting', reportTime: '24 hours',
    parameters: ['Fasting Sugar', 'HbA1c', 'Lipid Profile', 'Creatinine', 'Urine Microalbumin'],
    description: 'Complete diabetes monitoring.', popular: false },
  { name: 'Cardiac Risk Markers', category: 'Heart', type: 'package', mrp: 3000, price: 1699, sampleType: 'Blood',
    preparation: '10–12 hours fasting', reportTime: '48 hours',
    parameters: ['Lipid Profile', 'hs-CRP', 'Homocysteine', 'Lipoprotein(a)', 'Apolipoprotein A1 & B'],
    description: 'Advanced heart risk assessment.', popular: false },
  { name: 'Allergy Panel (Food & Inhalants)', category: 'Allergy', type: 'package', mrp: 5500, price: 3299, sampleType: 'Blood',
    preparation: 'Stop antihistamines 3 days prior', reportTime: '72 hours',
    parameters: ['Total IgE', '40 food allergens', '30 inhalant allergens'],
    description: 'Identifies common food and environmental allergies.', popular: false },
  { name: 'X-Ray Chest PA View', category: 'Imaging', type: 'test', mrp: 600, price: 399, sampleType: 'None',
    preparation: 'Remove metal objects', reportTime: '2 hours', parameters: ['Chest X-Ray PA'],
    description: 'Digital chest X-ray at the centre.', popular: false },
];

const CATALOG = [...LAB_CATALOG, ...EXTRA_CATALOG];

// Names each demo lab does not offer, so the labs' menus differ a little.
const XRAY = 'X-Ray Chest PA View';
const ALLERGY = 'Allergy Panel (Food & Inhalants)';
// The small neighbourhood lab only runs routine single tests.
const routineOnly = (t) => t.type === 'test' && !['Imaging', 'Allergy'].includes(t.category) && t.mrp <= 1200;

const LABS = [
  {
    owner: ['Arindam Ghosh', 'lab1@sanjibani.in', '9830011111'],
    name: 'Lifeline Pathology', tagline: 'NABL-accredited lab with 20 years of trust',
    description: 'Lifeline Pathology is a fully automated diagnostic centre in Salt Lake with trained phlebotomists for safe home collection across Kolkata.',
    address: { line: 'CK-12, Sector II', area: 'Salt Lake', city: 'Kolkata', pincode: '700091' },
    phone: '03340011111', accreditations: ['NABL', 'ISO 15189'], homeCollectionFee: 49, reportTime: '12–24 hours',
    establishedYear: 2005, coverTheme: 0, factor: 1.0, skip: [XRAY], status: 'approved',
  },
  {
    owner: ['Priya Banerjee', 'lab2@sanjibani.in', '9830022222'],
    name: 'CarePoint Diagnostics', tagline: 'Free home collection, reports on WhatsApp',
    description: 'CarePoint offers affordable pathology with free home sample collection anywhere in central Kolkata.',
    address: { line: '45 Park Street', area: 'Park Street', city: 'Kolkata', pincode: '700016' },
    phone: '03340022222', accreditations: ['NABL', 'CAP'], homeCollectionFee: 0, reportTime: '24 hours',
    establishedYear: 2012, coverTheme: 1, factor: 0.88, skip: [ALLERGY, XRAY, 'Testosterone, Total', 'Hemogram (CBC + ESR)'], status: 'approved',
  },
  {
    owner: ['Karthik Rao', 'lab3@sanjibani.in', '9845033333'],
    name: 'GreenLeaf Labs', tagline: 'Precision diagnostics, compassionate care',
    description: 'GreenLeaf Labs in Indiranagar runs a CAP-standard lab with same-day reports for most routine tests.',
    address: { line: '100 Feet Road, HAL 2nd Stage', area: 'Indiranagar', city: 'Bengaluru', pincode: '560038' },
    phone: '08040033333', accreditations: ['NABL'], homeCollectionFee: 99, reportTime: 'Same day',
    establishedYear: 2015, coverTheme: 2, factor: 1.12, skip: [XRAY, 'Typhoid (Widal Test)', 'Hepatitis C Antibody (Anti-HCV)'], status: 'approved',
  },
  {
    owner: ['Neha Kapoor', 'lab4@sanjibani.in', '9810044444'],
    name: 'MedScan Health Centre', tagline: 'Pathology + digital X-ray under one roof',
    description: 'MedScan combines a NABH-accredited imaging centre with a full pathology lab in South Delhi.',
    address: { line: 'B-12, Defence Colony Road', area: 'Lajpat Nagar', city: 'Delhi', pincode: '110024' },
    phone: '01140044444', accreditations: ['NABL', 'NABH'], homeCollectionFee: 79, reportTime: '24 hours',
    establishedYear: 2009, coverTheme: 3, factor: 1.05, skip: [ALLERGY], status: 'approved',
  },
  {
    owner: ['Rahul Mehta', 'lab5@sanjibani.in', '9820055555'],
    name: 'Pulse Diagnostics', tagline: 'Early morning slots from 6 AM',
    description: 'Pulse Diagnostics serves Andheri and the western suburbs with early morning home collection.',
    address: { line: 'Shop 3, Lokhandwala Complex', area: 'Andheri West', city: 'Mumbai', pincode: '400053' },
    phone: '02240055555', accreditations: ['ISO 15189'], homeCollectionFee: 59, reportTime: '24 hours',
    establishedYear: 2018, coverTheme: 4, factor: 0.95, skip: [XRAY, 'Cardiac Risk Markers', 'PCOD Screening Panel', 'Full Body Checkup – Essential Plus (57 tests)'], status: 'approved',
  },
  {
    owner: ['Sourav Das', 'lab6@sanjibani.in', '9830066666'],
    name: 'Wellness Path Lab', tagline: 'Your neighbourhood lab in Behala',
    description: 'A small neighbourhood lab focused on routine blood work at fair prices.',
    address: { line: '22 Diamond Harbour Road', area: 'Behala', city: 'Kolkata', pincode: '700034' },
    phone: '03340066666', accreditations: [], homeCollectionFee: 30, reportTime: '24 hours',
    establishedYear: 2021, coverTheme: 5, factor: 0.8, include: routineOnly, status: 'pending',
  },
];

const PATIENTS = [
  ['Riya Sen', DEMO_ACCOUNTS.patient.email, '9876500001', 'female', 29],
  ['Amit Kumar', 'amit@example.com', '9876500002', 'male', 41],
  ['Sneha Iyer', 'sneha@example.com', '9876500003', 'female', 35],
  ['Vikram Singh', 'vikram@example.com', '9876500004', 'male', 52],
  ['Fatima Khan', 'fatima@example.com', '9876500005', 'female', 24],
  ['Rohan Das', 'rohan@example.com', '9876500006', 'male', 63],
];

const REVIEW_TEXT = [
  [5, 'Phlebotomist came on time and the report arrived the same evening. Very smooth.'],
  [5, 'Painless sample collection and very polite staff. Prices are much better than other labs.'],
  [4, 'Good experience overall, report took a little longer than promised.'],
  [4, 'Clean centre, quick service. Would book again.'],
  [3, 'Collection was fine but I had to call twice for the report.'],
  [5, 'Best lab in the area. The online booking made it super easy.'],
];

export const DEMO_COUPONS = [
  { code: 'SANJI15', type: 'percent', value: 15, maxDiscount: 300, minOrder: 500, featured: true, description: '15% off on orders above ₹500' },
  { code: 'FIRST100', type: 'flat', value: 100, minOrder: 999, description: '₹100 off on your first booking above ₹999' },
];

/** Insert the demo coupons if they don't exist yet (safe to run on an already-seeded database). */
export async function ensureDemoCoupons() {
  for (const c of DEMO_COUPONS) {
    await Coupon.updateOne({ code: c.code }, { $setOnInsert: c }, { upsert: true });
  }
}

const itemSnapshot = (t) => ({
  test: t._id, name: t.name, category: t.category, type: t.type, mrp: t.mrp, price: t.price,
  sampleType: t.sampleType, preparation: t.preparation,
});

// Assisted visits and field-staff payouts for the demo labs that have collectors.
const LAB_EXTRAS = {
  'Lifeline Pathology': { assistedVisit: true, assistedVisitFee: 149, collectorPayoutHome: 60, collectorPayoutAssisted: 120 },
  'CarePoint Diagnostics': { assistedVisit: true, assistedVisitFee: 99, collectorPayoutHome: 50, collectorPayoutAssisted: 100 },
};

const COLLECTORS = [
  ['Bikash Mondal', 'collector1@sanjibani.in', '9830077771', 'Lifeline Pathology'],
  ['Rupa Saha', 'collector2@sanjibani.in', '9830077772', 'Lifeline Pathology'],
  ['Tanmoy Paul', 'collector3@sanjibani.in', '9830077773', 'CarePoint Diagnostics'],
];

const payoutFor = (lab, type) => (type === 'assisted_visit' ? lab.collectorPayoutAssisted ?? 120 : lab.collectorPayoutHome ?? 60);

function assignTo(booking, collector, lab) {
  booking.collector = collector._id;
  booking.collectorAssignedAt = new Date();
  booking.fieldStatus = 'assigned';
  booking.fieldHistory.push({ status: 'assigned', at: new Date() });
  booking.collectorEarning = payoutFor(lab, booking.collectionType);
}

async function demoBooking({ lab, user, date, time, status, collector, skip = 0, collectionType = 'home' }) {
  const picks = await LabTest.find({ lab: lab._id, isActive: true, ...(collectionType === 'home' ? { homeCollection: true } : {}) })
    .sort({ price: -1 })
    .skip(skip)
    .limit(collectionType === 'home' ? 2 : 1);
  const subtotal = picks.reduce((s, t) => s + t.price, 0);
  const fee = collectionType === 'assisted_visit' ? lab.assistedVisitFee || 0 : lab.homeCollectionFee;
  const booking = new Booking({
    user: user._id,
    lab: lab._id,
    items: picks.map(itemSnapshot),
    subtotal,
    collectionFee: fee,
    total: subtotal + fee,
    collectionType,
    slot: { date, time },
    patient: { name: user.name, age: 29, gender: user.gender || 'female', phone: user.phone },
    address: user.address?.line ? user.address.toObject() : { line: '14B Lake View Road', area: 'Ballygunge', city: 'Kolkata', pincode: '700029' },
    paymentStatus: status === 'completed' ? 'paid' : 'unpaid',
  });
  booking.setStatus('pending', 'Booking placed');
  if (status !== 'pending') booking.setStatus('confirmed');
  if (collector) assignTo(booking, collector, lab);
  if (['sample_collected', 'report_ready', 'completed'].includes(status)) {
    if (collector) {
      const steps = collectionType === 'assisted_visit'
        ? ['on_the_way', 'arrived', 'picked_up', 'reached_lab', 'dropped_home']
        : ['on_the_way', 'arrived'];
      steps.forEach((s) => booking.fieldHistory.push({ status: s, at: new Date() }));
      booking.fieldStatus = steps[steps.length - 1];
    }
    booking.setStatus('sample_collected', `Sample collected by ${collector?.name || 'lab staff'}`);
    if (status !== 'sample_collected') booking.setStatus('report_ready');
    if (status === 'completed') booking.setStatus('completed');
  }
  await booking.save();
  return booking;
}

/**
 * Idempotently add sample collectors, visit-mode settings and collector jobs to the demo data
 * (safe on an already-seeded database).
 */
export async function ensureDemoCollectors() {
  for (const [name, extras] of Object.entries(LAB_EXTRAS)) {
    await Lab.updateOne({ name }, { $set: extras });
  }
  const labs = Object.fromEntries((await Lab.find({ name: { $in: Object.keys(LAB_EXTRAS) } })).map((l) => [l.name, l]));
  if (!labs['Lifeline Pathology']) return;

  const collectors = {};
  for (const [name, email, phone, labName] of COLLECTORS) {
    let c = await User.findOne({ email });
    if (!c && labs[labName]) {
      c = await User.create({ name, email, phone, password: DEMO_ACCOUNTS.collector.password, role: 'collector', lab: labs[labName]._id, city: 'Kolkata' });
    }
    if (c) collectors[email] = c;
  }
  const c1 = collectors['collector1@sanjibani.in'];
  const c3 = collectors['collector3@sanjibani.in'];

  // Assign every open home booking at these labs.
  for (const [labName, collector] of [['Lifeline Pathology', c1], ['CarePoint Diagnostics', c3]]) {
    const lab = labs[labName];
    if (!lab || !collector) continue;
    const open = await Booking.find({ lab: lab._id, collectionType: 'home', status: 'confirmed', collector: { $exists: false } });
    for (const b of open) {
      assignTo(b, collector, lab);
      await b.save();
    }
  }

  const riya = await User.findOne({ email: DEMO_ACCOUNTS.patient.email });
  const lifeline = labs['Lifeline Pathology'];
  if (!riya || !c1) return;
  const tomorrow = todayIST(1);
  for (const [collectionType, time] of [['home', '07:00-08:00'], ['assisted_visit', '09:00-10:00']]) {
    const has = await Booking.exists({ collector: c1._id, collectionType, status: 'confirmed', 'slot.date': tomorrow });
    if (!has) await demoBooking({ lab: lifeline, user: riya, collectionType, date: tomorrow, time, status: 'confirmed', collector: c1 });
  }
  // A couple of finished jobs this month so earnings aren't empty.
  const month = todayIST().slice(0, 7);
  const doneCount = await Booking.countDocuments({
    collector: c1._id,
    status: { $in: ['sample_collected', 'report_ready', 'completed'] },
    'slot.date': { $regex: `^${month}` },
  });
  for (let i = doneCount; i < 2; i++) {
    await demoBooking({
      lab: lifeline,
      user: riya,
      skip: i + 1,
      collectionType: i === 0 ? 'home' : 'assisted_visit',
      date: todayIST(),
      time: i === 0 ? '06:00-07:00' : '07:00-08:00',
      status: i === 0 ? 'completed' : 'report_ready',
      collector: c1,
    });
  }
}

const roundPrice = (n) => Math.max(49, Math.round(n / 10) * 10 - 1);

export async function seedDatabase({ reset = false, log = () => {} } = {}) {
  if (reset) {
    await Promise.all([User, Lab, LabTest, Booking, Review, Coupon].map((m) => m.deleteMany({})));
  } else if (await User.exists({})) {
    log('Database already has data — skipping seed (use --reset to start over).');
    return;
  }
  const rand = rng(42);

  await ensureDemoCoupons();

  await User.create({ name: 'Sanjibani Admin', email: DEMO_ACCOUNTS.admin.email, phone: '9000000001', password: DEMO_ACCOUNTS.admin.password, role: 'admin' });

  const patients = [];
  for (const [name, email, phone, gender, age] of PATIENTS) {
    const user = await User.create({
      name, email, phone, gender, role: 'patient',
      password: email === DEMO_ACCOUNTS.patient.email ? DEMO_ACCOUNTS.patient.password : 'Patient@123',
      city: 'Kolkata',
      address: { line: '14B Lake View Road', area: 'Ballygunge', city: 'Kolkata', pincode: '700029' },
    });
    patients.push({ user, gender, age });
  }

  const labs = [];
  for (const def of LABS) {
    const [ownerName, ownerEmail, ownerPhone] = def.owner;
    const owner = await User.create({ name: ownerName, email: ownerEmail, phone: ownerPhone, password: DEMO_ACCOUNTS.lab.password, role: 'lab' });
    const { factor, skip = [], include = () => true, owner: _o, ...labData } = def;
    const lab = await Lab.create({ ...labData, ...(LAB_EXTRAS[labData.name] || {}), slotCapacity: 4, owner: owner._id, homeCollection: true, opensAt: '07:00', closesAt: '20:00' });

    const tests = await LabTest.insertMany(
      CATALOG.filter((t) => include(t) && !skip.includes(t.name)).map(
        ({ name, category, type, mrp, price: base, sampleType, preparation, reportTime, parameters, description, popular }) => ({
          lab: lab._id, name, category, type, mrp, sampleType, preparation, reportTime, parameters, description,
          price: Math.min(mrp, roundPrice(base * factor * (0.92 + rand() * 0.16))),
          homeCollection: sampleType !== 'None',
          isPopular: popular,
        })
      )
    );
    labs.push({ lab, tests });
  }

  // Bookings spread over the last two weeks, plus upcoming ones.
  const statuses = ['completed', 'completed', 'completed', 'report_ready', 'sample_collected', 'confirmed', 'pending', 'cancelled'];
  const flow = ['pending', 'confirmed', 'sample_collected', 'report_ready', 'completed'];
  const timeFix = [];
  let reviewIdx = 0;

  for (const { lab, tests } of labs.filter((l) => l.lab.status === 'approved')) {
    for (let i = 0; i < 7; i++) {
      const { user, gender, age } = patients[(i + labs.indexOf(labs.find((l) => l.lab === lab))) % patients.length];
      const status = statuses[i % statuses.length];
      const picks = [...tests].filter((t) => t.homeCollection).sort(() => rand() - 0.5).slice(0, 1 + Math.floor(rand() * 3));
      const daysAgo = Math.floor(rand() * 13);
      const upcoming = ['pending', 'confirmed'].includes(status);
      const home = rand() > 0.3;
      const subtotal = picks.reduce((s, t) => s + t.price, 0);
      const fee = home ? lab.homeCollectionFee : 0;

      const booking = new Booking({
        user: user._id, lab: lab._id,
        items: picks.map(itemSnapshot),
        subtotal, collectionFee: fee, total: subtotal + fee,
        collectionType: home ? 'home' : 'lab_visit',
        slot: { date: upcoming ? todayIST(1 + (i % 3)) : todayIST(-daysAgo + 1), time: TIME_SLOTS[i % TIME_SLOTS.length] },
        patient: { name: user.name, age, gender, phone: user.phone },
        address: home ? user.address.toObject() : undefined,
        paymentStatus: status === 'completed' ? 'paid' : 'unpaid',
      });
      const created = new Date(Date.now() - daysAgo * 86400000 - 3600000);
      if (status === 'cancelled') {
        booking.statusHistory.push({ status: 'pending', at: created, note: 'Booking placed' });
        booking.statusHistory.push({ status: 'cancelled', at: created, note: 'Plans changed' });
        booking.status = 'cancelled';
        booking.cancelledBy = 'patient';
        booking.cancelReason = 'Plans changed';
      } else {
        flow.slice(0, flow.indexOf(status) + 1).forEach((s, k) =>
          booking.statusHistory.push({ status: s, at: new Date(created.getTime() + k * 3 * 3600000), note: s === 'pending' ? 'Booking placed' : undefined })
        );
        booking.status = status;
        if (['report_ready', 'completed'].includes(status)) {
          booking.reportNote = 'Report shared on your registered email and WhatsApp. All values within normal range except as highlighted.';
        }
      }
      await booking.save();
      timeFix.push({ id: booking._id, at: created });

      const skipReview = user.email === DEMO_ACCOUNTS.patient.email && i % 2 === 0;
      if (status === 'completed' && !skipReview) {
        const [rating, comment] = REVIEW_TEXT[reviewIdx++ % REVIEW_TEXT.length];
        await Review.create({ lab: lab._id, user: user._id, booking: booking._id, rating, comment });
        booking.reviewed = true;
        await booking.save();
      }
    }
    await Review.recalculateLabRating(lab._id);
  }

  // Backdate bookings so dashboards show a realistic history (raw driver bypasses auto-timestamps).
  await Booking.collection.bulkWrite(
    timeFix.map(({ id, at }) => ({ updateOne: { filter: { _id: id }, update: { $set: { createdAt: at } } } }))
  );

  await ensureDemoCollectors();

  log(`Seeded ${await Coupon.countDocuments()} coupons (SANJI15, FIRST100), ${await User.countDocuments()} users, ${await Lab.countDocuments()} labs, ${await LabTest.countDocuments()} tests, ${await Booking.countDocuments()} bookings.`);
  log('Demo logins:');
  log(`  Admin   ${DEMO_ACCOUNTS.admin.email} / ${DEMO_ACCOUNTS.admin.password}`);
  log(`  Patient ${DEMO_ACCOUNTS.patient.email} / ${DEMO_ACCOUNTS.patient.password}`);
  log(`  Lab     ${DEMO_ACCOUNTS.lab.email} / ${DEMO_ACCOUNTS.lab.password}  (lab1…lab6, lab6 is pending approval)`);
  log(`  Collector ${DEMO_ACCOUNTS.collector.email} / ${DEMO_ACCOUNTS.collector.password}  (collector1–3)`);
}
