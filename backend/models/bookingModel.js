import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { BOOKING_STATUSES, COLLECTION_TYPES, FIELD_STATUSES } from '../utils/constants.js';

const bookingSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      default: () => `SJB${crypto.randomInt(100000, 999999)}${crypto.randomBytes(1).toString('hex').toUpperCase()}`,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Shared by every lab booking placed in one checkout (a patient can book tests from several labs at once).
    orderCode: { type: String, index: true },
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true, index: true },
    items: {
      type: [
        {
          _id: false,
          test: { type: mongoose.Schema.Types.ObjectId, ref: 'LabTest' },
          name: String,
          category: String,
          type: { type: String },
          mrp: Number,
          price: Number,
          sampleType: String,
          preparation: String,
        },
      ],
      validate: [(v) => v.length > 0, 'Add at least one test'],
    },
    subtotal: { type: Number, required: true },
    collectionFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    collectionType: { type: String, enum: COLLECTION_TYPES, required: true },
    slot: {
      date: { type: String, required: [true, 'Pick a date'] },
      time: { type: String, required: [true, 'Pick a time slot'] },
    },
    patient: {
      name: { type: String, required: [true, 'Patient name is required'], trim: true, maxlength: 80 },
      age: {
        type: Number,
        required: [true, 'Patient age is required'],
        min: [0, 'Invalid age'],
        max: [120, 'Invalid age'],
      },
      gender: {
        type: String,
        enum: { values: ['male', 'female', 'other'], message: 'Select a gender' },
        required: [true, 'Patient gender is required'],
      },
      phone: {
        type: String,
        required: [true, 'Patient phone is required'],
        match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'],
      },
    },
    address: {
      line: { type: String, trim: true, maxlength: 200 },
      area: { type: String, trim: true, maxlength: 80 },
      city: { type: String, trim: true, maxlength: 60 },
      pincode: { type: String, trim: true },
    },
    notes: { type: String, trim: true, maxlength: 300 },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending', index: true },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: BOOKING_STATUSES },
        at: { type: Date, default: Date.now },
        note: String,
      },
    ],
    // Home sample collector and their field progress.
    collector: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    collectorAssignedAt: { type: Date },
    // Payout owed to the collector for this job (snapshot from the lab's payout settings at assignment).
    collectorEarning: { type: Number, min: 0 },
    fieldStatus: { type: String, enum: FIELD_STATUSES },
    fieldHistory: [{ _id: false, status: { type: String }, at: { type: Date, default: Date.now } }],
    couponCode: { type: String, trim: true, uppercase: true },
    discount: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, enum: ['pay_at_collection', 'upi_direct'], default: 'pay_at_collection' },
    // 'verifying' = patient paid the lab's UPI ID directly and submitted the UTR; the lab must confirm.
    paymentStatus: { type: String, enum: ['unpaid', 'verifying', 'paid'], default: 'unpaid' },
    upiRef: { type: String, trim: true },
    upiPayee: { type: String, enum: ['lab', 'platform'] }, // whose UPI ID received the money (decides who verifies)
    upiSubmittedAt: { type: Date },
    paidAt: { type: Date },
    refund: {
      type: new mongoose.Schema(
        { id: String, amount: Number, status: { type: String, enum: ['pending', 'processed', 'failed'] }, error: String, createdAt: Date, processedAt: Date },
        { _id: false }
      ),
      default: undefined,
    },
    report: {
      type: new mongoose.Schema(
        { fileName: String, originalName: String, size: Number, uploadedAt: Date },
        { _id: false }
      ),
      default: undefined,
    },
    reportNote: { type: String, trim: true, maxlength: 1000 },
    cancelReason: { type: String, trim: true, maxlength: 300 },
    cancelledBy: { type: String, enum: ['patient', 'lab', 'admin'] },
    reviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookingSchema.index({ lab: 1, createdAt: -1 });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ lab: 1, 'slot.date': 1, 'slot.time': 1, collectionType: 1 });
bookingSchema.index({ collector: 1, 'slot.date': 1 });

bookingSchema.methods.setStatus = function setStatus(status, note) {
  this.status = status;
  this.statusHistory.push({ status, at: new Date(), note });
};

bookingSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Booking', bookingSchema);
