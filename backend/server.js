import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import connectDB from './config/db.js';
import { validateEnv } from './config/env.js';

validateEnv();
const PORT = Number(process.env.PORT) || 5001;

try {
  await connectDB();
} catch (error) {
  console.error('Could not connect to MongoDB:', error.message);
  console.error('Tip: run `npm run dev:local` to start with a built-in local database.');
  process.exit(1);
}

const server = createApp().listen(PORT, () => console.log(`Sanjibani API running on http://localhost:${PORT}`));

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received — shutting down gracefully`);
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  server.close(async () => {
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  });
}
['SIGTERM', 'SIGINT'].forEach((sig) => process.on(sig, () => shutdown(sig)));
