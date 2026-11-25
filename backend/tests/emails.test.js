import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app.js';
import User from '../models/userModel.js';
import { flushEmails } from '../services/events.js';
import { outbox } from '../services/notify.js';
import { todayIST } from '../utils/helpers.js';

let mongod;
let app;
const api = () => request(app);
const auth = (t) => ({ Authorization: `Bearer ${t}` });

const PREVIEW = process.env.EMAIL_PREVIEW_DIR;
let previewN = 0;
async function mails() {
  await flushEmails();
  const list = outbox.splice(0);
  // EMAIL_PREVIEW_DIR=/some/dir npm test → writes every email as HTML for visual review.
  if (PREVIEW) {
    const fs = await import('node:fs');
    for (const m of list) fs.writeFileSync(`${PREVIEW}/${String(++previewN).padStart(2, '0')}-${m.to.split('@')[0]}-${m.subject.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.html`, m.html);
  }
  return list;
}
function expectMail(list, to, subject) {
  const m = list.find((x) => x.to === to && subject.test(x.subject));
  assert.ok(m, `expected email to ${to} matching ${subject}; got:\n${list.map((x) => `  ${x.to}: ${x.subject}`).join('\n')}`);
  assert.match(m.html, /<html/, 'uses the branded template');
  return m;
}

const PATIENT = { name: 'Riya Sen', email: 'riya@test.com', phone: '9876500001', password: 'secret123' };
const OWNER = { name: 'Lab Owner', email: 'owner@test.com', phone: '9876500002', password: 'secret123', role: 'lab' };
const LAB_EMAIL = 'desk@alphalabs.test';
const ctx = {};

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('emails-test'));
  app = createApp();
});
after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
beforeEach(() => outbox.splice(0));

