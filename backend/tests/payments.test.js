import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app.js';
import Booking from '../models/bookingModel.js';
import User from '../models/userModel.js';
import { flushEmails } from '../services/events.js';
import { outbox } from '../services/notify.js';
import { todayIST } from '../utils/helpers.js';

let mongod;
let app;
const api = () => request(app);
const auth = (t) => ({ Authorization: `Bearer ${t}` });
const ctx = {};

async function newBooking() {
  const res = await api().post('/api/bookings').set(auth(ctx.patient)).send({
    labId: ctx.labId, items: [ctx.testId], collectionType: 'lab_visit', slot: { date: todayIST(1), time: '09:00-10:00' },
    patient: { name: 'Riya Sen', age: 30, gender: 'female', phone: '9876500001' },
  });
  assert.equal(res.status, 201, res.body.message);
  return res.body.booking._id;
}
const mails = async () => {
  await flushEmails();
  return outbox.splice(0);
};

before(async () => {
  delete process.env.UPI_ID;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('payments-test'));
  app = createApp();
  ctx.patient = (await api().post('/api/auth/register').send({ name: 'Riya Sen', email: 'riya@test.com', phone: '9876500001', password: 'secret123' })).body.token;
  ctx.owner = (await api().post('/api/auth/register').send({ name: 'Owner', email: 'owner@test.com', phone: '9876500002', password: 'secret123', role: 'lab' })).body.token;
  const lab = await api().post('/api/partner/lab').set(auth(ctx.owner)).send({ name: 'Alpha Labs', email: 'desk@alpha.test', phone: '03312345678', address: { line: '1 Road', city: 'Kolkata', pincode: '700001' } });
  ctx.labId = lab.body.lab._id;
  await User.create({ name: 'Admin', email: 'admin@test.com', phone: '9000000001', password: 'secret123', role: 'admin' });
  ctx.admin = (await api().post('/api/auth/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;
  await api().patch(`/api/admin/labs/${ctx.labId}/status`).set(auth(ctx.admin)).send({ status: 'approved' });
  ctx.testId = (await api().post('/api/partner/tests').set(auth(ctx.owner)).send({ name: 'HbA1c', category: 'Diabetes', mrp: 1000, price: 450 })).body.test._id;
});
after(async () => {
  delete process.env.UPI_ID;
  delete process.env.UPI_NAME;
  await mongoose.disconnect();
  await mongod.stop();
});

describe('free UPI payments', () => {
  test('no payment gateway endpoints remain', async () => {
    assert.equal((await api().post('/api/payments/order').set(auth(ctx.patient)).send({})).status, 404);
    assert.ok([401, 404].includes((await api().post('/api/payments/webhook').send({})).status), 'no public webhook');
  });

  test('without any UPI ID patients are told to pay at collection', async () => {
    const id = await newBooking();
    const meta = (await api().get('/api/meta')).body;
    assert.equal(meta.upiAvailable, false);
    const res = await api().get(`/api/payments/upi/${id}`).set(auth(ctx.patient));
    assert.equal(res.status, 400);
    assert.match(res.body.message, /pay at collection/);
  });

  test('platform UPI: patient pays Patholy, admin verifies (lab cannot)', async () => {
    process.env.UPI_ID = 'abhijitshyamal005-3@okhdfcbank';
    process.env.UPI_NAME = 'Abhijit Shyamal';
    assert.equal((await api().get('/api/meta')).body.upiAvailable, true);

    const id = await newBooking();
    const details = await api().get(`/api/payments/upi/${id}`).set(auth(ctx.patient));
    assert.equal(details.status, 200);
    assert.equal(details.body.upiId, 'abhijitshyamal005-3@okhdfcbank');
    assert.equal(details.body.payee, 'Abhijit Shyamal');
    assert.match(details.body.uri, /^upi:\/\/pay\?pa=abhijitshyamal005-3%40okhdfcbank&pn=Abhijit\+Shyamal&am=450\.00&cu=INR&tn=Patholy\+PTL/);

    assert.equal((await api().post(`/api/payments/upi/${id}/submit`).set(auth(ctx.patient)).send({ utr: '12' })).status, 400);
    await mails();
    const sub = await api().post(`/api/payments/upi/${id}/submit`).set(auth(ctx.patient)).send({ utr: '4123 5678 9012' });
    assert.equal(sub.status, 200, sub.body.message);
    assert.equal(sub.body.booking.paymentStatus, 'verifying');
    let m = await mails();
    assert.ok(m.some((x) => x.to === 'admin@test.com' && /Confirm UPI payment/.test(x.subject)), 'admin asked to verify');
    assert.ok(!m.some((x) => x.to === 'desk@alpha.test' && /Confirm UPI payment/.test(x.subject)), 'lab not asked (money went to platform)');
    assert.ok(m.some((x) => x.to === 'riya@test.com' && /UPI payment submitted/.test(x.subject)));

    const byLab = await api().patch(`/api/partner/bookings/${id}/payment`).set(auth(ctx.owner)).send({ action: 'confirm' });
    assert.equal(byLab.status, 400);
    assert.match(byLab.body.message, /Patholy team will verify/);

    const ok = await api().patch(`/api/admin/bookings/${id}/payment`).set(auth(ctx.admin)).send({ action: 'confirm' });
    assert.equal(ok.status, 200, ok.body.message);
    assert.equal(ok.body.booking.paymentStatus, 'paid');
    m = await mails();
    assert.match(m.find((x) => x.to === 'riya@test.com' && /Payment received/.test(x.subject)).html, /by UPI \(transaction ID 412356789012\)/);
    ctx.paidId = id;
  });

  test('a UTR cannot be reused, and a paid booking cannot be paid twice', async () => {
    const id = await newBooking();
    assert.equal((await api().post(`/api/payments/upi/${id}/submit`).set(auth(ctx.patient)).send({ utr: '412356789012' })).status, 409);
    assert.equal((await api().get(`/api/payments/upi/${ctx.paidId}`).set(auth(ctx.patient))).status, 400);
  });

  test('lab UPI ID takes priority; lab verifies and can reject', async () => {
    assert.equal((await api().put('/api/partner/lab').set(auth(ctx.owner)).send({ upiId: 'not a upi' })).status, 400);
    await api().put('/api/partner/lab').set(auth(ctx.owner)).send({ upiId: 'AlphaLabs@okhdfcbank', upiName: 'Alpha Labs Pvt Ltd' });

    const id = await newBooking();
    const details = await api().get(`/api/payments/upi/${id}`).set(auth(ctx.patient));
    assert.equal(details.body.upiId, 'alphalabs@okhdfcbank');
    assert.equal(details.body.payee, 'Alpha Labs Pvt Ltd');

    await api().post(`/api/payments/upi/${id}/submit`).set(auth(ctx.patient)).send({ utr: '999988887777' });
    let m = await mails();
    assert.ok(m.some((x) => x.to === 'desk@alpha.test' && /Confirm UPI payment/.test(x.subject)), 'lab asked to verify its own UPI');

    const rej = await api().patch(`/api/partner/bookings/${id}/payment`).set(auth(ctx.owner)).send({ action: 'reject' });
    assert.equal(rej.body.booking.paymentStatus, 'unpaid');
    m = await mails();
    assert.ok(m.some((x) => x.to === 'riya@test.com' && /UPI payment not found/.test(x.subject)));
    assert.equal((await api().patch(`/api/partner/bookings/${id}/payment`).set(auth(ctx.owner)).send({ action: 'confirm' })).status, 400, 'nothing left to verify');
  });

  test('cancelling a UPI-paid booking tells the patient about the refund', async () => {
    await mails();
    await api().patch(`/api/bookings/${ctx.paidId}/cancel`).set(auth(ctx.patient)).send({ reason: 'Plans changed' });
    const m = await mails();
    assert.match(m.find((x) => x.to === 'riya@test.com' && /cancelled/.test(x.subject)).html, /will be refunded to your UPI account/);
    const b = await Booking.findById(ctx.paidId);
    assert.equal(b.status, 'cancelled');
  });
});
