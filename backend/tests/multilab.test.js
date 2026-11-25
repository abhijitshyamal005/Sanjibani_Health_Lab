import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app.js';
import Coupon from '../models/couponModel.js';
import Lab from '../models/labModel.js';
import LabTest from '../models/labTestModel.js';
import User from '../models/userModel.js';
import { seedDatabase } from '../scripts/seedData.js';
import { todayIST } from '../utils/helpers.js';

process.env.NODE_ENV = 'test';

let mongod;
let app;
const api = () => request(app);
const auth = (t) => ({ Authorization: `Bearer ${t}` });
const ctx = {};

async function loginAs(email, password) {
  const res = await api().post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200, res.body.message);
  return res.body.token;
}

const PATIENT = { name: 'Riya Sen', age: 29, gender: 'female', phone: '9876500001' };
const ADDRESS = { line: '5 Lake Rd', area: 'Ballygunge', city: 'Kolkata', pincode: '700029' };
const day = () => todayIST(2);

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('sjb-multilab'));
  app = createApp();
  await seedDatabase({ reset: true });

  ctx.patient = await loginAs('patient@sanjibani.in', 'Patient@123');
  ctx.lab1 = await loginAs('lab1@sanjibani.in', 'Lab@1234'); // Lifeline Pathology
  ctx.lab2 = await loginAs('lab2@sanjibani.in', 'Lab@1234'); // CarePoint Diagnostics
  ctx.lifeline = await Lab.findOne({ name: 'Lifeline Pathology' });
  ctx.carepoint = await Lab.findOne({ name: 'CarePoint Diagnostics' });
  ctx.testA = await LabTest.findOne({ lab: ctx.lifeline._id, homeCollection: true, isActive: true });
  ctx.testB = await LabTest.findOne({ lab: ctx.carepoint._id, homeCollection: true, isActive: true });
  ctx.c1 = await User.findOne({ email: 'collector1@sanjibani.in' });
  ctx.c3 = await User.findOne({ email: 'collector3@sanjibani.in' });
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const order = (groups, extra = {}) => ({ groups, patient: PATIENT, address: ADDRESS, ...extra });
const group = (lab, test, collectionType = 'home', time = '07:00-08:00') => ({
  labId: lab._id,
  items: [test._id],
  collectionType,
  slot: { date: day(), time },
});

