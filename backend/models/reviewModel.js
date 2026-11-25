import mongoose from 'mongoose';
import Lab from './labModel.js';

const reviewSchema = new mongoose.Schema(
  {
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
    },
    comment: { type: String, trim: true, maxlength: [500, 'Review is too long'] },
  },
  { timestamps: true }
);

reviewSchema.statics.recalculateLabRating = async function recalculateLabRating(labId) {
  const [agg] = await this.aggregate([
    { $match: { lab: new mongoose.Types.ObjectId(String(labId)) } },
    { $group: { _id: '$lab', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Lab.updateOne(
    { _id: labId },
    { rating: agg ? Math.round(agg.avg * 10) / 10 : 0, ratingCount: agg?.count || 0 }
  );
};

export default mongoose.model('Review', reviewSchema);
