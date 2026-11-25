import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{3,20}$/, 'Code must be 3–20 letters or digits'],
    },
    description: { type: String, trim: true, maxlength: [140, 'Description is too long'] },
    type: { type: String, enum: { values: ['percent', 'flat'], message: 'Type must be percent or flat' }, required: true },
    value: { type: Number, required: [true, 'Value is required'], min: [0.01, 'Value must be more than 0'] },
    maxDiscount: { type: Number, default: null, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

couponSchema.pre('validate', function percentCap() {
  if (this.type === 'percent' && this.value > 90) this.invalidate('value', 'Percent discount cannot exceed 90%');
});

couponSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Coupon', couponSchema);
