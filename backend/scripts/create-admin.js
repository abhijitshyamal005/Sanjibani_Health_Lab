/**
 * Create or promote an admin in the database at MONGO_URI (no demo data).
 *   ADMIN_PASSWORD='…' npm run create-admin -- --email you@example.com --name "Your Name" --phone 9876543210
 * If ADMIN_PASSWORD is not set you will be prompted for it.
 */
import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/userModel.js';

const { values } = parseArgs({
  options: { email: { type: 'string' }, name: { type: 'string' }, phone: { type: 'string' } },
});
if (!values.email) {
  console.error('Usage: npm run create-admin -- --email you@example.com --name "Your Name" --phone 9876543210');
  process.exit(1);
}

let password = process.env.ADMIN_PASSWORD;
const existing = await (async () => {
  await connectDB();
  return User.findOne({ email: values.email.toLowerCase().trim() }).select('+password');
})();

if (!existing && !password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question('Admin password (min 6 chars): ');
  rl.close();
}

try {
  if (existing) {
    existing.role = 'admin';
    existing.isActive = true;
    if (password) existing.password = password;
    if (values.name) existing.name = values.name;
    if (values.phone) existing.phone = values.phone;
    await existing.save();
    console.log(`✅ ${existing.email} is now an admin${password ? ' (password updated)' : ''}.`);
  } else {
    if (!values.name || !values.phone) throw new Error('--name and --phone are required to create a new admin');
    const user = await User.create({ email: values.email, name: values.name, phone: values.phone, password, role: 'admin' });
    console.log(`✅ Admin created: ${user.email}`);
  }
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
