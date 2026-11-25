import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app.js';
import Coupon from '../models/couponModel.js';
import { seedDatabase } from '../scripts/seedData.js';
import { computeDiscount } from '../utils/coupons.js';
import { todayIST } from '../utils/helpers.js';

process.env.NODE_ENV = 'test';
const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sjb-reports-'));
process.env.UPLOAD_DIR = uploadDir;

let mongod;
let app;
const api = () => request(app);
const auth = (t) => ({ Authorization: `Bearer ${t}` });
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

async function loginAs(email, password) {
  const res = await api().post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200, res.body.message);
  return res.body.token;
}

const ctx = {};

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('sjb-enh'));
  app = createApp();
  await seedDatabase({ reset: true });
  ctx.patient = await loginAs('patient@sanjibani.in', 'Patient@123');
  ctx.lab = await loginAs('lab1@sanjibani.in', 'Lab@1234');
  ctx.lab2 = await loginAs('lab2@sanjibani.in', 'Lab@1234');
  ctx.admin = await loginAs('admin@sanjibani.in', 'Admin@123');

  const labs = await api().get('/api/labs?q=Lifeline');
  ctx.labSlug = labs.body.items[0].slug;
  const page = await api().get(`/api/labs/${ctx.labSlug}`);
  ctx.labId = page.body.lab._id;
  ctx.tests = page.body.tests.filter((t) => t.homeCollection);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  fs.rmSync(uploadDir, { recursive: true, force: true });
});

const bookingBody = (items, extra = {}) => ({
  labId: ctx.labId,
  items,
  collectionType: 'lab_visit',
  slot: { date: todayIST(1), time: '08:00-09:00' },
  patient: { name: 'Riya Sen', age: 29, gender: 'female', phone: '9876500001' },
  ...extra,
});

describe('security & infra', () => {
  test('helmet headers are set', async () => {
    const res = await api().get('/api/health');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-powered-by'], undefined);
  });
});

describe('discovery', () => {
  test('suggest returns distinct tests with lab counts', async () => {
    assert.deepEqual((await api().get('/api/tests/suggest?q=t')).body.items, []);
    const res = await api().get('/api/tests/suggest?q=thyroid');
    assert.equal(res.status, 200);
    assert.ok(res.body.items.length >= 2);
    const names = res.body.items.map((i) => i.name);
    assert.equal(new Set(names).size, names.length, 'names are distinct');
    assert.ok(res.body.items.every((i) => /thyroid/i.test(i.name) && i.minPrice > 0 && i.labCount >= 1));
    assert.ok(res.body.items.length <= 8);
    const regex = await api().get('/api/tests/suggest?q=(((');
    assert.equal(regex.status, 200);
  });

  test('recent reviews are positive, with comments, from approved labs', async () => {
    const res = await api().get('/api/reviews/recent');
    assert.equal(res.status, 200);
    assert.ok(res.body.items.length > 0 && res.body.items.length <= 6);
    for (const r of res.body.items) {
      assert.ok(r.rating >= 4);
      assert.ok(r.comment);
      assert.ok(r.labName && r.labSlug && r.userName);
      assert.ok(!r.userName.includes(' '));
    }
  });

  test('meta exposes UPI flag and featured coupon', async () => {
    const res = await api().get('/api/meta');
    assert.equal(res.body.featuredCoupon.code, 'SANJI15');
    assert.equal(res.body.featuredCoupon.type, 'percent');
  });
});

