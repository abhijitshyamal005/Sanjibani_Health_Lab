import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app.js';
import Coupon from '../models/couponModel.js';
import Lab from '../models/labModel.js';
import LabTest from '../models/labTestModel.js';
import User from '../models/userModel.js';
import { seedDatabase } from '../scripts/seedData.js';
import { flushEmails } from '../services/events.js';
import { outbox } from '../services/notify.js';
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
async function mails() {
  await flushEmails();
  return outbox.splice(0);
}

const PATIENT = { name: 'Asha Roy', age: 31, gender: 'female', phone: '9876511111' };
const ADDRESS = { line: '5 Lake Rd', area: 'Ballygunge', city: 'Kolkata', pincode: '700029' };
const order = (test, extra = {}, time = '07:00-08:00') => ({
  groups: [{ labId: ctx.lifeline._id, items: [test._id], collectionType: 'lab_visit', slot: { date: todayIST(3), time } }],
  patient: PATIENT,
  address: ADDRESS,
  ...extra,
});

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('sjb-invites'));
  app = createApp();
  await seedDatabase({ reset: true });
  ctx.patient = await loginAs('patient@sanjibani.in', 'Patient@123');
  ctx.lab = await loginAs('lab1@sanjibani.in', 'Lab@1234');
  ctx.admin = await loginAs('admin@sanjibani.in', 'Admin@123');
  ctx.lifeline = await Lab.findOne({ name: 'Lifeline Pathology' });
  ctx.bigTest = await LabTest.findOne({ lab: ctx.lifeline._id, isActive: true, price: { $gte: 500 } }).sort({ price: 1 });
  ctx.smallTest = await LabTest.findOne({ lab: ctx.lifeline._id, isActive: true, price: { $lt: 500 } });
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(() => outbox.splice(0));

describe('invite a friend', () => {
  test('every user gets a personal invite code', async () => {
    const res = await api().get('/api/invites/me').set(auth(ctx.patient));
    assert.equal(res.status, 200, res.body.message);
    assert.match(res.body.code, /^[A-Z2-9]{8}$/);
    assert.equal(res.body.earnsReward, true);
    assert.equal(res.body.reward.amount, 100);
    assert.deepEqual(res.body.coupons, []);
    ctx.code = res.body.code;

    const again = await api().get('/api/invites/me').set(auth(ctx.patient));
    assert.equal(again.body.code, ctx.code, 'the code stays the same');

    const lab = await api().get('/api/invites/me').set(auth(ctx.lab));
    assert.equal(lab.status, 200);
    assert.equal(lab.body.earnsReward, false);
    assert.notEqual(lab.body.code, ctx.code);
  });

  test('the sign-up page can check a code', async () => {
    const ok = await api().get(`/api/invites/check/${ctx.code.toLowerCase()}`);
    assert.deepEqual([ok.body.valid, ok.body.inviterName], [true, 'Riya']);
    const bad = await api().get('/api/invites/check/NOPE1234');
    assert.equal(bad.body.valid, false);
  });

  test('signing up with an invite code gives the new patient a ₹100 coupon by email', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Asha Roy', email: 'asha@example.org', phone: '9876511111', password: 'secret12', inviteCode: ctx.code });
    assert.equal(res.status, 201, res.body.message);
    ctx.friend = res.body.token;
    const friend = await User.findOne({ email: 'asha@example.org' });
    const riya = await User.findOne({ email: 'patient@sanjibani.in' });
    assert.ok(friend.invitedBy.equals(riya._id));

    const coupons = await Coupon.find({ owner: friend._id });
    assert.equal(coupons.length, 1);
    const [c] = coupons;
    assert.match(c.code, /^WELCOME[A-Z2-9]{6}$/);
    assert.deepEqual([c.type, c.value, c.usageLimit, c.source], ['flat', 100, 1, 'invite_welcome']);
    ctx.welcome = c.code;

    const welcome = (await mails()).find((m) => m.to === 'asha@example.org');
    assert.ok(welcome, 'welcome email sent');
    assert.ok(welcome.html.includes(c.code), 'welcome email shows the coupon code');

    const me = await api().get('/api/invites/me').set(auth(ctx.patient));
    assert.equal(me.body.joined, 1);
  });

  test('an unknown invite code is ignored and sign-up still works', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Bina Das', email: 'bina@example.org', phone: '9876522222', password: 'secret12', inviteCode: 'ZZZZ9999' });
    assert.equal(res.status, 201, res.body.message);
    const bina = await User.findOne({ email: 'bina@example.org' });
    assert.equal(bina.invitedBy, undefined);
    assert.equal(await Coupon.countDocuments({ owner: bina._id }), 0);
  });

  test('a lab owner who signs up through an invite is linked but gets no patient coupon', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Dr Sen', email: 'newlab@example.org', phone: '9876533333', password: 'secret12', role: 'lab', inviteCode: ctx.code });
    assert.equal(res.status, 201, res.body.message);
    const owner = await User.findOne({ email: 'newlab@example.org' });
    assert.ok(owner.invitedBy);
    assert.equal(await Coupon.countDocuments({ owner: owner._id }), 0);
  });

  test('the welcome coupon only works for its owner and above the minimum order', async () => {
    const body = (test) => ({ code: ctx.welcome, groups: [{ labId: ctx.lifeline._id, items: [test._id] }] });
    const ok = await api().post('/api/coupons/validate').set(auth(ctx.friend)).send(body(ctx.bigTest));
    assert.equal(ok.status, 200, ok.body.message);
    assert.equal(ok.body.discount, 100);

    const other = await api().post('/api/coupons/validate').set(auth(ctx.patient)).send(body(ctx.bigTest));
    assert.equal(other.status, 400);
    assert.equal(other.body.message, 'Invalid coupon code');

    if (ctx.smallTest) {
      const small = await api().post('/api/coupons/validate').set(auth(ctx.friend)).send(body(ctx.smallTest));
      assert.equal(small.status, 400);
      assert.match(small.body.message, /₹500/);
    }

    const admin = await api().get('/api/admin/coupons').set(auth(ctx.admin));
    assert.ok(!admin.body.items.some((c) => c.code === ctx.welcome), 'personal coupons stay out of the admin list');
  });

  test("the inviter earns ₹100 once, when their friend's first booking is completed", async () => {
    const res = await api().post('/api/bookings').set(auth(ctx.friend)).send(order(ctx.bigTest, { couponCode: ctx.welcome }));
    assert.equal(res.status, 201, res.body.message);
    assert.equal(res.body.booking.discount, 100);
    const id = res.body.booking._id;

    const reuse = await api().post('/api/bookings').set(auth(ctx.friend)).send(order(ctx.bigTest, { couponCode: ctx.welcome }, '09:00-10:00'));
    assert.equal(reuse.status, 400);

    const riya = await User.findOne({ email: 'patient@sanjibani.in' });
    for (const status of ['confirmed', 'sample_collected', 'report_ready']) {
      const r = await api().patch(`/api/partner/bookings/${id}/status`).set(auth(ctx.lab)).send({ status });
      assert.equal(r.status, 200, r.body.message);
    }
    assert.equal(await Coupon.countDocuments({ owner: riya._id }), 0, 'no reward before completion');
    await mails();

    const done = await api().patch(`/api/partner/bookings/${id}/status`).set(auth(ctx.lab)).send({ status: 'completed' });
    assert.equal(done.status, 200, done.body.message);
    const rewards = await Coupon.find({ owner: riya._id });
    assert.equal(rewards.length, 1);
    assert.match(rewards[0].code, /^THANKS[A-Z2-9]{6}$/);
    assert.equal(rewards[0].source, 'invite_reward');
    const mail = (await mails()).find((m) => m.to === 'patient@sanjibani.in' && /You earned ₹100/.test(m.subject));
    assert.ok(mail, 'inviter is emailed');
    assert.ok(mail.html.includes(rewards[0].code));

    const me = await api().get('/api/invites/me').set(auth(ctx.patient));
    assert.equal(me.body.rewarded, 1);
    assert.equal(me.body.coupons[0].state, 'available');

    // A second completed booking by the same friend earns nothing more.
    const second = await api().post('/api/bookings').set(auth(ctx.friend)).send(order(ctx.bigTest, {}, '10:00-11:00'));
    assert.equal(second.status, 201, second.body.message);
    for (const status of ['confirmed', 'sample_collected', 'report_ready', 'completed']) {
      await api().patch(`/api/partner/bookings/${second.body.booking._id}/status`).set(auth(ctx.lab)).send({ status });
    }
    assert.equal(await Coupon.countDocuments({ owner: riya._id }), 1);

    const friendView = await api().get('/api/invites/me').set(auth(ctx.friend));
    assert.equal(friendView.body.coupons[0].state, 'used');
  });
});