describe('one patient, several labs in one order', () => {
  test('creates one booking per lab sharing an order code', async () => {
    const res = await api()
      .post('/api/bookings')
      .set(auth(ctx.patient))
      .send(order([group(ctx.lifeline, ctx.testA), group(ctx.carepoint, ctx.testB, 'home', '08:00-09:00')]));
    assert.equal(res.status, 201, res.body.message);
    assert.equal(res.body.bookings.length, 2);
    assert.match(res.body.orderCode, /^ORD/);
    const [a, b] = res.body.bookings;
    assert.equal(a.lab.name, 'Lifeline Pathology');
    assert.equal(b.lab.name, 'CarePoint Diagnostics');
    for (const bk of res.body.bookings) {
      assert.equal(bk.orderCode, res.body.orderCode);
      assert.equal(bk.patient.name, PATIENT.name);
      assert.equal(bk.status, 'pending');
    }
    assert.notEqual(a.code, b.code);
    assert.equal(a.subtotal, ctx.testA.price);
    assert.equal(b.subtotal, ctx.testB.price);
    ctx.a = a._id;
    ctx.b = b._id;
    ctx.orderCode = res.body.orderCode;
  });

  test('each lab sees only its own booking and assigns its own collector', async () => {
    const l1 = await api().get('/api/partner/bookings').set(auth(ctx.lab1));
    const l2 = await api().get('/api/partner/bookings').set(auth(ctx.lab2));
    assert.ok(l1.body.items.some((x) => x._id === ctx.a) && !l1.body.items.some((x) => x._id === ctx.b));
    assert.ok(l2.body.items.some((x) => x._id === ctx.b) && !l2.body.items.some((x) => x._id === ctx.a));

    // Labs cannot touch each other's part of the order.
    assert.equal((await api().patch(`/api/partner/bookings/${ctx.b}/assign`).set(auth(ctx.lab1)).send({ collectorId: ctx.c1._id })).status, 404);

    const r1 = await api().patch(`/api/partner/bookings/${ctx.a}/assign`).set(auth(ctx.lab1)).send({ collectorId: ctx.c1._id });
    assert.equal(r1.status, 200, r1.body.message);
    const r2 = await api().patch(`/api/partner/bookings/${ctx.b}/assign`).set(auth(ctx.lab2)).send({ collectorId: ctx.c3._id });
    assert.equal(r2.status, 200, r2.body.message);

    const detail = await api().get(`/api/bookings/${ctx.a}`).set(auth(ctx.patient));
    assert.equal(detail.body.booking.collector.name, ctx.c1.name);
    assert.equal(detail.body.order.code, ctx.orderCode);
    assert.equal(detail.body.order.bookings.length, 1);
    assert.equal(detail.body.order.bookings[0].lab.name, 'CarePoint Diagnostics');
    assert.equal(detail.body.order.bookings[0].collector.name, ctx.c3.name);

    // A lab does not get the other lab's booking details.
    const labView = await api().get(`/api/bookings/${ctx.a}`).set(auth(ctx.lab1));
    assert.equal(labView.body.order, undefined);
  });

  test('rejects two in-person visits at the same time, duplicate labs and tests from the wrong lab', async () => {
    const clash = await api()
      .post('/api/bookings')
      .set(auth(ctx.patient))
      .send(order([group(ctx.lifeline, ctx.testA, 'lab_visit', '10:00-11:00'), group(ctx.carepoint, ctx.testB, 'home', '10:00-11:00')]));
    assert.equal(clash.status, 400);
    assert.match(clash.body.message, /same time/);

    const dup = await api().post('/api/bookings').set(auth(ctx.patient)).send(order([group(ctx.lifeline, ctx.testA), group(ctx.lifeline, ctx.testA)]));
    assert.equal(dup.status, 400);
    assert.match(dup.body.message, /only once/);

    const wrongLab = await api()
      .post('/api/bookings')
      .set(auth(ctx.patient))
      .send(order([group(ctx.lifeline, ctx.testB), group(ctx.carepoint, ctx.testB, 'home', '09:00-10:00')]));
    assert.equal(wrongLab.status, 400);
    assert.match(wrongLab.body.message, /no longer available/);
  });

  test('a coupon applies once to the whole order and is split across labs', async () => {
    const before = (await Coupon.findOne({ code: 'SANJI15' })).usedCount;
    const groups = [group(ctx.lifeline, ctx.testA, 'home', '11:00-12:00'), group(ctx.carepoint, ctx.testB, 'home', '11:00-12:00')];

    const check = await api().post('/api/coupons/validate').set(auth(ctx.patient)).send({ code: 'SANJI15', groups });
    assert.equal(check.status, 200, check.body.message);
    assert.equal(check.body.subtotal, ctx.testA.price + ctx.testB.price);

    const res = await api().post('/api/bookings').set(auth(ctx.patient)).send(order(groups, { couponCode: 'SANJI15' }));
    assert.equal(res.status, 201, res.body.message);
    const total = res.body.bookings.reduce((s, b) => s + b.discount, 0);
    assert.equal(total, check.body.discount);
    assert.equal((await Coupon.findOne({ code: 'SANJI15' })).usedCount, before + 1);

    // The coupon is released only after every booking in the order is cancelled.
    const [x, y] = res.body.bookings;
    await api().patch(`/api/bookings/${x._id}/cancel`).set(auth(ctx.patient));
    assert.equal((await Coupon.findOne({ code: 'SANJI15' })).usedCount, before + 1);
    await api().patch(`/api/bookings/${y._id}/cancel`).set(auth(ctx.patient));
    assert.equal((await Coupon.findOne({ code: 'SANJI15' })).usedCount, before);
  });

  test('the single-lab body still works and has no order code', async () => {
    const res = await api()
      .post('/api/bookings')
      .set(auth(ctx.patient))
      .send({ labId: ctx.lifeline._id, items: [ctx.testA._id], collectionType: 'home', slot: { date: day(), time: '17:00-18:00' }, patient: PATIENT, address: ADDRESS });
    assert.equal(res.status, 201, res.body.message);
    assert.equal(res.body.booking.orderCode, undefined);
    assert.equal(res.body.bookings.length, 1);
  });
});