describe('coupons', () => {
  test('computeDiscount respects caps and never exceeds subtotal', () => {
    assert.equal(computeDiscount({ type: 'percent', value: 15, maxDiscount: 300 }, 1000), 150);
    assert.equal(computeDiscount({ type: 'percent', value: 15, maxDiscount: 300 }, 5000), 300);
    assert.equal(computeDiscount({ type: 'flat', value: 100 }, 60), 60);
  });

  test('validate endpoint checks code, min order, expiry and usage limit', async () => {
    const cheap = ctx.tests.reduce((a, b) => (a.price < b.price ? a : b));
    const pricey = [...ctx.tests].sort((a, b) => b.price - a.price).slice(0, 2);
    const priceySubtotal = pricey.reduce((s, t) => s + t.price, 0);

    const ok = await api().post('/api/coupons/validate').set(auth(ctx.patient)).send({ code: 'sanji15', labId: ctx.labId, items: pricey.map((t) => t._id) });
    assert.equal(ok.status, 200, ok.body.message);
    assert.equal(ok.body.code, 'SANJI15');
    assert.equal(ok.body.subtotal, priceySubtotal);
    assert.equal(ok.body.discount, Math.min(300, Math.floor(priceySubtotal * 0.15)));

    const bad = await api().post('/api/coupons/validate').set(auth(ctx.patient)).send({ code: 'NOPE', labId: ctx.labId, items: [cheap._id] });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.message, 'Invalid coupon code');

    const min = await api().post('/api/coupons/validate').set(auth(ctx.patient)).send({ code: 'FIRST100', labId: ctx.labId, items: [cheap._id] });
    assert.equal(min.status, 400);
    assert.match(min.body.message, /^Add tests worth ₹999 or more to use this coupon$/);

    await Coupon.create({ code: 'OLD10', type: 'flat', value: 10, expiresAt: new Date(Date.now() - 1000) });
    const expired = await api().post('/api/coupons/validate').set(auth(ctx.patient)).send({ code: 'OLD10', labId: ctx.labId, items: [cheap._id] });
    assert.equal(expired.body.message, 'This coupon has expired');

    await Coupon.create({ code: 'ONCE', type: 'flat', value: 10, usageLimit: 1, usedCount: 1 });
    const used = await api().post('/api/coupons/validate').set(auth(ctx.patient)).send({ code: 'ONCE', labId: ctx.labId, items: [cheap._id] });
    assert.equal(used.body.message, 'This coupon has reached its usage limit');

    const unavailable = await api().post('/api/coupons/validate').set(auth(ctx.patient)).send({ code: 'SANJI15', labId: ctx.labId, items: [new mongoose.Types.ObjectId()] });
    assert.equal(unavailable.status, 400);

    const asLab = await api().post('/api/coupons/validate').set(auth(ctx.lab)).send({ code: 'SANJI15', labId: ctx.labId, items: [cheap._id] });
    assert.equal(asLab.status, 403);
  });

  test('booking with coupon applies discount, counts usage, and releases it on cancel', async () => {
    const items = [...ctx.tests].sort((a, b) => b.price - a.price).slice(0, 2).map((t) => t._id);
    const before = (await Coupon.findOne({ code: 'SANJI15' })).usedCount;
    const res = await api().post('/api/bookings').set(auth(ctx.patient)).send(bookingBody(items, { couponCode: 'sanji15' }));
    assert.equal(res.status, 201, res.body.message);
    const b = res.body.booking;
    assert.equal(b.couponCode, 'SANJI15');
    assert.ok(b.discount > 0);
    assert.equal(b.total, b.subtotal + b.collectionFee - b.discount);
    assert.equal((await Coupon.findOne({ code: 'SANJI15' })).usedCount, before + 1);

    const bad = await api().post('/api/bookings').set(auth(ctx.patient)).send(bookingBody(items, { couponCode: 'NOPE' }));
    assert.equal(bad.status, 400);
    assert.equal(bad.body.message, 'Invalid coupon code');

    await api().patch(`/api/bookings/${b._id}/cancel`).set(auth(ctx.patient)).send({});
    assert.equal((await Coupon.findOne({ code: 'SANJI15' })).usedCount, before);
  });

  test('admin manages coupons', async () => {
    assert.equal((await api().get('/api/admin/coupons').set(auth(ctx.patient))).status, 403);
    const list = await api().get('/api/admin/coupons').set(auth(ctx.admin));
    assert.ok(list.body.items.some((c) => c.code === 'SANJI15'));

    const created = await api().post('/api/admin/coupons').set(auth(ctx.admin)).send({ code: 'monsoon20', type: 'percent', value: 20, maxDiscount: 250, usedCount: 999 });
    assert.equal(created.status, 201, created.body.message);
    assert.equal(created.body.coupon.code, 'MONSOON20');
    assert.equal(created.body.coupon.usedCount, 0, 'usedCount is not writable');

    assert.equal((await api().post('/api/admin/coupons').set(auth(ctx.admin)).send({ code: 'MONSOON20', type: 'flat', value: 5 })).status, 409);
    assert.equal((await api().post('/api/admin/coupons').set(auth(ctx.admin)).send({ code: 'BIG', type: 'percent', value: 95 })).status, 400);

    const id = created.body.coupon._id;
    const updated = await api().put(`/api/admin/coupons/${id}`).set(auth(ctx.admin)).send({ isActive: false, maxDiscount: '' });
    assert.equal(updated.body.coupon.isActive, false);
    assert.equal(updated.body.coupon.maxDiscount, null);
    assert.deepEqual((await api().delete(`/api/admin/coupons/${id}`).set(auth(ctx.admin))).body, { ok: true });
    assert.equal((await api().delete(`/api/admin/coupons/${id}`).set(auth(ctx.admin))).status, 404);
  });
});

