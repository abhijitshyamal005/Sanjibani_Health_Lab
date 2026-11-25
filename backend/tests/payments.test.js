import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app.js';
import Booking from '../models/bookingModel.js';
import User from '../models/userModel.js';
import { flushEmails } from '../services/events.js';
import { outbox } from '../services/notify.js';
import { setRazorpayClient } from '../services/payments.js';
import { todayIST } from '../utils/helpers.js';

process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_123';
process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook_secret_456';

let mongod;
let app;
const api = () => request(app);
const auth = (t) => ({ Authorization: `Bearer ${t}` });
const sign = (orderId, paymentId) => crypto.createHmac('sha256', 'test_secret_123').update(`${orderId}|${paymentId}`).digest('hex');
const webhook = (event) => {
  const body = JSON.stringify(event);
  return api()
    .post('/api/payments/webhook')
    .set('Content-Type', 'application/json')
    .set('X-Razorpay-Signature', crypto.createHmac('sha256', 'webhook_secret_456').update(body).digest('hex'))
    .send(body);
};

const calls = { captured: [], refunded: [] };
let orderSeq = 0;
setRazorpayClient({
  orders: { create: async ({ amount }) => ({ id: `order_${++orderSeq}`, amount, currency: 'INR' }) },
  payments: {
    fetch: async (id) => ({ id, status: id.includes('auth') ? 'authorized' : 'captured' }),
    capture: async (id, amount) => {
      calls.captured.push({ id, amount });
      return { id, status: 'captured' };
    },
    refund: async (id, { amount }) => {
      calls.refunded.push({ id, amount });
      if (id.includes('norefund')) throw Object.assign(new Error('refund failed'), { error: { description: 'Payment not refundable' } });
      return { id: `rfnd_${id}`, status: 'pending', amount };
    },
  },
});

