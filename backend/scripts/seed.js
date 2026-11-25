/**
 * Seed demo data into the database at MONGO_URI.
 *   npm run seed -- --reset                     wipe and reseed (local/dev only)
 *   DEMO_PASSWORD='…' npm run seed -- --append --no-admin
 *        add demo data to a live database: keeps real users, no demo admin, private password for demo logins
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { seedDatabase } from './seedData.js';

const args = process.argv.slice(2);
const append = args.includes('--append');
const demoPassword = process.env.DEMO_PASSWORD || null;
if (append && (!demoPassword || demoPassword.length < 10)) {
  console.error('--append needs DEMO_PASSWORD (10+ characters) so demo accounts on a live site are not guessable.');
  process.exit(1);
}

await connectDB();
await seedDatabase({ reset: args.includes('--reset'), append, includeAdmin: !args.includes('--no-admin'), demoPassword, log: console.log });
await mongoose.disconnect();
