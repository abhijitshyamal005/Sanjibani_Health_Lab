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

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('sjb-patient-tools'));
  app = createApp();
  await seedDatabase({ reset: true });
  ctx.patient = await loginAs('patient@sanjibani.in', 'Patient@123');
  ctx.lab1 = await loginAs('lab1@sanjibani.in', 'Lab@1234');
  ctx.lifeline = await Lab.findOne({ name: 'Lifeline Pathology' });
  ctx.carepoint = await Lab.findOne({ name: 'CarePoint Diagnostics' });
  ctx.testA = await LabTest.findOne({ lab: ctx.lifeline._id, homeCollection: true, isActive: true });
  ctx.testB = await LabTest.findOne({ lab: ctx.carepoint._id, isActive: true });
  ctx.c1 = await User.findOne({ email: 'collector1@sanjibani.in' });
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('family members', () => {
  const MUM = { name: 'Mita Sen', relation: 'mother', gender: 'female', dateOfBirth: '1962-04-11', phone: '9876500002' };

  test('patient adds, edits and removes a family member', async () => {
    const add = await api().post('/api/auth/me/family').set(auth(ctx.patient)).send(MUM);
    assert.equal(add.status, 201, add.body.message);
    assert.equal(add.body.member.name, 'Mita Sen');
    const id = add.body.member._id;

    const me = await api().get('/api/auth/me').set(auth(ctx.patient));
    assert.ok(me.body.user.familyMembers.some((m) => m._id === id));

    const edit = await api().put(`/api/auth/me/family/${id}`).set(auth(ctx.patient)).send({ ...MUM, phone: '9876500003' });
    assert.equal(edit.status, 200, edit.body.message);
    assert.equal(edit.body.member.phone, '9876500003');

    const del = await api().delete(`/api/auth/me/family/${id}`).set(auth(ctx.patient));
    assert.equal(del.status, 200);
    assert.ok(!del.body.user.familyMembers.some((m) => m._id === id));
  });

  test('rejects bad input, a future birth date and unknown members', async () => {
    const bad = await api().post('/api/auth/me/family').set(auth(ctx.patient)).send({ name: 'X', relation: 'boss', gender: 'female', dateOfBirth: '1990-01-01' });
    assert.equal(bad.status, 400);
    assert.match(bad.body.message, /relation/i);
    const future = await api().post('/api/auth/me/family').set(auth(ctx.patient)).send({ ...MUM, dateOfBirth: todayIST(5) });
    assert.equal(future.status, 400);
    assert.match(future.body.message, /future/);
    const missing = await api().put(`/api/auth/me/family/${new mongoose.Types.ObjectId()}`).set(auth(ctx.patient)).send(MUM);
    assert.equal(missing.status, 404);
    const junk = await api().delete('/api/auth/me/family/not-an-id').set(auth(ctx.patient));
    assert.equal(junk.status, 404);
  });

  test('caps the list at 8 and is only for patients', async () => {
    for (let i = 0; i < 8; i += 1) {
      const r = await api().post('/api/auth/me/family').set(auth(ctx.patient)).send({ ...MUM, name: `Kin ${i}` });
      assert.equal(r.status, 201, r.body.message);
    }
    const ninth = await api().post('/api/auth/me/family').set(auth(ctx.patient)).send(MUM);
    assert.equal(ninth.status, 400);
    assert.match(ninth.body.message, /up to 8/);
    const lab = await api().post('/api/auth/me/family').set(auth(ctx.lab1)).send(MUM);
    assert.equal(lab.status, 403);
    await User.updateOne({ email: 'patient@sanjibani.in' }, { $set: { familyMembers: [] } });
  });
});

