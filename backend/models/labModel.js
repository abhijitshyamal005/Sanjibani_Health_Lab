import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { ACCREDITATIONS, LAB_STATUSES } from '../utils/constants.js';
import { slugify } from '../utils/helpers.js';

const timeMatch = [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:MM format'];

const labSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: {
      type: String,
      required: [true, 'Lab name is required'],
      trim: true,
      maxlength: [100, 'Lab name is too long'],
    },
    slug: { type: String, unique: true, index: true },
    tagline: { type: String, trim: true, maxlength: [120, 'Tagline is too long'] },
    description: { type: String, trim: true, maxlength: [1500, 'Description is too long'] },
    address: {
      line: { type: String, required: [true, 'Address is required'], trim: true, maxlength: 200 },
      area: { type: String, trim: true, maxlength: 80 },
      city: { type: String, required: [true, 'City is required'], trim: true, maxlength: 60 },
      pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        match: [/^\d{6}$/, 'Pincode must be 6 digits'],
      },
    },
    phone: {
      type: String,
      required: [true, 'Lab phone is required'],
      match: [/^[0-9+\- ]{8,15}$/, 'Please enter a valid phone number'],
    },
    email: { type: String, trim: true, lowercase: true, match: [/^(\S+@\S+\.\S+)?$/, 'Invalid email'] },
    opensAt: { type: String, default: '07:00', match: timeMatch },
    closesAt: { type: String, default: '20:00', match: timeMatch },
    accreditations: [{ type: String, enum: ACCREDITATIONS }],
    homeCollection: { type: Boolean, default: true },
    homeCollectionFee: { type: Number, default: 0, min: [0, 'Fee cannot be negative'], max: 2000 },
    reportTime: { type: String, default: '24 hours', trim: true, maxlength: 40 },
    // Max bookings per time slot, per collection type.
    // Assisted visit: field staff picks the patient up at home, stays with them at the lab and drops them back.
    assistedVisit: { type: Boolean, default: false },
    assistedVisitFee: { type: Number, default: 0, min: [0, 'Fee cannot be negative'], max: 5000 },
    // What the lab pays its field staff per job (private to the lab).
    collectorPayoutHome: { type: Number, default: 60, min: 0, max: 2000 },
    collectorPayoutAssisted: { type: Number, default: 120, min: 0, max: 5000 },
    // Direct UPI (free): patients pay the lab's own UPI ID; the lab confirms receipt.
    upiId: { type: String, trim: true, lowercase: true, match: [/^([\w.\-]{2,256}@[a-z]{2,64})?$/, 'Enter a valid UPI ID, e.g. yourlab@okhdfcbank'] },
    upiName: { type: String, trim: true, maxlength: 80 },
    slotCapacity: { type: Number, default: 4, min: [1, 'Slot capacity must be at least 1'], max: 50 },
    establishedYear: { type: Number, min: 1900, max: 2100 },
    coverTheme: { type: Number, default: () => crypto.randomInt(0, 6), min: 0, max: 5 },
    status: { type: String, enum: LAB_STATUSES, default: 'pending', index: true },
    statusNote: { type: String, trim: true, maxlength: 300 },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

labSchema.pre('validate', function makeSlug() {
  if (!this.slug || this.isModified('name')) {
    const base = slugify(`${this.name || 'lab'} ${this.address?.city || ''}`);
    this.slug = `${base}-${crypto.randomBytes(2).toString('hex')}`;
  }
});

labSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Lab', labSchema);
