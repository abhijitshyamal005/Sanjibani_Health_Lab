import mongoose from 'mongoose';
import Booking from '../models/bookingModel.js';
import { createOrder, ensureCaptured, paymentsEnabled, razorpayKeyId, refundPayment, verifySignature, verifyWebhookSignature } from '../services/payments.js';
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
  try {
    await ensureCaptured(paymentId, Math.round(booking.total * 100));
  } catch (err) {
    console.error(`[payments] capture failed for ${paymentId}: ${err.message}`);
  }
  await markPaid(booking, paymentId);
  res.json({ booking: await booking.populate('lab', 'name slug address phone coverTheme reportTime') });
}

async function markPaid(booking, paymentId) {
  if (booking.paymentStatus === 'paid') return false;
  booking.paymentStatus = 'paid';
  booking.paymentMethod = 'online';
  booking.paymentId = paymentId;
  booking.paidAt = new Date();
  await booking.save();
  events.paymentReceived(booking._id);
  return true;
}

/**
 * POST /api/payments/webhook — Razorpay server-to-server events (raw JSON body).
 * Makes payments reliable even if the patient closes the browser before /verify runs,
 * and tracks refund completion.
 */
export async function razorpayWebhook(req, res) {
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  if (!verifyWebhookSignature(raw, req.headers['x-razorpay-signature'])) {
    return res.status(400).json({ message: 'Invalid signature' });
  }
  let event;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).json({ message: 'Invalid payload' });
  }
  const payment = event.payload?.payment?.entity;
  const refund = event.payload?.refund?.entity;
  try {
    if (['payment.captured', 'order.paid'].includes(event.event) && payment) {
      const booking =
        (payment.order_id && (await Booking.findOne({ paymentOrderId: payment.order_id }))) ||
        (payment.notes?.bookingId && mongoose.isValidObjectId(payment.notes.bookingId) && (await Booking.findById(payment.notes.bookingId)));
      if (booking && booking.status !== 'cancelled') await markPaid(booking, payment.id);
    } else if (['refund.processed', 'refund.failed'].includes(event.event) && refund) {
      const booking = await Booking.findOne({ paymentId: refund.payment_id });
      if (booking?.refund) {
        booking.refund.status = event.event === 'refund.processed' ? 'processed' : 'failed';
        if (event.event === 'refund.processed') booking.refund.processedAt = new Date();
        await booking.save();
      }
    }
  } catch (err) {
    console.error(`[payments] webhook ${event.event} failed: ${err.message}`);
  }
  res.json({ ok: true });
}

/** Refund an online-paid booking in full (called when it is cancelled). Never throws. */
export async function refundIfPaidOnline(booking) {
  if (booking.paymentMethod !== 'online' || booking.paymentStatus !== 'paid' || !booking.paymentId || booking.refund?.id) return;
  const amount = Math.round(booking.total * 100);
  try {
    const r = await refundPayment(booking.paymentId, amount, { bookingId: String(booking._id), code: booking.code });
    booking.refund = { id: r.id, amount: booking.total, status: r.status === 'processed' ? 'processed' : 'pending', createdAt: new Date() };
  } catch (err) {
    booking.refund = { amount: booking.total, status: 'failed', error: String(err?.error?.description || err.message).slice(0, 200), createdAt: new Date() };
    console.error(`[payments] refund failed for ${booking.code}: ${booking.refund.error}`);
  }
  await booking.save();
}
