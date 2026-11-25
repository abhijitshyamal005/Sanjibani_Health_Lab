import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app.js';
import Booking from '../models/bookingModel.js';
import Lab from '../models/labModel.js';
import LabTest from '../models/labTestModel.js';
import User from '../models/userModel.js';
import { seedDatabase } from '../scripts/seedData.js';
import { TIME_SLOTS } from '../utils/constants.js';
import { todayIST } from '../utils/helpers.js';

process.env.NODE_ENV = 'test';

let mongod;
let app;
const api = () => request(app);
const auth = (t) => ({ Authorization: `Bearer ${t}` });
const ctx = {};
const PRICE_KEYS = ['price', 'mrp', 'subtotal', 'total', 'discount', 'couponCode', 'collectionFee', 'user', 'report'];

async function loginAs(email, password) {
  const res = await api().post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200, res.body.message);
  return res.body;
}

function assertNoPrices(job) {
  for (const k of PRICE_KEYS) assert.equal(job[k], undefined, `collector job must not expose ${k}`);
  for (const item of job.items) {
    assert.deepEqual(Object.keys(item).sort(), ['name', 'preparation', 'sampleType'].filter((k) => item[k] !== undefined).sort());
  }
}

const PATIENT = { name: 'Riya Sen', age: 29, gender: 'female', phone: '9876500001' };
const ADDRESS = { line: '5 Lake Rd', area: 'Ballygunge', city: 'Kolkata', pincode: '700029' };

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('sjb-collectors'));
  app = createApp();
  await seedDatabase({ reset: true });

  ctx.patient = (await loginAs('patient@patholy.in', 'Patient@123')).token;
  ctx.lab = (await loginAs('lab1@patholy.in', 'Lab@1234')).token; // Lifeline Pathology
  ctx.lab2 = (await loginAs('lab2@patholy.in', 'Lab@1234')).token; // CarePoint
  const c1 = await loginAs('collector1@patholy.in', 'Collector@123');
  ctx.collector = c1.token;
  ctx.collectorLogin = c1;
  ctx.collector3 = (await loginAs('collector3@patholy.in', 'Collector@123')).token;

  ctx.lifeline = await Lab.findOne({ name: 'Lifeline Pathology' });
  ctx.greenleaf = await Lab.findOne({ name: 'GreenLeaf Labs' });
  ctx.labOnly = await LabTest.create({
    lab: ctx.lifeline._id, name: 'Ultrasound Whole Abdomen', category: 'Imaging', mrp: 1500, price: 999,
    sampleType: 'None', preparation: 'Full bladder, 6 hours fasting', homeCollection: false,
  });
  ctx.homeTest = await LabTest.findOne({ lab: ctx.lifeline._id, homeCollection: true, isActive: true });
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('collector accounts', () => {
  test('collector login includes their lab and they can only use the collector API', async () => {
    assert.equal(ctx.collectorLogin.user.role, 'collector');
    assert.equal(ctx.collectorLogin.lab.name, 'Lifeline Pathology');
    assert.equal((await api().get('/api/partner/lab').set(auth(ctx.collector))).status, 403);
    assert.equal((await api().get('/api/collector/summary').set(auth(ctx.patient))).status, 403);
    const reg = await api().post('/api/auth/register').send({ name: 'X', email: 'x@c.com', phone: '9876511111', password: 'secret123', role: 'collector' });
    assert.equal(reg.status, 400, 'cannot self-register as collector');
  });

  test('lab creates, lists and deactivates its collectors', async () => {
    const created = await api().post('/api/partner/collectors').set(auth(ctx.lab)).send({ name: 'New Runner', email: 'runner@lab.com', phone: '9876522222', password: 'runner123' });
    assert.equal(created.status, 201, created.body.message);
    assert.equal(created.body.collector.role, 'collector');
    assert.equal(created.body.collector.password, undefined);
    ctx.newCollectorId = created.body.collector._id;

    const dup = await api().post('/api/partner/collectors').set(auth(ctx.lab)).send({ name: 'Dup', email: 'runner@lab.com', phone: '9876522223', password: 'runner123' });
    assert.equal(dup.status, 409);

    const list = await api().get('/api/partner/collectors').set(auth(ctx.lab));
    assert.equal(list.status, 200);
    const names = list.body.items.map((c) => c.name);
    assert.ok(names.includes('Bikash Mondal') && names.includes('Rupa Saha') && names.includes('New Runner'));
    assert.ok(!names.includes('Tanmoy Paul'), 'other lab collectors are hidden');
    const bikash = list.body.items.find((c) => c.name === 'Bikash Mondal');
    assert.ok(bikash.activeJobs >= 1);
    assert.ok(bikash.monthEarnings > 0, 'seed gives collector1 earnings this month');

    const other = await api().patch(`/api/partner/collectors/${ctx.newCollectorId}`).set(auth(ctx.lab2)).send({ isActive: false });
    assert.equal(other.status, 404);
    const off = await api().patch(`/api/partner/collectors/${ctx.newCollectorId}`).set(auth(ctx.lab)).send({ isActive: false });
    assert.equal(off.body.collector.isActive, false);
  });
});

