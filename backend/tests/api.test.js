import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app.js';
import User from '../models/userModel.js';
import { seedDatabase } from '../scripts/seedData.js';
import { todayIST } from '../utils/helpers.js';

let mongod;
let app;
const api = () => request(app);
const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function registerAndLogin(body) {
  const res = await api().post('/api/auth/register').send(body);
  assert.equal(res.status, 201, res.body.message);
  return res.body.token;
}

const LAB_BODY = (name, city = 'Kolkata', extra = {}) => ({
  name,
  tagline: 'Test lab',
  address: { line: '1 Test Road', area: 'Test Area', city, pincode: '700001' },
  phone: '03312345678',
  accreditations: ['NABL'],
  homeCollection: true,
  homeCollectionFee: 50,
  ...extra,
});

const TEST_BODY = (name, price, extra = {}) => ({
  name,
  category: 'Diabetes',
  mrp: 1000,
  price,
  parameters: ['A', 'B'],
  ...extra,
});

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('patholy-test'));
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Patholy API', () => {
  const ctx = {};

  test('health check', async () => {
    const res = await api().get('/api/health');
    assert.equal(res.status, 200);
  });

  describe('auth', () => {
    test('patient can register, log in and fetch profile', async () => {
      ctx.patientToken = await registerAndLogin({
        name: 'Pat Ient', email: 'pat@test.com', phone: '9876543210', password: 'secret123',
      });
      const login = await api().post('/api/auth/login').send({ email: 'PAT@test.com', password: 'secret123' });
      assert.equal(login.status, 200);
      assert.equal(login.body.user.role, 'patient');
      assert.equal(login.body.user.password, undefined, 'password must never be returned');

      const me = await api().get('/api/auth/me').set(auth(login.body.token));
      assert.equal(me.status, 200);
      assert.equal(me.body.user.email, 'pat@test.com');
    });

    test('rejects duplicate email, bad password, missing token and invalid input', async () => {
      const dup = await api().post('/api/auth/register').send({ name: 'X', email: 'pat@test.com', phone: '9876543211', password: 'secret123' });
      assert.equal(dup.status, 409);

      const bad = await api().post('/api/auth/login').send({ email: 'pat@test.com', password: 'wrong' });
      assert.equal(bad.status, 401);

      assert.equal((await api().get('/api/auth/me')).status, 401);
      assert.equal((await api().get('/api/auth/me').set(auth('garbage'))).status, 401);

      const invalid = await api().post('/api/auth/register').send({ name: 'X', email: 'nope', phone: '123', password: '1' });
      assert.equal(invalid.status, 400);
      assert.match(invalid.body.message, /valid email|mobile|Password/);
    });

    test('cannot self-register as admin', async () => {
      const res = await api().post('/api/auth/register').send({ name: 'Evil', email: 'evil@test.com', phone: '9876543299', password: 'secret123', role: 'admin' });
      assert.equal(res.status, 400);
    });

    test('patient can update profile and change password', async () => {
      const res = await api().patch('/api/auth/me').set(auth(ctx.patientToken)).send({
        city: 'Kolkata', gender: 'female', address: { line: '5 Lake Rd', city: 'Kolkata', pincode: '700029' }, role: 'admin',
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.user.city, 'Kolkata');
      assert.equal(res.body.user.role, 'patient', 'role must not be changeable');

      const wrong = await api().patch('/api/auth/me').set(auth(ctx.patientToken)).send({ currentPassword: 'nope', newPassword: 'newpass1' });
      assert.equal(wrong.status, 400);
      const ok = await api().patch('/api/auth/me').set(auth(ctx.patientToken)).send({ currentPassword: 'secret123', newPassword: 'newpass1' });
      assert.equal(ok.status, 200);
      assert.equal((await api().post('/api/auth/login').send({ email: 'pat@test.com', password: 'newpass1' })).status, 200);
    });
  });

  describe('lab onboarding and admin approval', () => {
    test('lab partner registers a lab which starts pending and hidden', async () => {
      ctx.labToken = await registerAndLogin({ name: 'Lab Owner', email: 'owner@test.com', phone: '9876543220', password: 'secret123', role: 'lab' });
      ctx.lab2Token = await registerAndLogin({ name: 'Lab Owner 2', email: 'owner2@test.com', phone: '9876543221', password: 'secret123', role: 'lab' });

      const noLab = await api().get('/api/partner/lab').set(auth(ctx.labToken));
      assert.equal(noLab.body.lab, null);
      assert.equal((await api().get('/api/partner/tests').set(auth(ctx.labToken))).status, 404);

      const created = await api().post('/api/partner/lab').set(auth(ctx.labToken)).send({ ...LAB_BODY('Alpha Labs'), status: 'approved', rating: 5 });
      assert.equal(created.status, 201);
      assert.equal(created.body.lab.status, 'pending', 'partner cannot self-approve');
      assert.equal(created.body.lab.rating, 0, 'partner cannot set rating');
      ctx.labId = created.body.lab._id;
      ctx.labSlug = created.body.lab.slug;

      const again = await api().post('/api/partner/lab').set(auth(ctx.labToken)).send(LAB_BODY('Alpha Again'));
      assert.equal(again.status, 409);

      const lab2 = await api().post('/api/partner/lab').set(auth(ctx.lab2Token)).send(LAB_BODY('Beta Labs', 'Kolkata', { homeCollectionFee: 0 }));
      ctx.lab2Id = lab2.body.lab._id;

      const list = await api().get('/api/labs');
      assert.equal(list.body.total, 0);
      assert.equal((await api().get(`/api/labs/${ctx.labSlug}`)).status, 404);
    });

    test('role checks: patients cannot use partner or admin APIs', async () => {
      assert.equal((await api().get('/api/partner/lab').set(auth(ctx.patientToken))).status, 403);
      assert.equal((await api().get('/api/admin/stats').set(auth(ctx.patientToken))).status, 403);
      assert.equal((await api().get('/api/admin/stats').set(auth(ctx.labToken))).status, 403);
    });

    test('admin approves labs and they become public', async () => {
      await User.create({ name: 'Admin', email: 'admin@test.com', phone: '9000000001', password: 'secret123', role: 'admin' });
      ctx.adminToken = (await api().post('/api/auth/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;

      const pending = await api().get('/api/admin/labs?status=pending').set(auth(ctx.adminToken));
      assert.equal(pending.body.items.length, 2);

      for (const id of [ctx.labId, ctx.lab2Id]) {
        const res = await api().patch(`/api/admin/labs/${id}/status`).set(auth(ctx.adminToken)).send({ status: 'approved' });
        assert.equal(res.status, 200);
      }
      assert.equal((await api().patch(`/api/admin/labs/${ctx.labId}/status`).set(auth(ctx.adminToken)).send({ status: 'bogus' })).status, 400);

      const page = await api().get(`/api/labs/${ctx.labSlug}`);
      assert.equal(page.status, 200);
      assert.equal(page.body.lab.owner, undefined, 'owner id is not exposed');
    });
  });

  describe('test catalogue', () => {
    test('partner manages tests; price must not exceed MRP', async () => {
      const bad = await api().post('/api/partner/tests').set(auth(ctx.labToken)).send(TEST_BODY('HbA1c', 1200));
      assert.equal(bad.status, 400);
      assert.match(bad.body.message, /higher than MRP/);

      const badCat = await api().post('/api/partner/tests').set(auth(ctx.labToken)).send(TEST_BODY('HbA1c', 400, { category: 'Nope' }));
      assert.equal(badCat.status, 400);

      const a = await api().post('/api/partner/tests').set(auth(ctx.labToken)).send(TEST_BODY('HbA1c', 450));
      assert.equal(a.status, 201);
      assert.equal(a.body.test.discount, 55);
      ctx.testA = a.body.test._id;

      const xray = await api().post('/api/partner/tests').set(auth(ctx.labToken)).send(TEST_BODY('Chest X-Ray', 300, { category: 'Imaging', sampleType: 'None', homeCollection: false }));
      ctx.xray = xray.body.test._id;

      const hidden = await api().post('/api/partner/tests').set(auth(ctx.labToken)).send(TEST_BODY('Hidden Test', 100, { isActive: false }));
      ctx.hidden = hidden.body.test._id;

      const b = await api().post('/api/partner/tests').set(auth(ctx.lab2Token)).send(TEST_BODY('HbA1c', 350));
      ctx.testB = b.body.test._id;
    });

    test('partner cannot edit or delete another lab’s test', async () => {
      const edit = await api().put(`/api/partner/tests/${ctx.testA}`).set(auth(ctx.lab2Token)).send({ price: 1 });
      assert.equal(edit.status, 404);
      const del = await api().delete(`/api/partner/tests/${ctx.testA}`).set(auth(ctx.lab2Token));
      assert.equal(del.status, 404);
      assert.equal((await api().put('/api/partner/tests/not-an-id').set(auth(ctx.labToken)).send({})).status, 400);
    });

    test('price comparison search sorts across labs and hides inactive tests', async () => {
      const res = await api().get('/api/tests/search?q=hba1c');
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.items.map((t) => t.price), [350, 450]);
      assert.equal(res.body.items[0].lab.name, 'Beta Labs');

      const hidden = await api().get('/api/tests/search?q=Hidden');
      assert.equal(hidden.body.total, 0);

      const labs = await api().get('/api/labs?category=Diabetes&sort=price');
      assert.deepEqual(labs.body.items.map((l) => l.name), ['Beta Labs', 'Alpha Labs']);

      const meta = await api().get('/api/meta');
      assert.equal(meta.body.stats.labs, 2);
      assert.ok(meta.body.cities.includes('Kolkata'));
      assert.equal(meta.body.popularTests[0].name, 'HbA1c');
      assert.equal(meta.body.popularTests[0].labCount, 2);
    });
  });

  describe('booking flow', () => {
    const base = () => ({
      labId: ctx.labId,
      items: [ctx.testA],
      collectionType: 'home',
      slot: { date: todayIST(1), time: '07:00-08:00' },
      patient: { name: 'Pat Ient', age: 30, gender: 'female', phone: '9876543210' },
      address: { line: '5 Lake Rd', city: 'Kolkata', pincode: '700029' },
    });

    test('server computes price and ignores client-sent totals', async () => {
      const res = await api().post('/api/bookings').set(auth(ctx.patientToken)).send({ ...base(), total: 1, items: [{ _id: ctx.testA, price: 1 }] });
      assert.equal(res.status, 201, res.body.message);
      assert.equal(res.body.booking.subtotal, 450);
      assert.equal(res.body.booking.collectionFee, 50);
      assert.equal(res.body.booking.total, 500);
      assert.equal(res.body.booking.status, 'pending');
      assert.match(res.body.booking.code, /^PTL/);
      ctx.bookingId = res.body.booking._id;
    });

    test('rejects invalid bookings', async () => {
      const cases = [
        [{ items: [ctx.testB] }, /no longer available/],
        [{ items: [ctx.hidden] }, /no longer available/],
        [{ items: [ctx.xray] }, /Home collection is not available/],
        [{ items: [] }, /at least one test/],
        [{ slot: { date: todayIST(-1), time: '07:00-08:00' } }, /Pick a date/],
        [{ slot: { date: todayIST(1), time: '03:00-04:00' } }, /time slot/],
        [{ address: { line: 'x', city: 'y', pincode: '12' } }, /pincode/],
        [{ patient: { name: 'A', age: 30, gender: 'female', phone: '123' } }, /mobile number/],
        [{ collectionType: 'drone' }, /home collection, lab visit or assisted visit/],
      ];
      for (const [patch, message] of cases) {
        const res = await api().post('/api/bookings').set(auth(ctx.patientToken)).send({ ...base(), ...patch });
        assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(patch)}, got ${res.status} ${res.body.message}`);
        assert.match(res.body.message, message);
      }
      const labUser = await api().post('/api/bookings').set(auth(ctx.labToken)).send(base());
      assert.equal(labUser.status, 403, 'labs cannot place patient bookings');
    });

    test('lab-visit booking allows lab-only tests and has no fee', async () => {
      const res = await api().post('/api/bookings').set(auth(ctx.patientToken)).send({ ...base(), items: [ctx.xray], collectionType: 'lab_visit', address: undefined });
      assert.equal(res.status, 201, res.body.message);
      assert.equal(res.body.booking.collectionFee, 0);
      ctx.visitBookingId = res.body.booking._id;
    });

    test('booking visibility is limited to patient, owning lab and admin', async () => {
      assert.equal((await api().get(`/api/bookings/${ctx.bookingId}`).set(auth(ctx.patientToken))).status, 200);
      assert.equal((await api().get(`/api/bookings/${ctx.bookingId}`).set(auth(ctx.labToken))).status, 200);
      assert.equal((await api().get(`/api/bookings/${ctx.bookingId}`).set(auth(ctx.adminToken))).status, 200);
      assert.equal((await api().get(`/api/bookings/${ctx.bookingId}`).set(auth(ctx.lab2Token))).status, 404);

      const lab2Bookings = await api().get('/api/partner/bookings').set(auth(ctx.lab2Token));
      assert.equal(lab2Bookings.body.items.length, 0);
      const labBookings = await api().get('/api/partner/bookings?status=pending').set(auth(ctx.labToken));
      assert.equal(labBookings.body.items.length, 2);
    });

    test('status only moves forward through the pipeline', async () => {
      const url = `/api/partner/bookings/${ctx.bookingId}/status`;
      const jump = await api().patch(url).set(auth(ctx.labToken)).send({ status: 'completed' });
      assert.equal(jump.status, 400);

      const other = await api().patch(url).set(auth(ctx.lab2Token)).send({ status: 'confirmed' });
      assert.equal(other.status, 404);

      for (const status of ['confirmed', 'sample_collected']) {
        const res = await api().patch(url).set(auth(ctx.labToken)).send({ status });
        assert.equal(res.status, 200, res.body.message);
      }

      const cancel = await api().patch(`/api/bookings/${ctx.bookingId}/cancel`).set(auth(ctx.patientToken));
      assert.equal(cancel.status, 400, 'cannot cancel after sample collection');

      const review = await api().post('/api/reviews').set(auth(ctx.patientToken)).send({ bookingId: ctx.bookingId, rating: 5 });
      assert.equal(review.status, 400, 'cannot review before completion');

      const ready = await api().patch(url).set(auth(ctx.labToken)).send({ status: 'report_ready', note: 'All normal' });
      assert.equal(ready.body.booking.reportNote, 'All normal');
      const done = await api().patch(url).set(auth(ctx.labToken)).send({ status: 'completed' });
      assert.equal(done.body.booking.status, 'completed');
      assert.equal(done.body.booking.paymentStatus, 'paid');
      assert.deepEqual(done.body.booking.statusHistory.map((h) => h.status), ['pending', 'confirmed', 'sample_collected', 'report_ready', 'completed']);
    });

    test('patient can cancel a pending booking', async () => {
      const res = await api().patch(`/api/bookings/${ctx.visitBookingId}/cancel`).set(auth(ctx.patientToken)).send({ reason: 'Travelling' });
      assert.equal(res.status, 200);
      assert.equal(res.body.booking.status, 'cancelled');
      assert.equal(res.body.booking.cancelledBy, 'patient');
    });

    test('one review per completed booking updates lab rating', async () => {
      const bad = await api().post('/api/reviews').set(auth(ctx.patientToken)).send({ bookingId: ctx.bookingId, rating: 9 });
      assert.equal(bad.status, 400);
      const ok = await api().post('/api/reviews').set(auth(ctx.patientToken)).send({ bookingId: ctx.bookingId, rating: 4, comment: 'Good' });
      assert.equal(ok.status, 201);
      const dup = await api().post('/api/reviews').set(auth(ctx.patientToken)).send({ bookingId: ctx.bookingId, rating: 5 });
      assert.equal(dup.status, 409);

      const page = await api().get(`/api/labs/${ctx.labSlug}`);
      assert.equal(page.body.lab.rating, 4);
      assert.equal(page.body.lab.ratingCount, 1);
      assert.equal(page.body.reviews[0].userName, 'Pat');
    });

    test('my bookings lists the patient’s bookings', async () => {
      const res = await api().get('/api/bookings/me').set(auth(ctx.patientToken));
      assert.equal(res.body.items.length, 2);
    });
  });

  describe('dashboards', () => {
    test('lab dashboard stats and patients', async () => {
      const res = await api().get('/api/partner/stats').set(auth(ctx.labToken));
      assert.equal(res.status, 200);
      assert.equal(res.body.totals.bookings, 2);
      assert.equal(res.body.totals.revenue, 500);
      assert.equal(res.body.totals.activeTests, 2);
      assert.equal(res.body.totals.totalTests, 3);
      assert.equal(res.body.statusCounts.completed, 1);
      assert.equal(res.body.statusCounts.cancelled, 1);
      assert.equal(res.body.last7Days.length, 7);
      assert.equal(res.body.topTests[0].name, 'HbA1c');

      const patients = await api().get('/api/partner/patients').set(auth(ctx.labToken));
      assert.equal(patients.body.items.length, 1);
      assert.equal(patients.body.items[0].bookings, 2);
      assert.equal(patients.body.items[0].spent, 500);
    });

    test('admin dashboard stats, users and deactivation', async () => {
      const res = await api().get('/api/admin/stats').set(auth(ctx.adminToken));
      assert.equal(res.status, 200);
      assert.equal(res.body.users.patient, 1);
      assert.equal(res.body.users.lab, 2);
      assert.equal(res.body.labs.approved, 2);
      assert.equal(res.body.totals.bookings, 2);
      assert.equal(res.body.totals.gbv, 500);

      const users = await api().get('/api/admin/users?role=patient').set(auth(ctx.adminToken));
      assert.equal(users.body.items.length, 1);
      assert.equal(users.body.items[0].bookingCount, 2);
      assert.equal(users.body.items[0].password, undefined);

      const patientId = users.body.items[0]._id;
      await api().patch(`/api/admin/users/${patientId}`).set(auth(ctx.adminToken)).send({ isActive: false });
      assert.equal((await api().get('/api/auth/me').set(auth(ctx.patientToken))).status, 403);
      await api().patch(`/api/admin/users/${patientId}`).set(auth(ctx.adminToken)).send({ isActive: true });

      const bookings = await api().get('/api/admin/bookings').set(auth(ctx.adminToken));
      assert.equal(bookings.body.items.length, 2);
    });

    test('rejected lab goes back to pending after editing', async () => {
      await api().patch(`/api/admin/labs/${ctx.lab2Id}/status`).set(auth(ctx.adminToken)).send({ status: 'rejected', note: 'Add licence' });
      const res = await api().put('/api/partner/lab').set(auth(ctx.lab2Token)).send({ tagline: 'Updated', address: { pincode: '700002' } });
      assert.equal(res.status, 200);
      assert.equal(res.body.lab.status, 'pending');
      assert.equal(res.body.lab.address.city, 'Kolkata', 'partial address update keeps other fields');
    });
  });

  describe('seed data', () => {
    test('seeds a consistent demo dataset', async () => {
      await seedDatabase({ reset: true });
      const meta = await api().get('/api/meta');
      assert.equal(meta.body.stats.labs, 5);
      assert.equal(meta.body.cities.length, 4);
      const login = await api().post('/api/auth/login').send({ email: 'patient@patholy.in', password: 'Patient@123' });
      assert.equal(login.status, 200);
      const mine = await api().get('/api/bookings/me').set(auth(login.body.token));
      assert.ok(mine.body.items.length > 0);
      const labs = await api().get('/api/labs');
      assert.ok(labs.body.items.every((l) => l.rating > 0));
    });
  });
});
