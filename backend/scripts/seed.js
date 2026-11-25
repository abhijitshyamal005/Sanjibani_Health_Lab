/** Seed demo data into the database at MONGO_URI. Usage: npm run seed -- --reset */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { seedDatabase } from './seedData.js';

await connectDB();
await seedDatabase({ reset: process.argv.includes('--reset'), log: console.log });
await mongoose.disconnect();