describe('admin invites a laboratory', () => {
  test('sends a branded invite email with a sign-up link', async () => {
    const res = await api()
      .post('/api/invites/labs')
      .set(auth(ctx.admin))
      .send({ labName: 'Sunrise Diagnostics', email: 'Hello@Sunrise.example', contactName: 'Dr Mitra', note: 'Loved your Salt Lake centre.' });
    assert.equal(res.status, 201, res.body.message);
    assert.equal(res.body.invite.email, 'hello@sunrise.example');
    const mail = (await mails()).find((m) => m.to === 'hello@sunrise.example');
    assert.ok(mail, 'invite emailed');
    assert.equal(mail.subject, 'Invitation: list Sunrise Diagnostics on SanjiBani');
    assert.ok(mail.html.includes('Create your lab account'));
    assert.ok(mail.html.includes('/register?role=lab&amp;email=hello%40sunrise.example') || mail.html.includes('/register?role=lab&email=hello%40sunrise.example'));
    assert.ok(mail.html.includes('Loved your Salt Lake centre.'));
    assert.ok(mail.html.includes('Hello Dr Mitra,'), 'greets the contact by full name');

    const list = await api().get('/api/invites/labs').set(auth(ctx.admin));
    assert.equal(list.body.items[0].labName, 'Sunrise Diagnostics');
    assert.equal(list.body.items[0].joined, false);
  });

  test('blocks quick resends, existing accounts and non-admins', async () => {
    const again = await api().post('/api/invites/labs').set(auth(ctx.admin)).send({ labName: 'Sunrise Diagnostics', email: 'hello@sunrise.example' });
    assert.equal(again.status, 429);
    const existing = await api().post('/api/invites/labs').set(auth(ctx.admin)).send({ labName: 'Lifeline', email: 'lab1@sanjibani.in' });
    assert.equal(existing.status, 409);
    const bad = await api().post('/api/invites/labs').set(auth(ctx.admin)).send({ labName: 'X', email: 'not-an-email' });
    assert.equal(bad.status, 400);
    const patient = await api().post('/api/invites/labs').set(auth(ctx.patient)).send({ labName: 'X', email: 'x@example.org' });
    assert.equal(patient.status, 403);
  });

  test('marks the invite as joined once the lab registers', async () => {
    await api().post('/api/auth/register').send({ name: 'Dr Mitra', email: 'hello@sunrise.example', phone: '9876544444', password: 'secret12', role: 'lab' });
    const list = await api().get('/api/invites/labs').set(auth(ctx.admin));
    assert.equal(list.body.items.find((i) => i.email === 'hello@sunrise.example').joined, true);
  });
});