describe('visit modes, capacity and availability', () => {
  test('lab-only tests need a lab visit slot; home collection is rejected for them', async () => {
    const base = { labId: ctx.lifeline._id, items: [ctx.labOnly._id], slot: { date: todayIST(2), time: '10:00-11:00' }, patient: PATIENT };
    const home = await api().post('/api/bookings').set(auth(ctx.patient)).send({ ...base, collectionType: 'home', address: ADDRESS });
    assert.equal(home.status, 400);
    assert.match(home.body.message, /Home collection is not available/);

    const visit = await api().post('/api/bookings').set(auth(ctx.patient)).send({ ...base, collectionType: 'lab_visit' });
    assert.equal(visit.status, 201, visit.body.message);
    assert.equal(visit.body.booking.collectionFee, 0);
    assert.equal(visit.body.booking.items[0].sampleType, ctx.labOnly.sampleType);
    ctx.visitId = visit.body.booking._id;

    const bad = await api().post('/api/bookings').set(auth(ctx.patient)).send({ ...base, collectionType: 'drone', address: ADDRESS });
    assert.equal(bad.status, 400);
    assert.match(bad.body.message, /Choose home collection, lab visit or assisted visit/);

    const homeOk = await api().post('/api/bookings').set(auth(ctx.patient)).send({ ...base, items: [ctx.homeTest._id], collectionType: 'home', address: ADDRESS });
    assert.equal(homeOk.status, 201, homeOk.body.message);
    assert.equal(homeOk.body.booking.items[0].preparation, ctx.homeTest.preparation);
    ctx.homeBookingId = homeOk.body.booking._id;
  });

  test('assisted visit: any test, pickup address required, assisted fee charged', async () => {
    const base = { labId: ctx.lifeline._id, items: [ctx.labOnly._id], collectionType: 'assisted_visit', slot: { date: todayIST(2), time: '11:00-12:00' }, patient: PATIENT };
    const noAddr = await api().post('/api/bookings').set(auth(ctx.patient)).send(base);
    assert.equal(noAddr.status, 400);
    assert.match(noAddr.body.message, /pickup address/);
    const ok = await api().post('/api/bookings').set(auth(ctx.patient)).send({ ...base, address: ADDRESS });
    assert.equal(ok.status, 201, ok.body.message);
    assert.equal(ok.body.booking.collectionFee, 149);
    assert.equal(ok.body.booking.address.pincode, '700029');
    ctx.assistedId = ok.body.booking._id;

    const greenleafTest = await LabTest.findOne({ lab: ctx.greenleaf._id });
    const notOffered = await api().post('/api/bookings').set(auth(ctx.patient)).send({ ...base, labId: ctx.greenleaf._id, items: [greenleafTest._id], address: ADDRESS });
    assert.equal(notOffered.status, 400);
    assert.match(notOffered.body.message, /does not offer assisted visits/);
  });

  test('slot capacity is enforced per collection type', async () => {
    await Lab.updateOne({ _id: ctx.lifeline._id }, { slotCapacity: 2 });
    const body = { labId: ctx.lifeline._id, items: [ctx.homeTest._id], collectionType: 'lab_visit', slot: { date: todayIST(3), time: '16:00-17:00' }, patient: PATIENT };
    for (let i = 0; i < 2; i++) {
      const r = await api().post('/api/bookings').set(auth(ctx.patient)).send(body);
      assert.equal(r.status, 201, r.body.message);
    }
    const full = await api().post('/api/bookings').set(auth(ctx.patient)).send(body);
    assert.equal(full.status, 409);
    assert.match(full.body.message, /fully booked/);

    const home = await api().post('/api/bookings').set(auth(ctx.patient)).send({ ...body, collectionType: 'home', address: ADDRESS });
    assert.equal(home.status, 201, 'home collection has its own capacity');

    const avail = await api().get(`/api/labs/${ctx.lifeline.slug}/availability`).query({ date: todayIST(3), type: 'lab_visit' });
    assert.equal(avail.status, 200);
    assert.equal(avail.body.capacity, 2);
    assert.equal(avail.body.slots.length, TIME_SLOTS.length);
    const s = avail.body.slots.find((x) => x.time === '16:00-17:00');
    assert.deepEqual([s.booked, s.available, s.past], [2, 0, false]);
    const homeAvail = await api().get(`/api/labs/${ctx.lifeline.slug}/availability`).query({ date: todayIST(3), type: 'home' });
    assert.equal(homeAvail.body.slots.find((x) => x.time === '16:00-17:00').booked, 1);
    await Lab.updateOne({ _id: ctx.lifeline._id }, { slotCapacity: 4 });
  });

  test('availability validates input and past slots are rejected', async () => {
    assert.equal((await api().get(`/api/labs/${ctx.lifeline.slug}/availability`).query({ date: 'nope' })).status, 400);
    assert.equal((await api().get(`/api/labs/${ctx.lifeline.slug}/availability`).query({ date: todayIST(1), type: 'drone' })).status, 400);
    const assisted = await api().get(`/api/labs/${ctx.lifeline.slug}/availability`).query({ date: todayIST(2), type: 'assisted_visit' });
    assert.equal(assisted.body.slots.find((x) => x.time === '11:00-12:00').booked, 1);
    const def = await api().get(`/api/labs/${ctx.lifeline.slug}/availability`).query({ date: todayIST(1) });
    assert.equal(def.body.type, 'lab_visit');
    const yesterday = await api().get(`/api/labs/${ctx.lifeline.slug}/availability`).query({ date: todayIST(-1) });
    assert.ok(yesterday.body.slots.every((s) => s.past));

    const hour = Number(new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }).slice(0, 2));
    if (hour >= 6) {
      const r = await api().post('/api/bookings').set(auth(ctx.patient)).send({ labId: ctx.lifeline._id, items: [ctx.homeTest._id], collectionType: 'lab_visit', slot: { date: todayIST(), time: '06:00-07:00' }, patient: PATIENT });
      assert.equal(r.status, 400);
      assert.match(r.body.message, /already passed/);
    }
  });

  test('collector payouts are private to the lab; assisted visit info is public', async () => {
    const pub = await api().get(`/api/labs/${ctx.lifeline.slug}`);
    assert.equal(pub.body.lab.collectorPayoutHome, undefined);
    assert.equal(pub.body.lab.collectorPayoutAssisted, undefined);
    assert.deepEqual([pub.body.lab.assistedVisit, pub.body.lab.assistedVisitFee], [true, 149]);
    const list = await api().get('/api/labs').query({ q: 'Lifeline' });
    assert.equal(list.body.items[0].collectorPayoutHome, undefined);
    assert.equal(list.body.items[0].assistedVisit, true);
    const mine = await api().get('/api/partner/lab').set(auth(ctx.lab));
    assert.equal(mine.body.lab.collectorPayoutHome, 60);
    assert.equal(mine.body.lab.collectorPayoutAssisted, 120);
    const upd = await api().put('/api/partner/lab').set(auth(ctx.lab)).send({ collectorPayoutHome: 70, slotCapacity: 5 });
    assert.deepEqual([upd.body.lab.collectorPayoutHome, upd.body.lab.slotCapacity], [70, 5]);
    await api().put('/api/partner/lab').set(auth(ctx.lab)).send({ collectorPayoutHome: 60, slotCapacity: 4 });
  });
});

