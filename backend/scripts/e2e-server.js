/** Throwaway API for end-to-end tests: fresh in-memory MongoDB + demo seed on every start. */
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import connectDB from '../config/db.js';
import { seedDatabase } from './seedData.js';
import { outbox } from '../services/notify.js';

// Record every email so Playwright can check who was notified (GET /api/__e2e/outbox).
process.env.EMAIL_CAPTURE = 'true';
// Production keeps email links and reply-to off the blocklisted main domain; mirror that so specs can check it.
process.env.EMAIL_LINK_URL ||= 'https://mail-links.sanjibani.test';
process.env.EMAIL_REPLY_TO ||= 'replies@sanjibani.test';

const mongod = await MongoMemoryServer.create();
await connectDB(mongod.getUri('sanjibani-e2e'));
await seedDatabase({ reset: true });

const PORT = Number(process.env.E2E_API_PORT) || 5055;
const root = express();
const linkHosts = (html = '') => [...new Set([...html.matchAll(/(?:href|src)="https?:\/\/([^/"]+)/g)].map((m) => m[1]))];
root.get('/api/__e2e/outbox', (_req, res) =>
  res.json({ items: outbox.map(({ to, subject, html, replyTo }) => ({ to, subject, replyTo, hosts: linkHosts(html), mailtos: [...(html || '').matchAll(/mailto:([^"]+)/g)].map((m) => m[1]) })) })
);
root.use(createApp());
const server = root.listen(PORT, () => console.log(`E2E API ready on http://localhost:${PORT}`));

async function shutdown() {
  server.close();
  await mongoose.disconnect().catch(() => {});
  await mongod.stop().catch(() => {});
  process.exit(0);
}
['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, shutdown));
