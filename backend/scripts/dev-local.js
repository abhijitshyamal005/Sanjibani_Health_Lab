/**
 * Local development without installing MongoDB.
 * Starts an embedded MongoDB (data kept in backend/.mongo-data), seeds demo data on first run,
 * and starts the API.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import connectDB from '../config/db.js';
import User from '../models/userModel.js';
import { ensureDemoCollectors, ensureDemoCoupons, seedDatabase } from './seedData.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dbPath = path.join(root, '.mongo-data');
fs.mkdirSync(dbPath, { recursive: true });

const mongod = await MongoMemoryServer.create({
  instance: { dbPath, storageEngine: 'wiredTiger', port: Number(process.env.LOCAL_MONGO_PORT) || 27027 },
});
await connectDB(mongod.getUri('patholy'));

if ((await User.estimatedDocumentCount()) === 0) {
  console.log('Empty database — seeding demo data…');
  await seedDatabase({ log: console.log });
} else {
  await ensureDemoCoupons();
  await ensureDemoCollectors();
}

const PORT = Number(process.env.PORT) || 5001;
const server = createApp().listen(PORT, () =>
  console.log(`Patholy API running on http://localhost:${PORT} (local embedded MongoDB)`)
);

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  server.close();
  await mongoose.disconnect().catch(() => {});
  await mongod.stop({ doCleanup: false }).catch(() => {});
  process.exit(0);
}
['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach((sig) => process.on(sig, shutdown));