describe('email notifications across the whole flow', () => {
  test('sign-ups get welcome emails', async () => {
    ctx.patient = (await api().post('/api/auth/register').send(PATIENT)).body.token;
    ctx.owner = (await api().post('/api/auth/register').send(OWNER)).body.token;
    const m = await mails();
    expectMail(m, PATIENT.email, /Welcome to SanjiBani$/);
    expectMail(m, OWNER.email, /Welcome to SanjiBani for labs/);
  });

  test('lab submission emails the lab and admins; approval emails the lab', async () => {
    await User.create({ name: 'Admin', email: 'admin@test.com', phone: '9000000001', password: 'secret123', role: 'admin' });
    ctx.admin = (await api().post('/api/auth/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;
    const lab = await api().post('/api/partner/lab').set(auth(ctx.owner)).send({
      name: 'Alpha Labs', email: LAB_EMAIL, phone: '03312345678', homeCollection: true, homeCollectionFee: 50,
      address: { line: '1 Test Road', city: 'Kolkata', pincode: '700001' },
    });
    ctx.labId = lab.body.lab._id;
    let m = await mails();
    expectMail(m, LAB_EMAIL, /submitted for verification/);
    expectMail(m, 'admin@test.com', /New lab to review: Alpha Labs/);

    await api().patch(`/api/admin/labs/${ctx.labId}/status`).set(auth(ctx.admin)).send({ status: 'approved' });
    m = await mails();
    expectMail(m, LAB_EMAIL, /now live/);
  });

  test('new collector gets a welcome email', async () => {
    const res = await api().post('/api/partner/collectors').set(auth(ctx.owner)).send({ name: 'Bikash', email: 'bikash@test.com', phone: '9830077771', password: 'secret123' });
    ctx.collectorId = res.body.collector._id;
    ctx.collector = (await api().post('/api/auth/login').send({ email: 'bikash@test.com', password: 'secret123' })).body.token;
    expectMail(await mails(), 'bikash@test.com', /sample collector for Alpha Labs/);
  });

  test('booking placed emails patient and lab', async () => {
    const t = await api().post('/api/partner/tests').set(auth(ctx.owner)).send({ name: 'HbA1c', category: 'Diabetes', mrp: 1000, price: 450 });
    ctx.testId = t.body.test._id;
    await mails();
    const b = await api().post('/api/bookings').set(auth(ctx.patient)).send({
      labId: ctx.labId, items: [ctx.testId], collectionType: 'home', slot: { date: todayIST(1), time: '07:00-08:00' },
      patient: { name: 'Riya Sen', age: 30, gender: 'female', phone: '9876500001' },
      address: { line: '5 Lake Rd', city: 'Kolkata', pincode: '700029' },
    });
    ctx.bookingId = b.body.booking._id;
    const m = await mails();
    expectMail(m, PATIENT.email, /placed with Alpha Labs/);
    const lab = expectMail(m, LAB_EMAIL, /New booking/);
    assert.match(lab.html, /9876500001/, 'lab sees patient contact');
  });

  test('assigning a collector emails patient and collector (no prices for collector)', async () => {
    await api().patch(`/api/partner/bookings/${ctx.bookingId}/assign`).set(auth(ctx.owner)).send({ collectorId: ctx.collectorId });
    const m = await mails();
    expectMail(m, PATIENT.email, /Bikash will collect your sample/);
    const job = expectMail(m, 'bikash@test.com', /New job/);
    assert.doesNotMatch(job.html, /HbA1c — ₹|₹450|MRP/, 'collector email has no test prices');
    assert.match(job.html, /Collect ₹500/, 'collector sees the amount to collect');
  });

  test('collector steps email the patient, and sample collection also emails the lab', async () => {
    const step = (s) => api().patch(`/api/collector/jobs/${ctx.bookingId}/progress`).set(auth(ctx.collector)).send({ step: s });
    await step('on_the_way');
    await step('arrived');
    let m = await mails();
    expectMail(m, PATIENT.email, /on the way/);
    expectMail(m, PATIENT.email, /has arrived/);

    await step('sample_collected');
    m = await mails();
    expectMail(m, PATIENT.email, /Sample collected/);
    expectMail(m, LAB_EMAIL, /Sample collected/);

    await step('payment_collected');
    m = await mails();
    expectMail(m, PATIENT.email, /Payment received/);
    expectMail(m, LAB_EMAIL, /Payment received/);
  });

  test('report ready, completion and review emails', async () => {
    await api().patch(`/api/partner/bookings/${ctx.bookingId}/status`).set(auth(ctx.owner)).send({ status: 'report_ready', note: 'All normal' });
    let m = await mails();
    const ready = expectMail(m, PATIENT.email, /report is ready/);
    assert.match(ready.html, /All normal/);
    assert.match(ready.html, new RegExp(`/bookings/${ctx.bookingId}`), 'links to the booking page');

    await api().patch(`/api/partner/bookings/${ctx.bookingId}/status`).set(auth(ctx.owner)).send({ status: 'completed' });
    m = await mails();
    expectMail(m, PATIENT.email, /completed/);
    assert.equal(m.filter((x) => /Payment received/.test(x.subject)).length, 0, 'no duplicate payment email (already paid)');

    await api().post('/api/reviews').set(auth(ctx.patient)).send({ bookingId: ctx.bookingId, rating: 5, comment: 'Great' });
    expectMail(await mails(), LAB_EMAIL, /New 5★ review/);
  });

  test('cancellations email everyone involved', async () => {
    const book = () =>
      api().post('/api/bookings').set(auth(ctx.patient)).send({
        labId: ctx.labId, items: [ctx.testId], collectionType: 'lab_visit', slot: { date: todayIST(2), time: '09:00-10:00' },
        patient: { name: 'Riya Sen', age: 30, gender: 'female', phone: '9876500001' },
      });
    const a = (await book()).body.booking._id;
    const b = (await book()).body.booking._id;
    await mails();

    await api().patch(`/api/bookings/${a}/cancel`).set(auth(ctx.patient)).send({ reason: 'Travelling' });
    let m = await mails();
    expectMail(m, PATIENT.email, /cancelled/);
    const labMail = expectMail(m, LAB_EMAIL, /cancelled by patient/);
    assert.match(labMail.html, /Travelling/);

    await api().patch(`/api/partner/bookings/${b}/status`).set(auth(ctx.owner)).send({ status: 'cancelled', note: 'Machine under maintenance' });
    m = await mails();
    const p = expectMail(m, PATIENT.email, /cancelled/);
    assert.match(p.html, /Machine under maintenance/);
  });

  test('password change sends a security alert', async () => {
    await api().patch('/api/auth/me').set(auth(ctx.patient)).send({ currentPassword: 'secret123', newPassword: 'newpass123' });
    expectMail(await mails(), PATIENT.email, /password was changed/);
  });
});