const ctx = {};
async function newBooking() {
  const res = await api().post('/api/bookings').set(auth(ctx.patient)).send({
    labId: ctx.labId, items: [ctx.testId], collectionType: 'lab_visit', slot: { date: todayIST(1), time: '09:00-10:00' },
    patient: { name: 'Riya Sen', age: 30, gender: 'female', phone: '9876500001' },
  });
  assert.equal(res.status, 201, res.body.message);
  return res.body.booking._id;
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('payments-test'));
  app = createApp();
  ctx.patient = (await api().post('/api/auth/register').send({ name: 'Riya Sen', email: 'riya@test.com', phone: '9876500001', password: 'secret123' })).body.token;
  ctx.owner = (await api().post('/api/auth/register').send({ name: 'Owner', email: 'owner@test.com', phone: '9876500002', password: 'secret123', role: 'lab' })).body.token;
  const lab = await api().post('/api/partner/lab').set(auth(ctx.owner)).send({ name: 'Alpha Labs', phone: '03312345678', address: { line: '1 Road', city: 'Kolkata', pincode: '700001' } });
  ctx.labId = lab.body.lab._id;
  await User.create({ name: 'Admin', email: 'admin@test.com', phone: '9000000001', password: 'secret123', role: 'admin' });
  const admin = (await api().post('/api/auth/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;
  await api().patch(`/api/admin/labs/${ctx.labId}/status`).set(auth(admin)).send({ status: 'approved' });
  ctx.testId = (await api().post('/api/partner/tests').set(auth(ctx.owner)).send({ name: 'HbA1c', category: 'Diabetes', mrp: 1000, price: 450 })).body.test._id;
});
after(async () => {
  setRazorpayClient(null);
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Razorpay payments', () => {
  test('meta reports payments enabled with the public key only', async () => {
    const meta = (await api().get('/api/meta')).body;
    assert.equal(meta.paymentsEnabled, true);
    assert.equal(meta.razorpayKeyId, 'rzp_test_dummy');
    assert.ok(!JSON.stringify(meta).includes('test_secret_123'), 'secret never exposed');
  });

  test('pay online: order → verify captures an authorized payment and emails a receipt', async () => {
    const id = await newBooking();
    const order = await api().post('/api/payments/order').set(auth(ctx.patient)).send({ bookingId: id });
    assert.equal(order.status, 200);
    assert.equal(order.body.amount, 45000);

    const bad = await api().post('/api/payments/verify').set(auth(ctx.patient)).send({ bookingId: id, razorpay_order_id: order.body.orderId, razorpay_payment_id: 'pay_auth_1', razorpay_signature: 'nope' });
    assert.equal(bad.status, 400);

    const ok = await api().post('/api/payments/verify').set(auth(ctx.patient)).send({
      bookingId: id, razorpay_order_id: order.body.orderId, razorpay_payment_id: 'pay_auth_1', razorpay_signature: sign(order.body.orderId, 'pay_auth_1'),
    });
    assert.equal(ok.status, 200, ok.body.message);
    assert.equal(ok.body.booking.paymentStatus, 'paid');
    assert.deepEqual(calls.captured.at(-1), { id: 'pay_auth_1', amount: 45000 });
    await flushEmails();
    assert.ok(outbox.some((m) => m.to === 'riya@test.com' && /Payment received/.test(m.subject)));
    ctx.paidBooking = id;
  });

  test('webhook rejects bad signatures and marks a payment paid when the browser was closed', async () => {
    const id = await newBooking();
    const order = await api().post('/api/payments/order').set(auth(ctx.patient)).send({ bookingId: id });

    const forged = await api().post('/api/payments/webhook').set('Content-Type', 'application/json').set('X-Razorpay-Signature', 'forged').send('{}');
    assert.equal(forged.status, 400);

    const res = await webhook({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_web_1', order_id: order.body.orderId, notes: { bookingId: id } } } } });
    assert.equal(res.status, 200);
    const b = await Booking.findById(id);
    assert.equal(b.paymentStatus, 'paid');
    assert.equal(b.paymentId, 'pay_web_1');

    // Duplicate webhook deliveries are harmless.
    assert.equal((await webhook({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_web_1', order_id: order.body.orderId } } } })).status, 200);
  });

  test('cancelling an online-paid booking refunds it in full; refund.processed completes it', async () => {
    outbox.splice(0);
    const res = await api().patch(`/api/bookings/${ctx.paidBooking}/cancel`).set(auth(ctx.patient)).send({ reason: 'Plans changed' });
    assert.equal(res.status, 200);
    assert.deepEqual(calls.refunded.at(-1), { id: 'pay_auth_1', amount: 45000 });
    let b = await Booking.findById(ctx.paidBooking);
    assert.equal(b.refund.status, 'pending');
    assert.equal(b.refund.amount, 450);
    await flushEmails();
    assert.match(outbox.find((m) => m.to === 'riya@test.com' && /cancelled/.test(m.subject)).html, /full refund of <b>₹450/);

    await webhook({ event: 'refund.processed', payload: { refund: { entity: { id: 'rfnd_pay_auth_1', payment_id: 'pay_auth_1' } } } });
    b = await Booking.findById(ctx.paidBooking);
    assert.equal(b.refund.status, 'processed');
  });

  test('a failed refund is recorded and the patient is told it will be handled manually', async () => {
    const id = await newBooking();
    await Booking.updateOne({ _id: id }, { paymentStatus: 'paid', paymentMethod: 'online', paymentId: 'pay_norefund_1' });
    outbox.splice(0);
    await api().patch(`/api/partner/bookings/${id}/status`).set(auth(ctx.owner)).send({ status: 'cancelled', note: 'Machine down' });
    const b = await Booking.findById(id);
    assert.equal(b.refund.status, 'failed');
    assert.match(b.refund.error, /not refundable/);
    await flushEmails();
    assert.match(outbox.find((m) => m.to === 'riya@test.com' && /cancelled/.test(m.subject)).html, /process it manually/);
  });

  test('pay-at-collection bookings are never refunded', async () => {
    const before = calls.refunded.length;
    const id = await newBooking();
    await api().patch(`/api/bookings/${id}/cancel`).set(auth(ctx.patient)).send({});
    assert.equal(calls.refunded.length, before);
  });
});