describe('rescheduling a booking', () => {
  const book = async (lab, test, slot, collectionType = 'lab_visit') => {
    const res = await api()
      .post('/api/bookings')
      .set(auth(ctx.patient))
      .send({ labId: lab._id, items: [test._id], collectionType, slot, patient: PATIENT, address: ADDRESS });
    assert.equal(res.status, 201, res.body.message);
    return res.body.booking;
  };
  const move = (id, body) => api().patch(`/api/bookings/${id}/reschedule`).set(auth(ctx.patient)).send(body);

  test('moves the slot and keeps a record of the change', async () => {
    const b = await book(ctx.lifeline, ctx.testA, { date: todayIST(3), time: '07:00-08:00' });
    const res = await move(b._id, { date: todayIST(4), time: '09:00-10:00', reason: 'Travelling' });
    assert.equal(res.status, 200, res.body.message);
    assert.deepEqual(res.body.booking.slot, { date: todayIST(4), time: '09:00-10:00' });
    assert.equal(res.body.booking.reschedules.length, 1);
    assert.deepEqual(res.body.booking.reschedules[0].from, { date: todayIST(3), time: '07:00-08:00' });
    assert.equal(res.body.booking.reschedules[0].reason, 'Travelling');
    assert.equal(res.body.booking.status, 'pending');
  });

  test('rejects the same slot, past slots, bad times and slots too far ahead', async () => {
    const b = await book(ctx.lifeline, ctx.testA, { date: todayIST(5), time: '07:00-08:00' });
    assert.equal((await move(b._id, { date: todayIST(5), time: '07:00-08:00' })).status, 400);
    assert.equal((await move(b._id, { date: todayIST(-1), time: '07:00-08:00' })).status, 400);
    assert.equal((await move(b._id, { date: todayIST(5), time: '03:00-04:00' })).status, 400);
    assert.equal((await move(b._id, { date: todayIST(40), time: '07:00-08:00' })).status, 400);
  });

  test('refuses a full slot', async () => {
    const date = todayIST(6);
    const lab = await Lab.findById(ctx.lifeline._id);
    for (let i = 0; i < (lab.slotCapacity || 4); i += 1) await book(ctx.lifeline, ctx.testA, { date, time: '10:00-11:00' });
    const b = await book(ctx.lifeline, ctx.testA, { date, time: '11:00-12:00' });
    const res = await move(b._id, { date, time: '10:00-11:00' });
    assert.equal(res.status, 409);
  });

  test('releases an assigned collector, but not once they are on the way', async () => {
    const b = await book(ctx.lifeline, ctx.testA, { date: todayIST(7), time: '07:00-08:00' }, 'home');
    await api().patch(`/api/partner/bookings/${b._id}/status`).set(auth(ctx.lab1)).send({ status: 'confirmed' });
    const assign = await api().patch(`/api/partner/bookings/${b._id}/assign`).set(auth(ctx.lab1)).send({ collectorId: ctx.c1._id });
    assert.equal(assign.status, 200, assign.body.message);

    const res = await move(b._id, { date: todayIST(7), time: '08:00-09:00' });
    assert.equal(res.status, 200, res.body.message);
    assert.equal(res.body.booking.collector, undefined);
    assert.equal(res.body.booking.status, 'confirmed');

    await api().patch(`/api/partner/bookings/${b._id}/assign`).set(auth(ctx.lab1)).send({ collectorId: ctx.c1._id });
    await Booking.updateOne({ _id: b._id }, { fieldStatus: 'on_the_way' });
    const late = await move(b._id, { date: todayIST(8), time: '08:00-09:00' });
    assert.equal(late.status, 400);
    assert.match(late.body.message, /on the way/);
  });

  test('allows three changes, then asks to rebook', async () => {
    const b = await book(ctx.lifeline, ctx.testA, { date: todayIST(9), time: '07:00-08:00' });
    for (const t of ['08:00-09:00', '09:00-10:00', '10:00-11:00']) assert.equal((await move(b._id, { date: todayIST(9), time: t })).status, 200);
    const fourth = await move(b._id, { date: todayIST(9), time: '11:00-12:00' });
    assert.equal(fourth.status, 400);
    assert.match(fourth.body.message, /up to 3/);
  });

  test('cannot reschedule a cancelled booking or someone else’s', async () => {
    const b = await book(ctx.lifeline, ctx.testA, { date: todayIST(10), time: '07:00-08:00' });
    await api().patch(`/api/bookings/${b._id}/cancel`).set(auth(ctx.patient)).send({});
    assert.equal((await move(b._id, { date: todayIST(10), time: '08:00-09:00' })).status, 400);
    const other = await api().post('/api/auth/register').send({ name: 'Other', email: 'other@x.in', phone: '9876511111', password: 'secret1' });
    const res = await api().patch(`/api/bookings/${b._id}/reschedule`).set(auth(other.body.token)).send({ date: todayIST(10), time: '08:00-09:00' });
    assert.equal(res.status, 404);
  });

  test('keeps in-person visits of one order apart', async () => {
    const date = todayIST(11);
    const res = await api()
      .post('/api/bookings')
      .set(auth(ctx.patient))
      .send({
        groups: [
          { labId: ctx.lifeline._id, items: [ctx.testA._id], collectionType: 'lab_visit', slot: { date, time: '07:00-08:00' } },
          { labId: ctx.carepoint._id, items: [ctx.testB._id], collectionType: 'lab_visit', slot: { date, time: '09:00-10:00' } },
        ],
        patient: PATIENT,
        address: ADDRESS,
      });
    assert.equal(res.status, 201, res.body.message);
    const clash = await move(res.body.bookings[0]._id, { date, time: '09:00-10:00' });
    assert.equal(clash.status, 400);
    assert.match(clash.body.message, /CarePoint/);
  });
});
