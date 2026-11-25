/** Throwaway API for end-to-end tests: fresh in-memory MongoDB + demo seed on every start. */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import connectDB from '../config/db.js';
import { seedDatabase } from './seedData.js';

const mongod = await MongoMemoryServer.create();
await connectDB(mongod.getUri('sanjibani-e2e'));
await seedDatabase({ reset: true });

const PORT = Number(process.env.E2E_API_PORT) || 5055;
const server = createApp().listen(PORT, () => console.log(`E2E API ready on http://localhost:${PORT}`));

async function shutdown() {
  server.close();
  await mongoose.disconnect().catch(() => {});
  await mongod.stop().catch(() => {});
  process.exit(0);
}
['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, shutdown));