describe('reports', () => {
  test('lab uploads a PDF report and the patient downloads it', async () => {
    const res = await api().post('/api/bookings').set(auth(ctx.patient)).send(bookingBody([ctx.tests[0]._id]));
    const id = res.body.booking._id;
    ctx.reportBooking = id;
    const url = `/api/partner/bookings/${id}/report`;

    const early = await api().post(url).set(auth(ctx.lab)).attach('report', PDF, { filename: 'r.pdf', contentType: 'application/pdf' });
    assert.equal(early.status, 400);
    assert.equal(early.body.message, 'Upload the report after the sample is collected');

    for (const status of ['confirmed', 'sample_collected']) {
      await api().patch(`/api/partner/bookings/${id}/status`).set(auth(ctx.lab)).send({ status });
    }

    const wrongType = await api().post(url).set(auth(ctx.lab)).attach('report', Buffer.from('hello'), { filename: 'r.txt', contentType: 'text/plain' });
    assert.equal(wrongType.status, 400);
    assert.match(wrongType.body.message, /PDF/);

    const big = await api().post(url).set(auth(ctx.lab)).attach('report', Buffer.alloc(5 * 1024 * 1024 + 10), { filename: 'big.pdf', contentType: 'application/pdf' });
    assert.equal(big.status, 400);
    assert.match(big.body.message, /5 MB/);

    const other = await api().post(url).set(auth(ctx.lab2)).attach('report', PDF, { filename: 'r.pdf', contentType: 'application/pdf' });
    assert.equal(other.status, 404);

    const up = await api().post(url).set(auth(ctx.lab)).attach('report', PDF, { filename: 'CBC Report.pdf', contentType: 'application/pdf' });
    assert.equal(up.status, 200, up.body.message);
    assert.equal(up.body.booking.report.originalName, 'CBC Report.pdf');
    assert.equal(up.body.booking.report.size, PDF.length);
    const first = up.body.booking.report.fileName;
    assert.ok(fs.existsSync(path.join(uploadDir, first)));

    const again = await api().post(url).set(auth(ctx.lab)).attach('report', PDF, { filename: 'v2.pdf', contentType: 'application/pdf' });
    assert.notEqual(again.body.booking.report.fileName, first);
    assert.ok(!fs.existsSync(path.join(uploadDir, first)), 'old file deleted on replace');

    const dl = await api().get(`/api/bookings/${id}/report`).set(auth(ctx.patient)).buffer(true).parse((r, cb) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    assert.equal(dl.status, 200);
    assert.equal(dl.headers['content-type'], 'application/pdf');
    assert.match(dl.headers['content-disposition'], /attachment; filename="Sanjibani-Report-SJB.+\.pdf"/);
    assert.ok(dl.body.equals(PDF));

    assert.equal((await api().get(`/api/bookings/${id}/report`).set(auth(ctx.lab)).buffer(true)).status, 200);
    assert.equal((await api().get(`/api/bookings/${id}/report`).set(auth(ctx.admin)).buffer(true)).status, 200);
    assert.equal((await api().get(`/api/bookings/${id}/report`).set(auth(ctx.lab2))).status, 404);
  });

  test('download 404s when no report exists', async () => {
    const res = await api().post('/api/bookings').set(auth(ctx.patient)).send(bookingBody([ctx.tests[1]._id]));
    assert.equal((await api().get(`/api/bookings/${res.body.booking._id}/report`).set(auth(ctx.patient))).status, 404);
  });
});

describe('forgot password', () => {
  test('always 200, and a valid code resets the password', async () => {
    const unknown = await api().post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
    assert.equal(unknown.status, 200);
    assert.equal(unknown.body.message, 'If an account exists, we have sent a reset code to the email.');
    assert.equal(unknown.body.devCode, undefined);

    const res = await api().post('/api/auth/forgot-password').send({ email: 'Sneha@Example.com' });
    assert.equal(res.status, 200);
    assert.match(res.body.devCode, /^\d{6}$/);

    const wrong = await api().post('/api/auth/reset-password').send({ email: 'sneha@example.com', code: '000000', newPassword: 'NewPass1' });
    assert.equal(wrong.status, 400);
    assert.equal(wrong.body.message, 'Invalid or expired code');

    const short = await api().post('/api/auth/reset-password').send({ email: 'sneha@example.com', code: res.body.devCode, newPassword: '1' });
    assert.equal(short.status, 400);

    const ok = await api().post('/api/auth/reset-password').send({ email: 'sneha@example.com', code: res.body.devCode, newPassword: 'NewPass1' });
    assert.equal(ok.status, 200, ok.body.message);
    assert.ok(ok.body.token);
    assert.equal(ok.body.user.resetCodeHash, undefined);
    assert.equal((await api().post('/api/auth/login').send({ email: 'sneha@example.com', password: 'NewPass1' })).status, 200);

    const reuse = await api().post('/api/auth/reset-password').send({ email: 'sneha@example.com', code: res.body.devCode, newPassword: 'Another1' });
    assert.equal(reuse.status, 400, 'code is single-use');
  });
});
