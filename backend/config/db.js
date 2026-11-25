import mongoose from 'mongoose';

export default async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error('MONGO_URI is not set. Use `npm run dev:local` to run with a built-in database.');
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected (${mongoose.connection.host}/${mongoose.connection.name})`);
}