describe('assignment and field workflow', () => {
  test('lab assigns a collector to a home collection; rules are enforced', async () => {
    const bikash = await User.findOne({ email: 'collector1@patholy.in' });
    const tanmoy = await User.findOne({ email: 'collector3@patholy.in' });
    const url = `/api/partner/bookings/${ctx.homeBookingId}/assign`;

    assert.equal((await api().patch(url).set(auth(ctx.lab)).send({ collectorId: tanmoy._id })).status, 400, 'other lab collector');
    assert.equal((await api().patch(url).set(auth(ctx.lab)).send({ collectorId: ctx.newCollectorId })).status, 400, 'inactive collector');
    assert.equal((await api().patch(url).set(auth(ctx.lab2)).send({ collectorId: bikash._id })).status, 404, 'other lab booking');

    const ok = await api().patch(url).set(auth(ctx.lab)).send({ collectorId: bikash._id });
    assert.equal(ok.status, 200, ok.body.message);
    assert.equal(ok.body.booking.status, 'confirmed', 'pending booking is auto-confirmed');
    assert.equal(ok.body.booking.collector.name, 'Bikash Mondal');
    assert.equal(ok.body.booking.fieldStatus, 'assigned');
    assert.equal(ok.body.booking.collectorEarning, 60);

    const r = await api().patch(`/api/partner/bookings/${ctx.visitId}/assign`).set(auth(ctx.lab)).send({ collectorId: bikash._id });
    assert.equal(r.status, 400);
    assert.match(r.body.message, /Only home collections and assisted visits need a collector/);

    const a = await api().patch(`/api/partner/bookings/${ctx.assistedId}/assign`).set(auth(ctx.lab)).send({ collectorId: bikash._id });
    assert.equal(a.status, 200, a.body.message);
    assert.equal(a.body.booking.collectorEarning, 120, 'assisted payout snapshot');

    const patientView = await api().get(`/api/bookings/${ctx.homeBookingId}`).set(auth(ctx.patient));
    assert.deepEqual(Object.keys(patientView.body.booking.collector).sort(), ['_id', 'name', 'phone']);
  });

  test('collector jobs never contain prices', async () => {
    const res = await api().get('/api/collector/jobs').set(auth(ctx.collector));
    assert.equal(res.status, 200);
    assert.ok(res.body.items.length >= 2, 'seeded job + newly assigned job');
    res.body.items.forEach(assertNoPrices);
    const job = res.body.items.find((j) => j._id === ctx.homeBookingId);
    assert.ok(job, 'assigned job is listed');
    assert.equal(job.lab.name, 'Lifeline Pathology');
    assert.ok(job.amountToCollect > 0);
    assert.equal(job.collectorEarning, 60);
    assert.ok(job.items[0].name);

    const other = await api().get('/api/collector/jobs').set(auth(ctx.collector3));
    assert.ok(!other.body.items.some((j) => j._id === ctx.homeBookingId), 'collectors only see their own jobs');
  });

  test('home collection steps run in order to sample collected, then payment', async () => {
    const url = `/api/collector/jobs/${ctx.homeBookingId}/progress`;
    const wrong = await api().patch(url).set(auth(ctx.collector)).send({ step: 'arrived' });
    assert.equal(wrong.status, 400);
    assert.match(wrong.body.message, /Next step should be on_the_way/);
    assert.equal((await api().patch(url).set(auth(ctx.collector3)).send({ step: 'on_the_way' })).status, 404);
    assert.equal((await api().patch(url).set(auth(ctx.collector)).send({ step: 'payment_collected' })).status, 400);

    for (const step of ['on_the_way', 'arrived']) {
      const r = await api().patch(url).set(auth(ctx.collector)).send({ step });
      assert.equal(r.status, 200, `${step}: ${r.body.message}`);
      assertNoPrices(r.body.booking);
    }
    const pick = await api().patch(url).set(auth(ctx.collector)).send({ step: 'picked_up' });
    assert.match(pick.body.message, /Next step should be sample_collected/);
    const last = await api().patch(url).set(auth(ctx.collector)).send({ step: 'sample_collected' });
    assert.equal(last.body.booking.status, 'sample_collected');
    assert.deepEqual(last.body.booking.fieldHistory.map((h) => h.status), ['assigned', 'on_the_way', 'arrived']);

    const paid = await api().patch(url).set(auth(ctx.collector)).send({ step: 'payment_collected' });
    assert.equal(paid.body.booking.paymentStatus, 'paid');
    assert.equal(paid.body.booking.amountToCollect, 0);
    const again = await api().patch(url).set(auth(ctx.collector)).send({ step: 'payment_collected' });
    assert.match(again.body.message, /already recorded/);

    const done = await api().get('/api/collector/jobs').query({ scope: 'done' }).set(auth(ctx.collector));
    assert.ok(done.body.items.some((j) => j._id === ctx.homeBookingId));
    done.body.items.forEach(assertNoPrices);
  });

  test('assisted visit: pickup → lab → sample → drop home', async () => {
    const url = `/api/collector/jobs/${ctx.assistedId}/progress`;
    assert.match((await api().patch(url).set(auth(ctx.collector)).send({ step: 'dropped_home' })).body.message, /after the sample is collected/);
    for (const step of ['on_the_way', 'arrived', 'picked_up', 'reached_lab', 'sample_collected']) {
      const r = await api().patch(url).set(auth(ctx.collector)).send({ step });
      assert.equal(r.status, 200, `${step}: ${r.body.message}`);
      assertNoPrices(r.body.booking);
    }
    const active = await api().get('/api/collector/jobs').set(auth(ctx.collector));
    assert.ok(active.body.items.some((j) => j._id === ctx.assistedId), 'stays active until the patient is dropped home');

    const drop = await api().patch(url).set(auth(ctx.collector)).send({ step: 'dropped_home' });
    assert.equal(drop.status, 200, drop.body.message);
    assert.equal(drop.body.booking.fieldStatus, 'dropped_home');
    assert.deepEqual(drop.body.booking.fieldHistory.map((h) => h.status), ['assigned', 'on_the_way', 'arrived', 'picked_up', 'reached_lab', 'dropped_home']);
    assert.match((await api().patch(url).set(auth(ctx.collector)).send({ step: 'dropped_home' })).body.message, /already recorded/);

    const after = await api().get('/api/collector/jobs').set(auth(ctx.collector));
    assert.ok(!after.body.items.some((j) => j._id === ctx.assistedId));
    assert.match((await api().patch(`/api/collector/jobs/${ctx.homeBookingId}/progress`).set(auth(ctx.collector)).send({ step: 'dropped_home' })).body.message, /Only assisted visits/);
  });

  test('unassigning clears the collector and earning', async () => {
    const bikash = await User.findOne({ email: 'collector1@patholy.in' });
    const open = await Booking.findOne({ collector: bikash._id, status: 'confirmed' });
    assert.ok(open, 'seed gives collector1 an upcoming job');
    const un = await api().patch(`/api/partner/bookings/${open._id}/assign`).set(auth(ctx.lab)).send({ collectorId: null });
    assert.equal(un.status, 200);
    assert.equal(un.body.booking.collector, undefined);
    assert.equal(un.body.booking.fieldStatus, undefined);
    assert.equal(un.body.booking.collectorEarning, undefined);
  });

  test('collector summary and earnings', async () => {
    const s = await api().get('/api/collector/summary').set(auth(ctx.collector));
    assert.equal(s.status, 200);
    assert.equal(s.body.lab.name, 'Lifeline Pathology');
    assert.equal(s.body.earnings.payoutHome, 60);
    assert.equal(s.body.earnings.payoutAssisted, 120);
    assert.ok(s.body.earnings.today >= 180, 'seeded home + assisted jobs collected today');
    assert.ok(s.body.earnings.week >= s.body.earnings.today);
    assert.ok(s.body.earnings.month >= s.body.earnings.today);
    assert.ok(s.body.earnings.total >= s.body.earnings.month);
    assert.equal(typeof s.body.today.amountToCollect, 'number');

    const e = await api().get('/api/collector/earnings').set(auth(ctx.collector));
    assert.equal(e.body.month, todayIST().slice(0, 7));
    assert.equal(e.body.total, e.body.jobs.reduce((t, j) => t + j.collectorEarning, 0));
    assert.ok(e.body.jobs.length >= 2);
    assert.ok(e.body.jobs.every((j) => j.price === undefined && j.total === undefined));
    const old = await api().get('/api/collector/earnings').query({ month: '2000-01' }).set(auth(ctx.collector));
    assert.deepEqual([old.body.total, old.body.jobs.length], [0, 0]);
  });

  test('admin sees collectors with their lab', async () => {
    const admin = (await loginAs('admin@patholy.in', 'Admin@123')).token;
    const users = await api().get('/api/admin/users').query({ role: 'collector' }).set(auth(admin));
    assert.ok(users.body.items.length >= 3);
    assert.ok(users.body.items.every((u) => u.role === 'collector' && u.lab?.name));
    const stats = await api().get('/api/admin/stats').set(auth(admin));
    assert.ok(stats.body.users.collector >= 3);
  });

  test('a collector whose lab no longer exists is rejected', async () => {
    const orphan = await User.create({ name: 'Orphan', email: 'orphan@c.com', phone: '9876533333', password: 'secret123', role: 'collector', lab: new mongoose.Types.ObjectId() });
    const { body } = await api().post('/api/auth/login').send({ email: 'orphan@c.com', password: 'secret123' });
    const r = await api().get('/api/collector/summary').set(auth(body.token));
    assert.equal(r.status, 403);
    await orphan.deleteOne();
  });
});
