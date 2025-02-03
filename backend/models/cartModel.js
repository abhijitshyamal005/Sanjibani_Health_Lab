import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        productName: {
          type: String,
          required: true,
        },
        productPrice: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
        },
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Total price cannot be negative'],
      set: v => Math.round(v * 100) / 100 
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Cart', cartSchema);
