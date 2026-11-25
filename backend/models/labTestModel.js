import mongoose from 'mongoose';
import { CATEGORIES, SAMPLE_TYPES } from '../utils/constants.js';

const labTestSchema = new mongoose.Schema(
  {
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true, index: true },
    name: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
      maxlength: [120, 'Test name is too long'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: CATEGORIES, message: 'Unknown category' },
    },
    type: { type: String, enum: ['test', 'package'], default: 'test' },
    description: { type: String, trim: true, maxlength: [1000, 'Description is too long'] },
    parameters: [{ type: String, trim: true, maxlength: 80 }],
    sampleType: { type: String, enum: SAMPLE_TYPES, default: 'Blood' },
    preparation: { type: String, trim: true, default: 'No special preparation', maxlength: 200 },
    reportTime: { type: String, trim: true, default: '24 hours', maxlength: 40 },
    mrp: { type: Number, required: [true, 'MRP is required'], min: [1, 'MRP must be at least ₹1'] },
    price: { type: Number, required: [true, 'Price is required'], min: [1, 'Price must be at least ₹1'] },
    homeCollection: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

labTestSchema.pre('validate', function priceNotAboveMrp() {
  if (this.price != null && this.mrp != null && this.price > this.mrp) {
    this.invalidate('price', 'Offer price cannot be higher than MRP');
  }
});

labTestSchema.virtual('discount').get(function discount() {
  if (!this.mrp || !this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

labTestSchema.index({ name: 1 });
labTestSchema.index({ lab: 1, isActive: 1 });
labTestSchema.index({ lab: 1, isActive: 1, category: 1 });

export default mongoose.model('LabTest', labTestSchema);
