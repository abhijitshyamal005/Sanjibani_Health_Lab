import mongoose from 'mongoose';
import Booking from '../models/bookingModel.js';
import { createOrder, paymentsEnabled, razorpayKeyId, verifySignature } from '../services/payments.js';
import * as events from '../services/events.js';
import { ApiError } from '../utils/helpers.js';

function requirePayments() {
  if (!paymentsEnabled()) throw new ApiError(503, 'Online payments are not configured yet');
}

async function payableBooking(req, bookingId) {
  if (!mongoose.isValidObjectId(bookingId)) throw new ApiError(400, 'Invalid booking');
  const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status === 'cancelled') throw new ApiError(400, 'This booking is cancelled');
  if (booking.paymentStatus === 'paid') throw new ApiError(400, 'This booking is already paid');
  return booking;
}

/** POST /api/payments/order */
export async function createPaymentOrder(req, res) {
  requirePayments();
  const booking = await payableBooking(req, req.body?.bookingId);
  const order = await createOrder({ amount: Math.round(booking.total * 100), receipt: booking.code, notes: { bookingId: String(booking._id) } });
  booking.paymentOrderId = order.id;
  await booking.save();
  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: 'INR',
    keyId: razorpayKeyId(),
    bookingCode: booking.code,
    prefill: { name: req.user.name, email: req.user.email, contact: req.user.phone },
  });
}

/** POST /api/payments/verify */
export async function verifyPayment(req, res) {
  requirePayments();
  const { bookingId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  const booking = await payableBooking(req, bookingId);
  if (!orderId || orderId !== booking.paymentOrderId || !paymentId || !verifySignature(orderId, paymentId, signature)) {
    throw new ApiError(400, 'Payment verification failed');
  }
  booking.paymentStatus = 'paid';
  booking.paymentMethod = 'online';
  booking.paymentId = paymentId;
  await booking.save();
  events.paymentReceived(booking._id);
  res.json({ booking: await booking.populate('lab', 'name slug address phone coverTheme reportTime') });
}
